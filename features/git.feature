Feature: The Git plugin on a project row
  Once the plugin is activated, every project row carries the GIT menu: the read-only commands run in
  a terminal that stays open to be read, the mutating ones are copied, and a folder with no
  repository is offered git init.

  @needs-project-dev
  Scenario: A project row offers the GIT menu with its state caption
    Given I am on "/dev"
     Then the element ".act-menu-git" should be displayed
      And I should see "GIT"
      And the element ".act-menu-git + .act-status" should be displayed

  # The Plugins page names each plugin; the package is on the plugin's own page (the row shows it on hover only).
  Scenario: The plugin is listed on the Plugins page, and its own page names its package
    Given I am on "/settings/plugins"
     Then I should see "Git"
     When I go to "/settings/plugin/git"
     Then I should see "@webship.co/workspace-git"

  # The AI folders are searched by name: with every plugin on, a folder lists more than one page of items.
  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents?q=git-state-reader"
     Then I should see "git-state-reader"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills?q=git-menu"
     Then I should see "git-menu"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands?q=git-state"
     Then I should see "git-state"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts?q=git-folder-report"
     Then I should see "git-folder-report"
