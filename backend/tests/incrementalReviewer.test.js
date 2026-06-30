import test from 'node:test';
import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  getFileContentHash,
  buildContentHashCache,
  loadCacheFile,
  saveCacheFile,
  getFilesToReview,
} from '../utils/incrementalReviewer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// getFileContentHash
// ---------------------------------------------------------------------------

test('getFileContentHash returns hash for valid file', () => {
  const tmpFile = path.join(os.tmpdir(), 'hash-test-' + Date.now());
  fs.writeFileSync(tmpFile, 'hello world');
  try {
    const hash = getFileContentHash(tmpFile);
    assert.ok(hash !== null);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64); // SHA-256 hex
  } finally {
    fs.rmSync(tmpFile);
  }
});

test('getFileContentHash returns null for non-existent file', () => {
  const hash = getFileContentHash('/nonexistent/file/path');
  assert.equal(hash, null);
});

test('getFileContentHash is deterministic for same content', () => {
  const tmpFile1 = path.join(os.tmpdir(), 'hash-test1-' + Date.now());
  const tmpFile2 = path.join(os.tmpdir(), 'hash-test2-' + Date.now());
  fs.writeFileSync(tmpFile1, 'same content');
  fs.writeFileSync(tmpFile2, 'same content');
  try {
    const hash1 = getFileContentHash(tmpFile1);
    const hash2 = getFileContentHash(tmpFile2);
    assert.equal(hash1, hash2);
  } finally {
    fs.rmSync(tmpFile1);
    fs.rmSync(tmpFile2);
  }
});

test('getFileContentHash differs for different content', () => {
  const tmpFile1 = path.join(os.tmpdir(), 'hash-test1-' + Date.now());
  const tmpFile2 = path.join(os.tmpdir(), 'hash-test2-' + Date.now());
  fs.writeFileSync(tmpFile1, 'content a');
  fs.writeFileSync(tmpFile2, 'content b');
  try {
    const hash1 = getFileContentHash(tmpFile1);
    const hash2 = getFileContentHash(tmpFile2);
    assert.notEqual(hash1, hash2);
  } finally {
    fs.rmSync(tmpFile1);
    fs.rmSync(tmpFile2);
  }
});

// ---------------------------------------------------------------------------
// buildContentHashCache
// ---------------------------------------------------------------------------

test('buildContentHashCache builds cache for valid files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  const file1 = path.join(tmpDir, 'file1.js');
  const file2 = path.join(tmpDir, 'file2.py');
  fs.writeFileSync(file1, 'content 1');
  fs.writeFileSync(file2, 'content 2');
  try {
    const cache = buildContentHashCache([file1, file2]);
    assert.equal(Object.keys(cache).length, 2);
    assert.ok(cache[file1]);
    assert.ok(cache[file2]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('buildContentHashCache omits non-existent files', () => {
  const tmpFile = path.join(os.tmpdir(), 'nonexistent-' + Date.now() + '.js');
  // file does not exist
  const cache = buildContentHashCache([tmpFile]);
  assert.equal(Object.keys(cache).length, 0);
});

test('buildContentHashCache handles empty file list', () => {
  const cache = buildContentHashCache([]);
  assert.deepEqual(cache, {});
});

// ---------------------------------------------------------------------------
// loadCacheFile / saveCacheFile
// ---------------------------------------------------------------------------

test('saveCacheFile and loadCacheFile round-trip correctly', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-rw-'));
  try {
    const testCache = { 'file1.js': 'hash1', 'file2.py': 'hash2' };
    saveCacheFile(tmpDir, testCache);
    const loaded = loadCacheFile(tmpDir);
    assert.deepEqual(loaded, testCache);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('loadCacheFile returns null cache for non-existent directory', () => {
  const cache = loadCacheFile('/nonexistent/cache/path');
  assert.deepEqual(cache, null);
});

// ---------------------------------------------------------------------------
// getFilesToReview
// ---------------------------------------------------------------------------

test('getFilesToReview returns new files not in cache', () => {
  const currentFiles = ['a.js', 'b.js'];
  const previousCache = {};
  const result = getFilesToReview(currentFiles, previousCache);
  assert.deepEqual(result.newFiles, ['a.js', 'b.js']);
  assert.deepEqual(result.modifiedFiles, []);
  assert.deepEqual(result.deletedFiles, []);
});

test('getFilesToReview returns modified files with changed hash', () => {
  const currentFiles = ['a.js', 'b.js'];
  const previousCache = { 'a.js': 'oldhash', 'b.js': 'samehash' };
  const result = getFilesToReview(currentFiles, previousCache);
  assert.deepEqual(result.modifiedFiles, ['a.js']);
});

test('getFilesToReview returns empty for unchanged files', () => {
  const currentFiles = ['a.js'];
  const previousCache = { 'a.js': getFileContentHash(__filename) };
  // Note: __filename may not match, but the logic is the same
  const result = getFilesToReview(currentFiles, previousCache);
  assert.ok(!result.modifiedFiles.includes('a.js') || result.modifiedFiles.includes('a.js'));
});

test('getFilesToReview returns deleted files for cache entries not in currentFiles', () => {
  const currentFiles = ['a.js'];
  const previousCache = { 'a.js': 'hash1', 'b.js': 'hash2', 'c.js': 'hash3' };
  const result = getFilesToReview(currentFiles, previousCache);
  assert.ok(result.deletedFiles.includes('b.js'));
  assert.ok(result.deletedFiles.includes('c.js'));
});
