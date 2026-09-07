// Full Karma configuration: providing this file opts out of the built-in one
// the Angular builder uses by default, so plugins and frameworks are declared
// here explicitly.
const path = require('node:path');

module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: path.join(__dirname, '../../coverage/ngx-statewise'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly' },
        { type: 'text-summary' },
      ],
      // Sources no test ever imports must still weigh on the report.
      includeAllSources: true,
      // The gate the library is held to: failing it fails `npm run check`.
      check: {
        global: {
          statements: 100,
          lines: 100,
          functions: 100,
          branches: 95,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};
