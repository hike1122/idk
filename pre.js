const fs=require('fs');
try{
fs.mkdirSync('www/lib',{recursive:true});
let s='node_modules/pdfjs-dist/legacy/build/';
if(!fs.existsSync(s+'pdf.min.mjs'))s='node_modules/pdfjs-dist/build/';
fs.copyFileSync(s+'pdf.min.mjs','www/lib/pdf.min.js');
fs.copyFileSync(s+'pdf.worker.min.mjs','www/lib/pdf.worker.min.js');
}catch(e){console.log('pdfjs copy skipped',e.message)}
