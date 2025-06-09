import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,    
      entities: [__dirname + '/../**/*.entity.js'],
      synchronize: true,                // Nur für Entwicklung, nicht für Produktion!
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
