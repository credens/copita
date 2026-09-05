// PM2 process definition para el release activo en el VPS. Un solo proceso:
// a diferencia de shopy, Copita no tiene cola de jobs en background todavía.
module.exports = {
  apps: [
    {
      name: "copita-web",
      cwd: "/root/copita/current",
      script: "apps/web/server.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3100" },
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
      time: true,
    },
  ],
};
