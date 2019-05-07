/**
 * @file replace-includes.js
 * @description Replace include markers with corresponding code
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
const {distPath,srcPath} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
/**
 * @description Replace include markers with corresponding code
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
async function replaceIncludes({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;
  
  let errorLabel, errorPath, hasInclude, includePath;
  let dom = utils.jsdom.dom({src: file.src});
  // Allow `[include]` or `[data-include]` by default
  const includeSelector = getIncludeSelector(utils.attr.include);
  const includeItems = dom.window.document.querySelectorAll(includeSelector);

  // Early Exit: No includes
  if (!includeItems) return;

  // Loop through each found include call
  includeItems.forEach((el,i) => {

    // If attribute found and it has a path
    hasInclude = hasAttribute(el, utils.attr.include);
    if (hasInclude && hasInclude.path && hasInclude.path.length) {
      try {
        includePath = path.resolve(`${distPath}/${hasInclude.path}`);
        // If you are pointing to an include w/o the `.html` extension
        // We'll add it since the directory-replacement only occurs in /dist (See `createDirFromFile()` in build.js)
        // Example: `<div include="/includes/header"></div>`
        //   In /dist, the build process creates `/dist/includes/header/index.html`
        //   But, in /src, we only have `/src/includes/header.html`, hence this check
        const hasExtension = utils.hasExtension(includePath);
        includePath = hasExtension ? includePath : `${includePath}.html`;
        // Get contents of target include file
        const content = fs.readFileSync(includePath, 'utf-8');
        // Add included content in DOM before placeholder element
        el.insertAdjacentHTML('beforebegin', content);
        // Remove placeholder element from DOM
        el.remove();
        // Show terminal message
        Logger.success(`${file.path} - Replaced [${hasInclude.type}]: ${ chalk.green(hasInclude.path) }`);
      }
      catch (error) {
        errorLabel = `Invalid include path in '${file.path}`;
        errorPath = error.path.split(cwd)[1];
        Logger.error(`${errorPath}\n${ chalk.red(errorLabel) }`);
      }
    }
  });

  // Store updated file source
  file.src = utils.setSrc({dom});
  
  // Query again for includes. If sub-includes found, run again
  dom = utils.jsdom.dom({src: file.src});
  const newIncludeSelector = getIncludeSelector(utils.attr.include);
  const newSubIncludes = dom.window.document.querySelectorAll(newIncludeSelector);
  // const newSubIncludes = dom.window.document.querySelectorAll(`[${utils.attr.include}]`);
  if (newSubIncludes.length) replaceIncludes({file, allowType, disallowType});
}

// HELPER METHODS
// -----------------------------

function getIncludeSelector(attrs) {
  let selector = '';
  if (typeof attrs === 'string') selector = `[${attrs}]`;
  else attrs.forEach((a,i) => selector += i === 0 ? `[${a}]` : `,[${a}]`);
  return selector;
}

function hasAttribute(el, attrs) {
  let tmpArr = [];
  if (typeof attrs === 'string') tmpArr.push({ type: utils.attr.include, path: el.getAttribute(utils.attr.include) });
  else attrs.forEach((a,i) => tmpArr.push({ type: a, path: el.getAttribute(a) }));
  // Filter out falsey
  tmpArr = tmpArr.filter(a => a.path);
  // Return boolean
  return tmpArr[0] || false;
}

// EXPORT
// -----------------------------
module.exports = replaceIncludes;