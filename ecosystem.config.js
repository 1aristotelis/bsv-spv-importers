module.exports = {
    apps: [
      {
        name: 'master',
        script: './master.js',
        instances: 1,
        autorestart: true,
        watch: false,
      },
      {
        name: 'bmap_listener',
        script: './bmap_listener.js',
        instances: 1,
        autorestart: true,
        watch: false,
      },
      {
        name: 'lockup_listener',
        script: './lockup_listener.js',
        instances: 1,
        autorestart: true,
        watch: false,
      },
    ],
};