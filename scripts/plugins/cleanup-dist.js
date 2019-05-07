/**
 * @file cleanup-dist.js
 * @description Remove `/dist/includes` after build
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const rimraf = require('rimraf');
const Logger = require(`../utils/logger.js`);

// Config
const {distPath} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
async function cleanupDist() {
  // Remove `/dist/includes` (fails silently if not there as that is the intended result)
  rimraf(`${distPath}/includes`, first);
}

// HELPER METHODS
// -----------------------------

function first() {
  delayTerminalMessage();
  Logger.success(`${distPath}/includes removed`);
}

function delayTerminalMessage() {
  // Show terminal message: Start
  Logger.header(`\nCleanup /${distPath}`);
}

// EXPORT
// -----------------------------
module.exports = cleanupDist;