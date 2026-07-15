const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\William Miranda\\Desktop\\Proyecto Biblia WMB\\TLVD';
const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');
const contactanosHtml = fs.readFileSync(path.join(dir, 'contactanos.html'), 'utf-8');

// Extract head and header from index.html
const indexHeaderMatch = indexHtml.match(/([\s\S]*?)<main/);
const headAndHeader = indexHeaderMatch[1];

// Extract footer and script from index.html
const indexFooterMatch = indexHtml.match(/(<footer class="bg-iskCream[\s\S]*?<\/html>)/);
const footerAndScript = indexFooterMatch[1];

// Extract main from contactanos.html
const mainMatch = contactanosHtml.match(/(<main[\s\S]*?<\/main>)/);
if (!mainMatch) {
    console.error("Could not find <main> in contactanos.html");
    process.exit(1);
}
const mainContent = mainMatch[1];

const assembledHtml = headAndHeader + mainContent + '\n\n' + footerAndScript;

fs.writeFileSync(path.join(dir, 'contactanos.html'), assembledHtml, 'utf-8');
console.log("Fixed contactanos.html");
