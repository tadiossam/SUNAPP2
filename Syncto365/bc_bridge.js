const { execFile } = require('child_process');
const path = require('path');

const psScriptPath = path.join(__dirname, 'bc_fetch.ps1'); // your PowerShell script

function runBcScript() {
  execFile('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', psScriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ PS stderr: ${stderr}`);
    }
    console.log(`✅ BC Output:\n${stdout}`);
  });
}

runBcScript();
