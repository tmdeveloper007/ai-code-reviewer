import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeComplexity } from '../utils/complexityAnalyzer.js';

test('analyzeComplexity handles SQL block comments', () => {
  const sql = `
/*
  Multi-line
  SQL comment
*/
SELECT * FROM users;
-- single line comment
SELECT id;
  `;
  const result = analyzeComplexity(sql, 'query.sql');
  assert.ok(result.commentLines >= 4, 'Should count multi-line block comment lines');
  assert.equal(result.codeLines, 2, 'Two non-comment lines of code');
});

test('analyzeComplexity detects unindented HTML comment lines', () => {
  // The implementation only detects <!-- at start of trimmed line (no leading whitespace)
  const html = `<!--
HTML comment line
-->
<div>Hello</div>
<!-- inline html comment -->
<span>World</span>`;
  const result = analyzeComplexity(html, 'index.html');
  assert.ok(result.commentLines >= 2, 'Should count unindented HTML comment start/end lines');
});

test('analyzeComplexity handles C-style block comments', () => {
  const c = `
/*
 * Doc block
 * for foo
 */
function foo() {
  return 42;
}
  `;
  const result = analyzeComplexity(c, 'main.js');
  assert.ok(result.commentLines >= 4);
  assert.equal(result.functionCount, 1);
});

test('analyzeComplexity handles empty extension', () => {
  const code = 'const x = 1;';
  const result = analyzeComplexity(code, 'filename');
  assert.equal(result.functionCount, 0);
  assert.ok(result.totalLines >= 1);
});

test('analyzeComplexity computes grade B boundary correctly', () => {
  // complexityScore = round((totalLines / 25) + (functionCount * 3))
  // For grade B: score must be 9-15
  // 12 lines + 0 functions = 0 -> score 0 -> grade A
  // 25 lines + 0 functions = 1 -> score 1 -> grade A
  // 50 lines + 2 functions = 6 -> score 6 -> grade B
  // 100 lines + 3 functions = 13 -> score 13 -> grade B
  const code = 'const x = 1;\n'.repeat(99) + 'function foo() {}\n'.repeat(3);
  const result = analyzeComplexity(code, 'app.js');
  assert.equal(result.grade, 'B');
});

test('analyzeComplexity computes grade C boundary correctly', () => {
  // Grade C: score 16-25
  // 100 lines + 5 functions = 19 -> score 19 -> grade C
  const code = 'const x = 1;\n'.repeat(99) + 'function foo() {}\n'.repeat(5);
  const result = analyzeComplexity(code, 'app.js');
  assert.equal(result.grade, 'C');
});

test('analyzeComplexity computes grade D boundary correctly', () => {
  // Grade D: score 26-40
  // 200 lines + 10 functions = 38 -> score 38 -> grade D
  const code = 'const x = 1;\n'.repeat(199) + 'function foo() {}\n'.repeat(10);
  const result = analyzeComplexity(code, 'app.js');
  assert.equal(result.grade, 'D');
});

test('analyzeComplexity computes grade F for high complexity', () => {
  // Grade F: score > 40
  // 300 lines + 20 functions = 60 -> score 60 -> grade F
  const code = 'const x = 1;\n'.repeat(299) + 'function foo() {}\n'.repeat(20);
  const result = analyzeComplexity(code, 'app.js');
  assert.equal(result.grade, 'F');
});

test('analyzeComplexity handles files with no recognised comments (json)', () => {
  const json = '{"key": "value", "count": 42, "items": [1, 2, 3]}';
  const result = analyzeComplexity(json, 'config.json');
  // JSON has no recognised comment syntax, so all lines are code
  assert.equal(result.commentLines, 0);
  assert.ok(result.codeLines >= 1);
});

test('analyzeComplexity handles markdown files', () => {
  const md = '# Title\nSome description\n## Section\nMore text';
  const result = analyzeComplexity(md, 'readme.md');
  // No recognised comment syntax for .md
  assert.equal(result.commentLines, 0);
  assert.ok(result.codeLines >= 1);
});

test('analyzeComplexity handles Go function declarations', () => {
  const go = `
package main

func main() {
    doSomething()
}

func doSomething() {
    println("hello")
}
  `;
  const result = analyzeComplexity(go, 'main.go');
  assert.equal(result.functionCount, 2, 'Two Go func declarations');
});

test('analyzeComplexity handles Java method declarations', () => {
  // Java public/private method declarations are supported
  const java = `
public class Main {
    public void run() {
    }
    private int calculate() {
        return 42;
    }
}`;
  const result = analyzeComplexity(java, 'Main.java');
  assert.equal(result.functionCount, 2, 'Two Java method declarations');
});

test('analyzeComplexity handles inline block comment on single line', () => {
  const code = '/* inline block comment */ const x = 5;';
  const result = analyzeComplexity(code, 'app.js');
  // The whole line is counted as a comment line (single-line /* ... */)
  // codeLines = totalLines - emptyLines - commentLines = 1 - 0 - 1 = 0
  assert.ok(result.commentLines >= 1);
  // For the code to appear as code, it must be on a separate line
  const code2 = '/* comment */\nconst x = 5;';
  const result2 = analyzeComplexity(code2, 'app.js');
  assert.ok(result2.codeLines >= 1);
});

test('analyzeComplexity handles null/undefined fileContent gracefully', () => {
  const result = analyzeComplexity(null, 'app.js');
  assert.equal(result.totalLines, 0);
  assert.equal(result.grade, 'A');
});
