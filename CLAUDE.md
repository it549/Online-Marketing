@AGENTS.md

# Project Instructions

## Core Rules

- Inspect existing code before making changes.
- Make the smallest change that solves the task.
- Do not refactor unrelated code.
- Reuse existing services, repositories, utilities, types, and patterns.
- Do not duplicate existing logic.
- Never expose or commit secrets.
- Preserve existing database relationships and API contracts unless the task requires changing them.

## Skills

Project-specific knowledge is stored in `.claude/skills/`.

Only read a skill when its trigger matches the current task.
Do not read unrelated skills.

### Fix Logger

Read:
`.claude/skills/fix-logger/SKILL.md`

Use for:
- debugging/fixing bugs
- checking previous fixes
- logging resolved fixes

If `.claude/fixes.log` exists and may be relevant, check it before debugging.

### Facebook Meta ETL

Read:
`.claude/skills/facebook-meta-etl-debugging/SKILL.md`

Use for:
- Facebook/Meta Graph API
- token/permission errors
- ETL sync
- missing Facebook data
- campaigns, ads, ad_insights, ad_posts
- Facebook Insights
- breakdowns

### Facebook Content Ads

Read:
`.claude/skills/facebook-content-ads/SKILL.md`

Use for:
- Facebook Content analytics
- Content tab
- ContentPost / ContentPostMetric
- AdPost
- Content ↔ Ad ↔ Campaign relationships
- content CSV import
- live Facebook content sync
- `externalPostId` relationships

## Debugging

When fixing a bug:

1. Check `.claude/fixes.log` if relevant.
2. Read the relevant skill.
3. Trace the actual code path.
4. Identify the root cause.
5. Make the smallest fix.
6. Validate the change.
7. Log the resolved fix using `fix-logger`.

Prefer targeted search over reading the entire project.

## Validation

After code changes, run the smallest relevant validation.

For TypeScript changes:

```bash
npx tsc --noEmit