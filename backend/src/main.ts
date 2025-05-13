import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  // This will automatically validate incoming requests based on the DTOs
  // defined in your controllers and services
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for all origins
  app.enableCors({
      origin: '*',
  });

  // Swagger-config
  const config = new DocumentBuilder()
      .setTitle('Buch-Shop API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
  
  // Create the Swagger document 
  // using the app instance and the config defined above
  const document = SwaggerModule.createDocument(app, config);
  
  // Set up the Swagger module with the document and the app instance
  SwaggerModule.setup('api/', app, document); // This sets up the Swagger UI at the /api/ endpoint

  await app.listen(process.env.PORT ?? 3000); // Start the application on the specified port
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger is running on: ${await app.getUrl()}/api/`);
}
bootstrap();
