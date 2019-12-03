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
const {distPath,srcPath} = require('../utils/config.js');

// DEFINE
// -----------------------------
class CopySrc {
  constructor() {}

  // INIT
  // -----------------------------
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  async init() {
    // FILE CHANGE
    // If only a single page was updated, just copy it
    const isValidPageChange = utils.validatePageChange();
    if (isValidPageChange) {
      // Store start and end paths
      const changedPath = process.env.DEV_CHANGED_PAGE;
      const changedSrcPath = changedPath;
      const changedDistPath = changedPath.replace(srcPath, distPath);
      // Show terminal message: Start
      Logger.persist.header(`\nCopied Updated Page`);
      // Copy changed page to `/dist` only
      await fs.copy(changedSrcPath, changedDistPath);
      // Show terminal message
      Logger.persist.success(`/${changedSrcPath} copied to /${changedDistPath}`);
    }
    // FULL BUILD
    // Otherwise, copy all contents of `/src` to `/dist`
    else {
      // Show terminal message: Start
      Logger.persist.header('\nCopy /src to /dist');
      // Copy contents of `/src` to `/dist`
      await fs.copy(srcPath, distPath);
      // Show terminal message
      Logger.persist.success(`Content from /${srcPath} copied to /${distPath}`);
    }
  }
  
  
  // EXPORT WRAPPER
  // -----------------------------
  // Export function wrapper instead of class for `build.js` simplicity
  static async export(opts) {
    return new CopySrc(opts).init();
  }
}


// EXPORT
// -----------------------------
module.exports = CopySrc.export;