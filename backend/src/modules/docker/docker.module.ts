import { Module } from '@nestjs/common';
import { DockerController } from './controllers/docker.controller';
import { DockerService } from './services/docker.service';
import { ContainerHealthService } from './services/container-health.service';
import { QueryRateLimiterService } from './services/query-rate-limiter.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DockerController],
    providers: [
        DockerService,
        ContainerHealthService,
        QueryRateLimiterService,
    ],
    exports: [DockerService] // Export DockerService for use in other modules
})
export class DockerModule {}
