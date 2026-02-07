# Review Process

This document defines the review workflow and priorities. For concrete coding standards see documentation in `.cursor/rules`.

## Review Focus Areas

### High Priority

- Test reliability and flakiness
- Code maintainability
- Error handling completeness
- Test data management
- Assertion accuracy

### Medium Priority

- Code readability
- Function complexity
- Variable naming
- Comment quality

### Low Priority

- Minor style inconsistencies not covered by Prettier/ESLint
- Documentation improvements
- Minor refactoring opportunities

## Approval Workflow

### Automatic Approvals

- Minor formatting changes
- Comment additions
- Import organization
- Variable renaming for clarity

### Manual Review Required

- Logic changes
- New test additions
- API changes
- Configuration modifications
- Security-related changes

## Review Report Guidelines

### What NOT to Include in Reports

- Feature additions
- Positive feedback about code quality
- "New Features Added" sections
- "Code Quality" praise sections
- Status updates like "IMPROVED", "ENHANCED", "ENHANCED WITH TIMING"
- Detailed explanations of what code does well

## Provide Structured Feedback

- Categorize by severity (High/Medium/Low)
- Cite violations as: `**Rule Violated**: [Document Name] - "[Exact Quote]"`
  - Example: `**Rule Violated**: Code Quality Standards - "Use explicit type annotations for function parameters and return types"`
- Include actionable suggestions for improvement

