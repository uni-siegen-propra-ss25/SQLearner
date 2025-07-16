import { ContainerStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum } from 'class-validator';

/**
 * Configuration for creating a new container
 */
export class ContainerConfig {
    @ApiProperty({ description: 'Docker image to use' })
    @IsString()
    image: string;

    @ApiProperty({ description: 'Environment variables for the container' })
    @IsObject()
    env: Record<string, string>;

    @ApiProperty({ description: 'Port mappings', required: false })
    @IsObject()
    @IsOptional()
    ports?: Record<string, string>;

    @ApiProperty({ description: 'Volume mappings', required: false })
    @IsObject()
    @IsOptional()
    volumes?: Record<string, string>;

    @ApiProperty({ description: 'Command to run in the container', required: false })
    @IsString({ each: true })
    @IsOptional()
    command?: string[];

    @ApiProperty({ description: 'Working directory in the container', required: false })
    @IsString()
    @IsOptional()
    workingDir?: string;

    @ApiProperty({ description: 'Network mode for the container', required: false })
    @IsString()
    @IsOptional()
    networkMode?: string = 'bridge';

    @ApiProperty({ description: 'Whether to remove the container after it stops', required: false })
    @IsBoolean()
    @IsOptional()
    autoRemove?: boolean = true;

    @ApiProperty({ description: 'Resource limits for the container', required: false })
    @IsObject()
    @IsOptional()
    resources?: {
        memory?: string;
        memorySwap?: string;
        cpuShares?: number;
        cpuQuota?: number;
    };
}

/**
 * Information about a container
 */
export class ContainerInfo {
    @ApiProperty({ description: 'Container ID' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Current container status', enum: ContainerStatus })
    @IsEnum(ContainerStatus)
    status: ContainerStatus;

    @ApiProperty({ description: 'Exposed port number', required: false })
    @IsNumber()
    @IsOptional()
    port?: number;

    @ApiProperty({ description: 'Error message if any', required: false })
    @IsString()
    @IsOptional()
    error?: string;

    @ApiProperty({ description: 'Health check status', required: false })
    @IsString()
    @IsOptional()
    health?: string;

    @ApiProperty({ description: 'Memory usage in bytes', required: false })
    @IsNumber()
    @IsOptional()
    memoryUsage?: number;

    @ApiProperty({ description: 'CPU usage percentage', required: false })
    @IsNumber()
    @IsOptional()
    cpuUsage?: number;
}
