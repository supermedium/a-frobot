const stagingConfig = require('./config.staging');

let prodConfig = {
  repo: 'aframevr/aframe',
  userEmail: 'aframebot@gmail.com',
  userName: 'a-frobot'
};

if (process.env.NODE_ENV !== 'production') {
  module.exports = Object.assign(prodConfig, stagingConfig);
} else {
  module.exports = prodConfig;
}
