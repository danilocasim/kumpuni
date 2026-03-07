# Supabase migrations

Run migrations **in order** (oldest first). The Supabase CLI applies them automatically in order when you run `supabase db push` or link and push.

## PostGIS required

Migrations from `20250307000003` onward use the **geography** type from PostGIS. Migration **20250307000001** enables PostGIS with:

```sql
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
```

If you see **"type geography does not exist"** when pushing:

1. **Enable PostGIS** on your project: Supabase Dashboard → **Database** → **Extensions** → search for **postgis** → Enable.
2. If the extension was created in a different schema (e.g. `public`), ensure migration `20250307000001` has been applied so that `extensions.geography` exists. You can run it manually in the SQL Editor:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
   ```

3. Then run `supabase db push` again (or re-apply the migration that failed).
