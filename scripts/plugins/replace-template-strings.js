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

  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');

  const siteConfigKeys = Object.keys(siteConfig);
  const siteConfigValues = siteConfigKeys.map(i => siteConfig[i]);

  const compiled = compile(file.src, siteConfigKeys)(...siteConfigValues);

  file.src = compiled;

  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;