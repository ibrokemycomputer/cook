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

// Config
let {distPath,replaceExternalLinkProtocol} = require(`${cwd}/config/main.js`);
replaceExternalLinkProtocol = replaceExternalLinkProtocol || {};


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
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});

  // Find <a> tags
  const $links = dom.window.document.querySelectorAll('a');
  // Add `http://` to qualifying links
  $links.forEach((link,i) => replaceMissingProtocol({file, link}));

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
 * @property {Object} link - The current <a> tag being evaluated
 * @private
 */
function replaceMissingProtocol({file, link}) {
  // Early Exit: <a> does not have `[href]` or href value is empty string
  // Example: Someone adds an old-school anchor jump point: `<a id="jump-point"></a>`
  if (!link.href || link.href === '') return;
  // Get href path
  const linkPath = utils.getFileName(link.href, distPath);
  // Only replace for `www` and `cdn` instances, unless user defined their own
  const domainTargets = replaceExternalLinkProtocol.match || utils.replaceExternalLinkProtocolDefaults;
  if (domainTargets.indexOf(linkPath) === -1) return;
  // Split path on /
  let linkPathSplit = link.href.split('/');
  // Filter out ''
  linkPathSplit = linkPathSplit.filter(s => s);
  // Find if 'localhost' is in the path name
  // We'll only replace these, as they represent the links we want to convert
  if (linkPathSplit.indexOf('localhost') === -1) return;
  link.href = `http://${linkPathSplit[linkPathSplit.length-1]}`;
  // Show terminal message
  Logger.success(`/${file.path} - Added 'http://' to [href="${linkPathSplit[linkPathSplit.length-1]}"]: ${ chalk.green(link.href) }`);
}

// EXPORT
// -----------------------------
module.exports = replaceMissingExternalLinkProtocol;