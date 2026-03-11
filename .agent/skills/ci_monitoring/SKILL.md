---
name: CI Monitoring and Debugging
description: Guidelines and scripts for monitoring GitHub Actions CI runs and debugging common failures in the monorepo.
---

# CI Monitoring and Debugging Skill

This skill provides a systematic approach to identifying, diagnosing, and resolving Continuous Integration (CI) failures in the mini-marketplace monorepo.

## 🛠 Prerequisites

Ensure you have the GitHub CLI (`gh`) installed and authenticated:

```bash
gh auth status
```

## 📋 CI Monitoring Workflow

### 1. Identify the Latest Run

List the most recent runs for your current branch:

```bash
gh run list --limit 5 --branch <branch-name>
```

### 2. Monitor a Specific Run

Watch the progress of a run in real-time:

```bash
gh run watch <run-id>
```

### 3. Diagnose Failures

View the logs of a failed job to identify the root cause:

```bash
gh run view <run-id> --log-failed
```

To pinpoint specific patterns (e.g., E2E setup errors):

```bash
gh run view <run-id> --job <job-id> --log | grep -C 5 "FAILED TO INITIALIZE"
```

## 🔍 Common CI Failure Patterns

### 1. Missing Environment Variables

- **Symptom**: `TypeError: Configuration key "X" does not exist` or `Nest can't resolve dependencies`.
- **Diagnosis**: Check if the variable is defined in `.github/workflows/ci.yml` under the relevant job's `env` section.
- **Fix**: Add the missing secret or default value to `ci.yml`.

### 2. Flaky E2E Setup/Cleanup

- **Symptom**: `TypeError: Cannot read properties of undefined (reading 'user')` in `afterAll`.
- **Diagnosis**: This usually means `beforeAll` failed before the app/database service was initialized.
- **Fix**:
  - Wrap `beforeAll` in a `try-catch` with diagnostic logging to capture the true error.
  - Add safety checks in `afterAll` (e.g., `if (app) await app.close()`).

### 3. Outdated Test Expectations

- **Symptom**: `expect(received).toEqual(expected)` failures in logic tests or `toContainText` failures in Playwright.
- **Diagnosis**: Backend API response structure changed or UI strings were localized/updated.
- **Fix**: Align unit test mocks and E2E expectations with the current codebase state.

### 4. Port Conflicts

- **Symptom**: `EADDRINUSE: address already in use :::4000`.
- **Diagnosis**: A previous test run didn't clean up its processes or multiple workers are conflicting.
- **Fix**: Ensure `afterAll` always closes the application and database connections.

## 🚀 Useful Scripts

| Purpose                | Command                                                                                                             |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Watch Latest Run**   | `gh run list --limit 1 --json databaseId --jq '.[0].databaseId' \| xargs gh run watch`                              |
| **View Failed Steps**  | `gh run list --limit 1 --json databaseId --jq '.[0].databaseId' \| xargs gh run view --log-failed`                  |
| **Check Backend Logs** | `gh run list --limit 1 --json databaseId --jq '.[0].databaseId' \| xargs gh run view --job "Tests — Backend" --log` |
