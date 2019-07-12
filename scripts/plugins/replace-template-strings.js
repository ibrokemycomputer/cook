/**
 * @file replace-template-strings.js
 * @description Compiles ES6 template strings in HTML/CSS files
 */

// REQUIRE
// -----------------------------
// const cwd = process.cwd();
const utils = require(`../utils/util.js`);
// const Logger = require(`../utils/logger.js`);


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
function replaceTemplateStrings({file, data, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Replace template-string variables with values from matching property in `data` lookup object
  const replaceTemplateVars = (str, obj) => str.replace(/\${(.*?)}/g, (x,g) => obj[g]);
  file.src = replaceTemplateVars(file.src, data);
}

// EXPORT
// -----------------------------
module.exports = replaceTemplateStrings;