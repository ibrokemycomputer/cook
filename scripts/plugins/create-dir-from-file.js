/**
 * @file create-dir-from-file.js
 * @description Change all `xxxx.html` pages into `xxxx/index.html` versions so you
 * don't need to show extensions in the url
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// Config
const {distPath} = require(`${cwd}/config/main.js`);

// DEFINE
// -----------------------------
/**
 * @description Change all `xxxx.html` pages into `xxxx/index.html` versions so you
 * don't need to show extensions in the url
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 * @param {Array} [obj.excludePath] - Disallowed certain files (Opt-out)
 */
async function createDirFromFile({file, allowType, disallowType, excludePath}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Get file path without extension
  const filePath = file.path.split('.')[0];
  
  // Early Exit: Do not create directory if current file is an index.html page
  if (file.name === 'index') return;

  // Early Exit: Path includes excluded pattern
  // For example, we don't want to convert the site index file (homepage)
  const isExcludeMatch = excludePath.filter(str => file.path.includes(str));
  if (excludePath && isExcludeMatch.length) return;

  // Create new directory in `/dist`
  fs.mkdirSync(filePath);

  // Create new .html file in newly created directory
  fs.writeFileSync(`${filePath}/index.html`, file.src);

  // Show terminal message: Done
  Logger.success(`/${file.path} - Added [directory]: ${ chalk.green('/' + filePath + '/index.html' ) }`);
}

// EXPORT
// -----------------------------
module.exports = createDirFromFile;