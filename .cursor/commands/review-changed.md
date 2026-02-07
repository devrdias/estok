---
name: review-changed
description: Review all files changed compared to master branch
---

# Review Changed Files

Review all files that have been changed in the current branch compared to master, applying all project code quality rules and best practices.

## What This Command Does

1. **Detect Changed Files**
   - Committed changes: `git diff --name-only master...HEAD`
   - Staged changes: `git diff --name-only --cached`
   - Unstaged changes: `git diff --name-only`
   - Untracked files: `git ls-files --others --exclude-standard`

2. **Filter to Reviewable Files**

   - TypeScript/JavaScript files in `.cursor/` directory

3. **Load Project Rules**
   - All rules from the folder `.cursor/rules`

## Usage Examples

### Basic Usage

```text
/review-changed
```

### With Specific Focus

```text
/review-changed
Focus on security vulnerabilities and authentication issues
```
