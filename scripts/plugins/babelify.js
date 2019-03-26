/**
 * @file babelify.js
 * @description Babelify scripts and replace script tags with type=module/nomodule
 */

// REQUIRE
// -----------------------------
// const something = require('something');
const utils = require(`../utils/util.js`);
const { babel } = require('@babel/core');

// Config
// const {srcPath,distPath} = require(`${cwd}/config/main.js`);


// PLUGIN OPTIONS
// -----------------------------
// const opts = [{
//   doThis: true,
//   doThat: false
// }]


// DEFINE
// -----------------------------
function babelify({file, allowType, disallowType}) {

  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Early Exit: Don't minify in development
  if (process.env.NODE_ENV === 'development') return;

  // Minify source differently based on the file type  
  let newSrc = await babeItUpBro({file});

  // Store updated file source
  file.src = utils.setSrc({newSrc});

  // Show terminal message
  Logger.success(`${file.path} - Minified`);
}

async function babeItUpBro({file}) {
  console.log(`Sup bro. We're planning to babelify ${file.path}`);
  babel.transformFileAsync(file.src).then(result => {
    return result.code;
  });
}


// HELPER METHODS
// -----------------------------
// function helper() {
//   console.log('Mom made cookies, and I helped!');
// }


// EXPORT
// -----------------------------
module.exports = babelify;