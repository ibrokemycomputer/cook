/**
 * @file replace-template-strings.js
 * @description Compiles ES6 template strings in HTML/CSS files
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);
const decode = require('ent/decode'); // JSDom HTML entity band-aid

/**
 * @description Converts file into a function and returns the rendered value as the file source
 * 
 * @param {Object} file File object
 * @param {Array} allowType Allowed files types
 * @param {Array} disallowType Disallowed files types
 */
async function replaceTemplateStrings({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = await utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Get custom file data or default to site data.js file
  const data = file.data || require(`${cwd}/config/data.js`); // TODO: Fix this
  // Get data keys and values
  const dataKeys = Object.keys(data);
  const dataValues = dataKeys.map(i => data[i]);
  
  /* 
   * Essentially we pass in the HTML source string, wrap it in backticks, then create a 
   * 'Function' that returns the source back with the template string rendered  
   */ 
  const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');
  const compiled = compile(decode(file.src), dataKeys)(...dataValues);

  // Store the new file source
  file.src = compiled;

  // Show terminal message: Done
  Logger.success(`${file.path} - Replaced template strings`);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;