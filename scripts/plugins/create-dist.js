/**
 * @file create-dist.js
 * @description Remove `/dist` and recreate it
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const Logger = require(`./utils/logger.js`);

// Config
const {distPath} = require(`${cwd}/config/main.js`);

// DEFINE
// -----------------------------
async function createDist() {
  // Show terminal message: Start
  Logger.header(`\nCreate /${distPath}`);

  // Remove `/dist` (fails silently if not there as that is the intended result)
  rimraf.sync(distPath);
  // Make fresh '/dist' folder
  fs.mkdirSync(distPath);

  // Show terminal message: Done
  Logger.success (`/${distPath} created`);
}


// EXPORT
// -----------------------------
module.exports = createDist;