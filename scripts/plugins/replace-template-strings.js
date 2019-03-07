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

const siteData = require(`${cwd}/config/siteData.js`);

async function replaceTemplateStrings({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');

  const siteDataKeys = Object.keys(siteData);
  const siteDataValues = siteDataKeys.map(i => siteData[i]);

  const compiled = compile(file.src, siteDataKeys)(...siteDataValues);

  file.src = compiled;

  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;