/**
 * @file copy-src.js
 * @description Copy contents of `/src` to `/dist`
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs-extra');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);
// const { exec } = require('child_process');

// Config
const {distPath,srcPath} = require(`${cwd}/config/main.js`);

// DEFINE
// -----------------------------
function copySrc() {
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  
  // FILE CHANGE
  // If only a single page was updated, just copy it
  const isValidPageChange = utils.validatePageChange();
  if (isValidPageChange) {
    // Store start and end paths
    const changedPath = process.env.DEV_CHANGED_PAGE;
    const changedSrcPath = changedPath;
    const changedDistPath = changedPath.replace(srcPath, distPath);
    // Show terminal message: Start
    Logger.header(`\nCopy Changed Page`);
    // Copy changed page to `/dist` only
    fs.copySync(changedSrcPath, changedDistPath);
    // Show terminal message
    Logger.success(`/${changedSrcPath} copied to /${changedDistPath}`);
  }
  // FULL BUILD
  // Otherwise, copy all contents of `/src` to `/dist`
  else {
    // Show terminal message: Start
    Logger.header('\nCopy /src to /dist');
    // Copy contents of `/src` to `/dist`
    fs.copySync(srcPath, distPath);
    // Show terminal message
    Logger.success(`Content from /${srcPath} copied to /${distPath}`);
  }
}


// EXPORT
// -----------------------------
module.exports = copySrc;