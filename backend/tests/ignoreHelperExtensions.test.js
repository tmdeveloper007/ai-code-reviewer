import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFilesRecursively } from '../utils/ignoreHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, 'temp_test_extensions');

test.before(() => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  // Create test files
  fs.writeFileSync(path.join(tempDir, 'test.js'), 'console.log("hello");');
  fs.writeFileSync(path.join(tempDir, 'config.json'), '{"key": "value"}');
  fs.writeFileSync(path.join(tempDir, 'deploy.yaml'), 'version: 1');
  fs.writeFileSync(path.join(tempDir, 'manifest.yml'), 'name: my-app');
  fs.writeFileSync(path.join(tempDir, 'photo.png'), 'binarydata');
  fs.writeFileSync(path.join(tempDir, 'archive.zip'), 'binaryzip');
});

test.after(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('readFilesRecursively reads supported extensions and ignores unsupported ones', () => {
  const fileList = readFilesRecursively(tempDir);
  const fileNames = fileList.map(f => f.name);

  // Should include js, json, yaml, yml
  assert.ok(fileNames.includes('test.js'));
  assert.ok(fileNames.includes('config.json'));
  assert.ok(fileNames.includes('deploy.yaml'));
  assert.ok(fileNames.includes('manifest.yml'));

  // Should exclude png, zip
  assert.ok(!fileNames.includes('photo.png'));
  assert.ok(!fileNames.includes('archive.zip'));
});
