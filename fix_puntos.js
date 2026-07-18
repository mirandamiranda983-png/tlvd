const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\William Miranda\\Desktop\\Proyecto Biblia WMB\\TLVD';
const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');
const mainContent = fs.readFileSync(path.join(dir, 'Nuevo documento de texto.txt'), 'utf-8');

// Extract html head and header from index.html (everything up to <main id="main-content">)
// Wait, the new main content has <main class="max-w-4xl mx-auto px-6 py-16">, so we need to split index before <main
const headerMatch = indexHtml.match(/([\s\S]*?)<main/);
if (!headerMatch) {
    console.error("Could not find <main in index.html");
    process.exit(1);
}
const headAndHeader = headerMatch[1];

// Extract footer and script from index.html
// We look for the LAST <footer in index.html to be safe, or we know it has id="currentYear" or class="bg-iskCream
const footerMatch = indexHtml.match(/(<footer class="bg-iskCream[\s\S]*?<\/html>)/);
if (!footerMatch) {
    console.error("Could not find footer in index.html");
    process.exit(1);
}
const footerAndScript = footerMatch[1];

const assembledHtml = headAndHeader + mainContent + '\n\n' + footerAndScript;

fs.writeFileSync(path.join(dir, 'puntos_doctrinales.html'), assembledHtml, 'utf-8');
console.log("Fixed puntos_doctrinales.html");
