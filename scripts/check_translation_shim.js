const fs = require('fs')
const path = require('path')

const file = path.resolve(__dirname, '..', 'frontend-admin', 'index.html')
let html
try {
  html = fs.readFileSync(file, 'utf8')
} catch (e) {
  console.error('ERROR: no se puede leer', file, e.message)
  process.exit(2)
}

let ok = true
const messages = []

const shimIndex = html.indexOf('window.translations')
const moduleIndex = html.indexOf('<script type="module" src="/src/main.jsx">')
if (shimIndex === -1) {
  ok = false
  messages.push('No se encontró el shim de `window.translations` en `index.html`.')
} else {
  messages.push('Encontrado shim de `window.translations` (índice ' + shimIndex + ').')
}

if (moduleIndex === -1) {
  messages.push('No se encontró la referencia al módulo `/src/main.jsx` (posible build diferente).')
} else {
  messages.push('Encontrada referencia a `/src/main.jsx` (índice ' + moduleIndex + ').')
}

if (shimIndex !== -1 && moduleIndex !== -1 && shimIndex > moduleIndex) {
  ok = false
  messages.push('El shim aparece después del módulo principal; debe cargarse antes para proteger contra inyecciones.');
} else if (shimIndex !== -1 && moduleIndex !== -1) {
  messages.push('Orden correcto: shim antes del módulo principal.');
}

// detect handlers
if (html.includes('unhandledrejection')) {
  messages.push('Handler `unhandledrejection` detectado.');
} else {
  ok = false
  messages.push('Handler `unhandledrejection` NO detectado.');
}

if (html.includes("addEventListener('error'") || html.includes('addEventListener("error"')) {
  messages.push('Handler `error` detectado.');
} else {
  ok = false
  messages.push('Handler `error` NO detectado.');
}

// merchant instrumentation
if (html.includes("const key = 'merchant'") || html.includes('const key = "merchant"')) {
  messages.push('Instrumentación para `merchant` detectada.');
} else {
  ok = false
  messages.push('Instrumentación para `merchant` NO detectada.');
}

console.log('\n=== Resultado del test de shim/instrumentación ===')
console.log(ok ? 'PASS' : 'FAIL')
messages.forEach(m => console.log('- ' + m))
console.log('Archivo verificado:', file)
process.exit(ok ? 0 : 1)
