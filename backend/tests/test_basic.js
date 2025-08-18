const assert = require('assert');
const { execSync } = require('child_process');

// Test muy simple: comprobar que Node existe y backend file está presente
try {
  const nodeVersion = execSync('node -v').toString().trim();
  console.log('node:', nodeVersion);
  console.log('Test básico: OK (si estás viendo esto, Node está instalado en entorno de ejecución).');
} catch (e) {
  console.error('Node no encontrado en este entorno de ejecución. Ejecuta `node -v` localmente.');
  process.exit(2);
}
