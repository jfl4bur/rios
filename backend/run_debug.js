try {
  console.log('run_debug: requiriendo index.js');
  require('./index.js');
  console.log('run_debug: index.js cargado (si llegó hasta aquí, el servidor arrancó o está ejecutándose async)');
} catch (e) {
  console.error('run_debug: error al requerir index.js');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
}
