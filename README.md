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
bash core/scripts/plugins.sh --activate git --with-needs
bash core/scripts/plugins.sh --install git
```

The `workspacePlugin` block in `package.json` is the manifest the installer reads.

## What it goes with

The GIT menu is on every project row of whatever folders the workspace has. The command it ships, `cmd-tools-git-change-filemode-to-false.sh`, is placed only in `dev`, `test`, `sandboxes`, `projects`, `products`, so the manifest suggests one of them (`suggests`): `--require` and `--list` say whether the workspace has one, and nothing is added for you.

## The items it carries

The workspace is container-based (DDEV by default). Each item lands in the folder of its kind, when
that folder is an active workspace folder, is listed there like any other item, and is installed
into Claude Code from there:

| What | Lands in | What it is for |
| --- | --- | --- |
| The agent `git-state-reader` | `ai-agents/` | Reads the state of a project's repository with the six read-only commands of the menu, and hands over the line for anything that changes it |
| The skill `git-menu` | `ai-skills/` | Every entry of the GIT menu and its command, what the caption means, `git init`, and `cmd-tools-git-change-filemode-to-false.sh` |
| The command `/git-state` | `ai-commands/` | `/git-state <project>`: the branch, what is changed, unpushed and stashed, the remotes. Read-only |
| The prompt `git-folder-report` | `ai-prompts/` | The launch command of a session that reports the git state of every project of a folder |

The plugin keeps its one command, `cmd-tools-git-change-filemode-to-false.sh`; no other was added: the menu's commands are plain `git` in the project's folder. The item bodies are plain Markdown any AI command-line assistant can follow; Claude Code is the default shape (frontmatter, the launch command of the prompt).

How the items are laid out and checked: [docs/plugin-items-pattern.md](docs/plugin-items-pattern.md).

## What it needs

It needs the AI folders its items are placed in (`needs`): `ai-agents`, `ai-skills`, `ai-commands` and `ai-prompts`. `--require` says so, `--activate` and `--install` stop until the workspace has them, and `--with-needs` adds what is missing first. A kind whose folder is not an active workspace folder is skipped, and the install says so.

## What the package holds of them

| Path | What it is |
| --- | --- |
| `ai/agents/git-state-reader.md` | The agent `git-state-reader` |
| `ai/skills/git-menu/` | The skill `git-menu` |
| `ai/commands/git-state.md` | The command `/git-state` |
| `ai/prompts/git-folder-report.md` | The prompt `git-folder-report` |
| `tests/items.test.ts` | The shape of every item, and that it names nothing the plugin does not have |
