/**
 * @file replace-external-link-protocol.js
 * @description For targeted `<a>` tags, add `http://` in front of the href value, 
 * if it starts with `www` and wasn't added with a protocol (`http://` or `https://`).
 * Without this, the build process interprets it as a local link 
 * and will append the current window location origin.
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// USER 'MAIN.JS' CONFIG
const {
  distPath,
  replaceExternalLinkProtocol = {enabled:true},
} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
/**
 * @description Replace non-protocol `www.` and `cdn.` link paths to avoid them being treated as relative links.
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
function replaceMissingExternalLinkProtocol({file, allowType, disallowType}) {
  // Early Exit: User opted out of this plugin
  if (!replaceExternalLinkProtocol.enabled) return;
  
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});

  // Find <a>, <link>, and <script> tags
  const $link = dom.window.document.querySelectorAll('link');
  const $links = dom.window.document.querySelectorAll('a');
  const $script = dom.window.document.querySelectorAll('script');

  // Add `http://` to qualifying a tags
  // Replace leading `//` to qualifying tags
  if ($link) $link.forEach(el => replaceMissingProtocol({file, el}));
  if ($links) $links.forEach(el => replaceMissingProtocol({file, el}));
  if ($script) $script.forEach(el => replaceMissingProtocol({file, el}));
  
  // Store updated file source
  file.src = utils.setSrc({dom});
}

// HELPER METHODS
// -----------------------------

/**
 * @description Evaluate `<a>` tag `[href]` value, and set protocol if link is external and protocol not added by the user
 * @example Replace: `<a href="www.xxxx.com">`
 * @example Does Not Replace: `<a href="https://www.xxxx.com">`
 * @param {Object} opts - The arguments object
 * @property {Object} file - The current file's props (ext,name,path,name)
 * @property {Object} el - The current <a>, <link>, or <script> tag being evaluated
 * @private
 */
function replaceMissingProtocol({file, el}) {
  // Get source type (`href` or `src`)
  let srcType = el.href || el.src;
  // Early Exit: Tag does not have `[href]` or `[src]` or attribute value is empty string
  // Example: Someone adds an old-school anchor jump point: `<a id="jump-point"></a>`
  if (!srcType || srcType === '') return;
  // Get href path
  const linkPath = utils.getFileName(srcType, distPath);
  // Only replace for `www` and `cdn` instances, unless user defined their own
  const domainTargets = replaceExternalLinkProtocol.match || utils.replaceExternalLinkProtocolDefaults;
  const isTargetMatch = domainTargets.indexOf(linkPath) > -1;
  const pathType = el.href ? 'href' : 'src';
  if (isTargetMatch) replaceExternal(file, el, pathType);
}

/**
 * @description Create new, fixed external path
 * @property {Object} file - The current file's props (ext,name,path,name)
 * @property {Object} el - The current <a>, <link>, or <script> tag being evaluated
 * @property {String} type - Either the element's `[href]` or `[src]` prop to write new value to
 * @private
 */
function replaceExternal(file, el, type) {
  // Split path on /
  let linkPathSplit = el[type].split('/');
  // Filter out ''
  linkPathSplit = linkPathSplit.filter(s => s);
  // Find if 'localhost' is in the path name
  // We'll only replace these, as they represent the links we want to convert
  if (linkPathSplit.indexOf('localhost') === -1) return;
  el[type] = `http://${linkPathSplit[linkPathSplit.length-1]}`;
  // Show terminal message
  Logger.success(`/${file.path} - Added 'http://' to [href="${linkPathSplit[linkPathSplit.length-1]}"]: ${ chalk.green(el[type]) }`);
}

// EXPORT
// -----------------------------
module.exports = replaceMissingExternalLinkProtocol;