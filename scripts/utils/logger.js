// REQUIRE
// ----------------------------------
const chalk = require('chalk');


// DEFINE
// ----------------------------------
let types = {
  break: () => console.log('\n'),
  done: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.magenta('» done') + chalk.gray(` | ${message}`) }`),
  error: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.red('error') }`, message),
  header: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.grey.underline(message) }`),
  info: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.blue('info') }`, message),
  msg: (message, indent=0) => console.log(`${setIndent(indent)}${ message }`),
  success: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.green('✓ success')}`, message),
  system: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.blue(message) }`),
  warning: (message, indent=0) => console.log(`${setIndent(indent)}${ chalk.yellow('warn') }`, message),
}

// Mute logging if environment var set
if (!process.env.LOGGER) Object.keys(types).forEach(key => types[key] = () => ({}));

// HELPER METHODS
// ----------------------------------

/**
 * @description Return designated amount of spaces
 * @param {Number} indent - The number of indents
 */
function setIndent(indent) {
  const indentSrc = '                    ';
  return indentSrc.substr(0, indent);
}

// EXPORT
// ----------------------------------
module.exports = types;