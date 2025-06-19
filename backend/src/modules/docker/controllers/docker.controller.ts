import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DockerService } from '../services/docker.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Docker')
@Controller('docker')
@UseGuards(JwtAuthGuard)
export class DockerController {
    constructor(private readonly dockerService: DockerService) {}

    /**
     * Create a new database container for a user
     */
    @Post('containers/:exerciseId')
    @ApiOperation({ summary: 'Create a new database container' })
    @ApiResponse({ status: 201, description: 'Container created successfully' })
    async createContainer(
        @Param('exerciseId') exerciseId: number,
        @GetUser() user: User
    ) {
        // Implementation coming in next step
        return null;
    }

    /**
     * Delete a database container
     */
    @Delete('containers/:containerId')
    @ApiOperation({ summary: 'Delete a database container' })
    @ApiResponse({ status: 200, description: 'Container deleted successfully' })
    async deleteContainer(
        @Param('containerId') containerId: string,
        @GetUser() user: User
    ) {
        // Implementation coming in next step
    }

    /**
     * Reset a database container to initial state
     */
    @Post('containers/:containerId/reset')
    @ApiOperation({ summary: 'Reset a database container' })
    @ApiResponse({ status: 200, description: 'Container reset successfully' })
    async resetContainer(
        @Param('containerId') containerId: string,
        @GetUser() user: User
    ) {
        // Implementation coming in next step
    }

    /**
     * Get container status
     */
    @Get('containers/:containerId/status')
    @ApiOperation({ summary: 'Get container status' })
    @ApiResponse({ status: 200, description: 'Container status retrieved' })
    async getContainerStatus(
        @Param('containerId') containerId: string,
        @GetUser() user: User
    ) {
        // Implementation coming in next step
        return null;
    }
}
