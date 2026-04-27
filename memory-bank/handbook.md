# Memory Bank Handbook

This is the operating manual for working in this repository. **Every prompt, read every file in `memory-bank/` before doing anything else.** The Memory Bank is the source of truth — code is the artifact, the Memory Bank is the intent.

## Files in the Memory Bank

| File | Purpose |
|------|---------|
| `handbook.md` | This file. How to use the Memory Bank. |
| `projectbrief.md` | What we're building, for whom, and why. The detailed scope. |
| `productContext.md` | Why this product exists, the market and user context, success metrics. |
| `techContext.md` | Technology stack, build tooling, environment, conventions. |
| `systemPatterns.md` | Architecture, code organization, patterns, design rules. |
| `activeContext.md` | What is being worked on RIGHT NOW. Current focus, blockers, decisions in flight. |
| `progress.md` | Running log: what works, what's left, status, decisions made. |

## How to use the Memory Bank

1. **Read first, code second.** At the start of every session, read `activeContext.md` and `progress.md` to understand where things stand. Then consult the others as needed.
2. **Update as you work.** When the situation changes — a decision is made, a feature ships, a blocker appears — update the relevant file. Stale Memory Bank is worse than no Memory Bank.
3. **Keep `activeContext.md` current.** It is the single most important file for ongoing work. Update it at the start and end of every meaningful work session.
4. **Append, don't overwrite, decisions.** In `progress.md`, the Decision Log is append-only. We want to see how thinking evolved.
5. **Don't duplicate.** If something belongs in `systemPatterns.md`, don't also write it in `projectbrief.md`. Cross-reference instead.

## Working agreements

- **Plan before implementing.** For any non-trivial change, write a short plan, get alignment, then code.
- **TDD where it adds value.** RED → GREEN → REFACTOR. Aim for 80% coverage on logic-heavy code. UI doesn't need 80%.
- **KISS, YAGNI, SOLID, DRY.** In that order of priority. Don't build what you don't need.
- **Commit frequently.** Small commits with descriptive messages. The git log is documentation.
- **Refactor immediately.** When a file gets unwieldy, split it before adding more. Don't accumulate debt.
- **Self-check.** Before declaring a task done, run the build, run the tests, manually verify the feature.

## When the Memory Bank conflicts with reality

Reality wins. Update the Memory Bank to match. The Memory Bank is a living document, not a constitution.
