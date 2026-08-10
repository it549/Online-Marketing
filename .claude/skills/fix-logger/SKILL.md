---
name: fix-logger
description: Use this skill in Claude Code whenever a bug is fixed, an error is resolved, or code is debugged and corrected in the current project. After resolving the issue (code compiles/runs/tests pass, or the user confirms the fix works), append a single compact log line to .claude/fixes.log recording what was wrong and what changed. Trigger this any time the conversation involves debugging, fixing errors, troubleshooting failing code, or the user says something like "fix this", "why is this failing", "it's broken", even if they don't explicitly ask for logging.
---

# Fix Logger

Keep a running, minimal-token history of code fixes in `.claude/fixes.log` at the project root, so future sessions can quickly see what was already debugged without re-reading full conversations.

## When to log

Log **once per resolved issue**, right after:
- The fix is confirmed working (tests pass, error stops, or the user says it works), OR
- You've made the change and have reasonable confidence it resolves the issue (if the user won't explicitly confirm).

Do NOT log:
- Exploratory reading/searching that led nowhere
- Failed attempts (unless they're the final abandoned approach worth remembering)
- Non-fix changes (new features, refactors with no bug involved) — those aren't in scope for this skill

## How to log (minimize tokens)

1. Ensure `.claude/` exists: `mkdir -p .claude`
2. Append ONE line to `.claude/fixes.log` using this exact pipe-delimited format:

```
YYYY-MM-DD | file(s) | problem (≤8 words) | fix (≤8 words)
```

Example:
```
2026-08-07 | src/api/auth.js | login 500 on empty token | added null check before decode
2026-08-07 | utils/parse.py, cli.py | crash on trailing comma | switched to json5 parser
```

Rules for staying token-minimal:
- No prose, no markdown headers, no explanations in the log — one line only.
- Use short relative file paths, comma-separated if multiple.
- Problem and fix descriptions: terse fragments, not full sentences (skip "the", "was", articles where possible).
- Never re-summarize or rewrite prior entries — always append, never rewrite the whole file.
- Never paste code, stack traces, or diffs into the log.

Append with a single command, e.g.:
```bash
mkdir -p .claude && echo "$(date +%Y-%m-%d) | <files> | <problem> | <fix>" >> .claude/fixes.log
```

## Reading the log

If the user asks "what's been fixed before" or similar, or at the start of a debugging session if `.claude/fixes.log` exists and seems relevant, skim it (it's cheap — one line per entry) before starting work, to avoid repeating past fixes or reintroducing old bugs.

## Do not

- Do not create separate log files per fix — always the single `.claude/fixes.log`.
- Do not log full conversation transcripts, reasoning, or multi-line explanations — that defeats the token-minimal purpose of this skill.
- Do not ask the user for permission to log each time — just do it silently after a confirmed fix, then mention in passing (one short line) that it was logged.
