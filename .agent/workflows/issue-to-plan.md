---
description: Create a technical implementation plan from a GitHub issue.
---

# Issue to Implementation Plan Workflow

Use this workflow when the user provides an issue link or ID and asks for a plan.

## 📋 Steps

1. **Read the Issue Context**
   - If a link is provided, extract the issue number.
   - Use the `github_operations` skill to read the issue details:
     ```bash
     gh issue view <issue-number>
     ```
   - Identify the core objective, technical requirements, and any mentioned constraints.

2. **Research Affected Components**
   - Use `find_by_name` and `grep_search` to find relevant files in `backend/` and `frontend/`.
   - Read the relevant files to understand the current implementation.

3. **Check Project Guidelines**
   - Review `.agent/rules/coding_standards.md` and `.agent/rules/testing_requirements.md` to ensure the plan complies with testing and "fail-fast" requirements.

4. **Draft Implementation Plan**
   - Create a new `implementation_plan.md` following the standard template.
   - Group changes by component (Backend, Frontend, Infra).
   - **Crucial**: Include a `Verification Plan` with specific E2E test scenarios as per generic testing rules.

5. **Request Review**
   - Notify the user with the plan path and wait for approval.

## 💡 Tips

- If the issue is part of the project board (`https://github.com/users/thamys/projects/6`), try to check for related items that might provide more context.
