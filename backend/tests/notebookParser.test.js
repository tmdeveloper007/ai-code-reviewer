import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'url';
import {
  stripMagicCommands,
  extractCodeCells,
  parseCellsWithMetadata,
  isNotebookFile,
  formatNotebookFindings,
} from '../utils/notebookParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// stripMagicCommands
// ---------------------------------------------------------------------------

describe('stripMagicCommands', () => {

  it('strips IPython magic commands like %matplotlib', () => {
    const code = `%matplotlib inline
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%matplotlib'), 'should remove %matplotlib');
    assert.ok(result.includes('import matplotlib.pyplot as plt'), 'should keep regular code');
  });

  it('strips %pylab magic', () => {
    const code = `%pylab inline
x = [1, 2, 3]`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%pylab'), 'should remove %pylab');
    assert.ok(result.includes('x = [1, 2, 3]'), 'should keep regular code');
  });

  it('strips %config magic', () => {
    const code = `%config InlineBackend.figure_format = 'retina'
import numpy as np`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%config'), 'should remove %config');
    assert.ok(result.includes('import numpy as np'), 'should keep regular code');
  });

  it('strips %%time cell magic', () => {
    const code = `%%time
result = sum(range(1000000))`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%%time'), 'should remove %%time');
    assert.ok(result.includes('result = sum(range(1000000))'), 'should keep regular code');
  });

  it('strips %%timeit cell magic', () => {
    const code = `%%timeit
[ x**2 for x in range(1000) ]`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%%timeit'), 'should remove %%timeit');
  });

  it('strips %%writefile cell magic', () => {
    const code = `%%writefile hello.txt
Hello World`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%%writefile'), 'should remove %%writefile');
  });

  it('strips %%sh shell cell magic', () => {
    const code = `%%sh
ls -la`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%%sh'), 'should remove %%sh');
  });

  it('strips %%bash shell cell magic', () => {
    const code = `%%bash
echo "hello"`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%%bash'), 'should remove %%bash');
    assert.ok(result.includes('echo "hello"'), 'should keep regular code');
  });

  it('strips ! shell prefix on individual lines', () => {
    const code = `!pip install numpy
import numpy as np
!echo done`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('!pip install'), 'should remove !pip');
    assert.ok(!result.includes('!echo done'), 'should remove !echo');
    assert.ok(result.includes('import numpy as np'), 'should keep regular code');
  });

  it('strips %-style line magic', () => {
    const code = `%who_ls
x = 1
%reset -f`;
    const result = stripMagicCommands(code);
    assert.ok(!result.includes('%who_ls'), 'should remove %who_ls');
    assert.ok(!result.includes('%reset'), 'should remove %reset');
    assert.ok(result.includes('x = 1'), 'should keep regular code');
  });

  it('returns trimmed result with no leading/trailing blank lines', () => {
    const code = `

!ls
x = 1

`;
    const result = stripMagicCommands(code);
    assert.ok(!result.startsWith('\n'), 'should not start with newline');
    assert.ok(!result.endsWith('\n'), 'should not end with newline');
  });

  it('returns empty string for code containing only magic', () => {
    const code = `%matplotlib inline
%autoreload 2`;
    const result = stripMagicCommands(code);
    assert.equal(result.trim(), '', 'should return empty for magic-only input');
  });

  it('handles code with no magic commands unchanged', () => {
    const code = `def hello():
    print("world")
hello()`;
    const result = stripMagicCommands(code);
    assert.equal(result, code);
  });

});

// ---------------------------------------------------------------------------
// isNotebookFile
// ---------------------------------------------------------------------------

describe('isNotebookFile', () => {
  it('returns true for .ipynb extension', () => {
    assert.equal(isNotebookFile('analysis.ipynb'), true);
    assert.equal(isNotebookFile('path/to/notebook.ipynb'), true);
  });

  it('returns false for non-notebook files', () => {
    assert.equal(isNotebookFile('script.py'), false);
    assert.equal(isNotebookFile('app.js'), false);
    assert.equal(isNotebookFile('data.json'), false);
    assert.equal(isNotebookFile('notebook.ipynb.bak'), false);
  });
});

// ---------------------------------------------------------------------------
// extractCodeCells
// ---------------------------------------------------------------------------

describe('extractCodeCells', () => {

  function writeTempNotebook(notebook) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'notebook-test-'));
    const filePath = path.join(tmp, 'test.ipynb');
    fs.writeFileSync(filePath, JSON.stringify(notebook));
    return filePath;
  }

  it('extracts code cells from valid notebook', () => {
    const notebook = {
      cells: [
        { cell_type: 'markdown', source: '# Title' },
        { cell_type: 'code', source: ['import numpy as np\n', 'np.array([1, 2, 3])'] },
        { cell_type: 'markdown', source: '## Section' },
        { cell_type: 'code', source: 'print("hello")' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = extractCodeCells(filePath);
    assert.equal(cells.length, 2);
    assert.ok(cells[0].includes('import numpy'));
    assert.ok(cells[1].includes('print("hello")'));
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('skips markdown cells', () => {
    const notebook = {
      cells: [
        { cell_type: 'markdown', source: '# Only markdown' },
        { cell_type: 'markdown', source: 'No code here' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = extractCodeCells(filePath);
    assert.equal(cells.length, 0);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('skips empty code cells', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: '' },
        { cell_type: 'code', source: '   \n  ' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = extractCodeCells(filePath);
    assert.equal(cells.length, 0);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('handles source as array of strings', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: ['line1\n', 'line2\n'] },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = extractCodeCells(filePath);
    assert.equal(cells.length, 1);
    assert.ok(cells[0].includes('line1'));
    assert.ok(cells[0].includes('line2'));
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('handles invalid notebook gracefully', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'notebook-test-'));
    const filePath = path.join(tmp, 'invalid.ipynb');
    fs.writeFileSync(filePath, '{ broken json');
    const cells = extractCodeCells(filePath);
    assert.deepEqual(cells, []);
    fs.rmSync(tmp, { recursive: true });
  });

  it('handles notebook with no cells array', () => {
    const notebook = { metadata: {}, nbformat: 4 };
    const filePath = writeTempNotebook(notebook);
    const cells = extractCodeCells(filePath);
    assert.deepEqual(cells, []);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

});

// ---------------------------------------------------------------------------
// parseCellsWithMetadata
// ---------------------------------------------------------------------------

describe('parseCellsWithMetadata', () => {

  function writeTempNotebook(notebook) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'notebook-test-'));
    const filePath = path.join(tmp, 'test.ipynb');
    fs.writeFileSync(filePath, JSON.stringify(notebook));
    return filePath;
  }

  it('returns cells with metadata including cellIndex', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: 'x = 1' },
        { cell_type: 'markdown', source: 'ignore' },
        { cell_type: 'code', source: 'y = 2' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = parseCellsWithMetadata(filePath);
    assert.equal(cells.length, 2);
    assert.equal(cells[0].cellIndex, 0);
    assert.equal(cells[1].cellIndex, 1);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('populates cleanedSource by stripping magic commands', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: '%matplotlib inline\nimport plt\nplt.show()' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = parseCellsWithMetadata(filePath);
    assert.equal(cells.length, 1);
    assert.ok(!cells[0].cleanedSource.includes('%matplotlib'));
    assert.ok(cells[0].cleanedSource.includes('import plt'));
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('skips cells where cleanedSource is empty after stripping magic', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: '%matplotlib' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = parseCellsWithMetadata(filePath);
    assert.equal(cells.length, 0);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

  it('records correct lineCount for each cell', () => {
    const notebook = {
      cells: [
        { cell_type: 'code', source: 'line1\nline2\nline3' },
      ]
    };
    const filePath = writeTempNotebook(notebook);
    const cells = parseCellsWithMetadata(filePath);
    assert.equal(cells[0].lineCount, 3);
    fs.rmSync(path.dirname(filePath), { recursive: true });
  });

});

// ---------------------------------------------------------------------------
// formatNotebookFindings
// ---------------------------------------------------------------------------

describe('formatNotebookFindings', () => {

  it('appends cellContext to each finding', () => {
    const findings = [
      { type: 'bug', message: 'undefined variable', line: 5 },
      { type: 'style', message: 'missing semicolon', line: 10 },
    ];
    const result = formatNotebookFindings(findings, 3);
    assert.equal(result.length, 2);
    assert.equal(result[0].cellContext, 'Cell 3');
    assert.equal(result[1].cellContext, 'Cell 3');
    assert.equal(result[0].type, 'bug');
    assert.equal(result[1].type, 'style');
  });

  it('returns empty array for empty findings list', () => {
    const result = formatNotebookFindings([], 0);
    assert.deepEqual(result, []);
  });

  it('preserves all original fields on findings', () => {
    const findings = [
      { type: 'bug', message: 'null check missing', line: 2, severity: 'high' },
    ];
    const result = formatNotebookFindings(findings, 1);
    assert.equal(result[0].type, 'bug');
    assert.equal(result[0].message, 'null check missing');
    assert.equal(result[0].line, 2);
    assert.equal(result[0].severity, 'high');
    assert.equal(result[0].cellContext, 'Cell 1');
  });

});
