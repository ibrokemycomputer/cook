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
const Logger = require(`../utils/logger.js`);

// Config
const {distPath} = require(`${cwd}/config/main.js`);

// DEFINE
// -----------------------------
function createDist() {
  // Early Exit: Do not create `/dist` if only a single page was updated
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  if (process.env.DEV_CHANGED_PAGE) return;

  // Show terminal message: Start
  Logger.persist.header(`\nCreate /${distPath}`);

  // Remove `/dist` (fails silently if not there as that is the intended result)
  rimraf.sync(distPath);
  // Make fresh '/dist' folder
  fs.mkdirSync(distPath);

  // Show terminal message: Done
  Logger.persist.success (`/${distPath} created`);
}


// EXPORT
// -----------------------------
module.exports = createDist;