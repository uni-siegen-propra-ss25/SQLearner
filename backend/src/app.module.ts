import { Module } from '@nestjs/common';
import { AuthController } from './models/auth/auth.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { Module } from './prisma/.module';
import { PrismaModule } from './prisma/prisma.module';

// imports the future controllers and services from modules

@Module({
    imports: [AuthModule, UsersModule, Module, PrismaModule],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AppModule {}
