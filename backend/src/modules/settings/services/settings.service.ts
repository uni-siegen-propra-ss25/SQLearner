import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) {}

    async getSetting(name: string): Promise<string | null> {
        const setting = await this.prisma.settings.findUnique({
            where: { name },
        });
        return setting?.value ?? null;
    }

    // TODO: Add encryption for sensitive settings like API keys
    async setSetting(name: string, value: string, description?: string): Promise<void> {
        await this.prisma.settings.upsert({
            where: { name },
            update: { value },
            create: {
                name,
                value,
                description,
            },
        });
    }

    async deleteSetting(name: string): Promise<void> {
        await this.prisma.settings.delete({
            where: { name },
        });
    }

    async getAllSettings(): Promise<any[]> {
        return this.prisma.settings.findMany();
    }
}
