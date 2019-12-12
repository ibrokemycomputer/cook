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
const {convertPageToDirectory,distPath,srcPath} = require('../utils/config.js');


// DEFINE
// -----------------------------
/**
 * @description Replace include markers with corresponding code
 * @param {Object} obj - Deconstructed options object
 * @property {Object} obj.file - The current file's info (name, extension, path, src, etc.)
 * @property {Object} obj.store - The build process' own data store object we'll add the cached include-file content to
 * @property {Array} [obj.allowType] - Allowed file types (Opt-in)
 * @property {Array} [obj.disallowType] - Disallowed file types (Opt-out)
 */
class ReplaceInclude {
  constructor({file, store, allowType, disallowType, excludePaths = []}) {
    this.opts = {file, allowType, disallowType, excludePaths};
    this.file = file;
    this.store = store;
    this.allowType = allowType;
    this.disallowType = disallowType;
    this.excludePaths = excludePaths;

    // Add object to internal store for holding the cached include content
    if (!this.store.cachedIncludes) this.store.cachedIncludes = {};
  }

  // INIT
  // -----------------------------
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  async init() {
    // Early Exit: File type not allowed
    const allowed = utils.isAllowedType(this.opts);
    if (!allowed) return;
    
    // Store string source as traversable DOM
    let dom = utils.jsdom.dom({src: this.file.src});  
    // Allow `[include]` or `[data-include]` by default
    const includeSelector = utils.getSelector(utils.attr.include);
    const includeItems = dom.window.document.querySelectorAll(includeSelector);

    // Early Exit: No includes
    if (!includeItems) return;

    // Loop through each found include call and replace with fetched file source
    for (let item of includeItems) {
      await this.replaceInclude(item);
    }
    
    // Store updated file source
    this.file.src = utils.setSrc({dom});

    // TODO: For now, includes cannot include other includes. 
    // This was causing an infinite loop
    // ---
    // Query again for includes. If sub-includes found, run again
    // dom = utils.jsdom.dom({src: file.src});
    // const newIncludeSelector = utils.getSelector(utils.attr.include);
    // const newSubIncludes = dom.window.document.querySelectorAll(newIncludeSelector);
    // if (newSubIncludes.length) ReplaceInclude({file, allowType, disallowType});
  }


  // REPLACE INDIV. INCLUDE
  // -----------------------------
  /**
   * @description Replace include with corresponding source code
   * @param {Object} el - The current include to replace
   * Caches includes' content that was already fetched, to speed up performance.
   * @private
   */
  async replaceInclude(el) {
    // If attribute found and it has a path
    const hasInclude = this.hasAttribute(el, utils.attr.include);
    if (hasInclude && hasInclude.path && hasInclude.path.length) {
      try {
        // Init vars
        let content;

        // Get full system path to the include file
        const includePath = path.resolve(`${distPath}/${hasInclude.path}`);

        // CHECK IF CACHED VERSION
        // If this path was already looked up previously, use the stored-in-memory source instead of fetching and reading the file again.
        // NOTE: Include file could be empty, resulting in an empty string (''). Since this is treated as falsey by default,
        // we explicitly check for undefined or null (we need Null Coalescing Operator in Node now, cmon!)
        const cachedTarget = this.store.cachedIncludes[includePath];
        if ([undefined, null].indexOf(cachedTarget) === -1) content = cachedTarget;

        // OTHERWISE, GET THE INCLUDE FILE'S CONTENT (`fs.readFile`)
        else content = await this.fetchIncludeSrc(includePath);

        // ADD CONTENT TO DOM
        // Add included content in DOM before placeholder element
        el.insertAdjacentHTML('afterend', content);
        // Add any attributes that were on the include element to the first replaced DOM element (that is valid)
        // A 'valid' element is a non- style/script/template etc. element. See the check in the method for the full list
        // NOTE: If an include has multiple 'top-level' elements, they will be applied to the first one
        this.addAttributesToReplacedDOM(el);
        // Remove placeholder element from DOM (`<div include="/includes/xxxx"></div>`)
        el.remove();
        // Show terminal message
        Logger.success(`/${distPath}${hasInclude.path} - Replaced [${hasInclude.type}]: ${ chalk.green(includePath.split(distPath)[1]) }`);
      }
      catch (err) {
        utils.customError(err, `replace-includes.js`);
      }
    }
  }


  // PROCESS METHODS
  // -----------------------------

  /**
   * @description Lookup the include file, by path, and get its source content.
   * @param
   * @returns {String}
   * @private
   */
  async fetchIncludeSrc(path) {
    // Store raw path
    let formattedIncludePath = path;
    // Format the path before doing a file lookup, in case the user added a malformed path
    const hasExtension = !!path.match(/.html/g);
    // Case: User added `.html` and `convertPageToDirectory` is DISABLED in `config/main.js`
    // --> Do nothing
    // Case: User omitted `.html` and `convertPageToDirectory` is DISABLED in `config/main.js`
    // --> convert `/footer` to `/footer.html`)
    if (convertPageToDirectory.disabled && !hasExtension) formattedIncludePath = `${path}.html`;
    // Case: User added `.html` and `convertPageToDirectory` is ENABLED in `config/main.js`
    // --> convert `/footer.html` to `/footer/index.html`)
    if (!convertPageToDirectory.disabled && hasExtension) formattedIncludePath = path.replace('.html', '/index.html');
    // Case: User omitted `.html` and `convertPageToDirectory` is ENABLED in `config/main.js`
    // --> convert `/footer` to `/footer/index.html`)
    if (!convertPageToDirectory.disabled && !hasExtension) formattedIncludePath = `${path}/index.html`;
    // Get and return content of target include file
    try {
      // Get source from file
      const fetchedSrc = await fs.readFile(formattedIncludePath, 'utf-8');
      // Add entry to cached object store
      this.store.cachedIncludes[path] = fetchedSrc;
      // Return source
      return fetchedSrc;
    }
    catch (err) {
      utils.customKill(`getIncludeSrc(): ${err}`);
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
  addAttributesToReplacedDOM(el) {
    const targetEl = this.getValidNextElement(el);
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
  getValidNextElement(el) {
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
  hasAttribute(el, attrs) {
    let tmpArr = [];
    if (typeof attrs === 'string') tmpArr.push({ type: utils.attr.include, path: el.getAttribute(utils.attr.include) });
    else attrs.forEach(a => tmpArr.push({ type: a, path: el.getAttribute(a) }));
    // Filter out falsey
    tmpArr = tmpArr.filter(a => a.path);
    // Return boolean
    return tmpArr[0] || false;
  }
  
  // EXPORT WRAPPER
  // -----------------------------
  // Export function wrapper instead of class for `build.js` simplicity
  static async export(opts) {
    return new ReplaceInclude(opts).init();
  }
}


// EXPORT
// -----------------------------
module.exports = ReplaceInclude.export;