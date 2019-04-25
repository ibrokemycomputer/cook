/**
 * @file babelify.js
 * @description Babelify JS files and replace HTML script tags with type=module/nomodule
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const Logger = require(`../utils/logger.js`);
const utils = require(`../utils/util.js`);
const babel = require('@babel/core');
const fs = require('fs');

// Config
const {babelOpts} = require(`${cwd}/config/main.js`);


// PLUGIN OPTIONS
// -----------------------------
const opts = babelOpts || {
  "plugins": ["@babel/plugin-transform-classes"],
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": [
          "> 1%",
          "last 2 versions",
          "not ie <= 10"
        ]
      }
    }]
  ]
};


// DEFINE
// -----------------------------

/**
 * @description Compile JS files to ES5 and modifiy HTML <script> markup
 * 
 * @param {Object} file File object
 * @param {Array} allowType Allowed files types
 * @param {Array} disallowType Disallowed files types
 */
async function babelify({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;
  // Early Exit: Don't minify in development
  if (process.env.NODE_ENV === 'development') return;

  if (file.ext === 'js') { // Runs on .js files
    createEs5File(file);
  } else { // Runs on .html files
    addES5Markup(file);
  }
}


/**
 * @description Creates ES5 version of a JS file
 * 
 * @param {Object} file File object
 */
async function createEs5File(file) {
  // Create ES5 filename (filename.es5.js)
  const es5Path = `${file.path.slice(0, file.path.length-file.ext.length)}es5.${file.ext}`;

  await fs.copyFile(file.path, es5Path, async err => {
    if (err) throw err;
    fs.writeFile(es5Path, await babel.transformFileSync(file, opts).code, err => {
      if (err) throw err;
      Logger.success(`${file.path} - Copied to ${es5Path} and 'babelified'`);
    }); 
  });
}


/**
 * @description Edit <script> tag markup if they do not have `data-inline` or `data-compile="disabled"`
 * 
 * @param {Object} file File object
 */
function addES5Markup(file) {
  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});
  // Get all script tags
  const scripts = dom.window.document.querySelectorAll(`script`);

  let source;
  scripts.forEach(script => {
    source = script.getAttribute('src');
    // If we have a src and the tag is not inlined or set to skip build (babel)
    if (source 
      && script.getAttribute('inline') !== ''
      && script.getAttribute('data-inline') !== ''
      && script.getAttribute('data-build') !== 'disabled') {
      // Remove `.js` extension
      source = source.substr(0,source.length-3);
      // Add `type=module` attribute for modern browsers
      script.setAttribute('type', 'module');
      // Add new `<script>` tag with `nomodule` for older browsers.
      script.insertAdjacentHTML('afterend', `<script src="${source}.es5.js" nomodule></script>`);
      // Store updated file source
      file.src = utils.setSrc({dom});

      Logger.success(`${file.path} - Added ES5 support`);
    }
  });
}


// EXPORT
// -----------------------------
module.exports = babelify;