import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as Docker from 'dockerode';
import { PrismaService } from '../../../prisma/prisma.service';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as util from 'util';

const execAsync = util.promisify(exec);

/**
 * Service responsible for managing Docker containers for the SQL learning system.
 * Handles container lifecycle (creation, deletion, reset) and status monitoring.
 */
@Injectable()
export class DockerService {
    private readonly docker: Docker;

    constructor(private prisma: PrismaService) {
        this.docker = new Docker();
    }
    
    /**
     * Creates a new database container for a specific exercise and user
     * @param exerciseId - The ID of the exercise for which to create the container
     * @param user - The user for whom the container is being created
     * @returns The container ID and connection details
     */
    async createContainer(exerciseId: number, user: User): Promise<{ containerId: string; connectionDetails: any }> {
        const exercise = await this.prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: { database: true },
        });

        if (!exercise || !exercise.database) {
            throw new Error('Exercise or database not found');
        }

        const container = await this.docker.createContainer({
            Image: 'postgres:alpine',
            Env: ['POSTGRES_PASSWORD=secret'],
            ExposedPorts: { '5432/tcp': {} },
            HostConfig: {
                PortBindings: { '5432/tcp': [{ HostPort: '0' }] },
                AutoRemove: true,
            },
        });

        await container.start();
        const containerInfo = await container.inspect();
        const port = containerInfo.NetworkSettings.Ports['5432/tcp'][0].HostPort;

        const dbName = exercise.database.schemaSql;
        const backupPath = `/tmp/backup-${Date.now()}.sql`;

        const dumpCommand = `pg_dump -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USER} -d ${dbName} > ${backupPath}`;
        await execAsync(dumpCommand, { env: { PGPASSWORD: process.env.DB_PASSWORD } });

        const tarStream = fs.createReadStream(backupPath);
        await container.putArchive(tarStream, { path: '/tmp' });

        const restoreCommand = `psql -U postgres -d postgres -f ${backupPath}`;
        const restoreExec = await container.exec({
            Cmd: ['sh', '-c', restoreCommand],
            AttachStdout: true,
            AttachStderr: true,
        });

        await new Promise<void>((resolve, reject) => {
            restoreExec.start({}, (err, stream) => {
                if (err) return reject(err);
                if (stream) {
                    stream.on('end', resolve);
                    stream.on('error', reject);
                } else {
                    resolve();
                }
            });
        });

        fs.unlinkSync(backupPath);

        return {
            containerId: container.id,
            connectionDetails: {
                host: 'localhost',
                port: port,
            },
        };
    }

    /**
     * Deletes a specific database container
     * @param containerId - The ID of the container to delete
     * @param user - The user requesting the deletion
     */
    async deleteContainer(containerId: string, user: User): Promise<void> {
        const container = this.docker.getContainer(containerId);
        await container.stop();
    }

    /**
     * Resets a database container to its initial state
     * @param containerId - The ID of the container to reset
     * @param user - The user requesting the reset
     */
    async resetContainer(containerId: string, user: User): Promise<void> {
        // Implementation coming in next step
    }

    /**
     * Retrieves the current status of a container
     * @param containerId - The ID of the container to check
     * @param user - The user requesting the status
     * @returns Container status information
     */
    async getContainerStatus(containerId: string, user: User | null): Promise<{ status: string; details: any }> {
        // Implementation coming in next step
        return {
            status: '',
            details: {}
        };
    }

    /**
     * Validates user access to a specific container
     * @param containerId - The ID of the container to validate
     * @param user - The user to validate
     * @returns boolean indicating if the user has access
     */
    private async validateUserAccess(containerId: string, user: User): Promise<boolean> {
        // Implementation coming in next step
        return false;
    }

    async pullImage(image: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.docker.pull(image, (err: Error, stream: NodeJS.ReadStream) => {
                if (err) {
                    return reject(err);
                }
                if (stream) {
                    stream.on('end', resolve);
                    stream.on('error', reject);
                    stream.on('data', (chunk) => {
                        console.log(`Pulling ${image}: ${chunk.toString().trim()}`);
                    });
                } else {
                    resolve();
                }
            });
        });
    }
}