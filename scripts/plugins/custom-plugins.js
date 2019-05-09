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

// Config
const {pluginPath} = require(`${cwd}/config/main.js`);

// DEFINE
// -----------------------------
/**
 * @description Runs custom plugins defined outside of the build repo
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Object} obj.plugins - The set of custom-user plugins to run for this instance.
 * These are pulled from the `main.js` config file, and are run in 3 build positions: `before`, `after` and during the files loop (`default`).
 */
function customPlugins({data = {}, file, log, plugins}) {
  // Early Exit: No Plugins
  if (!plugins) return;
  // Show terminal message: Start
  if (log) Logger.header(`\nCustom User Plugins: ${log}`);
  // Use user-defined plugin dir path (main.js) or use default location
  const pluginsPath = pluginPath || 'plugins';
  // Execute each user plugin
  plugins.forEach(fn => {
    const plugin = require(`${cwd}/${pluginsPath}/${fn}.js`);
    let plg = String(fn);
    // Execute plugin method if it exists
    if (plugin[plg]) plugin[plg]({data, file}); 
  });
}


// EXPORT
// -----------------------------
module.exports = customPlugins;