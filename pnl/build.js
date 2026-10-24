#!/usr/bin/env node
/* Usage: node build.js [computed.json]  -> dist/dashboard.html
   Inlines lib/pnl.js and (optionally) a data snapshot so the page renders at rest even without the live store. */
const fs = require('fs');
const path = require('path');
const lib = fs.readFileSync(path.join(__dirname, 'lib/pnl.js'), 'utf8');
let tpl = fs.readFileSync(path.join(__dirname, 'src/dashboard.html'), 'utf8');
const snapFile = process.argv[2];
const snap = snapFile && fs.existsSync(snapFile) ? fs.readFileSync(snapFile, 'utf8').replace(/<\/script/gi, '<\\/script') : 'null';
tpl = tpl.replace('/*__PNL_LIB__*/', () => lib).replace('/*__SNAPSHOT__*/null', () => snap);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/dashboard.html'), tpl);
console.log('wrote dist/dashboard.html', tpl.length, 'bytes');
