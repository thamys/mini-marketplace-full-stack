---
name: GitHub Operations
description: Guidelines and commands for interacting with GitHub issues, pull requests, and projects using the `gh` CLI.
---

# GitHub Operations Skill

This skill allows the AI to effectively browse, read, and manage GitHub resources within the repository.

## 📋 Pull Requests

### 1. List PRs

```bash
gh pr list --limit 10 --state all
```

### 2. View PR Details and Comments

```bash
gh pr view <pr-number> --comments
```

### 3. Review PR Diffs

```bash
gh pr diff <pr-number>
```

## 📋 Issues and Project Board

### 1. List Recent Issues

```bash
gh issue list --limit 10
```

### 2. View Issue Content

```bash
gh issue view <issue-number>
```

### 3. Project Board Guidance

The project board is located at: `https://github.com/users/thamys/projects/6`.
To view items in the project (requires proper auth scopes):

```bash
gh project item-list 6 --owner thamys
```

_Note: If project scopes are missing, prefer searching for issues via `gh issue list` with labels._

## 📋 Integration with Workflows

- **Reading Context**: Use `gh pr view` and `gh issue view` to gather requirements before creating implementation plans.
- **Verification**: Use `gh pr status` to check if CI passed on a given branch.
