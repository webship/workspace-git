/**
 * What this plugin needs from the workspace it is added to and from the machine (the manifest's `needs` and `suggests`).
 * The workspace reads them: github.com/webship/workspace, core/workspace-app/PLUGINS.md.
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

// Compiled, this test runs from dist/tests, so the package root is one folder further up.
const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).workspacePlugin;

test("the manifest says what the plugin goes with, and what it needs", () => {
  assert.deepStrictEqual(manifest.needs, ['ai-agents', 'ai-skills', 'ai-commands', 'ai-prompts']);
  for (const kind of Object.keys(manifest.ai)) assert.ok(manifest.ai[kind].length > 0, `it ships ${kind}, which is why it needs the folder they are placed in`);
  assert.deepStrictEqual(manifest.suggests, [['dev', 'test', 'sandboxes', 'projects', 'products']]);
  assert.deepStrictEqual(manifest.suggests[0], manifest.commands.workspaces, 'the alternatives are the folders the command goes to');
  assert.match(fs.readFileSync(path.join(PKG, 'README.md'), 'utf8'), /^## What it goes with$/m, 'and the README says so');
});
