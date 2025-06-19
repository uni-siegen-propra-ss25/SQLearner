/**
 * Docker configuration settings for container management
 */
export const DockerConfig = {
    // Default settings for student database containers
    studentContainer: {
        // Resource limits
        resources: {
            memory: '256m',
            memorySwap: '256m',
            cpuShares: 512,
            cpuQuota: 50000,
        },
        // Security settings
        security: {
            capDrop: ['ALL'],
            readOnlyRootfs: true,
            noNewPrivileges: true,
            securityOpts: ['no-new-privileges'],
        }
    },
    // Database settings
    database: {
        image: 'postgres:15-alpine',
        port: '5432',
        initPath: '/docker-entrypoint-initdb.d',
        healthCheck: {
            interval: '30s',
            timeout: '10s',
            retries: 3,
            command: ['pg_isready', '-U', 'postgres']
        }
    },
    // Network settings
    network: {
        mode: 'bridge',
        dns: ['8.8.8.8', '8.8.4.4']
    },
    // Cleanup settings
    cleanup: {
        autoRemove: true,
        stopTimeout: 10,
        idleTimeout: 3600 // 1 hour
    }
};
