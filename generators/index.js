// generators/index.js
const generateAppJs = require('./appGenerator');
const generateDbJs = require('./dbGenerator');
const { generateRouteFile, createIndexRoutesFile } = require('./routeGenerator');
const { generateAuthJs, generateAuthRoutes } = require('./authGenerator');
const setupFrontend = require('./frontendGenerator');

module.exports = {
  generateAppJs,
  generateDbJs,
  generateRouteFile,
  createIndexRoutesFile,
  generateAuthJs,
  generateAuthRoutes,
  setupFrontend
};
