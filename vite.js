const vite = require('vite');

const createViteServer = vite.createServer;
const createLogger = vite.createLogger;

module.exports = {
  createViteServer,
  createLogger,
};