---
name: workflow-orchestration
description: Orchestrates the full development workflow including planning, task tracking, subagent delegation, verification, and lesson capture. Use when starting a new task, managing complex work, or when the user mentions workflow, planning, or task management.
---

# Workflow Orchestration

This skill orchestrates AI-assisted development following staff engineer standards.

## Quick Start

When starting any non-trivial task:

1. **Check for existing context**
   - Read `tasks/lessons.md` if it exists (learn from past mistakes)
   - Read `tasks/todo.md` if continuing work

2. **Plan first** (for 3+ step tasks)
   - Switch to plan mode OR
   - Write plan to `tasks/todo.md` with checkable items
   - Get user confirmation before implementing

3. **Execute with subagents**
   - Use `explorer` subagent for research/context gathering
   - Use `debugger` subagent for any errors encountered
   - Use `code-reviewer` subagent after writing code
   - Use `verifier` subagent before marking complete

4. **Track progress**
   - Update `tasks/todo.md` as you go
   - Mark items complete with timestamps

5. **Verify before done**
   - Run tests, check logs
   - Ask: "Would a staff engineer approve this?"

6. **Capture lessons**
   - After ANY user correction, update `tasks/lessons.md`

## Subagent Delegation Guide

| Situation | Subagent | Why |
|-----------|----------|-----|
| Need to understand codebase | `explorer` | Keeps main context clean |
| Error or test failure | `debugger` | Autonomous fixing |
| After writing code | `code-reviewer` | Quality gate |
| Before marking done | `verifier` | Prove it works |

## Task File Templates

### tasks/todo.md

```markdown
# Current Task: [Name]

## Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Progress
- [time] Note

## Review
- Summary of what was done
```

### tasks/lessons.md

```markdown
# Lessons Learned

## [Date] - [Category]
**Mistake**: What happened
**Pattern**: Why it happened
**Rule**: How to prevent it
```

## Core Principles

- **Simplicity First**: Minimal code impact
- **No Laziness**: Find root causes, no temp fixes
- **Minimal Impact**: Touch only what's necessary
- **Verify Everything**: Prove it works before marking done
