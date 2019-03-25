/**
 * @file babelify.js
 * @description Babelify scripts and replace script tags with type=module/nomodule
 */

// REQUIRE
// -----------------------------
// const something = require('something');

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
  let newSrc = babeItUpBro({file});

  // Store new source
  // file.src = newSrc;

  // Show terminal message
  Logger.success(`${file.path} - Minified`);
}

function babeItUpBro({file}) {
  console.log(`Sup bro. We're planning to babelify ${file.path}`);
}


// HELPER METHODS
// -----------------------------
// function helper() {
//   console.log('Mom made cookies, and I helped!');
// }


// EXPORT
// -----------------------------
module.exports = minifySrc;