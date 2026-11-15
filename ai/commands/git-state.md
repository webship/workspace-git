---
description: Read the state of the git repository of a Webship Workspace project — the branch, what is changed, what is on no remote, the stashes, the remotes — with the read-only commands the GIT menu runs. Nothing is committed, pushed, pulled or switched.
argument-hint: '<project>'
---

# /git-state

Read the state of the repository of this project: `$ARGUMENTS`

The argument is one word: the project, which is its folder name in a workspace folder. With no
project, stop and ask for one.

The workspace is container-based (DDEV by default); `git` runs on the machine, in the project's
folder. This command only reads: these are the six commands the GIT menu of the Git plugin
(`@webship.co/workspace-git`) runs. Never run `git commit`, `git push`, `git pull`, `git fetch`,
`git switch`, `git stash push` or `git stash pop` here.

## 1. Find the project

```bash
ls -d ~/workspace/*/<project>
cd ~/workspace/<folder>/<project>
ls -d .git
```

If the project has no `.git` of its own, say "not a git repository yet" and stop: the GIT menu
offers `git init` for it. Do not report the repository of a parent folder.

## 2. Read

```bash
git --no-pager status
git --no-pager log --oneline --graph --decorate -30
git --no-pager diff --stat
git --no-pager branch -a -vv
git --no-pager remote -v
git --no-pager stash list
```

## 3. Report

In this order: the branch (or a detached HEAD), how many files are changed and not committed, how
many commits are on no remote (`ahead <n>` in the branch list, or a branch with no upstream), the
stashes, the remotes. Then one line: what would be lost if the folder were removed now, or
"nothing would be lost".

If something should be done next, give the line to copy, with `cd ~/workspace/<folder>/<project> &&`
in front, and do not run it: `git push -u origin HEAD`, `git pull --ff-only`,
`git add -A && git commit -m "<message>"`.
