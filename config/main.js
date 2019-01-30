// REQUIRE
// -----------------------------
const packageJSON = require('../package.json');

// EXPORT
// -----------------------------
module.exports = {
  // Convert xxxx.html files to xxxx/index.html
  // NOTE: If set to `false`, you must add the .html extension in <a href="xxxx.html"> paths
  convertPageToDirectory: true,
  // The name of the compiled, 'public' directory (`dist`, `public`, etc.)
  distPath: 'dist',
  // Change the default [attribute] for includes and inline link/scripts
  //includeAttr: 'include',
  //inlineAttr: 'inline',
  // The path to the dev source files. This is used for running the local dev livereload server.
  srcPath: 'src',
  // The file to load in `srcPath` if not `index.html`
  startPath: 'index.html',
  // Live reload dev browser when these files change (`/css`,`/js` and all `.html` by default)
  watch: [
    //'/css/*.css',
  ],
};
