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

async function replaceTemplateStrings({file, allowType, disallowType}) {

  // Early Exit: File type not allowed
  const allowed = await utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  const data = file.data || require(`${cwd}/config/data.js`); // TODO: Fix this
  
  const dataKeys = Object.keys(data);
  const dataValues = dataKeys.map(i => data[i]);

  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');

  const compiled = compile(decode(file.src), dataKeys)(...dataValues);

  file.src = compiled;

  // Show terminal message: Done
  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;