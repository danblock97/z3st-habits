# Z3st Habits

## Getting Started

```bash
pnpm install
pnpm dev
```

The app boots at [http://localhost:3000](http://localhost:3000). Edits to anything in `app/` hot reload automatically.

## Generating Supabase Types

We keep the generated types in `types/supabase.ts`. The script targets the hosted Supabase project so you always get the latest schema.

1. Export the project id you want to target:
   ```bash
   export SUPABASE_PROJECT_ID=your-project-id
   ```
2. Authenticate the CLI (`pnpm dlx supabase login`) **or** set `SUPABASE_ACCESS_TOKEN`.
3. Run the generator:
   ```bash
   pnpm gen:db:types
   ```

The command will create `types/` if it is missing and write fresh definitions to `types/supabase.ts`. TypeScript consumers can then import from `~/types/supabase` without additional setup.

> Tip: add the command to CI once Supabase credentials are available so schema drift is caught early.

## Migrations

Database migrations live in `migrations/` and are ignored by Git so you can keep local experiments without polluting the repo.
