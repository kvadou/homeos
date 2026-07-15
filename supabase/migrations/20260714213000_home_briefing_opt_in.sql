-- Home Briefing is optional. New households must explicitly enable it in Settings.
alter table public.notification_preferences
  alter column weekly_digest set default false;

comment on column public.notification_preferences.weekly_digest is
  'Explicit opt-in for the Monday Home Briefing email.';
