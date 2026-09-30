const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(projectRoot, 'www');
const rootFiles = ['index.html', 'manifest.json'];
const assetDirectories = ['css', 'icons', 'js'];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of rootFiles) {
  fs.copyFileSync(path.join(projectRoot, file), path.join(outputDirectory, file));
}

for (const directory of assetDirectories) {
  fs.cpSync(path.join(projectRoot, directory), path.join(outputDirectory, directory), { recursive: true });
}

console.log(`Application web copiée dans ${path.relative(projectRoot, outputDirectory)}`);
