/**
 * Git for Webship Workspace: the GIT menu on a project row.
 *
 * Every git command the menu runs goes to a SCREEN SESSION, like everything else the dashboard runs,
 * and the page shows nothing but the short toast at the top that links to it. A git command finishes
 * in well under a second, so each session lingers after its output, waiting for Enter, and closes by
 * itself after 15 minutes (api.lib.lingerTail). Clicking the same command again replaces the session
 * still open from last time.
 *
 * Two kinds of command, treated differently on purpose: READ-ONLY commands run from the menu;
 * commands that CHANGE the repository or REACH A REMOTE (fetch, pull, switch, commit, push, stash
 * push/pop) are only offered to copy, with a `cd <project> &&` in front. A push from a dropdown is
 * too easy to do by accident. The handler runs only what GIT_RUN_ACTIONS names (plus `git init`).
 *
 * A folder only gets the commands when it has its OWN `.git` (api.lib.hasOwnGit); one with none is
 * offered `git init` instead, refused where a repository already exists.
 */

import fs from 'fs';
import path from 'path';
import type { ActionContext, FragmentContext, PluginApi, RowContext } from '@webship.co/workspace-plugin-api';

export const GIT_RUN_ACTIONS: Record<string, { label: string; args: string[] }> = {
  status:   { label: 'git status',        args: ['status'] },
  log:      { label: 'git log (last 30)', args: ['log', '--oneline', '--graph', '--decorate', '-30'] },
  diff:     { label: 'git diff --stat',   args: ['diff', '--stat'] },
  branches: { label: 'git branch -a -vv', args: ['branch', '-a', '-vv'] },
  remotes:  { label: 'git remote -v',     args: ['remote', '-v'] },
  stashes:  { label: 'git stash list',    args: ['stash', 'list'] },
};

export const GIT_COPY_COMMANDS = [
  { label: 'Fetch every remote',       line: 'git fetch --all --prune' },
  { label: 'Pull (fast-forward only)', line: 'git pull --ff-only' },
  { label: 'Switch branch',            line: 'git switch <branch>' },
  { label: 'New branch',               line: 'git switch -c <branch>' },
  { label: 'Stage and commit',         line: 'git add -A && git commit -m "<message>"' },
  { label: 'Push this branch',         line: 'git push -u origin HEAD' },
  { label: 'Stash changes',            line: 'git stash push -m "<message>"' },
  { label: 'Restore the last stash',   line: 'git stash pop' },
];

/** Why `git init` must not run here, or '' when it may. */
export function gitInitRefusal(dir: string): string {
  let st: fs.Stats | null = null;
  try { st = fs.statSync(dir); } catch (_) { return 'no such folder'; }
  if (!st.isDirectory()) return 'not a folder';
  if (fs.existsSync(path.join(dir, '.git'))) return 'already a git repository';
  return '';
}

/**
 * The line a git session runs: no prompts and no pager, then the lingering tail. No `$` anywhere:
 * the runner hands it to an outer `bash -lc`, which would expand a variable before screen started.
 */
export const gitScreenCommand = (lingerTail: (label: string) => string, label: string, args: string[]) =>
  `GIT_TERMINAL_PROMPT=0 git --no-pager ${args.join(' ')}; ${lingerTail(label)}`;

