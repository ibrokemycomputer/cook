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
  // Remove `/dist` (fails silently if not there as that is the intended result)
  rimraf(`${distPath}/includes`, cb);
}

function cb() {
  Logger.success(`/${distPath}/includes removed`);
}


// EXPORT
// -----------------------------
module.exports = cleanupDist;