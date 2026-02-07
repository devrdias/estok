---
alwaysApply: true
---

# Pre-Format Validation Rules

These rules MUST pass before code formatting. Any violation will break the format process.

## Critical Rules (Breaking)

### Rule 1: TODO Comments Must Have Tracking Links

**Description**: All TODO comments must include a valid link to track the work item.

**Pattern**: `// TODO` or `/* TODO */` (case-insensitive, in code comments only)

**Required**: Must include one of:

- Jira ticket link: `https://questrade.atlassian.net/browse/[TICKET-ID]`
- GitHub issue/PR link: `https://github.com/[org]/[repo]/issues/[number]` or `/pull/[number]`

**Valid Examples**:

```typescript
// TODO: Fix authentication bug - https://questrade.atlassian.net/browse/TEC-1234
/* TODO: Implement new feature
 * Ticket: https://questrade.atlassian.net/browse/IAM-5678
 */
// TODO: Refactor this code - https://github.com/questrade/iam-functional-tests/issues/42
```

**Invalid Examples**:

```typescript
// TODO: Fix this later
// TODO: Refactor
/* TODO: Improve performance */
```

**Note**: Only check actual code comments. Ignore TODO in strings, documentation examples, or commented-out code blocks.

## Validation Instructions

**Scope**: Validate only changed TypeScript/JavaScript files (`.ts`, `.js`) in `.cursor/` directory compared to master branch.

**Process**: Follow these steps:

1. **Read each changed file** and validate it against ALL rules in the validation rules section
2. **Check EVERY rule** marked as "CRITICAL" or "Breaking" - no exceptions
3. **Report violations** using the format specified in the "Validation Output Format" section below

**Important**: This is a blocking validation. Any rule violation will break the format process.

## Validation Output Format

### Success Case

Output exactly:

```plaintext
VALIDATION PASSED
```

### Failure Case

Format:

```plaintext
VALIDATION FAILED

Error 1: [Rule Name]
────────────────────────────────────────────────────────────────────────────────
File:    [file-path]
Line:    [line-number]
Content: [violating-line-content]

[Explanation of the violation and how to fix it]

Error 2: [Rule Name]
────────────────────────────────────────────────────────────────────────────────
File:    [file-path]
Line:    [line-number]
Content: [violating-line-content]

[Explanation of the violation and how to fix it]

[Repeat for each violation found]
```

### Output Requirements

When reporting violations, ensure you:

- **File path**: Exact path relative to project root (e.g., `.cursor/scripts/shared-utils.ts`)
- **Line number**: Exact line number from the actual file content
- **Line content**: Complete violating line content (as it appears in the file)
- **Rule name**: Clear rule identifier (e.g., "TODO without tracking link")
- **Explanation**: Clear explanation of what needs to be fixed with examples
- **Completeness**: Report ALL violations found, not just the first one
- **Separator**: Use exactly 80 dash characters (`─`) between metadata and explanation
- **Thoroughness**: Check EVERY file against EVERY rule

### Complete Example

Here's a complete example showing how to report a validation failure (using Rule 1):

```plaintext
VALIDATION FAILED

Error 1: TODO without tracking link
────────────────────────────────────────────────────────────────────────────────
File:    .cursor/scripts/shared-utils.ts
Line:    42
Content: // TODO: Fix this later

A TODO comment was found without a tracking link. All TODOs must include a valid link to track the work item.

REQUIRED: Add a link to:
  - Jira: https://questrade.atlassian.net/browse/[TICKET-ID]
  - GitHub: https://github.com/[org]/[repo]/issues/[number]

Example fix: // TODO: Fix this later - https://questrade.atlassian.net/browse/TEC-1234
```
