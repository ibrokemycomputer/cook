// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs');
const utils = require(`./utils/util.js`);

// PLUGINS
// -----------------------------
const babelify = require('./plugins/babelify');
const copySrc = require('./plugins/copy-src');
const createDist = require('./plugins/create-dist');
const createDirFromFile = require('./plugins/create-dir-from-file');
const customPlugins = require('./plugins/custom-plugins');
const minifySrc = require('./plugins/minify-src');
const replaceIncludes = require('./plugins/replace-includes.js');
const replaceInline = require('./plugins/replace-inline.js');
const replaceSrcPathForDev = require('./plugins/replace-src-path.js');
const replaceTemplateStrings = require('./plugins/replace-template-strings.js');
const setActiveLinks = require('./plugins/set-active-links.js');

// CONFIG
const {convertPageToDirectory, customData} = require(`${cwd}/config/main.js`);

// GET SOURCE
const {getSrcConfig,getSrcFiles} = require('./utils/get-src');


// BUILD
// -----------------------------
async function build() {
  // Show init message
  console.log(`${ chalk.blue('\n[Build]') } ${ chalk.blue.bold('`npm run build`') }`);

  // PLUGIN: Create `/dist` if not already made
  await createDist();

  // PLUGIN: Copy `/src` to `/dist`
  await copySrc();

  // Get valid project files to manipulate (this method makes it so we only need to read/write the file once)
  await getSrcFiles(async files => {
    // CUSTOM PLUGINS: Run custom per-site plugins
    if (customData) fileData = await require(`${cwd}/plugins/${customData}.js`).customData;

    // Run tasks on matched files
    await files.forEach(async (fileName) => {
      
      // Open file and store file info for use in plugins
      // We'll pass around the source string between the plugins
      // Then write back the updated/modified source to the file at the end
      let file = await getSrcConfig({fileName});

      file.data = await fileData; // RMV THIS!!

      // CUSTOM PLUGINS: Run custom per-site plugins
      await customPlugins();

      // PLUGIN: Replace `[data-include]` in files
      replaceIncludes({file, allowType: ['.html']});

      // PLUGIN: Replace `[data-inline]` with external `<link>` and `<script>` tags
      replaceInline({file, allowType: ['.html']});

      // PLUGIN: Babelify standalone JS files
      await babelify({file, allowType: ['.js','.html']});

      // PLUGIN: `/src` is needed for `@import url()` calls when inlining source
      // Since we don't inline in 'development' mode, we need to remove `/src` paths
      // because `/src` doesn't exist in `/dist`
      replaceSrcPathForDev({file, allowType: ['.css','.html']});

      // WIP PLUGIN: Render all ES6 template strings 
      // `siteData` imported from site-specifc ./config/data.js file
      await replaceTemplateStrings({file, allowType: ['.html']});
      
      // PLUGIN: Find `<a>` tags whose [href] value matches the current page (link active state)
      setActiveLinks({file, allowType: ['.html']});

      // PLUGIN: Minify Source
      minifySrc({file});

      // utils.testSrc({file});

      // PLUGIN: Create directory from .html file
      if (convertPageToDirectory) createDirFromFile({file, allowType: ['.html'], excludePath: ['dist/index']});
      
      // Write new, modified source back to the file
      fs.writeFileSync(file.path, file.src);

    });
  });
};

// STEP 3: Profit??
build();