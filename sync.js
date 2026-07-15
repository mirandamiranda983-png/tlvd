const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\William Miranda\\Desktop\\Proyecto Biblia WMB\\TLVD';
const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');

// Extract header
const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/);
const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/);
const scriptMatch = indexHtml.match(/<!-- CONTROLADORES JAVASCRIPT -->[\s\S]*?<\/html>/);

if (!headerMatch || !footerMatch || !scriptMatch) {
    console.error("Could not find header, footer, or scripts in index.html");
    process.exit(1);
}

const headerContent = headerMatch[0];
const footerContent = footerMatch[0];
const scriptContent = scriptMatch[0];

const filesToUpdate = ['contactanos.html', 'puntos_doctrinales.html'];

for (const file of filesToUpdate) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace header
    content = content.replace(/<header[\s\S]*?<\/header>/, headerContent);
    // Replace footer
    content = content.replace(/<footer[\s\S]*?<\/footer>/, footerContent);
    // Replace scripts (everything from <!-- CONTROLADORES JAVASCRIPT --> to the end of html)
    // Wait, the other files might not have <!-- CONTROLADORES JAVASCRIPT -->
    // Let's replace everything after <!-- Botón Ir Arriba (Back to Top) --> or just replace the <footer> and the rest of the file
    // A safer way is to replace everything from <footer> to the end of the file with footerContent + scriptContent
    content = content.replace(/<footer[\s\S]*?<\/html>/, footerContent + '\n\n' + scriptContent);

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated", file);
}
