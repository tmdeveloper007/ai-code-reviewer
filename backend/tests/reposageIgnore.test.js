import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { parseIgnoreFile, shouldIgnore } from '../utils/reposageIgnore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// parseIgnoreFile
// ---------------------------------------------------------------------------

test('parseIgnoreFile returns empty array for missing file', () => {
  const result = parseIgnoreFile('/nonexistent/path/.reposageignore');
  assert.deepEqual(result, []);
});

test('parseIgnoreFile strips comments and blank lines', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  const ignoreFile = path.join(tmpDir, '.reposageignore');
  fs.writeFileSync(ignoreFile, '# This is a comment\n\n\n*.log\n  \n# Another comment\nnode_modules/');
  try {
    const result = parseIgnoreFile(ignoreFile);
    assert.deepEqual(result, ['*.log', 'node_modules/']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('parseIgnoreFile trims whitespace', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  const ignoreFile = path.join(tmpDir, '.reposageignore');
  fs.writeFileSync(ignoreFile, '  *.tmp  \n  dist/  ');
  try {
    const result = parseIgnoreFile(ignoreFile);
    assert.deepEqual(result, ['*.tmp', 'dist/']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('parseIgnoreFile treats lines starting with # as comments', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  const ignoreFile = path.join(tmpDir, '.reposageignore');
  fs.writeFileSync(ignoreFile, 'valid.txt\n#comment\n *.js\n##doublecomment');
  try {
    const result = parseIgnoreFile(ignoreFile);
    assert.deepEqual(result, ['valid.txt', '*.js']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// shouldIgnore
// ---------------------------------------------------------------------------

test('shouldIgnore returns false when no .reposageignore exists', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  try {
    const result = shouldIgnore('anything.js', tmpDir);
    assert.equal(result, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore returns false for empty patterns', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '');
  try {
    const result = shouldIgnore('anything.js', tmpDir);
    assert.equal(result, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore matches single star pattern on full path', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '*.log');
  try {
    assert.equal(shouldIgnore('debug.log', tmpDir), true);
    assert.equal(shouldIgnore('error.log', tmpDir), true);
    assert.equal(shouldIgnore('test.js', tmpDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore matches single star pattern via basename', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '*.log');
  try {
    assert.equal(shouldIgnore('src/debug.log', tmpDir), true);
    assert.equal(shouldIgnore('src/utils/error.log', tmpDir), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore matches directory pattern with trailing slash', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), 'node_modules/');
  try {
    // basename 'node_modules' matches the pattern
    assert.equal(shouldIgnore('node_modules', tmpDir), true);
    assert.equal(shouldIgnore('something/node_modules', tmpDir), true);
    assert.equal(shouldIgnore('node_modules/package/index.js', tmpDir), true);
    assert.equal(shouldIgnore('package.json', tmpDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore matches exact filename via basename', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '.env');
  try {
    assert.equal(shouldIgnore('.env', tmpDir), true);
    assert.equal(shouldIgnore('src/config/.env', tmpDir), true);
    assert.equal(shouldIgnore('.env.local', tmpDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore returns false when no pattern matches', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '*.log\nnode_modules/');
  try {
    assert.equal(shouldIgnore('main.js', tmpDir), false);
    assert.equal(shouldIgnore('readme.md', tmpDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('shouldIgnore handles path with backslash (normalized to forward slash)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reposage-test-'));
  fs.writeFileSync(path.join(tmpDir, '.reposageignore'), '*.log');
  try {
    assert.equal(shouldIgnore('src\\debug.log', tmpDir), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});
