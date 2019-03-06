/**
 * @file replace-template-strings.js
 * @description Replace template strings with proper variable
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// Config
const siteConfig = require(`${cwd}/siteConfig.json`);

async function replaceTemplateStrings({file}) {

  Object.keys(siteConfig).forEach((k) => {
    const rgx = new RegExp('\\$\\{'+k+'\\}', 'g');
    file.src = file.src.replace(rgx, siteConfig[k]);
  });

  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;