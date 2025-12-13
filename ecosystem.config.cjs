
        module.exports = {
            apps: [{
                name: 'vite',
                script: 'npm',
                args: 'run dev',
                cwd: '/app',
                autorestart: true,
                watch: false,
                max_memory_restart: '1G',
                env: {
                    NODE_ENV: 'development'
                }
            }]
        };
        