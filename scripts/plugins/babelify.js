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

  // Minify source differently based on the file type  
  let newSrc = await babeItUpBro({file});

  // Store updated file source
  file.src = newSrc;

  // Show terminal message
  Logger.success(`${file.path} - Babelified`);
}

async function babeItUpBro({file}) {
  console.log(`Sup bro. We're planning to babelify ${file.path}`);
  return babel.transformFileSync(file.path, opts).code;
}


// HELPER METHODS
// -----------------------------
// function helper() {
//   console.log('Mom made cookies, and I helped!');
// }


// EXPORT
// -----------------------------
module.exports = babelify;