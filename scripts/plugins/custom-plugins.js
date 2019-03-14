/**
 * @file custom-plugins.js
 * @description Runs custom plugins defined outside of the build repo
 */

const cwd = process.cwd();

const siteData = require(`${cwd}/config/main.js`);

async function customPlugins() {
  siteData.plugins.forEach(fn => {
    const plugin = require(`${cwd}/plugins/${fn}.js`);
    plugin();
  });
}


// EXPORT
// -----------------------------
module.exports = customPlugins;