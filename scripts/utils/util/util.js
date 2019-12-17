// REQUIRE
// ----------------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs-extra');
const cliCursor = require('cli-cursor');
const cliSpinners = require('cli-spinners');
const v8 = require('v8');
const Logger = require('../logger/logger.js');
const Spinner = require('../spinner/spinner.js');
const Timer = require('../timer/timer.js');
const {execSync} = require('child_process');
const {lstatSync,readdirSync} = require('fs-extra');

// JSDOM
const jsdomLib = require('jsdom');
const {JSDOM} = jsdomLib;

// BUILD CONFIG
const {activeLink,convertPageToDirectory,includeAttr,inlineAttr} = require('../config/config.js');


// JSDOM CONFIG
// ----------------------------------
// https://github.com/jsdom/jsdom
const jsdom = {
  baseUrl: 'https://localhost',
  dom: newJSDOM,
  frag: newFrag,
}

// STATIC CONFIG
// ----------------------------------
// Attribute values 
const attr = {
  active: convertToKebab(activeLink && activeLink.activeState) || 'active',
  activeParent: convertToKebab(activeLink && activeLink.parentState) || 'active-parent',
  include: includeAttr ? [includeAttr, `data-${includeAttr}`] : ['include', 'data-include'],
  inline: inlineAttr ? [inlineAttr, `data-${inlineAttr}`] : ['inline', 'data-inline'],
}

// The default path types to target in `replace-external-link-protocol.js`
// if not defined by the user in the config file
const replaceExternalLinkProtocolDefaults = ['cdn', 'www'];


// EXPORT
// ----------------------------------
module.exports = {
  attr,
  convertExternalLinks,
  countDisplay,
  createDirectory,
  customError,
  customKill,
  deepClone,
  encodeTag,
  escapeUrlString,
  fakePromise,
  getFileName,
  getFileParts,
  getFilePath,
  getPaths,
  getSelector,
  hasExtension,
  isAllowedType,
  isExtension,
  jsdom,
  promiseAll,
  replaceExternalLinkProtocolDefaults,
  runFileLoop,
  setSrc,
  skipped,
  validatePageChange,
};


// METHODS AND CONSTS
// ----------------------------------

/**
 * @description Find all href="www.xxxx.com" links and add http:// protocol. 
 * By using the <base> tag, www links w/o a protocol are treated as internal (relative) links and will 404
 * @param {*} source 
 * @returns {String}
 * @private
 */ 
