# A plugin carries its own items

Every `@webship.co/workspace-<name>` plugin manages what belongs to it: its `cmd-*.sh` commands and
its AI items (agents, skills, commands, prompts). The package holds them under `ai/`, one folder per
kind, the manifest names them (`ai`) and the AI folder each kind lands in (`needs`), and
`plugins.sh --install git` lists each one in the workspace folder of its kind, when that folder is
an active workspace folder. `--uninstall` takes them away again.

The shape, what an item may say and how it is proven on a fresh workspace are described once, in
the reference for a plugin that is not a platform:
[`@webship.co/workspace-github`, docs/plugin-items-pattern.md](https://github.com/webship/workspace-github/blob/1.0.x/docs/plugin-items-pattern.md).

What is specific here is in `tests/items.test.ts`: the items of this plugin are held to what the
plugin itself draws, runs and reads — its menu entries, its settings keys, its commands and flags.
