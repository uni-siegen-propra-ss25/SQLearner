import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { main as seedDB } from './prisma/seed';

async function checkAndSeedDatabase() {
    const prisma = new PrismaClient();
    try {
        // Check if any users exist
        const userCount = await prisma.user.count();
        
        if (userCount === 0) {
            console.log('No users found. Running database seed...');
            await seedDB();
            console.log('Database seeding completed successfully.');
        } else {
            console.log('Database already contains users. Skipping seed.');
        }
    } catch (error) {
        console.error('Error checking/seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Log loaded JWT_SECRET for debugging
    // (Achtung: Niemals in Produktion so lassen!)
    // eslint-disable-next-line no-console
    console.log('Loaded JWT_SECRET:', process.env.JWT_SECRET);

    // Set global prefix for all routes
    app.setGlobalPrefix('api');

    // Enable global validation pipe
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
        .setTitle('SQL Practice Platform API')
        .setDescription('API documentation for the interactive SQL-Übungsplattform')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            'access-token',
        )
        .build();

    // Create the Swagger document
    const document = SwaggerModule.createDocument(app, config);

    // Set up the Swagger module
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger is running on: ${await app.getUrl()}/api/`);
}

// Start the application with database check and seeding
async function start() {
    try {
        await checkAndSeedDatabase();
        await bootstrap();
    } catch (error) {
        console.error('Error during application startup:', error);
        process.exit(1);
    }
}

start();
