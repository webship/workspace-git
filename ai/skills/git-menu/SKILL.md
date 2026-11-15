---
name: git-menu
description: Use git on a project of a Webship Workspace the way the Git plugin (`@webship.co/workspace-git`) does — the GIT menu of a project row, the six read-only commands it runs in a terminal session, the eight commands it only offers to copy, `git init` for a folder with no repository, what the caption beside the menu says, and the command that turns `core.filemode` off in a folder. Use when asked "what does the GIT menu do", "why is push only a copy", "what does 3 changed or 2 unpushed mean on a row", "every file shows as changed after a build", "start a repository in this folder", or when the state of a project's repository is being read.
argument-hint: '<project>'
---

# git-menu

Git for a project of a Webship Workspace (`~/workspace`, container-based, DDEV by default). It
comes with the Git plugin (`@webship.co/workspace-git`), like the agent `git-state-reader`, the
command `/git-state` and the prompt `git-folder-report`.

## The GIT menu

Every project row carries the GIT menu. What it offers depends on the folder having its own `.git`.

### Run here

Read-only commands. Each one runs in a terminal session in the project, without a pager, stays
open to be read, and closes by itself; the page shows a line that links to the output.

| Menu entry | The command |
| --- | --- |
| **git status** | `git status` |
| **git log (last 30)** | `git log --oneline --graph --decorate -30` |
| **git diff --stat** | `git diff --stat` |
| **git branch -a -vv** | `git branch -a -vv` |
| **git remote -v** | `git remote -v` |
| **git stash list** | `git stash list` |

### Copy to a terminal

Commands that change the repository or reach a remote. The menu never runs them: it copies the
line, with `cd <the project> &&` in front, for a terminal.

| Menu entry | The line it copies |
| --- | --- |
| **Fetch every remote** | `git fetch --all --prune` |
| **Pull (fast-forward only)** | `git pull --ff-only` |
| **Switch branch** | `git switch <branch>` |
| **New branch** | `git switch -c <branch>` |
| **Stage and commit** | `git add -A && git commit -m "<message>"` |
| **Push this branch** | `git push -u origin HEAD` |
| **Stash changes** | `git stash push -m "<message>"` |
| **Restore the last stash** | `git stash pop` |

### A folder with no repository

The menu says "Not a git repository yet" and offers **git init — start a repository here**. It is
refused where a `.git` already exists. A folder inside another repository counts as having none:
the menu looks for the folder's own `.git`, not for a parent's.

### The caption beside the menu

| Caption | What it means |
| --- | --- |
| `no repo` | The folder has no `.git` of its own |
| `<n> changed` | Uncommitted changes |
| `<n> unpushed` | Commits on no remote, and nothing uncommitted |
| `clean` | Neither |

## The same from a terminal

```bash
cd ~/workspace/<folder>/<project>
git --no-pager status
git --no-pager log --oneline --graph --decorate -30
git --no-pager diff --stat
git --no-pager branch -a -vv
git --no-pager remote -v
git --no-pager stash list
```

## The command the plugin places

`cmd-tools-git-change-filemode-to-false.sh` is placed in the folders `dev`, `test`, `sandboxes`,
`projects` and `products` that are active in the workspace. It takes no argument:

```bash
cd ~/workspace/<folder>
bash cmd-tools-git-change-filemode-to-false.sh
```

For every project of the folder that has a `.git/config`, it changes `filemode = true` to
`filemode = false` and prints `<project>: filemode = false`. Use it when a container changed the
mode of the files and git shows every file as changed.

## Turn it on

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require @webship.co/workspace-git
bash core/scripts/plugins.sh --activate git --with-needs     # adds the AI folders its items land in
bash core/scripts/plugins.sh --install git
```

The plugin has no settings file.

## Traps

- **A push, a pull or a commit from the menu does nothing by itself**: the line was copied. Paste
  it in a terminal.
- **`filemode` and a worktree**: the command edits `.git/config`. A linked worktree has a `.git`
  file, not a folder, and is left as it is.
- **The caption says `clean` and there are stashes**: stashes are not counted. `git stash list` shows them.
