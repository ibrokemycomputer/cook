// REQUIRE
// -----------------------------
const cwd = process.cwd();
const Logger = require(`./logger.js`);
const git = require('nodegit-kit');

// Config

async function getGit() {
  // GIT DELTA CHECKING
  Logger.header('\nGit delta checks');

  // Check if developing locally
  if (process.env.NODE_ENV === 'development') {
    // Get changed files (local dev)
    await require('child_process').exec('git diff --name-only', function(err, stdout) {
      console.log('Currently changed files are:');
      const lines = stdout.toString().split('\n');
      lines.forEach((line, i) => {
          if (line.length) console.log(`- ${line}`);
      });
      return lines;
    });
  } else {
    // Compare current/last commmit
    await git.open(`${cwd}`)
    .then(repo => {
      return git.log(repo, { branch: 'dev', sort: 'time' })
      .then(history => {
          const commit1 = history[0].commit;
          const commit2 = history[1].commit;
          // git diff <from> <to>
          return git.diff(repo, commit1, commit2, { 'name-only': true });
      })
      .then(filenames => {
        console.log('Committed file changes are:');
        filenames.forEach(file => {
          if (file.status !== 'removed') {
            console.log(file.path);
          }
        })
      });
    });
  }
}

module.exports = getGit;