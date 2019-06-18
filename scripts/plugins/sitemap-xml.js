// Generate `sitemap.xml` file

// REQUIRE
// -----------------------------
const cwd = process.cwd();
// const chalk = require('chalk');
const fs = require('fs-extra');
// const path = require('path');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// CONFIG
const {distPath,sitemapUrl,srcPath} = require(`${cwd}/config/main.js`);


// BUILD XML
// -----------------------------
// DEFINE
// -----------------------------
/**
 * @description Remove `/dist` and recreate it
 * @param {Object} obj - Deconstructed object
 * @param {Object} obj.file - The current file info (name, extension, src, etc.)
 * @param {Array} [obj.allowType] - Allowed files types (Opt-in)
 * @param {Array} [obj.disallowType] - Disallowed files types (Opt-out)
 */
function generateSitemap({file, allowType, disallowType}) {
  try {
    // Get directory and .html file paths from `/dist`
    let files = fs.readdirSync(distPath);
    // Format file paths for XML
    files = formatFilesForXML(files);
    // Build XML source
    let xmlSrc = buildXML(files);
    // Create `sitemap.xml` and write source to it
    fs.writeFileSync(`${distPath}/sitemap.xml`, xmlSrc);
  }
  catch (e) {
    utils.customError(e, 'Generate sitemap.xml');
    Logger.error(`Requires /${distPath} directory - please run the build process first`);
  }
}


// PROCESS METHODS
// -----------------------------

/**
 * @description Build the .xml file source from the site files' paths
 * @param {Array} files - The array of site file paths
 * @returns {String}
 */
function buildXML(files) {
  let date = formattedDate();
  let xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  files.forEach(f => {
    // Set homepage to higher priority
    const priority = f === '' ? '1.0' : '0.9';
    // Add entry
    xml += `
      <url>
        <loc>${sitemapUrl}${f}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>${priority}</priority>
      </url>
    `.trim();
  });
  xml += '</urlset>';
  // Return src
  return xml;
}

/**
 * @description Remove `/dist` path and drop any `index.html` parts from the file path
 * @param {Array} files - The array of site file paths
 * @returns {Array}
 */
function formatFilesForXML(files) {
  // Allowed page extensions
  const allowedExt = ['html'];
  const excludedPaths = [];
  // Get files in `/dist`
  files = utils.getPaths(distPath, distPath, excludedPaths);
  // Get only the allowed files by extension (.css, .html)
  files = files.filter(fileName => utils.isExtension(fileName, allowedExt));
  // Format for xml: Remove `/dist`
  files = files.map(fileName => fileName.split(distPath)[1]);
  // Format for xml: Remove `filename`
  files = files.map(fileName => formatDirPath(fileName));
  // Alphabetize files
  files.sort();
  // Return formatted files
  return files;
}

// HELPER METHODS
// -----------------------------

/**
 * @description Format current date in `yyyy-mm-dd` format
 * @returns {String}
 * @private
 */
function formattedDate() {
  const dateRaw = new Date();
  const formatter = new Intl.DateTimeFormat('en-us', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const dateStringRaw = formatter.formatToParts(dateRaw);
  const dateStringParts = [,,];
  dateStringRaw.forEach(({type, value}) => {
    switch (type) {
      case 'year': dateStringParts[0] = value; break;
      case 'month': dateStringParts[1] = value; break;
      case 'day': dateStringParts[2] = value; break;
    }
  });
  return `${dateStringParts[0]}-${dateStringParts[1]}-${dateStringParts[2]}`;
}

/**
 * @description Remove `index.html` from file path
 * @param {String} filePath - The current file path string
 * @returns {String}
 * @private
 */
function formatDirPath(filePath) {
  let filePathSplit = filePath.split('/');
  const last = filePathSplit.pop();
  if (last !== 'index.html') filePathSplit[filePathSplit.length] = last;
  return filePathSplit.join('/');
}

// EXPORT
// -----------------------------
module.exports = generateSitemap;