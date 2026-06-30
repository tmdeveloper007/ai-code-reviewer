import test from 'node:test';
import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  stripMagicCommands,
  extractCodeCells,
  isNotebookFile,
  formatNotebookFindings,
} from '../utils/notebookParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// stripMagicCommands
// ---------------------------------------------------------------------------

test('stripMagicCommands removes IPython magic commands', () => {
  const code = `%matplotlib inline
import matplotlib.pyplot as plt
%load_ext autoreload
%autoreload 2
plt.plot([1, 2, 3])`;
  const result = stripMagicCommands(code);
  assert.ok(!result.includes('%matplotlib'));
  assert.ok(!result.includes('%load_ext'));
  assert.ok(!result.includes('%autoreload'));
  assert.ok(result.includes('import matplotlib.pyplot as plt'));
  assert.ok(result.includes('plt.plot([1, 2, 3])'));
});

test('stripMagicCommands removes shell magic commands', () => {
  const code = `!ls -la
print('hello')
!pwd`;
  const result = stripMagicCommands(code);
  assert.ok(!result.includes('!ls'));
  assert.ok(!result.includes('!pwd'));
  assert.ok(result.includes("print('hello')"));
});

test('stripMagicCommands preserves code without magic commands', () => {
  const code = `def hello():
    print('world')
hello()`;
  const result = stripMagicCommands(code);
  assert.equal(result, code);
});

test('stripMagicCommands handles empty string', () => {
  assert.equal(stripMagicCommands(''), '');
});

test('stripMagicCommands removes multiple magic commands on same line', () => {
  const code = `%timeit x = sum(range(1000))
x = sum(range(1000))`;
  const result = stripMagicCommands(code);
  assert.ok(!result.includes('%timeit'));
  assert.ok(result.includes('x = sum(range(1000))'));
});

test('stripMagicCommands removes inline magic at start of line', () => {
  const code = `%who_ls
result = 42`;
  const result = stripMagicCommands(code);
  assert.ok(!result.includes('%who_ls'));
  assert.ok(result.includes('result = 42'));
});

// ---------------------------------------------------------------------------
// isNotebookFile
// ---------------------------------------------------------------------------

test('isNotebookFile returns true for .ipynb extension', () => {
  assert.equal(isNotebookFile('notebook.ipynb'), true);
  assert.equal(isNotebookFile('path/to/file.ipynb'), true);
});

test('isNotebookFile returns false for non-notebook files', () => {
  assert.equal(isNotebookFile('script.py'), false);
  assert.equal(isNotebookFile('data.json'), false);
  assert.equal(isNotebookFile('readme.md'), false);
  assert.equal(isNotebookFile(''), false);
});



// ---------------------------------------------------------------------------
// formatNotebookFindings
// ---------------------------------------------------------------------------

test('formatNotebookFindings adds cellContext to each finding', () => {
  const findings = [
    { cellIndex: 0, line: 5, message: 'unused variable', severity: 'info' },
  ];
  const result = formatNotebookFindings(findings, 0);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].cellContext, 'Cell 0');
  assert.equal(result[0].message, 'unused variable');
});

test('formatNotebookFindings handles empty findings array', () => {
  const result = formatNotebookFindings([], 0);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// extractCodeCells - uses fixture file
// ---------------------------------------------------------------------------

test('extractCodeCells handles non-existent file gracefully', () => {
  const result = extractCodeCells('/nonexistent/notebook.ipynb');
  assert.deepEqual(result, []);
});

test('extractCodeCells returns empty array for invalid JSON', () => {
  const tmpFile = path.join(os.tmpdir(), 'invalid-' + Date.now() + '.ipynb');
  fs.writeFileSync(tmpFile, 'not valid json');
  try {
    const result = extractCodeCells(tmpFile);
    assert.deepEqual(result, []);
  } finally {
    fs.rmSync(tmpFile);
  }
});

test('extractCodeCells returns empty array for empty notebook', () => {
  const tmpFile = path.join(os.tmpdir(), 'empty-' + Date.now() + '.ipynb');
  fs.writeFileSync(tmpFile, JSON.stringify({ cells: [] }));
  try {
    const result = extractCodeCells(tmpFile);
    assert.deepEqual(result, []);
  } finally {
    fs.rmSync(tmpFile);
  }
});

test('extractCodeCells extracts code cells from valid notebook', () => {
  const tmpFile = path.join(os.tmpdir(), 'valid-' + Date.now() + '.ipynb');
  const notebook = {
    cells: [
      { cell_type: 'code', source: ['print("hello")\n'] },
      { cell_type: 'markdown', source: ['# Title\n'] },
      { cell_type: 'code', source: ['x = 42\n'] },
    ],
  };
  fs.writeFileSync(tmpFile, JSON.stringify(notebook));
  try {
    const result = extractCodeCells(tmpFile);
    assert.equal(result.length, 2);
    assert.ok(result[0].includes('print("hello")'));
    assert.ok(result[1].includes('x = 42'));
  } finally {
    fs.rmSync(tmpFile);
  }
});

test('extractCodeCells skips non-code cells', () => {
  const tmpFile = path.join(os.tmpdir(), 'markdown-' + Date.now() + '.ipynb');
  const notebook = {
    cells: [
      { cell_type: 'markdown', source: ['# Title\n'] },
      { cell_type: 'raw', source: ['raw content\n'] },
    ],
  };
  fs.writeFileSync(tmpFile, JSON.stringify(notebook));
  try {
    const result = extractCodeCells(tmpFile);
    assert.equal(result.length, 0);
  } finally {
    fs.rmSync(tmpFile);
  }
});
