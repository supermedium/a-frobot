const childProcess = require('child_process');

/**
 * Helper for async.js.
 */
function execCommand (command, cwd) {
  return callback => {
    console.log(`Running ${command}...`);
    childProcess.exec(command, {
      cwd: cwd,
      stdio: 'inherit'
    }, (err, stdout, stderr) => {
      if (err) { console.error(err); }
      if (stderr) { console.error(stderr); }
      console.log(stdout);
      callback();
    });
  };
}
module.exports.execCommand = execCommand;
