const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const exifParser = require('exif-parser');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const { v4: uuidv4 } = require('uuid');
// Usar nombre definitivo basado en uuid para evitar renames posteriores
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ext = path.extname(safeName) || '';
    const name = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// POST /api/multimedia/upload
// Recibe archivos, valida por magic bytes, comprime imágenes con sharp y extrae EXIF si está presente.
router.post('/upload', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });
  const results = [];

  // helper: detect simple mime by magic bytes (prevenir mismatch extension/content)
  function detectMimeFromBuffer(buffer) {
    if (!buffer || buffer.length < 4) return null;
    // PNG
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { mime: 'image/png', ext: '.png' };
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return { mime: 'image/jpeg', ext: '.jpg' };
    // GIF
    const head6 = buffer.slice(0, 6).toString('ascii');
    if (head6.startsWith('GIF87') || head6.startsWith('GIF89')) return { mime: 'image/gif', ext: '.gif' };
    // WEBP
    if (buffer.length >= 12 && buffer.slice(0,4).toString('ascii') === 'RIFF' && buffer.slice(8,12).toString('ascii') === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
    return null;
  }

  for (const f of req.files) {
    let fullPath = path.join(uploadDir, f.filename);
    let meta = { filename: f.filename, path: `/uploads/${f.filename}`, size: f.size, originalMime: f.mimetype };
    try {
      // Leer buffer
      const buffer = fs.readFileSync(fullPath);

      // Detectar mime real
      const detected = detectMimeFromBuffer(buffer);
      if (detected) {
        meta.detectedMime = detected.mime;
        meta.detectedExt = detected.ext;
        // si la extensión del archivo no coincide con la detectada, creamos una copia con la extensión correcta
        const curExt = path.extname(f.filename).toLowerCase();
        if (curExt !== detected.ext) {
          const base = f.filename.replace(/\.[^.]+$/, '');
          const correctedName = `${Date.now()}-${base}${detected.ext}`;
          const correctedPath = path.join(uploadDir, correctedName);
          try {
            fs.writeFileSync(correctedPath, buffer);
            // eliminar el original y usar el corregido
            try { fs.unlinkSync(fullPath); } catch (e) {}
            fullPath = correctedPath;
            meta.filename = correctedName;
            meta.path = `/uploads/${correctedName}`;
          } catch (copyErr) {
            meta.copyError = String(copyErr && copyErr.message ? copyErr.message : copyErr);
          }
        }
      }

  // Intentar parsear EXIF (silencioso si falla)
      try {
        const parser = exifParser.create(buffer);
        const exif = parser.parse();
        if (exif && exif.tags) meta.exif = exif.tags;
      } catch (e) {
        // ignore exif parse errors
      }

      // Si detectamos que es imagen (por detected.mime o por mimetype) hacemos compresión con sharp
      const isImage = (meta.detectedMime && meta.detectedMime.startsWith('image/')) || (f.mimetype && f.mimetype.startsWith('image/'));
      if (isImage) {
        // Intentar procesar con sharp; envolver en try para capturar errores decode
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          let pipeline = image;
          if (metadata.width && metadata.width > 1920) pipeline = pipeline.resize(1920);

          const outPath = path.join(uploadDir, 'compressed-' + meta.filename);
          // elegir formato de salida según metadata.format si existe
          const fmt = metadata.format || (meta.detectedExt === '.png' ? 'png' : 'jpeg');
          if (fmt === 'png') {
            await pipeline.png({ quality: 80 }).toFile(outPath);
          } else if (fmt === 'webp') {
            await pipeline.webp({ quality: 80 }).toFile(outPath);
          } else {
            await pipeline.jpeg({ quality: 80 }).toFile(outPath);
          }
          const stats = fs.statSync(outPath);
          // reemplazar el archivo por la versión comprimida
          try { fs.unlinkSync(fullPath); } catch (e) {}
          fs.renameSync(outPath, fullPath);
          meta.size = stats.size;
          meta.compressed = true;
          // Generar thumbnail (ancho 300px) y guardarlo como JPG para servir rápido
          try {
            const thumbName = 'thumb-' + meta.filename.replace(/\.[^.]+$/, '.jpg');
            const thumbPath = path.join(uploadDir, thumbName);
            console.log('[multimedia] Generating thumbnail for', meta.filename, '->', thumbName);
            await sharp(fullPath).resize({ width: 300 }).jpeg({ quality: 70 }).toFile(thumbPath);
            const tstats = fs.statSync(thumbPath);
            meta.thumbnail = `/uploads/${thumbName}`;
            meta.thumbnailSize = tstats.size;
            // Si hay bucket de Firebase configurado, subir thumbnail y archivo final
            try {
              const bucket = req.app && req.app.locals && req.app.locals.firebaseStorageBucket;
              if (bucket) {
                // subir file final
                await bucket.upload(fullPath, { destination: `uploads/${meta.filename}`, public: true });
                const file = bucket.file(`uploads/${meta.filename}`);
                const [metaFile] = await file.getMetadata();
                meta.firebaseUrl = metaFile.mediaLink || (file.publicUrl && file.publicUrl());
                // subir thumbnail
                await bucket.upload(thumbPath, { destination: `uploads/${thumbName}`, public: true });
                const tfile = bucket.file(`uploads/${thumbName}`);
                const [tmeta] = await tfile.getMetadata();
                meta.firebaseThumbnail = tmeta.mediaLink || (tfile.publicUrl && tfile.publicUrl());
              }
            } catch (fbErr) {
              console.warn('Firebase upload failed for', meta.filename, fbErr && fbErr.message ? fbErr.message : fbErr);
              meta.firebaseError = fbErr && fbErr.message ? fbErr.message : String(fbErr);
            }
            console.log('[multimedia] Thumbnail saved:', thumbName, 'size:', tstats.size);
          } catch (thumbErr) {
            // no bloquear la respuesta por fallo en thumbnail
            console.warn('[multimedia] Thumbnail generation failed for', meta.filename, thumbErr && thumbErr.message ? thumbErr.message : thumbErr);
            meta.thumbnailError = thumbErr && thumbErr.message ? thumbErr.message : String(thumbErr);
          }
        } catch (imgErr) {
          console.warn('Sharp decode/processing failed for', meta.filename, imgErr && imgErr.message ? imgErr.message : imgErr);
          meta.error = imgErr && imgErr.message ? imgErr.message : String(imgErr);
        }

        // Si tras el procesamiento no se generó thumbnail (por ejemplo compresión no necesaria), intentamos generarlo igual
    if (!meta.thumbnail) {
          try {
            // usar el archivo final (fullPath) para generar thumbnail
            const thumbName = 'thumb-' + meta.filename.replace(/\.[^.]+$/, '.jpg');
            const thumbPath = path.join(uploadDir, thumbName);
      console.log('[multimedia] Generating fallback thumbnail for', meta.filename, '->', thumbName);
      await sharp(fullPath).resize({ width: 300 }).jpeg({ quality: 70 }).toFile(thumbPath);
      const tstats = fs.statSync(thumbPath);
      meta.thumbnail = `/uploads/${thumbName}`;
      meta.thumbnailSize = tstats.size;
      console.log('[multimedia] Fallback thumbnail saved:', thumbName, 'size:', tstats.size);
          } catch (thumbErr2) {
      console.warn('[multimedia] Thumbnail fallback failed for', meta.filename, thumbErr2 && thumbErr2.message ? thumbErr2.message : thumbErr2);
      meta.thumbnailError = thumbErr2 && thumbErr2.message ? thumbErr2.message : String(thumbErr2);
          }
        }
      }
    } catch (e) {
      console.warn('Procesamiento multimedia falló:', e && e.message ? e.message : e);
      meta.error = e && e.message ? e.message : String(e);
    }
    // Verificación final: si existe un thumbnail en el filesystem lo añadimos a la respuesta
    try {
      const thumbCandidate = 'thumb-' + meta.filename.replace(/\.[^.]+$/, '.jpg');
      const thumbCandidatePath = path.join(uploadDir, thumbCandidate);
      if (fs.existsSync(thumbCandidatePath)) {
        const tstat = fs.statSync(thumbCandidatePath);
        meta.thumbnail = `/uploads/${thumbCandidate}`;
        meta.thumbnailSize = tstat.size;
      }
    } catch (finalThumbErr) {
      // no bloquear la respuesta por fallo en la verificación del thumbnail
      console.warn('[multimedia] Final thumbnail check failed for', meta.filename, finalThumbErr && finalThumbErr.message ? finalThumbErr.message : finalThumbErr);
    }

    results.push(meta);
  }
  return res.json({ files: results });
});

module.exports = router;

// Endpoint de prueba
// GET /api/multimedia/test
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'multimedia route ok' });
});
