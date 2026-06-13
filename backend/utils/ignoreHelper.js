import fs from 'fs';
import path from 'path';

// 🟢 Helper to load .reposageignore patterns from a directory
export function loadIgnorePatterns(dir) {
  const patterns = [];
  const ignoreFile = path.join(dir, '.reposageignore');
  if (fs.existsSync(ignoreFile)) {
    const content = fs.readFileSync(ignoreFile, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        patterns.push(trimmed);
      }
    }
  }
  return patterns;
}

// 🟢 Helper to check if a path matches any ignore pattern
export function isIgnored(filePath, patterns, baseDir) {
  const relative = path.relative(baseDir, filePath);
  for (const pattern of patterns) {
    if (pattern.endsWith('/')) {
      if (relative === pattern.slice(0, -1) || relative.startsWith(pattern)) {
        return true;
      }
    } else if (pattern.startsWith('*.')) {
      if (relative.endsWith(pattern.slice(1))) {
        return true;
      }
    } else if (pattern.includes('*')) {
      const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
      try {
        if (new RegExp(`^${escaped}$`).test(relative)) return true;
      } catch { /* skip invalid pattern */ }
    } else {
      if (relative === pattern || relative.startsWith(pattern + path.sep)) {
        return true;
      }
    }
  }
  return false;
}

// 🟢 Helper to recursively read files
const MAX_DEPTH = 20;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_FILES = 200;
let _totalBytes = 0;

function _resetReadBudget() { _totalBytes = 0; }

export function readFilesRecursively(dir, fileList = [], baseDir = dir, ignorePatterns = [], depth = 0) {
  if (depth >= MAX_DEPTH) {
    console.warn(`⚠️ Max recursion depth (${MAX_DEPTH}) reached at ${dir}; skipping deeper entries.`);
    return fileList;
  }
  if (fileList.length >= MAX_FILES) {
    console.warn(`⚠️ Max files (${MAX_FILES}) reached; skipping further entries.`);
    return fileList;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (fileList.length >= MAX_FILES) break;
    const filePath = path.join(dir, file);

    // Use lstat so we can detect (and skip) symlinks to avoid loops
    let stat;
    try {
      stat = fs.lstatSync(filePath);
    } catch (e) {
      continue;
    }
    if (stat.isSymbolicLink()) {
      console.warn(`⚠️ Skipping symlink: ${filePath}`);
      continue;
    }

    // Skip node_modules, git directories, and build artifacts
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
      continue;
    }

    // Skip .reposageignore itself and any ignored paths
    if (file === '.reposageignore' || isIgnored(filePath, ignorePatterns, baseDir)) {
      continue;
    }

    if (stat.isDirectory()) {
      readFilesRecursively(filePath, fileList, baseDir, ignorePatterns, depth + 1);
    } else {
      // Analyze only source code files (Python, JS, TS, HTML, CSS, Go, Rust, Java, C++, PHP, Ruby, SQL)
      const ext = path.extname(file).toLowerCase();
      const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.h', '.cs', '.php', '.rb', '.sql', '.html', '.css'];

      if (validExtensions.includes(ext)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (_totalBytes + Buffer.byteLength(content, 'utf8') > MAX_TOTAL_BYTES) {
            console.warn(`⚠️ Total byte budget (${MAX_TOTAL_BYTES}) reached; skipping ${filePath}.`);
            return fileList;
          }
          _totalBytes += Buffer.byteLength(content, 'utf8');
          fileList.push({
            name: path.relative(baseDir, filePath).replace(/\\/g, '/'),
            content: content
          });
        } catch (e) {
          console.warn(`Could not read file: ${filePath}`, e.message);
        }
      }
    }
  }
  return fileList;
}

// Re-export budget reset so callers (e.g. tests) can clear it between runs.
export { _resetReadBudget, MAX_DEPTH, MAX_FILES, MAX_TOTAL_BYTES };

