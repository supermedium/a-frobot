const stagingConfig = require('./config.staging');

let config = {
  repo: 'aframevr/aframe',
  repoRegistry: 'aframevr/aframe-registry',
  repoSite: 'aframevr/aframe-site',
  repoSitePages: 'aframevr/aframevr.github.io',
  userEmail: 'aframebot@gmail.com',
  userName: 'a-frobot'
};

if (process.env.NODE_ENV !== 'production') {
  config = Object.assign(config, stagingConfig);
}

module.exports = config;
