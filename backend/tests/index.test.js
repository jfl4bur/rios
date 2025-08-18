const fs = require('fs');
const path = require('path');

const dir = __dirname;

// Require all .js test files in this folder except this index file so node --test runs them
fs.readdirSync(dir)
  .filter(f => f.endsWith('.js') && f !== 'index.test.js')
  .forEach(f => {
    require(path.join(dir, f));
  });

// If you want to exclude certain files, add logic above.
