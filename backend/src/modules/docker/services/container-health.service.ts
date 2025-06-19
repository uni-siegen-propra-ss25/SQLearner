import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from '../services/docker.service';

@Injectable()
export class ContainerHealthService {
    private readonly logger = new Logger(ContainerHealthService.name);
    private healthChecks: Map<string, NodeJS.Timeout> = new Map();

    constructor(private readonly dockerService: DockerService) {}

    /**
     * Start monitoring a container's health
     * @param containerId The ID of the container to monitor
     */
    async startHealthCheck(containerId: string): Promise<void> {
        if (this.healthChecks.has(containerId)) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const status = await this.dockerService.getContainerStatus(containerId, null);
                if (status.status === 'error') {
                    await this.handleUnhealthyContainer(containerId);
                }
            } catch (error) {
                this.logger.error(`Health check failed for container ${containerId}`, error);
            }
        }, 30000); // Check every 30 seconds

        this.healthChecks.set(containerId, interval);
    }

    /**
     * Stop monitoring a container's health
     * @param containerId The ID of the container to stop monitoring
     */
    stopHealthCheck(containerId: string): void {
        const interval = this.healthChecks.get(containerId);
        if (interval) {
            clearInterval(interval);
            this.healthChecks.delete(containerId);
        }
    }

    /**
     * Handle an unhealthy container
     * @param containerId The ID of the unhealthy container
     */
    private async handleUnhealthyContainer(containerId: string): Promise<void> {
        this.logger.warn(`Container ${containerId} is unhealthy. Attempting recovery...`);
        try {
            await this.dockerService.resetContainer(containerId, null);
            this.logger.log(`Container ${containerId} successfully recovered`);
        } catch (error) {
            this.logger.error(`Failed to recover container ${containerId}`, error);
        }
    }
}
