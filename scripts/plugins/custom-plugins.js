/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
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
 * Note: You can export a plugin either as a function or ES6 class
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
    // Is function?
    if (plugin[plg]) plugin[plg]({file, data});
    // Is class?
    else {
      try {
        new plugin[Object.keys(plugin)[0]]({file, data})
      }
      catch (e) {
        const errorStackFileLine = e.stack.split('\n')[1];
        const splitColon = errorStackFileLine.split(':');
        const lineNumber = splitColon[splitColon.length - 2];
        const fileName = splitColon[splitColon.length - 3];
        // Display custom error message
        console.log(chalk.bold.red(`\n${plg}`));
        console.log(chalk.red(e.message));
        if (fileName) {
          const fileSplit = fileName.split(' (');
          const filePart = fileSplit[0];
          const filePath = fileSplit[1];
          console.log(chalk.grey(`${filePart.trim()} (line ${lineNumber})`));
          console.log(chalk.grey(filePath));
        }
      }
    }

  });
}


// EXPORT
// -----------------------------
module.exports = customPlugins;