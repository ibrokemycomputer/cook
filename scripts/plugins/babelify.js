/**
 * @file babelify.js
 * @description Babelify scripts and replace script tags with type=module/nomodule
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
async function babelify({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Early Exit: Don't minify in development
  if (process.env.NODE_ENV === 'development') return;

  if (file.ext === 'js') { // Runs on .js files
    const es5Path = `${file.path.slice(0, file.path.length-file.ext.length)}es5.${file.ext}`;

    await fs.copyFile(file.path, es5Path, async err => {
      if (err) throw err;
      fs.writeFile(es5Path, await createEs5File(es5Path), err => {
        if (err) throw err;
        Logger.success(`${file.path} - Copied to ${es5Path} and Babelified`);
      }); 
    });
  } else { // Runs on .html files
    addES5Markup(file);
  }
}


// HELPER METHODS
// -----------------------------
async function createEs5File(es5File) {
  return babel.transformFileSync(es5File, opts).code;
}

/**
 * @description Find all script tags, and edit markup for ES5 support if 
 * they do not have `data-inline` or `data-compile="disabled"`
 */
function addES5Markup(file) {
    // Make source traversable with JSDOM
    let dom = utils.jsdom.dom({src: file.src});
    const scripts = dom.window.document.querySelectorAll(`script`);

    let source;
    scripts.forEach(script => {
      source = script.getAttribute('src');
      if (source 
      && script.getAttribute('data-inline') !== ""
      && script.getAttribute('data-build') !== 'disabled') {
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