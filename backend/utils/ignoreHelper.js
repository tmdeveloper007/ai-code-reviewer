import fs from 'fs';
import path from 'path';

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

export function readFilesRecursively(dir, fileList = [], baseDir = dir, ignorePatterns = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
      continue;
    }

    if (file === '.reposageignore' || isIgnored(filePath, ignorePatterns, baseDir)) {
      continue;
    }

    if (stat.isDirectory()) {
      readFilesRecursively(filePath, fileList, baseDir, ignorePatterns);
    } else {
      const ext = path.extname(file).toLowerCase();
      const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.h', '.cs', '.php', '.rb', '.sql', '.html', '.css', '.json', '.yaml', '.yml'];
      
      if (validExtensions.includes(ext)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
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
