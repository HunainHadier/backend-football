import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Obfuscation options
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 4000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

function obfuscateFile(sourcePath, targetPath) {
  try {
    const sourceCode = fs.readFileSync(sourcePath, 'utf8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions).getObfuscatedCode();
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, obfuscatedCode);
    console.log(`✓ Obfuscated: ${path.relative(rootDir, sourcePath)}`);
  } catch (error) {
    console.error(`✗ Error obfuscating ${sourcePath}:`, error.message);
  }
}

function obfuscateDirectory(sourceDir, targetDir) {
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      obfuscateDirectory(sourcePath, targetPath);
    } else if (file.endsWith('.js')) {
      obfuscateFile(sourcePath, targetPath);
    } else {
      // Copy non-JS files as-is
      const targetDirForFile = path.dirname(targetPath);
      if (!fs.existsSync(targetDirForFile)) {
        fs.mkdirSync(targetDirForFile, { recursive: true });
      }
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  Copied: ${path.relative(rootDir, sourcePath)}`);
    }
  }
}

// Also obfuscate main server.js and other root JS files
const rootFiles = ['server.js', 'config/db.js'];
for (const file of rootFiles) {
  const sourcePath = path.join(rootDir, file);
  if (fs.existsSync(sourcePath)) {
    const targetPath = path.join(distDir, file);
    obfuscateFile(sourcePath, targetPath);
  }
}

// Obfuscate src directory
if (fs.existsSync(srcDir)) {
  console.log('Obfuscating source files...');
  obfuscateDirectory(srcDir, path.join(distDir, 'src'));
}

// Copy package.json and other necessary files
const filesToCopy = ['package.json', '.env.example'];
for (const file of filesToCopy) {
  const sourcePath = path.join(rootDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(distDir, file));
    console.log(`  Copied: ${file}`);
  }
}

console.log('\n✅ Obfuscation complete! Output in ./dist directory');
console.log('📝 To deploy: copy the dist folder to your server and run: cd dist && npm install --production && node server.js');