function convertExternalLinks(source) {
  return source.replace(/href="www/gi, 'href="http://www');
}

/**
 * @description Convert string to `Kebab` case for use as attributes, class values, etc.
 * @param {String} str - The string to convert to Kebab-case.
 */
function convertToKebab(str) {
  // Early Exit: String is not defined
  if (!str || typeof str !== 'string') return null;
  // Convert all spaces to dashes
  str = str.replace(/ /g, '-');
  // Lowercase
  str = str.toLowerCase();
  // Return formatted string
  return str;
}

/**
 * @description Return array length string formatted for display or empty string if array is empty
 * @param {Array} arrayToCount - The array to find it length for display
 * @example Returns either `(5)` or '' depending on the length of the test array (assuming length was `5`)
 * @private
 */ 
function countDisplay(arrayToCount) {
  return arrayToCount.length ? ' (' + arrayToCount.length + ')' : '';
}

/**
 * @description Create directory hierarchy, if it doesn't already exist
 * @param {String} path - The path to directory to create
 * @private
 */
async function createDirectory(path) {
  try {
    await fs.mkdirp(path);
  }
  catch (err) {
    customKill(err, `Error creating directory(s) in: ${path}`);
  }
}

/**
 * @description Custom terminal error stack-trace message
 * @param {Object} e - The error event
 * @param {String} [label] - The console section label
 * @param {String} [post] - 'Post' message after call stack
 * @private
 */ 
function customError(e, label = 'Error', post) {
  if (!e.stack) return e;
  const errorStackFileLine = e.stack.split('\n')[1];
  if (!errorStackFileLine) {
    console.log(chalk.red(e));
    return e;
  }
  const splitColon = errorStackFileLine.split(':');
  const lineNumber = splitColon[splitColon.length - 2];
  const fileName = splitColon[splitColon.length - 3];
  // Display custom error message
  console.log(chalk.bold.red(`\n${label}`));
  console.log(chalk.red(e.message));
  if (fileName) {
    const fileSplit = fileName.split(' (');
    const filePart = fileSplit[0];
    const filePath = fileSplit[1];
    if (filePart) console.log(chalk.grey(`${filePart.trim()} (line ${lineNumber})`));
    if (filePath) console.log(chalk.grey(filePath));
  }
  if (post) console.log(post);

  customKill('Hard stop to prevent deploy')
}

/**
 * @description Custom terminal `kill -9 node` when you need to stop
 * all terminal activity on exception/error.
 * For example, a page needs to show fetched content. You don't want a deploy to occur 
 * if the source returned a rate limit, or didn't return anything and you don't want to 
 * show `N/A` or equivalent on screen.
 * @param {String} msg - The console message before terminating
 * @private
 */ 
function customKill(msg) {
  // Escape ( and )
  const formatMsg = msg.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  // Display terminal message and kill process
  execSync(`echo '' && echo ${chalk.red(formatMsg)} && killall -9 node`, {stdio: 'inherit'});
}

/**
 * @description Deep clone an object using the experimental, but native Serialization API in Node.js (https://nodejs.org/api/all.html#v8_serialization_api)
 * @param {String} obj - The object to clone
 * @returns {Object}
 * @private
 */ 
function deepClone(obj) {
  return v8.deserialize(v8.serialize(obj));
}

/**
 * @description Sanitize DOM tag for display. Replace `<` with `&lt;`
 * @param {String} str - The string to sanitize
 * @returs {String}
 * @private
 */
function encodeTag(str) {
  return str.replace(/</g, '&lt;');
}

/**
 * @description Simple escape method that escapes literal characters
 * @param {String} url - The string to escape
 * @example `/` becomes `\/`
 * @example `.` becomes `\.`
 * @returns {String}
 * @private
 */
function escapeUrlString(url) {
  return url.replace(/\//g,'\\/').replace(/\./g,'\\.');
}

/**
 * @description Create a test promise delay
 * @param {Number} ms - The delay, in milliseconds
 * @param {Boolean} throwError - Fake a rejected promise
 * @returns {Object}
 * @private
 */ 
function fakePromise(ms, throwError) {
  if (!throwError) return new Promise(resolve => setTimeout(resolve, ms));
  else return Promise.reject('Could not resolve this')
}

/**
 * @description Return filename from path
 * @param {String} path - The file path (/path/to/file.ext)
 * @param {String} distPath - The path to the /dist directory
 * @returns {String}
 * @private
 */ 
function getFileName(path, distPath) {
  let splitOnSlash = path.split('/');
  splitOnSlash = splitOnSlash.filter(s => s !== '');
  let lastPart = splitOnSlash[splitOnSlash.length-1];
  let fileName = lastPart.split('.')[0];
  if (fileName === 'index') fileName = splitOnSlash[splitOnSlash.length-2];
  if (fileName === distPath) fileName = '/';
  return fileName;
}

/**
 * @description Return object with filename `name` and `extension`
 * @param {path} - The file path (/path/to/file.ext)
 * @returns {Object}
 * @private
 */ 
function getFileParts(path) {
  if (!path) return;
  const fileSplit = path.split('/');
  const fileName = fileSplit[fileSplit.length - 1];
  // If last split item is `index.html`, store its parent directory (if option to convert pages to directories is enabled)
  // If not, there will be a lot of pages with `file.name` as
  const fileNameIfIndex = !convertPageToDirectory.disabled && fileName === 'index.html' ? fileSplit[fileSplit.length - 2] : undefined;
  const fileNameSplit = fileName.split('.');
  return { name: fileNameSplit[0], nameIfIndex: fileNameIfIndex, ext: fileNameSplit[1] };
}

/**
 * @description Return path to file without the file name and extension
 * @param {path} - The file path (/path/to/file.ext)
 * @returns {String}
 * @private
 */ 
function getFilePath(path) {
  const pathSplit = path.split('/');
  const filename = pathSplit.splice(pathSplit.length - 1, 1);
  return pathSplit.join('/');
}

/**
 * @description Recursively grab all paths in a folder structure
 * @param {String} originalPath - The previous path
 * @param {String} path - The new path to explore
 * @param {RegExp} ignorePattern - A regex pattern to ignore certain files and folders
 * @param {Array} paths - The on going list of paths found
 * @returns {Array} - An array of paths
 * @private
 */
function getPaths(originalPath, path, ignorePattern, paths = []) {
  try {
    // Obtain a list of files and folders
    const files = readdirSync(path);
    files.forEach(file => {
      const currentFilePath = `${path}/${file}`;
      // Get the file descriptor
      const fd = lstatSync(currentFilePath);
      // If path is ignored, either by default or user-entered (`excludePaths` in /config/main.js),
      // We won't do anything to it once it is copied to /dist
      // This is handy for `/dist/assets/scripts/vendor`, for example, since that is code likely already minified
      // and outside of the user's control
      let allowed = true, pattern, match;
      if (ignorePattern) {
        ignorePattern.forEach(p => {
          pattern = new RegExp(p, 'g');
          match = currentFilePath.match(pattern);
          if (match && match.length) allowed = false;
        })
      }
      // Include file to use in build process
      if (allowed) {
        if (fd.isDirectory()) {
          paths = [...paths, ...getPaths(originalPath, currentFilePath, ignorePattern)];
        } else {
          paths.push(currentFilePath);
        }
      }
    });
    return paths;
  } 
  catch (err) { customError(err, `getPaths`); }
}

/**
 * @description Return the correct selector for query select. Can either be a string, 
 * or an array of strings for multi-selector.
 * @param {String|Array} attrs - The multiple selectors to query select off of
 * @param {String} [el] - Optional element to add in front of attribute selector (Ex: `link[attr]` instead of `[attr]`)
 * @returns {String}
 * @private
 */
function getSelector(attrs, el = '') {
  let selector = '';
  if (typeof attrs === 'string') selector = `${el}[${attrs}]`;
  else attrs.forEach((a,i) => selector += i === 0 ? `${el}[${a}]` : `,${el}[${a}]`);
  return selector;
}

/**
 * @description Check if path string has extension. Protects against directory names with `.` characters
 * @property {String} str - Path string to test
 * @returns {Boolean}
 * @private
 */
function hasExtension(str) {
  const is2LengthExt = str[str.length - 3] === '.';
  const is3LengthExt = str[str.length - 4] === '.';
  const is4LengthExt = str[str.length - 5] === '.';
  return is2LengthExt || is3LengthExt || is4LengthExt;
}

/**
 * @description Pass in an 'opt-in' or 'opt-out' array to match current file against by extension type
 * @param {Object} opts - The argument object
 * @property {String} fileExt - The extension of the file
 * @property {Object} [allowType] - The array of extensions to allow
 * @property {String} [disallowType] - The array of extensions to disallow
 * @returns {Boolean}
 * @private
 */
function isAllowedType({file,allowType,disallowType}) {
  // Early Exit: No file name given
  if (!file) return;
  // Destructure properties
  let {ext} = file;
  // Early Exit: No valid extension
  if (!ext) return false;
  ext = ext.charAt(0) === '.' ? ext : `.${ext}`;
  // If file extension NOT in allowed array, return false
  if (allowType && allowType.indexOf(ext) === -1) return false;
  // If file extension IS in disallowed array, return false
  if (disallowType && disallowType.indexOf(ext) > -1) return false;
  return true;
}

/**
 * @description Return pattern match to `.html`
 * @param {String} fileName - The target string
 * @param {Array|String} target - The target extension(s) (html, js, etc.)
 * @private
 */
function isExtension(fileName, target) {
  const isString = typeof target === 'string';
  const ext = fileName.split('.').pop();
  if (isString) return ext === target;
  else return target.indexOf(ext) > -1;
}

/**
 * @description Get a new JSDOM document/object from the passed in string source
 * @docs https://github.com/jsdom/jsdom
 * @param {Object} opts - The arguments object
 * @property {String} fileSource - The source to make a traversable document from
 * @property {Object} [options] - Optional JSDOM options config object
 * @returns {Object}
 */
function newJSDOM({src,options}) {
  const opts = options || { url: jsdom.baseUrl };
  return new JSDOM(src, opts);
}

/**
 * @description Get a new JSDOM fragment from the passed in string source
 * @docs https://github.com/jsdom/jsdom
 * @param {Object} opts - The arguments object
 * @property {String} fileSource - The source to make a traversable document from
 * @returns {Object}
 */
function newFrag(src) {
  return JSDOM.fragment(src);
}

/**
 * @description Custom `Promise.all` that sends information to a callback fn when each promise is returned
 * @param {Array} arr - The items to promisify and run method against
 * @param {Function} method - The method to run against each promise item
 * @param {Function} [cb] - Optional callback that passes returned infomation from the method for each promise that returns
 * @param {Boolean} [pageLabel] - Optionally pass in the file or method name as a label for display in terminal if the promise rejects
 * @returns {Object}
 */
function promiseAll(arr, method, cb, pageLabel) {
  const promises = arr.map(method);
  if (cb) {
    const length = promises.length;
    for (const promise of promises) {
      promise
        .then(data => cb({length, data}))
        .catch(err => customKill(`killed: ${err}${ ` in ${pageLabel}` || '' }`));
    }
  }
  return Promise.all(promises);
}

/**
 * @description Run method against target file asynchronously
 * @param {Array} files - The array of file paths to modify
 * @param {Function} method - The method to run against each file
 */
async function runFileLoop(files, method) {
  // Early Exit: No allowed files given
  if (!files || !files.length) return;
  // Show terminal message: Start
  Logger.persist.header(`\nModify Files`);
  // Start spinner message
  const loading = new Spinner();
  loading.start(`Fetching allowed files`);
  loading.total = files.length;

  // Start timer
  const timer = new Timer();
  timer.start();

  await recurseFiles(0);
  async function recurseFiles(index) {
    const file = files[index];
    await method(file);
    index += 1;
    loading.updateAsPercentage(file, index, loading.total, true);
    if (index < loading.total) await recurseFiles(index);
  }

  // NOTE: There is no noticeable speed difference from the below over the recusion method above
  // NOTE: However, the logging shows each page message cleaner in the above
  // await promiseAll(files, method, data => {
  //   loading.count += 1;
  //   // When each promise returns, update terminal percentage message
  //   loading.updateAsPercentage(data.data, loading.count, loading.total, true);
  // });
  
  // End timer
  loading.stop(`Files Modified (${loading.total}) ${timer.end()}`);
}

/**
 * @description Get the correct DOM nodes as a string
 * @param {*} param0 
 */
function setSrc({dom, path}) {
  // Dom Fragment
  if (!dom.window) {
    const XMLSerializer = new JSDOM('').window.XMLSerializer;
    const domString = new XMLSerializer().serializeToString(dom)
    const formattedDomString = domString
      .replace(/ xmlns="http:\/\/www.w3.org\/1999\/xhtml"/gmi, '')
      // `ns1:href` added to `<use>` svgs, however the # increases per instance in the page
      // So we need to find each one and replace it - the `ns(\d)*?` finds `ns1`, `ns2`, etc.
      .replace(/ns(\d)*?:(?:href)/gmi, 'href');
    return formattedDomString;
  }
  // Full HTML document
  // NOTE: This can either be a full .html page's source already with doctype and `<html>`,
  // Or a non-document include fragment, with just standalone, fragment-like DOM markup.
  else {
    // Get the JSDOM document object
    const document = dom.window.document;
    // Is the src a full HTML doc?
    const isFullDoc = !!document.doctype;
    
    // If already a full DOM .html page w/ doctype, <html>, etc. Just return the whole source
    if (isFullDoc) return dom.serialize();
    // Otherwise, it is a fragment .html include file. However, depending on the # and position of markup elements within,
    // it may return all content in just the `<head>` tag, the `<body>`, or a mixture.
    // So we don't want to return the default `<html><head>...</head><body>...</body></html>`, 
    // since it won't have the site's meta info, like `lang="en"`, char type, etc.
    // ---
    // Instead, we'll cherry-pick the content from those two elments and return them as one code block,
    // since include files don't write to two places in the .html. They are just replaced in place.
    else return `${document.head.innerHTML}${document.body.innerHTML}`;
  }
}

/**
 * @description Return dynamic value or 'skipped' if test failed
 * @param {Array} test - Array to test
 * @param {String} [label] - Optional label instead of 'skipped' default
 * @returns {String}
 */
function skipped(test, label = 'skipped') {
  return test.length ? `(${test.length})` : chalk.grey('(skipped)');
}

/**
 * @description Return whether dev live reload change event was an individual page change,
 * AND if the file wasn't an include
 */
function validatePageChange() {
  // Page was changed when using localhost BrowserSync live reloading (`npm run dev`)
  const changedDevPage = process.env.DEV_CHANGED_PAGE;
  // Was the changed page an include file?
  const isInclude = changedDevPage && !!changedDevPage.match(/\/(include)|(template)/);
  // Return true (valid) if it was a page change AND it wasn't an include file
  return changedDevPage && !isInclude;
}