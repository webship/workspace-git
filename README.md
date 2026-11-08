# @webship.co/workspace-git

Git for the [Webship Workspace](https://github.com/webship/workspace) dashboard: the **GIT** menu on
every project row. The read-only commands (status, log, diff, branches, remotes, stashes) run in a
terminal session that stays open to be read and closes by itself; the commands that change the
repository or reach a remote (fetch, pull, switch, commit, push, stash) are offered to copy, with the
`cd` in front; a folder with no repository is offered `git init`. The plugin also installs
`cmd-tools-git-change-filemode-to-false.sh` into the site workspaces.

What git says about a folder (its own `.git`, the worktree role, the branch, what a remove would
destroy) stays in the dashboard, which needs it for the clone and remove forms; this plugin reads
those answers through `api.lib` (`hasOwnGit`, `gitWorktreeInfo`, `lingerTail`, `hostRunnerRequest`).

## Use it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require github:webship/workspace-git
bash core/scripts/plugins.sh --activate git
bash core/scripts/plugins.sh --install git
```

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
