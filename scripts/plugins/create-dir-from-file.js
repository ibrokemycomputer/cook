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

// GET SOURCE
const {getSrcConfig} = require('../utils/get-src');


// DEFINE
// -----------------------------
/**
 * @description Change all `xxxx.html` pages into `xxxx/index.html` versions so you
 * don't need to show extensions in the url
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.files - The site files' full /dist path
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 * @param {Array} [obj.excludePath] - Disallowed certain files (Opt-out)
 */
async function createDirFromFile({files, allowType, disallowType, excludePath}) {
  // CONVERT EACH ALLOWED .HTML PAGE TO DIRECTORY
  files.forEach(fileName => {

    // Get file's meta info (ext,name,path)
    const file = getSrcConfig({fileName, excludeSrc: true });
  
    // Early Exit: File type not allowed
    const allowed = utils.isAllowedType({file,allowType,disallowType});
    if (!allowed) return;

    // Get file path without extension
    const filePath = file.path.split('.')[0];
    
    // Early Exit: Do not create directory if current file is an index.html page
    if (file.name === 'index') return;
    
    // Early Exit: Path includes excluded pattern
    // For example, we don't want to convert the site index file (homepage)
    if (excludePath && excludePath.filter(str => file.path.includes(str)).length) return;

    // CREATE NEW DIRECTORY IN /DIST
    rimraf.sync(filePath);
    fs.mkdirSync(filePath);

    // MOVE PAGE TO NEW DIRECTORY
    // Move xxxx.html file to new directory xxxx/index.html
    fs.renameSync(`${filePath}.html`, `${filePath}/index.html`)

    // Show terminal message
    Logger.success(`/${filePath}.html - Converted to [directory]: ${ chalk.green(`${filePath}/index.html`) }`);
  });

  // CHANGE FILES' STORED /DIST PATH
  // In order to update the pages' new location, instead of the old,
  // we need to update the /dist path to reflect the new, directory location
  files.forEach((f,i) => files[i] = files[i].replace('.html', '/index.html').replace('index/index.html','index.html'));
}

// EXPORT
// -----------------------------
module.exports = createDirFromFile;