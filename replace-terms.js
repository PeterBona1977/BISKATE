const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(/\bbiscatos\b/g, 'biskates');
    content = content.replace(/\bBiscatos\b/g, 'Biskates');
    content = content.replace(/\bBISCATOS\b/g, 'BISKATES');

    content = content.replace(/\bbiscato\b/g, 'biskate');
    content = content.replace(/\bBiscato\b/g, 'Biskate');
    content = content.replace(/\bBISCATO\b/g, 'BISKATE');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed ' + filePath);
    }
}

function traverseDir(dir) {
    if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git') || dir.includes('.vscode') || dir.includes('brain')) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx|json|mdx|md|css)$/.test(fullPath)) {
            replaceInFile(fullPath);
        }
    }
}

traverseDir(process.cwd());
console.log('Done replacement');
