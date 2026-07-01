import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  severityToGitHubLevel,
  formatAnnotations,
  batchAnnotations,
  createCheckRun,
  MAX_ANNOTATIONS_PER_REQUEST,
} from '../utils/githubChecksIntegration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// severityToGitHubLevel
// ---------------------------------------------------------------------------

test('severityToGitHubLevel maps error to failure', () => {
  assert.equal(severityToGitHubLevel('error'), 'failure');
});

test('severityToGitHubLevel maps warning to neutral', () => {
  assert.equal(severityToGitHubLevel('warning'), 'neutral');
});

test('severityToGitHubLevel maps info to notice', () => {
  assert.equal(severityToGitHubLevel('info'), 'notice');
});

test('severityToGitHubLevel maps unknown severity to notice', () => {
  assert.equal(severityToGitHubLevel('unknown'), 'notice');
  assert.equal(severityToGitHubLevel(''), 'notice');
  assert.equal(severityToGitHubLevel(undefined), 'notice');
});

// ---------------------------------------------------------------------------
// formatAnnotations
// ---------------------------------------------------------------------------

test('formatAnnotations transforms findings to GitHub annotation format', () => {
  const findings = [
    { file: 'src/main.js', line: 10, severity: 'error', message: 'Unused variable', rule_id: 'no-unused-vars' },
  ];
  const result = formatAnnotations(findings);
  assert.equal(result.length, 1);
  assert.equal(result[0].path, 'src/main.js');
  assert.equal(result[0].start_line, 10);
  assert.equal(result[0].end_line, 10);
  assert.equal(result[0].annotation_level, 'failure');
  assert.equal(result[0].message, 'Unused variable');
  assert.equal(result[0].title, 'no-unused-vars');
});

test('formatAnnotations maps severity levels correctly', () => {
  const findings = [
    { file: 'a.js', line: 1, severity: 'error', message: 'err' },
    { file: 'b.js', line: 2, severity: 'warning', message: 'warn' },
    { file: 'c.js', line: 3, severity: 'info', message: 'info' },
  ];
  const result = formatAnnotations(findings);
  assert.equal(result[0].annotation_level, 'failure');
  assert.equal(result[1].annotation_level, 'neutral');
  assert.equal(result[2].annotation_level, 'notice');
});

test('formatAnnotations handles empty array', () => {
  const result = formatAnnotations([]);
  assert.deepEqual(result, []);
});

test('formatAnnotations handles findings with missing optional fields', () => {
  const findings = [{ file: 'test.js', line: 1, severity: 'error' }];
  const result = formatAnnotations(findings);
  assert.equal(result[0].message, undefined);
  assert.equal(result[0].title, undefined);
});

// ---------------------------------------------------------------------------
// batchAnnotations
// ---------------------------------------------------------------------------

test('batchAnnotations respects MAX_ANNOTATIONS_PER_REQUEST', () => {
  const annotations = Array.from({ length: 120 }, (_, i) => ({ n: i }));
  const batches = batchAnnotations(annotations);
  assert.equal(batches.length, 3);
  assert.equal(batches[0].length, 50);
  assert.equal(batches[1].length, 50);
  assert.equal(batches[2].length, 20);
});

test('batchAnnotations handles exact multiples of batch size', () => {
  const annotations = Array.from({ length: 100 }, (_, i) => ({ n: i }));
  const batches = batchAnnotations(annotations);
  assert.equal(batches.length, 2);
  assert.equal(batches[0].length, 50);
  assert.equal(batches[1].length, 50);
});

test('batchAnnotations handles empty array', () => {
  const batches = batchAnnotations([]);
  assert.deepEqual(batches, []);
});

test('batchAnnotations handles custom batch size', () => {
  const annotations = Array.from({ length: 10 }, (_, i) => ({ n: i }));
  const batches = batchAnnotations(annotations, 3);
  assert.equal(batches.length, 4);
  assert.equal(batches[0].length, 3);
  assert.equal(batches[3].length, 1);
});

test('batchAnnotations last batch may be smaller', () => {
  const annotations = Array.from({ length: 55 }, (_, i) => ({ n: i }));
  const batches = batchAnnotations(annotations, 50);
  assert.equal(batches.length, 2);
  assert.equal(batches[1].length, 5);
});

// ---------------------------------------------------------------------------
// createCheckRun
// ---------------------------------------------------------------------------

test('createCheckRun throws for missing required parameters', async () => {
  await assert.rejects(
    () => createCheckRun(null, 'owner', 'repo', 'sha', [{ file: 'a.js', line: 1, severity: 'error' }]),
    /Missing required parameters/
  );
  await assert.rejects(
    () => createCheckRun({}, '', 'repo', 'sha', []),
    /Missing required parameters/
  );
});

test('createCheckRun returns null for empty findings', async () => {
  const result = await createCheckRun({}, 'owner', 'repo', 'sha', []);
  assert.equal(result, null);
});

test('createCheckRun returns null for null findings', async () => {
  const result = await createCheckRun({}, 'owner', 'repo', 'sha', null);
  assert.equal(result, null);
});

test('createCheckRun creates check run with correct structure', async () => {
  let capturedPayload = null;
  const mockOctokit = {
    rest: {
      checks: {
        create: async ({ owner, repo, name, head_sha, status, conclusion, output }) => {
          capturedPayload = { owner, repo, name, head_sha, status, conclusion };
          return { data: { id: 12345 } };
        },
      },
    },
  };
  const findings = [
    { file: 'a.js', line: 1, severity: 'error', message: 'Error 1', rule_id: 'r1' },
    { file: 'b.js', line: 2, severity: 'warning', message: 'Warning 1', rule_id: 'r2' },
  ];
  const result = await createCheckRun(mockOctokit, 'myowner', 'myrepo', 'abc123', findings);
  assert.deepEqual(result.checkRunIds, [12345]);
  assert.equal(result.totalAnnotations, 2);
  assert.equal(result.batchCount, 1);
  assert.equal(capturedPayload.conclusion, 'failure');
});

test('createCheckRun conclusion is success when no errors', async () => {
  let capturedConclusion = null;
  const mockOctokit = {
    rest: {
      checks: {
        create: async ({ conclusion }) => {
          capturedConclusion = conclusion;
          return { data: { id: 1 } };
        },
      },
    },
  };
  const findings = [
    { file: 'a.js', line: 1, severity: 'warning', message: 'warn' },
    { file: 'b.js', line: 2, severity: 'info', message: 'info' },
  ];
  await createCheckRun(mockOctokit, 'owner', 'repo', 'sha', findings);
  assert.equal(capturedConclusion, 'success');
});

test('createCheckRun batches annotations across multiple batches', async () => {
  const created = [];
  const mockOctokit = {
    rest: {
      checks: {
        create: async () => {
          const id = created.length + 1;
          created.push(id);
          return { data: { id } };
        },
      },
    },
  };
  const findings = Array.from({ length: 120 }, (_, i) => ({
    file: `file${i}.js`, line: i, severity: 'error', message: `Finding ${i}`, rule_id: `r${i}`,
  }));
  const result = await createCheckRun(mockOctokit, 'owner', 'repo', 'sha', findings);
  assert.equal(created.length, 3);  // 3 batches
  assert.equal(result.batchCount, 3);
  assert.equal(result.totalAnnotations, 120);
});
