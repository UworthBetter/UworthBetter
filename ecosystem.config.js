// SQLite 与进程内任务订阅要求单进程；禁止 cluster 和多实例。
module.exports = {
  apps: [{
    name: "uworthbetter",
    cwd: __dirname,
    script: "node_modules/next/dist/bin/next",
    // 必须绑 docker0 网关：容器内 nginx 反代 172.17.0.1:3000，绑 127.0.0.1 则不通。
    args: "start -H 172.17.0.1 -p 3000",
    instances: 1,
    exec_mode: "fork",
    // 阿里云→Cloudflare（sidrune.ai）TLS 握手常超 250ms，Node Happy Eyeballs 默认单次尝试
    // 250ms 即放弃会聚合成 ETIMEDOUT，放宽到 5s（实测 5 次成功 4 次，失败由重试+mock 兜底）。
    env: { NODE_ENV: "production", NODE_OPTIONS: "--network-family-autoselection-attempt-timeout=5000" },
    kill_timeout: 90000,
    autorestart: true,
    time: true,
  }],
};
