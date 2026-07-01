import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAnalysis, getTrends } from '../utils/analyticsStore.js';

// ---------------------------------------------------------------------------
// getTrends
// ---------------------------------------------------------------------------

test('getTrends returns an array', () => {
  const result = getTrends();
  assert.ok(Array.isArray(result));
});

test('getTrends is stable (multiple calls return arrays)', () => {
  const r1 = getTrends();
  const r2 = getTrends();
  assert.ok(Array.isArray(r1));
  assert.ok(Array.isArray(r2));
});

// ---------------------------------------------------------------------------
// recordAnalysis
// ---------------------------------------------------------------------------

test('recordAnalysis accepts empty record and fills defaults', () => {
  const before = getTrends().length;
  recordAnalysis({});
  const after = getTrends().length;
  assert.equal(after, before + 1);
  const last = getTrends().at(-1);
  assert.equal(last.repoName, 'unknown');
  assert.equal(last.totalLines, 0);
  assert.equal(last.bugs, 0);
  assert.equal(last.security, 0);
  assert.equal(last.optimization, 0);
  assert.equal(last.styling, 0);
  assert.equal(last.filesCount, 0);
});

test('recordAnalysis records provided fields', () => {
  recordAnalysis({
    repoName: 'my-repo',
    totalLines: 1234,
    bugs: 5,
    security: 2,
    optimization: 3,
    styling: 1,
    filesCount: 42,
  });
  const last = getTrends().at(-1);
  assert.equal(last.repoName, 'my-repo');
  assert.equal(last.totalLines, 1234);
  assert.equal(last.bugs, 5);
  assert.equal(last.security, 2);
  assert.equal(last.optimization, 3);
  assert.equal(last.styling, 1);
  assert.equal(last.filesCount, 42);
});

test('recordAnalysis adds ISO timestamp', () => {
  const before = getTrends().length;
  recordAnalysis({});
  const after = getTrends().length;
  assert.equal(after, before + 1);
  const last = getTrends().at(-1);
  assert.ok('timestamp' in last);
  assert.ok(new Date(last.timestamp).getTime() > 0);
});

test('recordAnalysis handles all-zero numeric fields', () => {
  const before = getTrends().length;
  recordAnalysis({ bugs: 0, security: 0, optimization: 0, styling: 0, totalLines: 0, filesCount: 0 });
  const after = getTrends().length;
  assert.equal(after, before + 1);
  const last = getTrends().at(-1);
  assert.equal(last.bugs, 0);
  assert.equal(last.security, 0);
});

test('recordAnalysis does not crash on multiple calls', () => {
  const before = getTrends().length;
  recordAnalysis({ repoName: 'test1' });
  recordAnalysis({ repoName: 'test2' });
  recordAnalysis({ repoName: 'test3' });
  const after = getTrends().length;
  assert.equal(after, before + 3);
});

test('recordAnalysis result is persisted (readable by getTrends)', () => {
  const before = getTrends().length;
  recordAnalysis({ repoName: 'persist-check' });
  const trends = getTrends();
  const last = trends[trends.length - 1];
  assert.equal(last.repoName, 'persist-check');
});
