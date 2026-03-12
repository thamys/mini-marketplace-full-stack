---
description: Systematically resolve feedback from Pull Request reviews.
---

# Fix PR Comments Workflow

Use this workflow to address feedback from Copilot or peer reviews on a Pull Request.

## 📋 Steps

1. **Analyze Comments**
   - Use the `github_operations` skill to fetch PR comments:
     ```bash
     gh pr view <pr-number> --comments
     ```
   - Categorize comments into:
     - **Bug/Logic fixes**
     - **Code quality/Standards** (e.g., fail-fast, naming)
     - **Missing Tests** (E2E/Unit)

2. **Create a Fix Plan**
   - List each comment and the proposed code change.
   - Group fixes by file.

3. **Apply Changes**
   - Implement the fixes using `replace_file_content` or `multi_replace_file_content`.

4. **Verify Locally**
   - Use the `ci_monitoring` skill logic to run only the relevant tests first:
     ```bash
     pnpm --filter <package> test
     ```
   - Ensure all PR-related E2E tests pass.

5. **Update PR**
   - Push the changes and verify the CI status using `gh pr status`.

## 💡 Common Fixes

- **Missing E2E**: Add a new `.spec.ts` in `frontend/e2e` or update `backend/test/*.e2e-spec.ts`.
- **Undefined variables**: Change `config.get()` to `config.getOrThrow()`.
