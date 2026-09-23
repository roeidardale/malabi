# Malabi docs

Start here. Read top to bottom the first time; afterwards you mostly live in **ROADMAP**.

| File | Question it answers | Update when… |
| --- | --- | --- |
| [OVERVIEW.md](OVERVIEW.md) | What is this project, what's the stack, how is it laid out? | architecture changes |
| [FEATURES.md](FEATURES.md) | What is already built and working? | you finish a feature |
| [ROADMAP.md](ROADMAP.md) | **What do I do next to reach production?** (phased checklist) | every work session |
| [KNOWN-ISSUES.md](KNOWN-ISSUES.md) | What is broken / gotchas when developing? | you find or fix a bug |
| [BACKLOG.md](BACKLOG.md) | Nice-to-haves that don't block launch | you have an idea |
| [CHANGELOG.md](CHANGELOG.md) | How did we get here? What was verified? | after each milestone |
| [SITE-COMPARISON-REPORT.md](SITE-COMPARISON-REPORT.md) | How does the rebuild compare to the old malabi-expres.co.il site, and what's missing? | after a review/comparison pass |

## Workflow

1. Open `ROADMAP.md`, pick the first unchecked item in the lowest open phase.
2. Build it. Tick the box, and move any new feature description into `FEATURES.md`.
3. Bugs found on the way → `KNOWN-ISSUES.md`. Ideas → `BACKLOG.md`.
4. Add a dated entry to `CHANGELOG.md` when a milestone lands.

> Also see the root `README.md` (setup + scripts) and `AGENTS.md` (the full agent guide: architecture, commands, gotchas — plus the Next.js version warning to read `node_modules/next/dist/docs/` before writing Next code).
