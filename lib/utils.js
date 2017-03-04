const childProcess = require('child_process');

/**
 * Helper for async.js.
 */
function execCommand (command, cwd) {
  return callback => {
    console.log(`Running ${command}...`);
    childProcess.exec(command, {
      cwd: cwd,
      maxBuffer: 20000 * 1024,
      stdio: 'inherit'
    }, (err, stdout, stderr) => {
      if (err) { console.log(err); }
      if (stderr) { console.log(stderr); }
      if (stdout) { console.log(stdout); }
      callback();
    });
  };
}
module.exports.execCommand = execCommand;
