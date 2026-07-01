import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import path from 'path';
import { parseIgnoreFile, shouldIgnore } from '../utils/reposageIgnore.js';

test('parseIgnoreFile returns empty array for non-existent file', () => {
  const result = parseIgnoreFile('/nonexistent/path/.reposageignore');
  assert.deepEqual(result, []);
});

test('parseIgnoreFile skips comment lines', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, '# This is a comment\nnode_modules\n# Another comment\n');
    const result = parseIgnoreFile(filePath);
    assert.deepEqual(result, ['node_modules']);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('parseIgnoreFile skips blank lines', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'node_modules\n\n\n  \nvendor\n');
    const result = parseIgnoreFile(filePath);
    assert.deepEqual(result, ['node_modules', 'vendor']);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('parseIgnoreFile trims whitespace from patterns', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, '  node_modules  \n  vendor  \n');
    const result = parseIgnoreFile(filePath);
    assert.deepEqual(result, ['node_modules', 'vendor']);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore returns false when ignore file does not exist', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const result = shouldIgnore('src/app.js', tmpDir);
    assert.equal(result, false);
  } finally {
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore matches exact path pattern', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'node_modules\n');
    // Matches exactly 'node_modules' but not 'node_modules/dep/file.js'
    assert.equal(shouldIgnore('node_modules', tmpDir), true);
    assert.equal(shouldIgnore('node_modules/dep/file.js', tmpDir), false);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore matches wildcard pattern with *', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, '*.log\n');
    assert.equal(shouldIgnore('error.log', tmpDir), true);
    assert.equal(shouldIgnore('debug.log', tmpDir), true);
    // * does not match / so full path fails, but basename 'error.log' matches *.log
    assert.equal(shouldIgnore('logs/error.log', tmpDir), true); // matches via basename check
    assert.equal(shouldIgnore('src/app.js', tmpDir), false);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore matches ** wildcard for any path', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, '**/*.tmp\n');
    // ** matches at least one directory segment, so root-level file.tmp is false
    assert.equal(shouldIgnore('file.tmp', tmpDir), false); // no directory prefix
    assert.equal(shouldIgnore('nested/file.tmp', tmpDir), true);
    assert.equal(shouldIgnore('very/nested/deep/file.tmp', tmpDir), true);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore matches basename pattern', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'package-lock.json\n');
    const result = shouldIgnore('some/nested/package-lock.json', tmpDir);
    assert.equal(result, true);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore handles directory pattern with trailing slash', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'dist/\n');
    const result = shouldIgnore('dist/app.js', tmpDir);
    assert.equal(result, true);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore returns false for non-matching pattern', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'node_modules\n*.log\n');
    const result = shouldIgnore('src/app.js', tmpDir);
    assert.equal(result, false);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});

test('shouldIgnore handles multiple patterns', () => {
  const tmpDir = '/tmp/ignore-test-' + Date.now();
  mkdirSync(tmpDir, { recursive: true });
  try {
    const filePath = path.join(tmpDir, '.reposageignore');
    writeFileSync(filePath, 'node_modules\nvendor\n*.log\n');
    assert.equal(shouldIgnore('node_modules', tmpDir), true);
    assert.equal(shouldIgnore('vendor', tmpDir), true);
    assert.equal(shouldIgnore('debug.log', tmpDir), true);
    assert.equal(shouldIgnore('src/app.js', tmpDir), false);
  } finally {
    unlinkSync(path.join(tmpDir, '.reposageignore'));
    rmdirSync(tmpDir);
  }
});
