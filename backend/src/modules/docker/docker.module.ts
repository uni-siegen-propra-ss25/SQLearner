import { Module } from '@nestjs/common';
import { DockerController } from './controllers/docker.controller';
import { DockerService } from './services/docker.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DockerController],
    providers: [DockerService],
    exports: [DockerService] // Export DockerService for use in other modules
})
export class DockerModule {}
