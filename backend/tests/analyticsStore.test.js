import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { recordAnalysis, getTrends } from '../utils/analyticsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// getTrends
// ---------------------------------------------------------------------------

test('getTrends returns an array', () => {
  const trends = getTrends();
  assert.ok(Array.isArray(trends));
});

test('getTrends returns empty array when store is corrupted', () => {
  // Temporarily corrupt the store
  const storePath = path.join(__dirname, '..', 'analytics_trends.json');
  const originalContent = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf-8') : null;
  try {
    if (fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, 'not valid json {{{');
      const trends = getTrends();
      assert.ok(Array.isArray(trends));
    }
  } finally {
    if (originalContent !== null) {
      fs.writeFileSync(storePath, originalContent);
    }
  }
});

// ---------------------------------------------------------------------------
// recordAnalysis field normalization
// ---------------------------------------------------------------------------

test('recordAnalysis adds timestamp in ISO format', () => {
  const countBefore = getTrends().length;
  recordAnalysis({ repoName: 'ts-check' });
  const trends = getTrends();
  const last = trends[trends.length - 1];
  assert.ok(last.timestamp);
  const parsed = new Date(last.timestamp);
  assert.ok(!isNaN(parsed.getTime()));
});

test('recordAnalysis normalizes missing repoName to unknown', () => {
  recordAnalysis({ totalLines: 50 });
  const trends = getTrends();
  const last = trends[trends.length - 1];
  assert.equal(last.repoName, 'unknown');
});

test('recordAnalysis normalizes missing numeric fields to 0', () => {
  recordAnalysis({ repoName: 'zeros-test' });
  const trends = getTrends();
  const last = trends[trends.length - 1];
  assert.equal(last.totalLines, 0);
  assert.equal(last.bugs, 0);
  assert.equal(last.security, 0);
  assert.equal(last.optimization, 0);
  assert.equal(last.styling, 0);
  assert.equal(last.filesCount, 0);
});

test('recordAnalysis preserves provided numeric values', () => {
  recordAnalysis({
    repoName: 'values-test',
    totalLines: 500,
    bugs: 10,
    security: 3,
    optimization: 7,
    styling: 2,
    filesCount: 25,
  });
  const trends = getTrends();
  const last = trends[trends.length - 1];
  assert.equal(last.totalLines, 500);
  assert.equal(last.bugs, 10);
  assert.equal(last.security, 3);
  assert.equal(last.optimization, 7);
  assert.equal(last.styling, 2);
  assert.equal(last.filesCount, 25);
  assert.equal(last.repoName, 'values-test');
});
