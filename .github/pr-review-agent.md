# PR review contract

This repository is enrolled in the estate-wide PR review flow.

## Primary goal
Review each PR for:
- correctness
- regressions
- security
- test adequacy
- maintainability
- cross-repo impact when shared contracts or critical paths change

## Review rules
- Prioritize real bugs and security failures over style theater.
- Separate blockers/high-risk findings from nits.
- Cite file/line evidence whenever possible.
- If a changed API, auth flow, payment flow, event contract, schema, or shared package could affect other repos, add a short **cross-repo impact** section.
- If evidence is incomplete, say what is missing instead of guessing.
- Do not spam low-value comments.

## Related repositories
- No explicit system-map entries yet. Review shared APIs, auth, schemas, and packages conservatively.

## Domain notes
- Escalate correctness/security regressions; do not manufacture style comments to look busy.

## Critical paths
- `auth/**`
- `payments/**`
- `billing/**`
- `infra/**`
- `migrations/**`
- `frontend/**`
- `app/**`
