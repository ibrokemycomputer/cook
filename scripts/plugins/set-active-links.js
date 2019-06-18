/**
 * @file set-active-links.js
 * @description Add `[data-active]` state to `<a>` tags whose `[href]` value matches the current page
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`../utils/util.js`);

// Config
const {distPath} = require(`${cwd}/config/main.js`);


// DEFINE
// -----------------------------
/**
 * @description Add `[data-active]` state to `<a>` tags whose `[href]` value matches the current page
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
function setActiveLinks({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});

  // Find <a> tags and add active state 
  // if their [href] matches the current page url
  // Note: Using `a[href]` instead of just `a` as selector, since a user may omit the `[href]` attribute
  const $links = dom.window.document.querySelectorAll('a[href]');
  $links.forEach((link,i) => setActive({file, link}));

  // Store updated file source
  file.src = utils.setSrc({dom});
}

// HELPER METHODS
// -----------------------------

/**
 * @description Set <a> tags to 'active' state if their [href] value file name matches the current file's name
 * @param {Object} opts - The arguments object
 * @property {Object} file - The current file's props (ext,name,path,name)
 * @property {Object} link - The current <a> tag being evaluated
 * @private
 */
function setActive({file, link}) {
  const currPath = utils.getFileName(file.path, distPath);
  const linkPath = utils.getFileName(link.href, distPath);
  const isParent = linkIsParent(file.path, linkPath);
  if (linkPath === currPath) link.setAttribute(utils.attr.active,'');
  else if (isParent) link.setAttribute(utils.attr.parentActive,'');
}

/**
 * @description Return true if `<a>` link's `[href]` target is a parent of the current page
 * @param {String} pagePath - The full path of the current page being evaluated
 * @param {String} linkPath - The current page `<a>` to evaluate
 * @private
 */
function linkIsParent(pagePath, linkPath) {
  const pagePathSplit = pagePath.split(`${distPath}/`)[1];
  // Early Exit: No dist path
  if (!pagePathSplit) return;
  const pagePathParts = pagePathSplit.split('/');
  const pagePathPartsLast = pagePathParts.pop();
  // Return true if `linkPath` is one of the parts AND it is not the last part (we'll mark it as normal-active instead)
  const isActivePage = linkPath === pagePathParts[pagePathParts.length - 1];
  const isHierarchyPage = pagePathParts.indexOf(linkPath) > -1;
  return !isActivePage && isHierarchyPage;
}

// EXPORT
// -----------------------------
module.exports = setActiveLinks;