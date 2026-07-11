-- Security: "profiles: update own" had no WITH CHECK, letting a user set
-- is_admin=true on their own row. Column-level grants: authenticated users
-- may update only their display name; is_admin/email are service-role only.
revoke update on table public.profiles from authenticated, anon;
grant update (name) on table public.profiles to authenticated;
