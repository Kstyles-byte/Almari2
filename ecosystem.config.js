module.exports = {
  apps: [{
    name: 'zervia',
    script: "npm",
    args: "run start",
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    "time": true,
    "log_file": "~/.pm2/logs/zervia.log",
    "combine_logs": true,
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}