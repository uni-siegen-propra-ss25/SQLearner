import { Module } from '@nestjs/common';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}
