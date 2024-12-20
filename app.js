// app.js
const fs = require('fs');
const path = require('path');
const { parseIsokine, createProjectStructure } = require('./index'); // Adjust path if necessary

/**
 * Entry point for the project generator.
 * Usage: node app.js <input_file> <output_directory>
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node app.js <input_file> <output_directory>');
    process.exit(1);
  }

  const [inputFile, outputDir] = args;
  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputDir);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const dslContent = fs.readFileSync(inputPath, 'utf8');
  const ast = parseIsokine(dslContent);

  createProjectStructure(outputPath, ast, { noViews: false });
}

main();
