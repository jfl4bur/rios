const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./db/sqlite');
const firebaseAuth = require('./middleware/firebaseAuth');
const authRoutes = require('./routes/auth');

const riosRoutes = require('./routes/rios');
const comentariosRoutes = require('./routes/comentarios');
const multimediaRoutes = require('./routes/multimedia');
const usuariosRoutes = require('./routes/usuarios');
const devReports = require('./routes/dev_reports');
const devReportsRaw = require('./routes/dev_reports_raw');

const app = express();
const fs = require('fs');
let PORT = 3090;
try {
	const cfg = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'config', 'config.json')));
	if (cfg && cfg.server && cfg.server.port) PORT = cfg.server.port;
} catch (e) {
	if (process.env.PORT) PORT = process.env.PORT;
}

app.use(cors());
app.use(express.json());
// Servir uploads con cabeceras de cache y ruta segura
const uploadsDir = path.join(__dirname, 'uploads');
// Servir uploads con cache por tipo (images más agresivo) y CORS
app.use('/uploads', express.static(uploadsDir, {
	setHeaders: (res, filePath) => {
		const ext = path.extname(filePath).toLowerCase();
		// imágenes: 7 días
		if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
			res.setHeader('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 7));
		} else if (['.css', '.js'].includes(ext)) {
			// assets: 30 días
			res.setHeader('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 30));
		} else {
			// por defecto 1 día
			res.setHeader('Cache-Control', 'public, max-age=' + (60 * 60 * 24));
		}
		// permitir CORS para recursos estáticos cuando sean servidos desde otros orígenes
		res.setHeader('Access-Control-Allow-Origin', '*');
	}
}));

// Ruta segura para servir archivos (más control y validación)
app.get('/file/:name', (req, res) => {
	const name = req.params.name || '';
	if (name.includes('..') || /[^a-zA-Z0-9.\-_,]/.test(name)) return res.status(400).json({ error: 'Invalid filename' });
	const full = path.join(uploadsDir, name);
	if (!fs.existsSync(full)) return res.status(404).json({ error: 'Not found' });
	res.setHeader('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 7));
	res.setHeader('Access-Control-Allow-Origin', '*');
	return res.sendFile(full);
});

// Inicializar Firebase Storage opcionalmente si está configurado (requiere credenciales en el entorno)
try {
	if (process.env.FIREBASE_STORAGE_BUCKET) {
		const admin = require('firebase-admin');
		// preferir credencial explícita por variable de entorno o usar ADC
		try {
			admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				storageBucket: process.env.FIREBASE_STORAGE_BUCKET
			});
		} catch (e) {
			// si ya estaba inicializado, ignorar
		}
		const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
		app.locals.firebaseStorageBucket = bucket;
		console.log('Firebase Storage bucket ready:', process.env.FIREBASE_STORAGE_BUCKET);
	}
} catch (e) {
	console.warn('Firebase Storage not initialized:', e && e.message ? e.message : e);
}

// Inicializar DB
initDb();

// Verificar token Firebase para rutas protegidas
app.use('/api', firebaseAuth.optional);

app.use('/api/rios', riosRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/multimedia', multimediaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
// dev-only reports endpoint (no DB, JSONL append)
app.use('/api/dev/reports', devReports);
app.use('/api/dev/reports', devReportsRaw);

app.get('/', (req, res) => res.json({ ok: true, message: 'Rios backend listo' }));

function startServer(port) {
	const s = app.listen(port, () => console.log(`Backend escuchando en puerto ${port}`));
	s.on('error', (err) => {
		if (err && err.code === 'EADDRINUSE') {
			const alt = 9000;
			if (port !== alt) {
				console.warn(`Puerto ${port} en uso, intentando puerto ${alt}`);
				startServer(alt);
				return;
			}
		}
		console.error('Error al iniciar el servidor:', err && err.message ? err.message : err);
		process.exit(1);
	});
	return s;
}

if (require.main === module) {
	startServer(PORT);
}

module.exports = { app, startServer };
