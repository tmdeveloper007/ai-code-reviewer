import test from 'node:test';
import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  categorizeFinding,
  generateJSONReport,
  getReportPath,
  SCHEMA_VERSION,
} from '../utils/reportGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// categorizeFinding
// ---------------------------------------------------------------------------

test('categorizeFinding returns security for security keyword in message', () => {
  assert.equal(categorizeFinding({ message: 'SQL injection vulnerability' }), 'security');
});

test('categorizeFinding returns security for credential keyword', () => {
  assert.equal(categorizeFinding({ message: 'Hardcoded credential found' }), 'security');
});

test('categorizeFinding returns security for injection keyword', () => {
  assert.equal(categorizeFinding({ message: 'Code injection risk' }), 'security');
});

test('categorizeFinding returns security for vulnerability keyword', () => {
  assert.equal(categorizeFinding({ message: 'XSS vulnerability detected' }), 'security');
});

test('categorizeFinding returns performance for performance keyword', () => {
  assert.equal(categorizeFinding({ message: 'Performance issue detected' }), 'performance');
});

test('categorizeFinding returns performance for n+1 keyword', () => {
  assert.equal(categorizeFinding({ message: 'N+1 query problem' }), 'performance');
});

test('categorizeFinding returns performance for cache keyword', () => {
  assert.equal(categorizeFinding({ message: 'Cache invalidation missing' }), 'performance');
});

test('categorizeFinding returns performance for optimization keyword', () => {
  assert.equal(categorizeFinding({ message: 'Code optimization needed' }), 'performance');
});

test('categorizeFinding returns style for formatting keyword', () => {
  assert.equal(categorizeFinding({ message: 'File has formatting issues' }), 'style');
});

test('categorizeFinding returns style for comma keyword', () => {
  assert.equal(categorizeFinding({ message: 'Trailing comma missing' }), 'style');
});

test('categorizeFinding returns style for style keyword', () => {
  assert.equal(categorizeFinding({ message: 'Style violation detected' }), 'style');
});

test('categorizeFinding returns other for unrelated findings', () => {
  assert.equal(categorizeFinding({ message: 'File renamed' }), 'other');
  assert.equal(categorizeFinding({ message: '' }), 'other');
  assert.equal(categorizeFinding({}), 'other');
});

test('categorizeFinding handles missing fields gracefully', () => {
  assert.equal(categorizeFinding({}), 'other');
  assert.equal(categorizeFinding({ message: null }), 'other');
  assert.equal(categorizeFinding({ rule_id: null }), 'other');
});

test('categorizeFinding is case-insensitive', () => {
  assert.equal(categorizeFinding({ message: 'SECURITY ISSUE' }), 'security');
  assert.equal(categorizeFinding({ message: 'PERFORMANCE problem' }), 'performance');
  assert.equal(categorizeFinding({ message: 'STYLE VIOLATION' }), 'style');
});

test('categorizeFinding returns other for code-related but non-matching findings', () => {
  assert.equal(categorizeFinding({ message: 'File added' }), 'other');
  assert.equal(categorizeFinding({ message: 'Import statement changed' }), 'other');
});

// ---------------------------------------------------------------------------
// getReportPath
// ---------------------------------------------------------------------------

test('getReportPath returns json extension by default', () => {
  const result = getReportPath();
  assert.ok(result.endsWith('.json'));
  assert.ok(result.includes('review-report'));
});

test('getReportPath returns html extension for html format', () => {
  const result = getReportPath('html');
  assert.ok(result.endsWith('.html'));
});

test('getReportPath uses custom outputDir when provided', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reports-'));
  try {
    const result = getReportPath('json', tmpDir);
    assert.ok(result.startsWith(tmpDir));
    assert.ok(result.endsWith('.json'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('getReportPath returns json for unknown format', () => {
  const result = getReportPath('xml');
  assert.ok(result.endsWith('.json'));
});

// ---------------------------------------------------------------------------
// SCHEMA_VERSION
// ---------------------------------------------------------------------------

test('SCHEMA_VERSION is a non-empty string', () => {
  assert.equal(typeof SCHEMA_VERSION, 'string');
  assert.ok(SCHEMA_VERSION.length > 0);
});

// ---------------------------------------------------------------------------
// generateJSONReport
// ---------------------------------------------------------------------------

test('generateJSONReport writes a valid JSON file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-test-'));
  const outputPath = path.join(tmpDir, 'report.json');
  try {
    const result = generateJSONReport('test-repo', [], { fileReviews: {} }, outputPath);
    assert.ok(fs.existsSync(outputPath));
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    assert.equal(content.repository, 'test-repo');
    assert.equal(content.schema_version, SCHEMA_VERSION);
    assert.ok('timestamp' in content);
    assert.ok('total_findings' in content);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateJSONReport returns success true on valid write', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-test-'));
  const outputPath = path.join(tmpDir, 'report.json');
  try {
    const result = generateJSONReport('success-test', [], { fileReviews: {} }, outputPath);
    assert.equal(result.success, true);
    assert.ok(result.findingCount >= 0);
    assert.equal(result.path, outputPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});
