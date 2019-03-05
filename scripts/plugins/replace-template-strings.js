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
  
  file.src = file.src.replace(/\$\{pageName\}/g, siteConfig.pages.index);

  Logger.success(`${file.path} - Replaced [${'${pageName}'}] with [${siteConfig.pages.index}]`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;