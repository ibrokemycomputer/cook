/**
 * @file replace-includes.js
 * @description Replace include markers with corresponding code
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// Config
const {convertPageToDirectory,distPath,srcPath} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
/**
 * @description Replace include markers with corresponding code
 * @param {Object} obj - Deconstructed options object
 * @property {Object} obj.file - The current file's info (name, extension, path, src, etc.)
 * @property {Array} [obj.allowType] - Allowed file types (Opt-in)
 * @property {Array} [obj.disallowType] - Disallowed file types (Opt-out)
 */
async function replaceIncludes({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;
  
  // Store string source as traversable DOM
  let dom = utils.jsdom.dom({src: file.src});  
  // Allow `[include]` or `[data-include]` by default
  const includeSelector = utils.getSelector(utils.attr.include);
  const includeItems = dom.window.document.querySelectorAll(includeSelector);

  // Early Exit: No includes
  if (!includeItems) return;

  // Loop through each found include call and replace with source
  await utils.promiseAll([...includeItems], el => (replaceInclude)(el, file));
  
  // Store updated file source
  file.src = utils.setSrc({dom});

  // TODO: For now, includes cannot include other includes. 
  // This was causing an infinite loop
  // ---
  // Query again for includes. If sub-includes found, run again
  // dom = utils.jsdom.dom({src: file.src});
  // const newIncludeSelector = utils.getSelector(utils.attr.include);
  // const newSubIncludes = dom.window.document.querySelectorAll(newIncludeSelector);
  // if (newSubIncludes.length) replaceIncludes({file, allowType, disallowType});
}


// REPLACE INDIV. INCLUDE
// -----------------------------
/**
 * @description Replace include with corresponding source code
 * @param {Object} el - The current include to replace
 * @private
 */
async function replaceInclude(el) {
  // If attribute found and it has a path
  const hasInclude = hasAttribute(el, utils.attr.include);
  if (hasInclude && hasInclude.path && hasInclude.path.length) {
    try {
      // Get full system path to the include file
      const includePath = path.resolve(`${distPath}/${hasInclude.path}`);
      let formattedIncludePath = includePath;
      // Format the path before doing a file lookup, in case the user added a malformed path
      const hasExtension = !!includePath.match(/.html/g);
      // Case: User added `.html` and `convertPageToDirectory` is DISABLED in `config/main.js`
      // --> Do nothing
      // Case: User omitted `.html` and `convertPageToDirectory` is DISABLED in `config/main.js`
      // --> convert `/footer` to `/footer.html`)
      if (convertPageToDirectory.disabled && !hasExtension) formattedIncludePath = `${includePath}.html`;
      // Case: User added `.html` and `convertPageToDirectory` is ENABLED in `config/main.js`
      // --> convert `/footer.html` to `/footer/index.html`)
      if (!convertPageToDirectory.disabled && hasExtension) formattedIncludePath = includePath.replace('.html', '/index.html');
      // Case: User omitted `.html` and `convertPageToDirectory` is ENABLED in `config/main.js`
      // --> convert `/footer` to `/footer/index.html`)
      if (!convertPageToDirectory.disabled && !hasExtension) formattedIncludePath = `${includePath}/index.html`;
      // Get contents of target include file
      const content = await fs.readFile(formattedIncludePath, 'utf-8');
      // Add included content in DOM before placeholder element
      el.insertAdjacentHTML('afterend', content);
      // Add any attributes that were on the include element to the first replaced DOM element (that is valid)
      // A 'valid' element is a non- style/script/template etc. element. See the check in the method for the full list
      // NOTE: If an include has multiple 'top-level' elements, they will be applied to the first one
      addAttributesToReplacedDOM(el);
      // Remove placeholder element from DOM (`<div include="/includes/xxxx"></div>`)
      el.remove();
      // Show terminal message
      Logger.success(`/${distPath}${hasInclude.path} - Replaced [${hasInclude.type}]: ${ chalk.green(formattedIncludePath.split(distPath)[1]) }`);
    }
    catch (err) {
      utils.customError(err, `replace-includes.js`);
    }
  }
}


// HELPER METHODS
// -----------------------------

/**
 * @description If the include element had other attributes added, apply them to the first replaced, valid element found.
 * @example The replaced source has a `<style>` tag followed by 2 sibling `<div>` tags. We add the attributes to the first `<div>`
 * @param {Object} el - The `[data-include]` or `[include]` element that is replaced
 * @private
 */
function addAttributesToReplacedDOM(el) {
  const targetEl = getValidNextElement(el);
  // Early Exit: No valid element found
  if (!targetEl) return;
  // Loop through each attribute on the include element
  for (let i=0; i<el.attributes.length; i++) {
    const name = el.attributes[i].name;
    const value = el.attributes[i].value;
    const isValidAttr = utils.attr.include.indexOf(name) === -1;
    if (isValidAttr) targetEl.setAttribute(name, value);
  }
}

/**
 * @description Get the next valid element sibling (excludes style/script/etc. elements)
 * @param {Object} el - The `[data-include]` or `[include]` element that is replaced
 * @private
 */
function getValidNextElement(el) {
  const invalidTypes = ['DESCRIPTION','LINK','META','SCRIPT','STYLE','TEMPLATE','TITLE'];
  let nextEl = el.nextElementSibling, targetEl;
  while (nextEl) {
    // If a valid element type, store it
    const isValid = invalidTypes.indexOf(nextEl.nodeName) === -1;
    if (isValid) targetEl = nextEl;
    // Stop the loop if valid element found, or go to the next one
    nextEl = targetEl ? false : nextEl.nextElementSibling;
  }
  return targetEl;
}

/**
 * @description Match target attribute(s) against target DOM element
 * @param {Object} el - The element to check attributes
 * @param {*} attrs - The attributes to compare against
 * @returns {Boolean}
 * @private
 */
function hasAttribute(el, attrs) {
  let tmpArr = [];
  if (typeof attrs === 'string') tmpArr.push({ type: utils.attr.include, path: el.getAttribute(utils.attr.include) });
  else attrs.forEach(a => tmpArr.push({ type: a, path: el.getAttribute(a) }));
  // Filter out falsey
  tmpArr = tmpArr.filter(a => a.path);
  // Return boolean
  return tmpArr[0] || false;
}

// EXPORT
// -----------------------------
module.exports = replaceIncludes;