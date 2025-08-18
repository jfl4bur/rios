/*
Simple SMTP test for cleanup_uploads credentials.
Usage:
  node test_smtp_send.js
This script reads CLEANUP_SMTP_* and CLEANUP_NOTIFY_TO from Machine env and attempts to verify the transporter and send a small test message.
*/

const nodemailer = require('nodemailer');

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

// On Windows, if variables are not present in process.env, try to read Machine-level vars via PowerShell
function loadMachineEnvIfMissing(names) {
  const { execSync } = require('child_process');
  names.forEach(n => {
    if (!process.env[n]) {
      try {
        // Use PowerShell to read Machine environment variable
        const cmd = `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('${n}','Machine')"`;
        const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (out) {
          process.env[n] = out;
          console.log(`Imported Machine var ${n} to process.env`);
        }
      } catch (e) {
        // ignore
      }
    }
  });
}

const fs = require('fs');
const path = require('path');

// Load a dotenv-style file (KEY=VALUE) and import values into process.env only if they are missing.
function loadEnvFileIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // not present
      return false;
    }

    const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
    const lines = raw.split(/\r?\n/);
    let imported = 0;
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      // remove surrounding quotes
      if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
        imported++;
      }
    }
    if (imported > 0) {
      console.log(`Loaded ${imported} vars from ${filePath}`);
    } else {
      console.log(`No new vars imported from ${filePath}`);
    }
    return true;
  } catch (e) {
    console.error('Error loading env file', filePath, e && e.stack ? e.stack : e);
    return false;
  }
}

function writeLog(obj) {
  try {
    const logsDir = path.resolve(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const fn = path.join(logsDir, `smtp-test-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
    fs.writeFileSync(fn, JSON.stringify(obj, null, 2), { encoding: 'utf8' });
    console.log('Log escrito en:', fn);
  } catch (e) {
    console.error('No se pudo escribir el log:', e && e.stack ? e.stack : e);
  }
}

async function main() {
  // Attempt to import Machine-level vars into process.env if missing (Windows)
  try { loadMachineEnvIfMissing(['CLEANUP_SMTP_HOST','CLEANUP_SMTP_PORT','CLEANUP_SMTP_USER','CLEANUP_SMTP_PASS','CLEANUP_SMTP_SECURE','CLEANUP_NOTIFY_TO']); } catch(e) {}

  const host = getEnv('CLEANUP_SMTP_HOST');
  const port = parseInt(getEnv('CLEANUP_SMTP_PORT', '587'), 10);
  const user = getEnv('CLEANUP_SMTP_USER');
  const pass = getEnv('CLEANUP_SMTP_PASS');
  const secure = getEnv('CLEANUP_SMTP_SECURE', '0') === '1';
  const to = getEnv('CLEANUP_NOTIFY_TO', user);

  if (!host || !user || !pass) {
    console.error('Faltan variables CLEANUP_SMTP_* (asegúrate de ejecutar en una sesión nueva si acabas de usar set_gmail_app_password.ps1)');
    process.exit(2);
  }

  console.log('Intentando conectar a SMTP:', host, 'port:', port, 'secure:', secure);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: true,
    debug: true,
  });

  try {
    await transporter.verify();
    console.log('Verificación SMTP OK. Enviando correo de prueba a', to);

    const info = await transporter.sendMail({
      from: user,
      to,
      subject: 'Rios Cleanup - prueba SMTP',
      text: 'Este es un mensaje de prueba enviado desde test_smtp_send.js para verificar las credenciales SMTP (no borra archivos).',
    });

    console.log('Mensaje enviado. MessageId:', info.messageId);
    console.log('Response:', info.response || '(no response)');
    writeLog({
      timestamp: new Date().toISOString(),
      host,
      port,
      secure,
      user,
      to,
      ok: true,
      messageId: info.messageId,
      response: info.response || null
    });
    process.exit(0);
  } catch (err) {
    console.error('Error SMTP:', err && err.stack ? err.stack : err);
    writeLog({
      timestamp: new Date().toISOString(),
      host,
      port,
      secure,
      user,
      to,
      ok: false,
      error: (err && err.stack) ? err.stack : String(err)
    });
    process.exit(1);
  }
}

main();
