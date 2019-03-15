/**
 * @file site-data.js
 * @description Make custom per-site data available globally 
 */

const cwd = process.cwd();
const {tmpData} = require(`${cwd}/config/data.js`);

let siteData = {...tmpData};

module.exports = siteData;