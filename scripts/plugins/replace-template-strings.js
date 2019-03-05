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

function replaceTemplateStrings() {
  console.log(JSON.parse(siteConfig));
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;