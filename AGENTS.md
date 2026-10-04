# Project Rules

## Accuracy

- Never invent files, folders, functions, APIs, dependencies, or requirements.
- Always inspect the existing project before making changes.
- Never assume something exists. Verify it first.
- If information cannot be verified, say UNKNOWN.
- Ask me instead of guessing when important information is missing.

## Before Coding

1. Inspect the project structure.
2. Read relevant existing files.
3. Understand the current implementation.
4. Identify files that need modification.
5. Explain planned changes before implementing large changes.

## Implementation

- Make small incremental changes.
- Modify only relevant files.
- Do not rewrite working code unnecessarily.
- Preserve existing functionality.

## Verification

- Run appropriate tests and checks after changes.
- Never claim something was tested unless you actually tested it.
- Never claim something works unless it was verified.
- Clearly separate VERIFIED information from UNKNOWN information.

## DSA

- Use the requested data structure or algorithm.
- Do not secretly replace it with another algorithm.
- Explain time and space complexity where relevant.
- Test normal and edge cases.

## Security

- Never expose passwords, API keys, tokens, or secrets.
- Do not create fake credentials.
- Do not weaken security just to make something work.

## Git Safety

Never run destructive Git commands without my explicit permission.

## Skills

Use only the skill relevant to the current task.
Do not unnecessarily use every available skill.

## design-taste-frontend

Use `.agents/skills/design-taste-frontend/SKILL.md` for appropriate frontend
design tasks.

Important:
- Read the skill before using it.
- First determine whether the requested page is suitable for this skill.
- Do NOT apply it automatically to dashboards, data tables, or multi-step
  product UI because the skill explicitly excludes those contexts.
- For unsuitable contexts, use a more appropriate available skill.
- Never claim to have used the skill without reading its SKILL.md.
