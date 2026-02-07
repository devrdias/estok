---
name: provide-commit-msg
description: Review the current changes and provide a conventional commit message in lowercase
---

# Review Current Changes

Review all uncommitted changes (staged and unstaged) and provide a conventional commit message in lowercase that follows the project's commitlint rules.

## What This Command Does

1. **Review All Uncommitted Changes**
   - Analyze all staged and unstaged file changes
   - Identify the type of changes (feat, fix, refactor, etc.)
   - Determine appropriate scope based on changed files
   - Generate a conventional commit message in lowercase

2. **Enforce Commit Standards**
   - Follows [Conventional Commits](https://www.conventionalcommits.org/) specification
   - **Ensures lowercase for subject line** (per `@commitlint/config-conventional` default - rejects sentence-case, start-case, pascal-case, upper-case)
   - Validates message length (10-100 characters)
   - Uses allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - **Requires Jira reference** (`GI-XXX`) in footer per `commitlint.config.js` rules
   - Extracts ticket ID from branch name when possible (e.g., `fix/gi-239-title` → `GI-239`)

3. **Load Project Rules**
   - All rules from the folder `.cursor/rules`
   - Respects project-specific commit conventions

## Commit Message Format

The generated message follows this format:

```
<type>(<scope>): <description>

Refs: GI-XXX
```

**Important**: According to `commitlint.config.js`, Jira references are **REQUIRED** (rule: `references-empty: [2, "never"]`). All commit messages must include a `GI-XXX` reference in the footer.

The command will:
1. Attempt to extract the ticket ID from the current branch name (e.g., `fix/gi-239-title` → `GI-239`)
2. If not found in branch name, prompt for the ticket ID or use context from the changes
3. Include the reference in the footer as `Refs: GI-XXX`

## Usage Examples

### Basic Usage

```text
/provide-commit-msg
```

### With Specific Focus

```text
/provide-commit-msg
Focus on the authentication changes for this commit message
```

### Example Output

```text
feat(auth): add jwt token validation middleware

Refs: GI-1234
```

or

```text
fix(api): resolve payment processing timeout error

Refs: GI-5678
```

**Note**: The subject line must be in **lowercase** (not sentence-case). Commitlint will reject sentence-case, start-case, pascal-case, or upper-case formats.

**Note**: If the branch name contains a ticket ID (e.g., `fix/gi-239-title`), it will be automatically extracted and included. Otherwise, the command will attempt to infer it from context or should be provided explicitly.
