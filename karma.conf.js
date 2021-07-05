module.exports = function getConfig(config) {
  config.set({
    basePath: '',
    browsers: [
      'Chrome'
    ],
    files: [
      'dist/umd/http-rocket.js',
      'test/**/*.js'
    ],
    frameworks: [
      'mocha',
      'chai'
    ],
    singleRun: false
  });
};
