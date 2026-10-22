-- Lets an admin delete a member account. History stays, but no longer points at the deleted person.
alter table public.audit_log drop constraint audit_log_actor_id_fkey,
  add constraint audit_log_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null;
alter table public.identity_submissions drop constraint identity_submissions_reviewed_by_fkey,
  add constraint identity_submissions_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null;
alter table public.user_roles drop constraint user_roles_granted_by_fkey,
  add constraint user_roles_granted_by_fkey foreign key (granted_by) references public.profiles(id) on delete set null;
