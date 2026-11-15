Feature: The Git plugin on a project row
  Once the plugin is activated, every project row carries the GIT menu: the read-only commands run in
  a terminal that stays open to be read, the mutating ones are copied, and a folder with no
  repository is offered git init.

  Scenario: A project row offers the GIT menu with its state caption
    Given I am on "/dev"
     Then the element ".act-menu-git" should be displayed
      And I should see "GIT"
      And the element ".act-menu-git + .act-status" should be displayed

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Git"
      And I should see "@webship.co/workspace-git"

  Scenario: The AI Agents folder lists the agent the plugin ships
    Given I am on "/ai-agents"
     Then I should see "git-state-reader"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills"
     Then I should see "git-menu"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands"
     Then I should see "git-state"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts"
     Then I should see "git-folder-report"
