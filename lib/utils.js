const childProcess = require('child_process');

/**
 * Helper for async.js.
 */
function execCommand (command, cwd, timeout) {
  return callback => {
    console.log(`Running ${command}...`);
    childProcess.exec(command, {
      cwd: cwd,
      stdio: 'inherit'
    }, (err, stdout, stderr) => {
      if (err) { console.error(err); }
      if (stderr) { console.error(stderr); }
      if (stdout) { console.log(stdout); }
      setTimeout(() => {
        callback();
      }, timeout || 0);
    });
  };
}
module.exports.execCommand = execCommand;
