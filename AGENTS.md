# Oorah Admissions — Jules Agent Instructions

## Source of truth

`SPEC.md` is the authoritative copy of the user's uploaded Oorah Admissions specification. Read it before implementing changes. Do not silently remove, reinterpret, or replace requirements from it.

The focused task files under `spec/` are implementation workstreams derived from `SPEC.md`. They narrow ownership; they do not override the master specification.

## User-requested additions

In addition to `SPEC.md`, the user has requested these additions:

1. **Admin can modify voting choices.** Voting choices must become configurable data rather than a hardcoded UI list. Admins may create, rename, deactivate/reactivate, and reorder choices. Historical votes must remain understandable after a choice is deactivated.
2. **Separate Campers and Staff sections.** The application must have distinct navigation/sections for Campers and Staff.
3. **Create New Camper.** The Campers section must have a prominent `+ Create New Camper` action.
4. **Camper Contract.** Each camper has an additional `Contract` section using the existing secure document/file architecture.

These additions must be implemented without removing or weakening existing functionality.

## Parallel work

Agents 1–6 are independent implementation workstreams and should be started in parallel where Jules permits it. They should make changes primarily inside their owned areas and avoid unnecessary edits to unrelated files.

After those workstreams are complete, run Agent 7 for integration and QA.

## Security

- Enforce important authorization server-side and at the database/RLS layer where appropriate.
- Never rely only on frontend checks.
- Never expose database service-role credentials, Google private keys, or OAuth client secrets to browser code.
- Sensitive application files and camper contracts must not be public by default.
- Preserve audit history and historical attribution after user deactivation.

## Engineering quality

- Keep UI, pages, server actions/API, database queries, authorization, validation, file services, integrations, audit logic, VAAD logic, hooks/utilities, and types separated.
- Reuse existing services/components rather than creating competing implementations.
- Use TypeScript and shared validation.
- Add tests for changed business rules and permissions.
- Do not use destructive shortcuts to make tests pass.

## Required verification

Before declaring a workstream complete, run the applicable lint, typecheck, tests, and build checks. The integration agent must run the full suite and compare the resulting implementation against `SPEC.md` and the four user-requested additions.

## Coordination rule

When a task depends on another workstream's interface, use the contracts implied by `SPEC.md` and the focused task file rather than blocking all work. The integration agent is responsible for resolving remaining inconsistencies.
