Report the git state of every project of a workspace folder: what is changed, unpushed or stashed.

```
claude --permission-mode bypassPermissions """
Report the git state of every project in the workspace folder <folder>
# ~/workspace/<folder> · container-based (DDEV by default) · git runs on the machine
# read only: no commit, push, pull, fetch, switch, stash, reset, clean or init, in any project

1. cd ~/workspace/<folder> ; ls -d */.git
   a project with no .git of its own is listed as "no repository" and skipped
2. in each project that has one:
   git --no-pager status
   git --no-pager branch -a -vv
   git --no-pager stash list
   git --no-pager remote -v
3. one line per project: the branch, how many files are changed, how many commits are on no remote,
   how many stashes, and whether it has a remote at all

Then the projects where something would be lost if the folder were removed, first.
For each of them give me the line to copy, and do not run it:
cd ~/workspace/<folder>/<project> && git push -u origin HEAD
"""
```

The text between the triple quotes is plain: it can be given to another AI command-line assistant as it is.
