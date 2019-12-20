/**
 * @file replace-src-path.js
 * @description Replace `/src` paths for `NODE_ENV=development` since we do not inline `[inline]` elements locally,
 * so the `@import url()` path cannot start with `/src`, since that doesn't exist in the `/dist` folder
 */

// REQUIRE
// -----------------------------
// const cwd = process.cwd();
const chalk = require('chalk');
// const fs = require('fs-extra');
const Logger = require('../utils/logger/logger.js');
const Util = require('../utils/util/util.js');

// Config
const {distPath,srcPath} = require('../utils/config/config.js');


// DEFINE
// -----------------------------
/**
 * @description Replace `/src` paths for `NODE_ENV=development` since we do not inline `[inline]` elements locally,
 * so the `@import url()` path cannot start with `/src`, since that doesn't exist in the `/dist` folder
 * @param {Object} obj - Deconstructed options object
 * @property {Object} obj.file - The current file's info (name, extension, path, src, etc.)
 * @property {Array} [obj.allowType] - Allowed file types (Opt-in)
 * @property {Array} [obj.disallowType] - Disallowed file types (Opt-out)
 */
class ReplaceSrcPathForDev {
  constructor({file, allowType, disallowType, excludePaths = []}) {
    this.opts = {file, allowType, disallowType, excludePaths};
    this.file = file;
    this.allowType = allowType;
    this.disallowType = disallowType;
    this.excludePaths = excludePaths;

    // Store holder for total # of matches
    this.total = 0;

    // Init terminal logging
    if (process.env.LOGGER) Util.initLogging.call(this);
  }

  // INIT
  // -----------------------------
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  async init() {
    // Early Exit: File type not allowed
    const allowed = Util.isAllowedType(this.opts);
    if (!allowed) return;
    
    // START LOGGING
    this.startLog();

    // Set regex and do matching
    const { file } = this;
    const targetRegex = new RegExp(`\(\/${srcPath}.+(?=\))`, 'gim');
    const matches = file.src.match(targetRegex);
    // For each found match, replace it by slicing off the first X characters from the path,
    // based on the length of the `src` directory name set in config `config/main.js` file.
    // By default, this is `src`. Therefore, given a css path like `/src/css/ex.css` we
    // want to slice off the leading `/` and then `src`, which is 4 characters total (`srcPath.length+1`)
    if (matches) this.file.src = this.replacePath({file, matches});

    // END LOGGING
    this.endLog();
  }


  // HELPER METHODS
  // -----------------------------

  /**
   * @description Replace `/src` path with `/dist`-appropriate path.
   * @param {Object} opts - Argument options object
   * @property {String} match - The string match to modify
   * @property {String} fileName - The current file path for display
   * @property {String} fileSource - The current file's source for modifying
   * @returns {String}
   * @private
   */
  replacePath({file, matches}) {
    let newPath;
    matches.forEach((m,i) => {
      newPath = m.slice(srcPath.length+1);
      file.src = file.src.replace(m, newPath);
    });
    return file.src;
  }
  

  // LOGGING
  // -----------------------------
  // Display additional terminal logging when `process.env.LOGGER` enabled
  
  startLog() {
    // Early Exit: Logging not allowed
    if (!process.env.LOGGER) return; 
    // Start Spinner
    this.loading.start(chalk.magenta('Replacing /src paths in @import calls'));
    // Start timer
    this.timer.start();
  }

  endLog() {
    // Early Exit: Logging not allowed
    if (!process.env.LOGGER) return;
    // Stop Spinner and Timer
    if (this.total > 0) this.loading.stop(`Removed ${chalk.magenta(this.total)} /src instances ${this.timer.end()}`);
    // If no matches found, stop logger but don't show line in terminal
    else this.loading.kill();
  }
  
  
  // EXPORT WRAPPER
  // -----------------------------
  // Export function wrapper instead of class for `build.js` simplicity
  static async export(opts) {
    return new ReplaceSrcPathForDev(opts).init();
  }
}


// EXPORT
// -----------------------------
module.exports = ReplaceSrcPathForDev.export;