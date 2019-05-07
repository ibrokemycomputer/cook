/**
 * @file replace-template-strings.js
 * @description Compiles ES6 template strings in HTML/CSS files
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);


// DEFINE
// -----------------------------
/**
 * @description Converts file into a function and returns the rendered value as the file source
 * 
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Object} obj.data - The user's data from the `data.js` config file, that users can add data to in their custom functions
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
async function replaceTemplateStrings({file, data, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = await utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Get data keys and values
  const dataKeys = Object.keys(data);
  const dataValues = dataKeys.map(i => data[i]);
  
  /* 
   * Essentially we pass in the HTML source string, wrap it in backticks, then create a 
   * 'Function' that returns the source back with the template string rendered  
   */ 
  try {
    const compile = (content, $ = '$') => Function($, 'return `' + content + '`;');
    const compiled = compile(file.src, dataKeys)(...dataValues);

    // Store the new file source
    file.src = compiled;

    // Show terminal message: Done
    Logger.success(`${file.path} - Replaced template strings`);
  } catch (err) {
    Logger.error(`${file.path} - Error replacing template strings: 
    ${err}`);
  }
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;