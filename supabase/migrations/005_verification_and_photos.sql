-- Kenzim 3a-2: verification no longer uses ID uploads; news posts can have several photos.

-- A member may move their own status from 'new' to 'pending' (request verification).
-- Everything else about status still needs a verifier or a suspender.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if; -- SQL editor / service role
  if new.status is distinct from old.status
     and not ((old.status = 'new' and new.status = 'pending' and new.id = auth.uid())
              or public.has_permission('members.verify')
              or public.has_permission('identity.review')
              or public.has_permission('members.suspend')) then
    raise exception 'Not allowed to change status';
  end if;
  if new.is_senior_member is distinct from old.is_senior_member
     and not public.has_permission('roles.assign') then
    raise exception 'Not allowed to change the Trusted badge';
  end if;
  if new.paid_through is distinct from old.paid_through
     and not public.has_permission('dues.record') then
    raise exception 'Not allowed to change paid-through date';
  end if;
  return new;
end;
$$;

-- Several photos per news post
alter table public.news_posts add column image_paths text[] not null default '{}';
update public.news_posts set image_paths = array[image_path]
  where image_path is not null and image_paths = '{}';
