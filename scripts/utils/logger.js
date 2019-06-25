// REQUIRE
// ----------------------------------
const chalk = require('chalk');


// DEFINE
// ----------------------------------
let types = {
  break: () => console.log('\n'),
  done: message => console.log(chalk.magenta('» done') + chalk.gray(` | ${message}`)),
  error: message => console.log(chalk.red('error'), message),
  header: message => console.log(chalk.grey.underline(message)),
  info: message => console.log(chalk.blue('info'), message),
  msg: message => console.log(message),
  success: message => console.log(chalk.green('✓ success'), message),
  system: message => console.log(chalk.blue(message)),
  warning: message => console.log(chalk.yellow('warn'), message),
}

// Mute logging if environment var set
if (!process.env.LOGGER) Object.keys(types).forEach(key => types[key] = () => ({}));


// EXPORT
// ----------------------------------
module.exports = types;