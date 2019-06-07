/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const utils = require(`../utils/util.js`);
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
 * Note: You can export a plugin either as a function or ES6 class
 */
async function customPlugins({data = {}, file, log, plugins}) {
  // Early Exit: No Plugins
  if (!plugins) return;
  // Show terminal message: Start
  if (log) Logger.header(`\nCustom User Plugins: ${log}`);

  // Execute each user plugin
  // NOTE: Using recursion instead of forEach so plugins run synchronously
  // in case the plugin itself has async processes which the next is dependent on
  await recursePlugins(0); 
  async function recursePlugins(index) {
    // Stop recursion if no more plugins
    if (!plugins[index]) return;
    // Use user-defined plugin dir path (main.js) or use default location
    const pluginsPath = pluginPath || 'plugins';
    // Get plugin file source
    const plugin = require(`${cwd}/${pluginsPath}/${plugins[index]}.js`);
    // Run plugin's `init()` method (since it might be async - constructors can't be async)
    try {
      await new plugin[Object.keys(plugin)[0]]({file, data}).init();
      await recursePlugins(index+=1);
    }
    catch (e) {
      utils.customError(e);
      return;
    }
  };
}


// EXPORT
// -----------------------------
module.exports = customPlugins;