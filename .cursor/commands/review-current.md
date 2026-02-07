---
name: review-current
description: Review the currently open file using project rules
---

# Review Current File

Perform a comprehensive review of the currently open/focused file, applying all project code quality rules and best practices.

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