export function register(api: PluginApi): void {
  const { esc, workspaceDir, NAME_RE, hasOwnGit, gitWorktreeInfo, tildePath, lingerTail, startInScreen, screenStartedHtml, hostRunnerRequest } = api.lib as any;
  const post = (name: string) => `/actions/p/${api.name}/${name}`;

  // ---- The GIT menu on a project row -------------------------------------------------------------

  const fragment = (rest: string) => `/fragments/p/${api.name}/${rest}`;
  // A dashboard since 1.0.0-rc2 fetches a row menu's body when the menu opens (`row-menu-body`): the
  // page carries the button and the caption, and gitMenuBody() answers from the fragment below, for
  // that one folder. An older dashboard gets the whole menu inline, as it always did.
  const lazy = !!(api.capabilities && api.capabilities.has('row-menu-body'));
  const gitButton = (title: string) => `<button class="uk-button uk-button-default uk-button-small" type="button" title="${esc(title)}"><span uk-icon="icon: git-branch; ratio: .7"></span> GIT <span uk-icon="icon: chevron-down; ratio: .6"></span></button>`;
  const rowVals = (key: string, p: string) => (extra = '') => `hx-vals='{"workspace":"${esc(key)}","projectName":"${esc(p)}"${extra}}' hx-target="#webship-workspace-output" hx-swap="innerHTML"`;

  /**
   * What the folder's OWN .git says (not git's rev-parse: a subfolder of a parent repository would
   * otherwise be offered that parent's history as if it were its own), and the words the row shows.
   */
  function gitMenuState(projectPath: string) {
    const info = hasOwnGit(projectPath) ? gitWorktreeInfo(projectPath) : null;
    const g = info && info.role !== 'none' ? info : null;
    const caption = !g ? 'no repo' : (g.dirty ? `${g.dirty} changed` : (g.unpushed ? `${g.unpushed} unpushed` : 'clean'));
    const title = !g ? 'No git repository in this folder yet' : `Git on ${g.branch || 'a detached HEAD'}`;
    return { g, caption, title };
  }

  /** The dropdown's inner HTML for one folder: the commands on a repository, git init otherwise. */
  function gitMenuBody(key: string, p: string, projectPath: string, g: ReturnType<typeof gitWorktreeInfo> | null): string {
    const vals = rowVals(key, p);
    if (!g) {
      return `<ul class="uk-nav uk-dropdown-nav">
          <li class="uk-nav-header">Not a git repository yet</li>
          <li><a href hx-post="${post('init')}" ${vals()}><span uk-icon="icon: plus-circle; ratio: .7"></span> git init — start a repository here</a></li>
          <li><span class="uk-text-meta">The common commands appear once this folder has its own .git.</span></li>
        </ul>`;
    }
    const cdPath = tildePath(projectPath);
    const facts = [
      g.role === 'linked' ? `a worktree of ${tildePath(g.primary)}` : '',
      g.role === 'primary' ? `${g.others.length} worktree(s) live off this checkout` : '',
      g.unpushed ? `${g.unpushed} commit(s) on no remote` : '',
      g.dirty ? `${g.dirty} uncommitted change(s)` : '',
    ].filter(Boolean);
    const run = Object.entries(GIT_RUN_ACTIONS).map(([name, a]) =>
      `<li><a href hx-post="${post('run')}" ${vals(`,"cmd":"${name}"`)}><span uk-icon="icon: play; ratio: .7"></span> ${esc(a.label)}</a></li>`).join('');
    const copy = GIT_COPY_COMMANDS.map((c) => {
      const line = `cd ${cdPath} && ${c.line}`;
      return `<li><a href="#" class="copy-cmd" data-copy="${esc(line)}" title="Copy: ${esc(line)}"><span uk-icon="icon: copy; ratio: .7"></span> ${esc(c.label)}</a></li>`;
    }).join('');
    return `<ul class="uk-nav uk-dropdown-nav">
        <li class="uk-nav-header">${g.role === 'linked' ? 'Git worktree' : 'Git'} · ${esc(g.branch || 'detached HEAD')}${g.unborn ? ' · no commits yet' : ''}</li>
        ${facts.length ? `<li data-entry="facts"><span class="uk-text-meta">${esc(facts.join(' · '))}</span></li>` : ''}
        <li class="uk-nav-divider"></li>
        <li class="uk-nav-header">Run here</li>
        ${run}
        <li class="uk-nav-divider"></li>
        <li class="uk-nav-header">Copy to a terminal</li>
        ${copy}
      </ul>`;
  }

  api.addRowMenu('git', { label: 'GIT', row: 0 }, ({ key, project: p, dir }: RowContext) => {
    const projectPath = path.join(dir, p);
    const { g, caption, title } = gitMenuState(projectPath);
    if (lazy) return { html: gitButton(title), body: fragment(`menu/${encodeURIComponent(key)}/${encodeURIComponent(p)}`), caption };
    return `<span class="act-with-status"><div class="uk-inline act-menu act-menu-git">
      ${gitButton(title)}
      <div uk-dropdown="mode: click; pos: bottom-right">${gitMenuBody(key, p, projectPath, g)}</div>
    </div><span class="act-status uk-text-meta">${esc(caption)}</span></span>`;
  });

  // The row menu's body, asked for as the menu opens.
  api.addFragment(({ send, rest }: FragmentContext) => {
    const m = /^menu\/([a-z0-9_-]+)\/([a-zA-Z0-9_-]+)$/.exec(rest);
    if (!m || !NAME_RE.test(m[2])) return send('<ul class="uk-nav uk-dropdown-nav"><li class="uk-nav-header">No such menu.</li></ul>', 404);
    const projectPath = path.join(workspaceDir(m[1]), m[2]);
    let folder = false;
    try { folder = fs.statSync(projectPath).isDirectory(); } catch (_) { /* answered below */ }
    if (!folder) return send('<ul class="uk-nav uk-dropdown-nav"><li class="uk-nav-header">No such project.</li></ul>', 404);
    return send(gitMenuBody(m[1], m[2], projectPath, gitMenuState(projectPath).g));
  });

  /** Start the session; if the same command's session is still open from last time, replace it. */
  async function startFresh(opts: Record<string, unknown>) {
    let started = await startInScreen(opts);
    for (let i = 0; started.already && i < 3; i += 1) {
      await hostRunnerRequest('stop', { session: started.session });
      await new Promise((resolve) => setTimeout(resolve, 400));
      started = await startInScreen(opts);
    }
    return started;
  }

  /** The only thing the page shows: a toast at the top that opens the session. */
  const openOutputToast = (label: string, projectName: string, session: string, reload = false) =>
    `<div class="msg assistant flash-now"${reload ? ' data-reload-on-close="1"' : ''}><code>${esc(label)}</code> on <strong>${esc(projectName)}</strong> — <a href="/terminal/${encodeURIComponent(session)}" target="_blank" rel="noopener">open the output</a></div>`;

  api.addAction('run', async ({ form, send, workspace }: ActionContext) => {
    const act = GIT_RUN_ACTIONS[String(form.cmd || '')];
    if (!act) return send('<div class="msg error">Unknown git command.</div>', 404);
    const projectName = String(form.projectName || '');
    if (!NAME_RE.test(projectName)) return send('<div class="msg error">Invalid project name.</div>', 400);
    const projectDir = path.join(workspaceDir(workspace), projectName);
    if (!hasOwnGit(projectDir)) return send(`<div class="msg error">${esc(projectName)} has no .git of its own — start one with git init.</div>`, 400);
    const started = await startFresh({ workspace, project: projectName, projectDir,
      verb: `git-${String(form.cmd)}`, cmdLine: gitScreenCommand(lingerTail, act.label, act.args), label: act.label });
    if (!started.ok) return send(screenStartedHtml(started, act.label, projectName), started.already ? 409 : 500);
    return send(openOutputToast(act.label, projectName, started.session));
  });

  api.addAction('init', async ({ form, send, workspace }: ActionContext) => {
    const projectName = String(form.projectName || '');
    if (!NAME_RE.test(projectName)) return send('<div class="msg error">Invalid project name.</div>', 400);
    const projectDir = path.join(workspaceDir(workspace), projectName);
    const refusal = gitInitRefusal(projectDir);
    if (refusal) return send(`<div class="msg error">Not running git init in ${esc(projectName)}: ${esc(refusal)}.</div>`, 400);
    const started = await startFresh({ workspace, project: projectName, projectDir,
      verb: 'git-init', cmdLine: gitScreenCommand(lingerTail, 'git init', ['init']), label: 'git init' });
    if (!started.ok) return send(screenStartedHtml(started, 'git init', projectName), started.already ? 409 : 500);
    // Reload as the toast leaves: by then the folder has its .git, and the row offers the commands.
    return send(openOutputToast('git init', projectName, started.session, true));
  });
}
