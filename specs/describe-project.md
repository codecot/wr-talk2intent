# Describe this project

Analyze the codebase and create `PROJECT.md` at the repo root with the
following sections, in this order:

1. **What this project does** — 2-3 sentences, no fluff.
2. **Main technologies** — stack, frameworks, runtimes.
3. **Project structure** — key folders and their purpose (bullet list).
4. **How to run locally** — exact commands to clone, install, run the dev loop.
5. **How to deploy** — if there's a deploy story, describe it; if there isn't, say so.
6. **Key external dependencies** — APIs, services, databases the project talks to.

Also create or update `_project.yml` at the repo root with factory-friendly
metadata:

```yaml
slug: <project-slug>                  # matches the GitHub repo name
kind: web-app | cli | library | bot | other
primary_language: typescript | python | ...
frameworks: [list]
runtimes: [node20, python3.11, ...]
external_services: [github, cloudflare, stripe, ...]
entry_points:
  dev: "npm run dev"                  # or what applies
  build: "npm run build"
  test: "npm test"
deploy:
  target: cloudflare-pages | vercel | self-hosted | none
  docs: "where the deploy story is documented"
```

Only fill in fields you can verify from the code. Leave a field out rather
than guessing. Keep the file under 40 lines.

Do not touch any other files. Do not add CI, do not restructure the repo.
If `PROJECT.md` already exists, rewrite it to match this structure; do not
append.
