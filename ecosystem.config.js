module.exports = {
    apps: [
      {
        name: 'master-bsv',
        script: './master_bsv.js',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
      },
      {
        name: 'master-btc',
        script: './master_btc.js',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
      },
      {
        name: 'bsv-listener',
        script: './listener_bsv.js',
        exec_mode: 'fork',
        instances: 1,
        wait_ready: true,
        autorestart: true,
        watch: false,
        dependencies: ['master-bsv']
      },
      {
        name: 'btc-listener',
        script: './listener_btc.js',
        exec_mode: 'fork',
        instances: 1,
        wait_ready: true,
        autorestart: true,
        watch: false,
        dependencies: ['master-btc']
      },
    ],
};