/**
 * @file babelify.js
 * @description Babelify scripts and replace script tags with type=module/nomodule
 */

// REQUIRE
// -----------------------------
// const something = require('something');
const Logger = require(`../utils/logger.js`);
const utils = require(`../utils/util.js`);
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

// Config
// const {srcPath,distPath} = require(`${cwd}/config/main.js`);


// PLUGIN OPTIONS
// -----------------------------
const opts = {
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
  // if (process.env.NODE_ENV === 'development') return;

  if (file.ext === 'js') {
    const es5Path = `${file.path.slice(0, file.path.length-file.ext.length)}es5.${file.ext}`;

    await fs.copyFile(file.path, es5Path, async err => {
      if (err) throw err;
      fs.writeFile(es5Path, await babelItUpBro(es5Path), err => {
        if (err) throw err;
        // Show terminal message
        Logger.success(`${file.path} - Copied to ${es5Path} and Babelified`);
      }); 
    });
  } else {
    addES5Markup(file);
  }

}


// HELPER METHODS
// -----------------------------
async function babelItUpBro(es5File) {
  return babel.transformFileSync(es5File, opts).code;
}

function addES5Markup(file) {
    // Make source traversable with JSDOM
    let dom = utils.jsdom.dom({src: file.src});
    const scripts = dom.window.document.querySelectorAll(`script`);

    let source;
    scripts.forEach(script => {
      source = script.getAttribute('src');
      source
      ? source = source.substr(0,source.length-3)
      : source = 'error';
      script.setAttribute('type', 'module');
      // Add new `<script>` tag with `nomodule` for older browsers.
      script.insertAdjacentHTML('beforebegin', `<script src="${source}.es5.js" nomodule></script>`);
    });
  
    // Store updated file source
    file.src = utils.setSrc({dom});

    // Show terminal message
    Logger.success(`${file.path} - Added ES5 support`);
}


// EXPORT
// -----------------------------
module.exports = babelify;