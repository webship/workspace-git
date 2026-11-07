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
      And I should see "@webship/workspace-git"
