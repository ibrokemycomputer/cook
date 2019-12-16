/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const utils = require('../utils/util/util.js');
const Logger = require('../utils/logger/logger.js');

// Config
const {pluginPath} = require('../utils/config/config.js');

// DEFINE
// -----------------------------
/**
 * @description Runs custom plugins defined outside of the build repo
 * @param {Object} obj - Deconstructed options object
 * @property {Object} obj.file - The current file's info (name, extension, path, src, etc.) if a per-file plugin or all the allowed files if a `before` or `after` file loop plugin
 * @property {Object} obj.data - The user's custom data from the `data.js` config file, so they can access it in their custom plugins
 * @property {Boolean} obj.log - User opt-in to show the full logging in the terminal or not
 * @property {Object} obj.plugins - The set of custom-user plugins to run for this instance.
 * These are pulled from the `main.js` config file, and are run in 3 build positions: `before`, `after` and during the files loop (`default`).
 * Note: The user must create and export the plugin as an ES6 class
 */
class CustomPlugins {
  constructor({file, data = {}, log, plugins}) {
    this.file = file;
    this.data = data;
    this.log = log;
    this.plugins = plugins;
  }

  // INIT
  // -----------------------------
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  async init() {
    // Early Exit: No Plugins
    if (!this.plugins) return;
    
    // Show terminal message: Start
    if (this.log) Logger.persist.header(`\nCustom User Plugins: ${this.log}${utils.countDisplay(this.plugins)}`);

    // Execute each user plugin
    // NOTE: Using recursion instead of `util.promiseAll` since we want
    // each plugin to run schronously. Their internal plugin code can 
    // await async code, though.
    await this.recursePlugins(0); 
  }

  
  // HELPER METHODS
  // -----------------------------

  async recursePlugins(index) {
    // Stop recursion if no more plugins
    if (!this.plugins[index]) return;

    // Show terminal message: Plugin Start
    if (this.log) Logger.info(this.plugins[index]);

    // Use user-defined plugin dir path (main.js) or use default location
    const pluginsPath = pluginPath || 'plugins';
    // Get plugin file source
    const plugin = require(`${cwd}/${pluginsPath}/${this.plugins[index]}.js`);
    // Run plugin's `init()` method (since it might be async - constructors can't be async)
    try {
      const {file, data} = this;
      await new plugin[Object.keys(plugin)[0]]({file, data}).init();
      await this.recursePlugins(index+=1);
    }
    catch (err) {
      utils.customError(err, 'custom-plugins.js');
      return;
    }
  };
    

  // EXPORT WRAPPER
  // -----------------------------
  // Export function wrapper instead of class for `build.js` simplicity
  static async export(opts) {
    return new CustomPlugins(opts).init();
  }
}


// EXPORT
// -----------------------------
module.exports = CustomPlugins.export;