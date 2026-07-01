import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  categorizeFinding,
  generateJSONReport,
  generateHTMLReport,
  getReportPath,
  SCHEMA_VERSION,
} from '../utils/reportGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// categorizeFinding
// ---------------------------------------------------------------------------

test('categorizeFinding maps security keywords to security', () => {
  assert.equal(categorizeFinding({ message: 'security vulnerability detected' }), 'security');
  assert.equal(categorizeFinding({ message: 'sql injection risk' }), 'security');
  assert.equal(categorizeFinding({ rule_id: 'security-check' }), 'security');
  assert.equal(categorizeFinding({ message: 'credential exposed' }), 'security');
});

test('categorizeFinding maps performance keywords to performance', () => {
  assert.equal(categorizeFinding({ message: 'performance bottleneck detected' }), 'performance');
  assert.equal(categorizeFinding({ message: 'n+1 query problem' }), 'performance');
  assert.equal(categorizeFinding({ rule_id: 'performance-cache-miss' }), 'performance');
  assert.equal(categorizeFinding({ message: 'optimization opportunity' }), 'performance');
});

test('categorizeFinding maps style keywords to style', () => {
  assert.equal(categorizeFinding({ message: 'style: trailing comma missing' }), 'style');
  assert.equal(categorizeFinding({ rule_id: 'style-formatting' }), 'style');
  assert.equal(categorizeFinding({ message: 'formatting inconsistency' }), 'style');
});

test('categorizeFinding defaults to other for unknown keywords', () => {
  assert.equal(categorizeFinding({ message: 'something went wrong' }), 'other');
  assert.equal(categorizeFinding({}), 'other');
  assert.equal(categorizeFinding({ message: '' }), 'other');
});

test('categorizeFinding is case insensitive', () => {
  assert.equal(categorizeFinding({ message: 'SECURITY ISSUE' }), 'security');
  assert.equal(categorizeFinding({ message: 'Performance Bottleneck' }), 'performance');
});

// ---------------------------------------------------------------------------
// getReportPath
// ---------------------------------------------------------------------------

test('getReportPath returns json path by default', () => {
  const result = getReportPath();
  assert.ok(result.endsWith('.json'));
  assert.ok(result.includes('review-report'));
});

test('getReportPath returns html path when format is html', () => {
  const result = getReportPath('html');
  assert.ok(result.endsWith('.html'));
});

test('getReportPath respects outputDir parameter', () => {
  const result = getReportPath('json', '/tmp/reports');
  assert.ok(result.startsWith('/tmp/reports'));
  assert.ok(result.endsWith('.json'));
});

// ---------------------------------------------------------------------------
// generateJSONReport
// ---------------------------------------------------------------------------

test('generateJSONReport returns success with valid inputs', () => {
  const tmpFile = path.join(os.tmpdir(), `report-test-${Date.now()}.json`);
  const result = generateJSONReport('test-repo', [], { fileReviews: {} }, tmpFile);
  try {
    assert.equal(result.success, true);
    assert.equal(result.path, tmpFile);
    assert.ok(fs.existsSync(tmpFile));
    const content = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    assert.equal(content.schema_version, SCHEMA_VERSION);
    assert.equal(content.repository, 'test-repo');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('generateJSONReport writes valid JSON to file', () => {
  const tmpFile = path.join(os.tmpdir(), `report-test-${Date.now()}.json`);
  const result = generateJSONReport('my-repo', [], { fileReviews: {} }, tmpFile);
  try {
    assert.equal(result.success, true);
    const content = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    assert.equal(content.repository, 'my-repo');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('generateJSONReport returns failure when path is unwritable', () => {
  const result = generateJSONReport('test-repo', [], { fileReviews: {} }, '/nonexistent/dir/report.json');
  assert.equal(result.success, false);
  assert.ok('error' in result);
});

// ---------------------------------------------------------------------------
// generateHTMLReport
// ---------------------------------------------------------------------------

test('generateHTMLReport returns success with valid inputs', () => {
  const tmpFile = path.join(os.tmpdir(), `report-test-${Date.now()}.html`);
  const result = generateHTMLReport('test-repo', [], { fileReviews: {} }, tmpFile);
  try {
    assert.equal(result.success, true);
    assert.equal(result.path, tmpFile);
    assert.ok(fs.existsSync(tmpFile));
    const content = fs.readFileSync(tmpFile, 'utf-8');
    assert.ok(content.includes('<html'));
    assert.ok(content.includes('test-repo'));
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('generateHTMLReport returns failure when path is unwritable', () => {
  const result = generateHTMLReport('test-repo', [], { fileReviews: {} }, '/nonexistent/dir/report.html');
  assert.equal(result.success, false);
  assert.ok('error' in result);
});

// ---------------------------------------------------------------------------
// SCHEMA_VERSION
// ---------------------------------------------------------------------------

test('SCHEMA_VERSION is a non-empty string', () => {
  assert.equal(typeof SCHEMA_VERSION, 'string');
  assert.ok(SCHEMA_VERSION.length > 0);
});
