// Middleware sencillo que valida token Firebase si se configura; en desarrollo deja pasar
const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

function tryInit() {
  if (initialized) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    initialized = true;
  }
}

async function verifyTokenFromHeader(req) {
  tryInit();
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  if (!initialized) return null;
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded;
}

const optional = async (req, res, next) => {
  try {
    const decoded = await verifyTokenFromHeader(req);
    if (decoded) req.user = decoded;
  } catch (e) {
    console.warn('Token inválido (optional):', e && e.message ? e.message : e);
  }
  return next();
};

const required = async (req, res, next) => {
  try {
    const decoded = await verifyTokenFromHeader(req);
    if (!decoded) return res.status(401).json({ error: 'Autorización requerida' });
    req.user = decoded;
    return next();
  } catch (e) {
    console.warn('Token inválido (required):', e && e.message ? e.message : e);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { optional, required };
