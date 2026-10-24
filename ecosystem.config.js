// SQLite 与进程内任务订阅要求单进程；禁止 cluster 和多实例。
module.exports = {
  apps: [{
    name: "uworthbetter",
    cwd: __dirname,
    script: "node_modules/next/dist/bin/next",
    args: "start -H 127.0.0.1 -p 3000",
    instances: 1,
    exec_mode: "fork",
    env: { NODE_ENV: "production" },
    kill_timeout: 90000,
    autorestart: true,
    time: true,
  }],
};
