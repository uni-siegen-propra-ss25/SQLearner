import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '@prisma/client';
import * as Docker from 'dockerode';
import { PrismaService } from '../../../prisma/prisma.service';
import { Client } from 'pg';
import { Controller, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';

/**
 * Service responsible for managing Docker containers for the SQL learning system.
 * Handles container lifecycle (creation, deletion, reset) and status monitoring.
 */
@Injectable()
export class DockerService implements OnModuleInit {
    private readonly docker: Docker;

    constructor(private prisma: PrismaService) {
        this.docker = new Docker();
    }

    /**
     * On module init, start a simple interval to clean up stale containers every 5 minutes.
     */
    onModuleInit() {
        setInterval(() => {
            this.cleanupStaleContainers();
        }, 300_000); // every 5 minutes
    }

    /**
     * Finds and removes containers older than 5 minute with the 'exercise_db_' prefix.
     */
    private async cleanupStaleContainers() {
        try {
            const containers = await this.docker.listContainers({ all: true });
            const now = Date.now();

            // Get all sessions with endedAt != null OR status not RUNNING
            const staleSessions = await this.prisma.dbSession.findMany({
                where: {
                    OR: [
                        { endedAt: { not: null } },
                        { status: { not: 'RUNNING' } },
                    ],
                },
                select: { containerId: true },
            });
            const staleContainerIds = new Set(staleSessions.map(s => s.containerId));

            for (const info of containers) {
                if (info.Names.some(name => name.includes('exercise_db_'))) {
                    const createdMs = (info.Created || 0) * 1000;
                    if (now - createdMs > 60_000) {
                        // Delete only if the container is marked as inactive in the database
                        if (staleContainerIds.has(info.Id)) {
                            try {
                                const container = this.docker.getContainer(info.Id);
                                await container.stop().catch(() => {});
                                await container.remove({ force: true });
                                console.log(`[DockerService] Cleaned up stale container: ${info.Id} (${info.Names[0]})`);
                            } catch (err) {
                                console.error(`[DockerService] Failed to remove stale container: ${info.Id}`, err);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[DockerService] Error during cleanupStaleContainers:', err);
        }
    }

    /**
     * Creates a new database container for a specific exercise and user
     * @param exerciseId - The ID of the exercise for which to create the container
     * @param user - The user for whom the container is being created
     * @returns The container ID and connection details
     */
    async createContainer(
        exerciseId: number,
        user: User,
    ): Promise<{ containerId: string; connectionDetails: any }> {
        console.log(`Creating container for exercise ${exerciseId} and user ${user.id}`);

        const exercise = await this.prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: { database: true },
        });

        if (!exercise || !exercise.database) {
            throw new Error('Exercise or database not found');
        }

        console.log(`Found exercise: ${exercise.title}, database: ${exercise.database.schemaSql}`);

        // Generate unique container name
        const containerName = `exercise_db_${exerciseId}_${user.id}_${Date.now()}`;

        const container = await this.docker.createContainer({
            Image: 'postgres:15-alpine',
            name: containerName,
            Env: ['POSTGRES_PASSWORD=secret', 'POSTGRES_USER=postgres', 'POSTGRES_DB=exercise_db'],
            ExposedPorts: { '5432/tcp': {} },
            HostConfig: {
                PortBindings: { '5432/tcp': [{ HostPort: '0' }] },
                AutoRemove: true,
                Memory: 256 * 1024 * 1024, // 256MB limit
                MemorySwap: 256 * 1024 * 1024,
            },
        });

        console.log(`Container created with ID: ${container.id}`);

        await container.start();
        console.log(`Container started successfully`);

        // Wait for PostgreSQL to be ready
        console.log('Waiting for PostgreSQL to be ready...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const containerInfo = await container.inspect();
        const port = containerInfo.NetworkSettings.Ports['5432/tcp'][0].HostPort;

        console.log(`Container port: ${port}`);

        // Use the host machine's IP to connect to the container
        // When running in Docker, we need to use the host's IP, not localhost
        const connectionDetails = {
            host: 'host.docker.internal', // This works on Docker Desktop
            port: parseInt(port),
            database: 'exercise_db',
            user: 'postgres',
            password: 'secret',
        };

        console.log('Testing connection to container...');
        // Test the connection with retry logic
        let connected = false;
        for (let attempt = 1; attempt <= 10; attempt++) {
            try {
                console.log(`Connection attempt ${attempt}/10`);
                const testClient = new Client({
                    ...connectionDetails,
                    connectionTimeoutMillis: 5000,
                });
                await testClient.connect();
                await testClient.query('SELECT 1');
                await testClient.end();
                connected = true;
                console.log('Connection test successful');
                break;
            } catch (error) {
                console.log(`Connection attempt ${attempt} failed: ${error.message}`);
                if (attempt === 10) {
                    console.error('All connection attempts failed');
                    // Clean up the container if we can't connect
                    try {
                        await container.stop();
                        await container.remove();
                    } catch (cleanupError) {
                        console.error('Failed to cleanup container:', cleanupError);
                    }
                    throw new Error(
                        `Could not connect to PostgreSQL container after 10 attempts: ${error.message}`,
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }

        console.log('Initializing database with exercise schema...');
        // Initialize the database with the exercise schema
        await this.initializeDatabase(connectionDetails, exercise.database.schemaSql);

        console.log('Container setup completed successfully');
        return {
            containerId: container.id,
            connectionDetails,
        };
    }

    /**
     * Initializes the database in the container by copying schema and data from the source database
     * @param connectionDetails - Database connection details for the container
     * @param sourceDbName - Name of the source database to copy from
     */
    private async initializeDatabase(connectionDetails: any, sourceDbName: string): Promise<void> {
        let containerClient: Client | null = null;
        let sourceClient: Client | null = null;

        try {
            console.log(`Copying schema and data from database: ${sourceDbName}`);

            // Connect to the source database (exercise database in main PostgreSQL)
            sourceClient = new Client({
                host: process.env.DB_HOST || 'db', // Use the main database host
                port: parseInt(process.env.DB_PORT || '5432', 10),
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: sourceDbName, // Connect to the specific exercise database
            });
            await sourceClient.connect();
            console.log('Connected to source database successfully');

            // Connect to the container database
            containerClient = new Client(connectionDetails);
            await containerClient.connect();
            console.log('Connected to container database successfully');

            // Get all tables from source database
            const tablesResult = await sourceClient.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);

            const tables = tablesResult.rows.map((row) => row.table_name);
            console.log(`Found ${tables.length} tables to copy: ${tables.join(', ')}`);

            for (const tableName of tables) {
                console.log(`Copying table: ${tableName}`);

                // Get table structure
                const structureResult = await sourceClient.query(
                    `
                    SELECT 
                        c.column_name, 
                        c.data_type, 
                        c.is_nullable, 
                        c.column_default,
                        c.character_maximum_length,
                        c.numeric_precision,
                        c.numeric_scale
                    FROM information_schema.columns c
                    WHERE c.table_name = $1 
                    ORDER BY c.ordinal_position
                `,
                    [tableName],
                );

                // First, create any sequences needed
                for (const col of structureResult.rows) {
                    if (col.column_default && col.column_default.includes('nextval')) {
                        const sequenceMatch = col.column_default.match(
                            /nextval\('([^']+)'::regclass\)/,
                        );
                        if (sequenceMatch) {
                            const sequenceName = sequenceMatch[1];
                            console.log(`Creating sequence: ${sequenceName}`);
                            try {
                                await containerClient.query(
                                    `CREATE SEQUENCE IF NOT EXISTS "${sequenceName}"`,
                                );
                            } catch (seqError) {
                                console.log(
                                    `Sequence ${sequenceName} might already exist: ${seqError.message}`,
                                );
                            }
                        }
                    }
                }

                // Create table in container
                const columns = structureResult.rows.map((col) => {
                    let colDef = `"${col.column_name}" ${col.data_type}`;

                    // Handle character varying with length
                    if (col.data_type === 'character varying' && col.character_maximum_length) {
                        colDef = `"${col.column_name}" varchar(${col.character_maximum_length})`;
                    }

                    // Handle numeric types
                    if (col.data_type === 'numeric' && col.numeric_precision) {
                        if (col.numeric_scale) {
                            colDef = `"${col.column_name}" numeric(${col.numeric_precision},${col.numeric_scale})`;
                        } else {
                            colDef = `"${col.column_name}" numeric(${col.numeric_precision})`;
                        }
                    }

                    if (col.is_nullable === 'NO') colDef += ' NOT NULL';
                    if (col.column_default) {
                        colDef += ` DEFAULT ${col.column_default}`;
                    }
                    return colDef;
                });

                const createTableSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.join(', ')})`;
                console.log(`Creating table ${tableName}: ${createTableSql}`);

                try {
                    await containerClient.query(createTableSql);
                    console.log(`Table ${tableName} created successfully`);
                } catch (error) {
                    console.log(`Table ${tableName} might already exist: ${error.message}`);
                }

                // Copy data
                const dataResult = await sourceClient.query(`SELECT * FROM "${tableName}"`);
                if (dataResult.rows.length > 0) {
                    console.log(`Copying ${dataResult.rows.length} rows from table ${tableName}`);

                    for (const row of dataResult.rows) {
                        const columns = Object.keys(row);
                        const values = Object.values(row);
                        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                        const insertSql = `INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
                        await containerClient.query(insertSql, values);
                    }
                    console.log(`Data copied to table ${tableName} successfully`);
                }
            }

            console.log('Database initialization completed successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw new Error(`Failed to initialize database: ${error.message}`);
        } finally {
            if (containerClient) {
                console.log('Closing container database connection...');
                await containerClient.end();
            }
            if (sourceClient) {
                console.log('Closing source database connection...');
                await sourceClient.end();
            }
        }
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
    async getContainerStatus(
        containerId: string,
        user: User | null,
    ): Promise<{ status: string; details: any }> {
        // Implementation coming in next step
        return {
            status: '',
            details: {},
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

@Controller('docker')
export class DockerController {
    constructor(
        private readonly dockerService: DockerService,
        private readonly prisma: PrismaService,
    ) {}

    @Post('end-session/:containerId')
    async endSession(@Param('containerId') containerId: string) {
        const session = await this.prisma.dbSession.findFirst({ where: { containerId } });
        if (!session) throw new NotFoundException('Session not found');
        if (!session.endedAt || session.status === ContainerStatus.RUNNING) {
            await this.prisma.dbSession.updateMany({
                where: { containerId },
                data: { endedAt: new Date(), status: ContainerStatus.FINISHED },
            });
        }
        return { success: true };
    }
}
