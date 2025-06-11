import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * The DatabaseModule sets up the database connection using TypeORM.
 * It connects to a PostgreSQL database using environment variables.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../**/*.entity.js'],
      synchronize: true, // WARNING: use only in development
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
