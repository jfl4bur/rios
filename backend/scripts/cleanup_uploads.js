const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

// Load a dotenv-style file into process.env if present (do not override existing vars)
function loadEnvFileIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
    const lines = raw.split(/\r?\n/);
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    console.log('Loaded env file if present:', filePath);
    return true;
  } catch (e) {
    console.warn('Failed to load env file', filePath, e && e.message ? e.message : e);
    return false;
  }
}

// On Windows, import Machine-level environment variables into process.env if they are missing
function loadMachineEnvIfMissing(names) {
  const { execSync } = require('child_process');
  names.forEach(n => {
    if (!process.env[n]) {
      try {
        const cmd = `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('${n}','Machine')"`;
        const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
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

// Attempt to load backend/cleanup-notify.env relative to repo
try {
  const repoRoot = path.resolve(__dirname, '..');
  const notifyEnv = path.join(repoRoot, 'cleanup-notify.env');
  // First, import Machine-level CLEANUP_SMTP_* and CLEANUP_NOTIFY_TO if present (Windows)
  try {
    loadMachineEnvIfMissing(['CLEANUP_SMTP_HOST','CLEANUP_SMTP_PORT','CLEANUP_SMTP_USER','CLEANUP_SMTP_PASS','CLEANUP_SMTP_SECURE','CLEANUP_NOTIFY_TO','CLEANUP_ENABLE_EMAIL','CLEANUP_ALLOW_GMAIL_APP_PASS']);
  } catch (e) {
    // ignore
  }
  loadEnvFileIfExists(notifyEnv);
} catch (e) {
  // ignore
}

// Notification debounce helpers: avoid sending notifications repeatedly within a short window.
const notifyStateFile = path.join(__dirname, '..', 'logs', 'notify-state.json');
function readNotifyState() {
  try {
    if (!fs.existsSync(notifyStateFile)) return null;
    const raw = fs.readFileSync(notifyStateFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Append a human-readable line to backend/logs/cleanup.log for auditing
function appendCleanupLog(line) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const fn = path.join(logsDir, 'cleanup.log');
    const ts = new Date().toISOString();
    fs.appendFileSync(fn, `[${ts}] ${line}\n`, { encoding: 'utf8' });
  } catch (e) {
    // don't break main flow on logging failure
    console.warn('Failed to append cleanup log', e && e.message ? e.message : e);
  }
}

function writeNotifyState(state) {
  try {
    const d = path.dirname(notifyStateFile);
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(notifyStateFile, JSON.stringify(state, null, 2), { encoding: 'utf8' });
    return true;
  } catch (e) {
    console.warn('Failed to write notify state', e && e.message ? e.message : e);
    return false;
  }
}

function hashPayload(payload) {
  try {
    const s = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(s).digest('hex');
  } catch (e) {
    return null;
  }
}

function shouldSendNotification(force, payloadHash) {
  if (force) return true;
  const minIntervalMin = parseInt(process.env.CLEANUP_NOTIFY_MIN_INTERVAL_MIN || '60', 10);
  const st = readNotifyState() || {};
  const lastSent = st.lastSent ? new Date(st.lastSent).getTime() : null;
  const lastHash = st.lastHash || null;
  const now = Date.now();

  // If payload differs from last, allow send regardless of interval
  if (payloadHash && lastHash && payloadHash !== lastHash) return true;

  if (!lastSent) return true;
  return (now - lastSent) >= (minIntervalMin * 60 * 1000);
}

function recordNotificationAttempt(payloadHash) {
  try {
    writeNotifyState({ lastSent: new Date().toISOString(), lastHash: payloadHash || null });
  } catch (e) { /* ignore */ }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const envDays = process.env.CLEANUP_DAYS ? parseInt(process.env.CLEANUP_DAYS, 10) : undefined;
  const envDry = process.env.CLEANUP_DRY_RUN === '1' || process.env.CLEANUP_DRY_RUN === 'true';
  const out = { days: envDays || 30, dryRun: !!envDry, testNotify: false };
  args.forEach(a => {
    if (a.startsWith('--days=')) out.days = parseInt(a.split('=')[1], 10);
    if (a === '--dry-run' || a === '--dryrun') out.dryRun = true;
    if (a === '--test-notify') out.testNotify = true;
    if (a === '--help' || a === '-h') {
      console.log('Usage: node cleanup_uploads.js [--days=N] [--dry-run]');
      console.log('Environment variables supported: CLEANUP_DAYS, CLEANUP_DRY_RUN (1|true)');
      console.log('Flags: --test-notify  Send a notification (email/webhook) without deleting files (safe test)');
      process.exit(0);
    }
  });
  return out;
}

(async () => {
  const { days, dryRun } = parseArgs();
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.error('uploads directory not found:', uploadsDir);
    process.exit(1);
  }

  console.log(`Cleanup uploads: days=${days} dryRun=${dryRun}`);
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(uploadsDir);
  let removed = 0;
  let candidates = 0;
  const removedList = [];

  for (const f of files) {
    try {
      const full = path.join(uploadsDir, f);
      const stat = fs.statSync(full);
      if (!stat.isFile()) continue;
      const mtime = stat.mtimeMs;
      if (mtime < cutoff) {
        candidates++;
        console.log((dryRun ? '[DRY] Would remove:' : 'Removing:'), f, 'mtime:', new Date(mtime).toISOString());
        // if not dry-run, unlink and also remove thumb- counterpart if exists
        if (!dryRun) {
          try { fs.unlinkSync(full); removed++; removedList.push(f); } catch (e) { console.warn('Failed delete', full, e.message); }
          const thumb = path.join(uploadsDir, 'thumb-' + f.replace(/\.[^.]+$/, '.jpg'));
          if (fs.existsSync(thumb)) {
            try { fs.unlinkSync(thumb); removed++; removedList.push(path.basename(thumb)); } catch (e) { console.warn('Failed delete thumb', thumb, e.message); }
          }
        }
      }
    } catch (e) {
      console.warn('Skipping', f, e && e.message ? e.message : e);
    }
  }

  console.log('Candidates:', candidates, 'Removed (if not dry-run):', removed);

  // If user requested a notification test, send a notification with the candidate counts
  if (parseArgs().testNotify) {
    const payload = {
      timestamp: new Date().toISOString(),
      days,
      removed: 0,
      candidates,
      files: removedList,
      note: 'TEST NOTIFY - no files were deleted'
    };

    const webhook = process.env.CLEANUP_WEBHOOK_URL;
    const smtpHost = process.env.CLEANUP_SMTP_HOST;
    const smtpPort = process.env.CLEANUP_SMTP_PORT ? parseInt(process.env.CLEANUP_SMTP_PORT, 10) : undefined;
    const smtpUser = process.env.CLEANUP_SMTP_USER;
    const smtpPass = process.env.CLEANUP_SMTP_PASS;
    const notifyTo = process.env.CLEANUP_NOTIFY_TO; // comma separated

    (async () => {
      const payloadHash = hashPayload(payload);
      if (webhook) {
        try {
          if (shouldSendNotification(true, payloadHash)) {
            console.log('Sending test webhook to', webhook);
            await sendWebhook(webhook, payload);
            console.log('Test webhook sent');
            recordNotificationAttempt(payloadHash);
            appendCleanupLog(`Test webhook sent to ${webhook} payloadHash=${payloadHash}`);
          } else {
            console.log('Skipping test webhook (debounced)');
            appendCleanupLog(`Test webhook skipped (debounced) payloadHash=${payloadHash}`);
          }
        } catch (e) { console.warn('Test webhook failed', e && e.message ? e.message : e); }
      }

      const emailEnabled = process.env.CLEANUP_ENABLE_EMAIL === '1';
      if (smtpHost && nodemailer && emailEnabled) {
        try {
          if (/gmail\.com$/i.test(smtpHost) && process.env.CLEANUP_ALLOW_GMAIL_APP_PASS !== '1') {
            throw new Error('Gmail SMTP requires an App Password. Set CLEANUP_ALLOW_GMAIL_APP_PASS=1 to override (not recommended).');
          }
          if (shouldSendNotification(true, payloadHash)) {
            const subject = `Rios cleanup (test): ${0} files removed`;
            const text = `Test notification at ${new Date().toISOString()}\nRemoved: 0\nCandidates: ${candidates}\nDays threshold: ${days}\nFiles:\n${removedList.join('\n')}`;
            console.log('Sending test notification email to', notifyTo || 'unspecified recipients');
            await sendMail({ host: smtpHost, port: smtpPort, secure: !!process.env.CLEANUP_SMTP_SECURE, auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined }, notifyTo, subject, text);
            console.log('Test email sent');
            recordNotificationAttempt(payloadHash);
            appendCleanupLog(`Test email sent to ${notifyTo} payloadHash=${payloadHash}`);
          } else {
            console.log('Skipping test email (debounced)');
            appendCleanupLog(`Test email skipped (debounced) payloadHash=${payloadHash}`);
          }
        } catch (e) {
          console.warn('Test email notify failed', e && e.message ? e.message : e);
        }
      } else if (process.env.CLEANUP_SMTP_HOST && !nodemailer) {
        console.warn('nodemailer not installed; cannot send test email notifications');
      } else if (smtpHost && !emailEnabled) {
        console.warn('Email notifications are disabled. Set CLEANUP_ENABLE_EMAIL=1 to enable test emails.');
      }
      process.exit(0);
    })();
    return; // avoid falling into deletion branch
  }

  // If we removed files (and not a dry-run), optionally notify via webhook or email.
  if (!dryRun && removed > 0) {
    const webhook = process.env.CLEANUP_WEBHOOK_URL;
    const smtpHost = process.env.CLEANUP_SMTP_HOST;
    const smtpPort = process.env.CLEANUP_SMTP_PORT ? parseInt(process.env.CLEANUP_SMTP_PORT, 10) : undefined;
    const smtpUser = process.env.CLEANUP_SMTP_USER;
    const smtpPass = process.env.CLEANUP_SMTP_PASS;
    const notifyTo = process.env.CLEANUP_NOTIFY_TO; // comma separated

    const payload = {
      timestamp: new Date().toISOString(),
      days,
      removed,
      candidates,
      files: removedList
    };

    if (webhook) {
      try {
        const payloadHash = hashPayload(payload);
        if (shouldSendNotification(false, payloadHash)) {
          console.log('Sending webhook to', webhook);
          await sendWebhook(webhook, payload);
          console.log('Webhook sent');
          recordNotificationAttempt(payloadHash);
          appendCleanupLog(`Webhook sent to ${webhook} payloadHash=${payloadHash}`);
        } else {
          console.log('Skipping webhook (debounced)');
          appendCleanupLog(`Webhook skipped (debounced) payloadHash=${payloadHash}`);
        }
      } catch (e) {
        console.warn('Webhook failed', e && e.message ? e.message : e);
      }
    }

    const emailEnabled = process.env.CLEANUP_ENABLE_EMAIL === '1';
    if (smtpHost && nodemailer && emailEnabled) {
      try {
        // Protect against accidental use of primary Gmail password: require explicit allow flag
        if (/gmail\.com$/i.test(smtpHost) && process.env.CLEANUP_ALLOW_GMAIL_APP_PASS !== '1') {
          throw new Error('Gmail SMTP requires an App Password. Set CLEANUP_ALLOW_GMAIL_APP_PASS=1 to override (not recommended).');
        }
        const subject = `Rios cleanup: ${removed} files removed`;
        const text = `Cleanup ran at ${new Date().toISOString()}\nRemoved: ${removed}\nCandidates: ${candidates}\nDays threshold: ${days}\nFiles:\n${removedList.join('\n')}`;
        const payloadHash = hashPayload(payload);
        if (shouldSendNotification(false, payloadHash)) {
          console.log('Sending notification email to', notifyTo || 'unspecified recipients');
          // avoid logging SMTP credentials
          await sendMail({ host: smtpHost, port: smtpPort, secure: !!process.env.CLEANUP_SMTP_SECURE, auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined }, notifyTo, subject, text);
          console.log('Email sent');
          recordNotificationAttempt(payloadHash);
          appendCleanupLog(`Email sent to ${notifyTo} payloadHash=${payloadHash}`);
        } else {
          console.log('Skipping email (debounced)');
          appendCleanupLog(`Email skipped (debounced) payloadHash=${payloadHash}`);
        }
      } catch (e) {
        console.warn('Email notify failed', e && e.message ? e.message : e);
      }
    } else if (process.env.CLEANUP_SMTP_HOST && !nodemailer) {
      console.warn('nodemailer not installed; cannot send email notifications');
    } else if (smtpHost && !emailEnabled) {
      console.warn('Email notifications are disabled. Set CLEANUP_ENABLE_EMAIL=1 to enable.');
    }
  }
})();

async function sendWebhook(url, payload) {
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' }, timeout: 10000 });
  const text = await res.text();
  // ensure logs folder exists and write response for debugging/verification
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(logsDir, `webhook-${ts}.json`);
    fs.writeFileSync(outFile, text, 'utf8');
    console.log('Webhook response saved to', outFile);
  } catch (e) {
    console.warn('Failed to write webhook response to logs', e && e.message ? e.message : e);
  }
  if (!res.ok) throw new Error('Webhook returned ' + res.status + ' body: ' + text);
  return text;
}

async function sendMail(smtpOptions, toCsv, subject, text) {
  if (!nodemailer) throw new Error('nodemailer not available');
  const transporter = nodemailer.createTransport(smtpOptions);
  const to = toCsv ? toCsv.split(',').map(s => s.trim()).filter(Boolean).join(',') : undefined;
  const info = await transporter.sendMail({ from: process.env.CLEANUP_SMTP_FROM || 'rios@localhost', to, subject, text });
  return info;
}
