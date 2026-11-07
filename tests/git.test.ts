/**
 * What must never drift: the menu RUNS only read-only commands (and git init), in screen sessions,
 * with nothing rendered at the end of the page; everything that changes the repository or reaches a
 * remote is a copy entry; the handler refuses anything outside its table.
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

import { register, GIT_RUN_ACTIONS, GIT_COPY_COMMANDS, gitInitRefusal, gitScreenCommand } from '../src/index';

const READ_ONLY = new Set(['status', 'log', 'diff', 'branch', 'remote', 'stash']);
const MUTATING = /\b(push|pull|fetch|commit|add|reset|checkout|switch|merge|rebase|clean|rm|mv|tag|restore|cherry-pick|revert)\b/;
const lingerTail = (label: string) => `echo "${label} finished. Press Enter to close this session"; read -r _`;

function fakeApi(root: string) {
  const calls: any = { rowMenus: {}, actions: {}, started: [], stopped: [] };
  const api: any = {
    name: 'git', config: {}, settings: { read: () => ({}) },
    lib: {
      esc: (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)),
      workspaceDir: (ws: string) => path.join(root, ws), NAME_RE: /^[a-zA-Z0-9_-]+$/,
      hasOwnGit: (dir: string) => fs.existsSync(path.join(dir, '.git')),
      gitWorktreeInfo: (dir: string) => (fs.existsSync(path.join(dir, '.git')) ? { role: 'plain', branch: 'main', others: [], primary: dir, unpushed: 0, dirty: 2 } : { role: 'none', branch: '', others: [], primary: '', unpushed: 0, dirty: 0 }),
      tildePath: (p: string) => p.replace(os.homedir(), '~'), lingerTail,
      startInScreen: async (o: any) => { calls.started.push(o); return { ok: true, session: `s-${calls.started.length}`, already: calls.started.length === 1 && calls.alreadyOnce }; },
      screenStartedHtml: () => 'started-html', hostRunnerRequest: async (a: string, p: any) => { calls.stopped.push([a, p]); },
    },
    addRowMenu: (slot: string, spec: any, fn: any) => { calls.rowMenus[slot] = { spec, fn }; },
    addAction: (name: string, fn: any) => { calls.actions[name] = fn; },
  };
  return { api, calls };
}

function tree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'git-plugin-'));
  fs.mkdirSync(path.join(root, 'dev', 'repo'), { recursive: true });
  execFileSync('git', ['init', '-q', path.join(root, 'dev', 'repo')]);
  fs.mkdirSync(path.join(root, 'dev', 'plain'), { recursive: true });
  fs.mkdirSync(path.join(root, 'dev', 'repo', 'sub'), { recursive: true });
  return root;
}

test('every command the menu runs is read-only', () => {
  const routes = Object.entries(GIT_RUN_ACTIONS);
  assert.ok(routes.length >= 5);
  for (const [name, act] of routes) {
    assert.match(name, /^[a-z]+$/);
    assert.ok(READ_ONLY.has(act.args[0]), `${name} runs "${act.args[0]}", which is not on the read-only list`);
    assert.ok(!MUTATING.test(act.args.join(' ')), `${name} would change the repository`);
    if (act.args[0] === 'stash') assert.deepStrictEqual(act.args, ['stash', 'list']);
  }
});

test('what changes the repository or reaches a remote is copy-only', () => {
  for (const c of GIT_COPY_COMMANDS) assert.ok(MUTATING.test(c.line) || /stash (push|pop)/.test(c.line), `${c.line} is harmless, so it could run`);
  const runLines = Object.values(GIT_RUN_ACTIONS).map((a) => a.args.join(' '));
  for (const c of GIT_COPY_COMMANDS) assert.ok(!runLines.includes(c.line.replace(/^git /, '')));
});

test('the menu offers the commands on a folder with its own .git, git init otherwise, and copies carry the cd', () => {
  const root = tree();
  const { api, calls } = fakeApi(root);
  register(api);
  assert.deepStrictEqual(calls.rowMenus.git.spec, { label: 'GIT', row: 0 });
  const ctx = (p: string) => ({ key: 'dev', project: p, dir: path.join(root, 'dev'), meta: {}, allowed: new Set(), vals: () => '' });
  const html = calls.rowMenus.git.fn(ctx('repo'));
  assert.match(html, /Git · main/);
  assert.match(html, /2 changed/);
  assert.match(html, /hx-post="\/actions\/p\/git\/run"[^>]*"cmd":"status"/);
  assert.match(html, new RegExp(`data-copy="cd ${path.join(root, 'dev', 'repo').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')} &amp;&amp; git fetch --all --prune"`));
  assert.doesNotMatch(html, /hx-post[^>]*push/);
  const none = calls.rowMenus.git.fn(ctx('plain'));
  assert.match(none, /Not a git repository yet/);
  assert.match(none, /\/actions\/p\/git\/init/);
  assert.match(none, /no repo/);
});

test('the handler refuses anything outside its table, a bad name, and a folder with no .git', async () => {
  const root = tree();
  const { api, calls } = fakeApi(root);
  register(api);
  let out = ''; let status = 200;
  const send = (h: string, s = 200) => { out = h; status = s; };
  await calls.actions.run({ form: { cmd: 'push', projectName: 'repo' }, send, workspace: 'dev' });
  assert.strictEqual(status, 404);
  await calls.actions.run({ form: { cmd: 'status', projectName: '../x' }, send, workspace: 'dev' });
  assert.strictEqual(status, 400);
  await calls.actions.run({ form: { cmd: 'status', projectName: 'plain' }, send, workspace: 'dev' });
  assert.strictEqual(status, 400); assert.match(out, /no \.git of its own/);
  await calls.actions.run({ form: { cmd: 'status', projectName: 'repo' }, send, workspace: 'dev' });
  assert.strictEqual(status, 200); assert.match(out, /open the output/);
  assert.strictEqual(calls.started[0].verb, 'git-status');
  assert.match(calls.started[0].cmdLine, /^GIT_TERMINAL_PROMPT=0 git --no-pager status; echo "git status finished/);
  assert.doesNotMatch(calls.started[0].cmdLine, /\$/);
});

test('git init is refused where a repository already exists, and for anything but a folder', async () => {
  const root = tree();
  assert.strictEqual(gitInitRefusal(path.join(root, 'dev', 'repo')), 'already a git repository');
  assert.strictEqual(gitInitRefusal(path.join(root, 'dev', 'nope')), 'no such folder');
  assert.strictEqual(gitInitRefusal(path.join(root, 'dev', 'plain')), '');
  const { api, calls } = fakeApi(root);
  register(api);
  let out = ''; let status = 200;
  const send = (h: string, s = 200) => { out = h; status = s; };
  await calls.actions.init({ form: { projectName: 'repo' }, send, workspace: 'dev' });
  assert.strictEqual(status, 400); assert.match(out, /already a git repository/);
  await calls.actions.init({ form: { projectName: 'plain' }, send, workspace: 'dev' });
  assert.strictEqual(status, 200); assert.match(out, /data-reload-on-close/);
});

test('a session still open from last time is stopped and replaced; the command lingers to be read', async () => {
  const root = tree();
  const { api, calls } = fakeApi(root);
  calls.alreadyOnce = true;
  register(api);
  let out = '';
  await calls.actions.run({ form: { cmd: 'log', projectName: 'repo' }, send: (h: string) => { out = h; }, workspace: 'dev' });
  assert.deepStrictEqual(calls.stopped, [['stop', { session: 's-1' }]]);
  assert.strictEqual(calls.started.length, 2);
  assert.match(out, /open the output/);
  assert.match(gitScreenCommand(lingerTail, 'git log', ['log']), /Press Enter to close this session/);
});
