const stagingConfig = require('./config.staging');

let config = {
  contributors: ['ngokevin', 'dmarcos', 'donmccurdy'],
  repo: 'aframevr/aframe',
  repoRegistry: 'aframevr/aframe-registry',
  repoSite: 'aframevr/aframe-site',
  repoSitePages: 'aframevr/aframevr.github.io',
  userEmail: 'aframebot@gmail.com',
  userName: 'a-frobot'
};

if (process.env.AFROBOT_ENV === 'staging' || process.env.AFROBOT_ENV === 'test') {
  config = Object.assign(config, stagingConfig);
}

module.exports = config;
