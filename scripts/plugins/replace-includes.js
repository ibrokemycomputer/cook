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
const {convertPageToDirectory,distPath,srcPath} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
/**
 * @description Replace include markers with corresponding code
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
function replaceIncludes({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;
  
  let errorLabel, errorPath, formattedIncludePath, hasInclude, includePath;
  let dom = utils.jsdom.dom({src: file.src});
  // Allow `[include]` or `[data-include]` by default
  const includeSelector = utils.getSelector(utils.attr.include);
  const includeItems = dom.window.document.querySelectorAll(includeSelector);

  // Early Exit: No includes
  if (!includeItems) return;

  // Loop through each found include call
  includeItems.forEach((el,i) => {
    // If attribute found and it has a path
    hasInclude = hasAttribute(el, utils.attr.include);
    if (hasInclude && hasInclude.path && hasInclude.path.length) {
      try {
        // Get full system path to the include file
        includePath = formattedIncludePath = path.resolve(`${distPath}/${hasInclude.path}`);
        // Convert path to make file location
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
        const content = fs.readFileSync(formattedIncludePath, 'utf-8');
        // Add included content in DOM before placeholder element
        el.insertAdjacentHTML('beforebegin', content);
        // // Remove placeholder element from DOM
        el.remove();
        // Show terminal message
        Logger.success(`/${distPath}${hasInclude.path} - Replaced [${hasInclude.type}]: ${ chalk.green(formattedIncludePath.split(distPath)[1]) }`);
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
  // dom = utils.jsdom.dom({src: file.src});
  // const newIncludeSelector = utils.getSelector(utils.attr.include);
  // const newSubIncludes = dom.window.document.querySelectorAll(newIncludeSelector);
  // if (newSubIncludes.length) replaceIncludes({file, allowType, disallowType});
}

// HELPER METHODS
// -----------------------------

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