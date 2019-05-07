/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
// const chalk = require('chalk');
// const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);


// DEFINE
// -----------------------------
/**
 * @description Runs custom plugins defined outside of the build repo
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Object} obj.plugins - The set of custom-user plugins to run for this instance.
 * These are pulled from the `main.js` config file, and are run in 3 build positions: `before`, `after` and during the files loop (`default`).
 */
async function customPlugins({data = {}, file, log, plugins}) {
  // Show terminal message: Start
  if (log) Logger.header(`\nRunning Custom-User Plugins`);
  // Early Exit: No Plugins
  if (!plugins) return;
  // Execute each user plugin
  plugins.forEach(async fn => {
    const plugin = require(`${cwd}/plugins/${fn}.js`);
    let plg = String(fn);
    // Execute plugin method if it exists
    if (plugin[plg]) plugin[plg]({data, file}); 
    // Show terminal message: Done
    Logger.success(fn);
  });
}


// EXPORT
// -----------------------------
module.exports = customPlugins;