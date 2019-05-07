/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

const cwd = process.cwd();

async function customPlugins({file, plugins}) {
  // Early exit if no plugins provided
  if (!plugins) return;

  plugins.forEach(async fn => {
    const plugin = require(`${cwd}/plugins/${fn}.js`);
    let plg = String(fn);
    if (plugin[plg]) plugin[plg](file); 
  });
}


// EXPORT
// -----------------------------
module.exports = customPlugins;