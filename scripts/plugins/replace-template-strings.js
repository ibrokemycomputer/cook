/**
 * @file replace-template-strings.js
 * @description Replace template strings with proper variable
 */

// REQUIRE
// -----------------------------
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

const decode = require('ent/decode'); // JSDom HTML entity band-aid

// Config

const {siteData} = require(`./site-data.js`);

async function replaceTemplateStrings({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');

  const siteDataKeys = Object.keys(siteData);
  const siteDataValues = siteDataKeys.map(i => siteData[i]);

  const compiled = compile(decode(file.src), siteDataKeys)(...siteDataValues);

  file.src = compiled;

  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;