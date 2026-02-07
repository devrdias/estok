---
name: review-current
description: Review the current commit against origin master branch
---

# Review Current File

Thoroughly analyze the code differences between the current commit and the origin master branch, ensuring adherence to all project code quality standards and best practices.

# Pre-conditions
Run `git-acc rafa-quest` to authenticate and gain access to GitLab credentials.

## What This Command Does

1. **Identify Current File**
   - Detect the file currently open in the editor
   - Get file path and content from context

2. **Load Project Rules**
   - All rules from the folder `.cursor/rules`

## Usage Examples

### Basic Usage

```text
/review-current
```

### With Specific Focus

```text
/review-current
Focus on error handling and edge cases
```
