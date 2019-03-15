/**
 * @file replace-template-strings.js
 * @description Replace template strings with proper variable
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();

const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

const decode = require('ent/decode'); // JSDom HTML entity band-aid

// Data + Config

const siteConfig = require(`${cwd}/config/main.js`);
const {siteData} = require(`./site-data.js`);

async function replaceTemplateStrings({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  let data = siteConfig.customData.replaceTemplateStrings
  ? await require(`${cwd}/${siteConfig.customData.replaceTemplateStrings}`).customData
  : siteData;

  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');

  const siteDataKeys = Object.keys(data);
  const siteDataValues = siteDataKeys.map(i => data[i]);

  const compiled = compile(decode(file.src), siteDataKeys)(...siteDataValues);

  file.src = compiled;

  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;