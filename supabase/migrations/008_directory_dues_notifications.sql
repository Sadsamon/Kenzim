-- Kenzim Phase 4: member interests, dues, settings, in-app notifications.
-- Run in the Supabase SQL Editor. If the paste gets cut off, run it in three parts (split at PART 2 and PART 3).

create table public.interests (
  id serial primary key,
  name text not null unique
);
create table public.member_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id int not null references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'general',
  title text not null,
  body text,
  link text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, dedupe_key)
);
create index on public.notifications (user_id, created_at desc);

create table public.dues_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  member_name text not null,
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  method text not null check (method in ('cash','ecocash','bank','other')),
  months_covered int not null default 1 check (months_covered between 1 and 36),
  period_start date not null,
  period_end date not null,
  note text check (char_length(note) <= 200),
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete set null,
  void_reason text check (char_length(void_reason) <= 200)
);
create index on public.dues_payments (member_id, recorded_at desc);

alter table public.interests enable row level security;
alter table public.member_interests enable row level security;
alter table public.app_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.dues_payments enable row level security;

create policy interests_read on public.interests for select to authenticated using (true);
create policy mi_own on public.member_interests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy settings_read on public.app_settings for select to authenticated using (true);
create policy settings_write on public.app_settings for all to authenticated
  using (public.has_permission('dues.configure')) with check (public.has_permission('dues.configure'));
create policy notif_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy dues_read on public.dues_payments for select to authenticated
  using (member_id = auth.uid() or public.has_permission('dues.view'));
-- No insert/update/delete policies on dues_payments: every change goes through the two functions below.

-- PART 2
create or replace function public.recompute_paid_through(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set paid_through = (select max(period_end) from public.dues_payments where member_id = p_member and voided_at is null)
  where id = p_member;
end;
$$;

create or replace function public.record_dues_payment(p_member uuid, p_amount numeric, p_method text, p_months int, p_note text)
returns date
language plpgsql security definer set search_path = public as $$
declare
  v_name text; v_pt date; v_start date; v_end date;
  v_today date := (now() at time zone 'Africa/Harare')::date;
begin
  if not public.has_permission('dues.record') then raise exception 'Not allowed'; end if;
  select full_name, paid_through into v_name, v_pt from public.profiles where id = p_member;
  if v_name is null then raise exception 'Member not found'; end if;
  v_start := case when v_pt is null or v_pt < v_today then v_today else v_pt + 1 end;
  v_end := (v_start + make_interval(months => p_months))::date - 1;

  insert into public.dues_payments (member_id, member_name, amount_usd, method, months_covered, period_start, period_end, note, recorded_by)
  values (p_member, v_name, p_amount, p_method, p_months, v_start, v_end, nullif(trim(p_note), ''), auth.uid());

  perform public.recompute_paid_through(p_member);

  insert into public.notifications (user_id, kind, title, body, link)
  values (p_member, 'dues', 'Payment received',
          'Thank you! Your dues are paid until ' || to_char(v_end, 'DD Mon YYYY') || '.', '/dues');
  insert into public.audit_log (actor_id, action, subject_id, detail)
  values (auth.uid(), 'dues.record', p_member, jsonb_build_object('amount', p_amount, 'months', p_months, 'method', p_method));
  return v_end;
end;
$$;

create or replace function public.void_dues_payment(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_member uuid;
begin
  if not public.has_permission('dues.record') then raise exception 'Not allowed'; end if;
  update public.dues_payments
  set voided_at = now(), voided_by = auth.uid(), void_reason = nullif(trim(p_reason), '')
  where id = p_id and voided_at is null
  returning member_id into v_member;
  if not found then raise exception 'Payment not found or already voided'; end if;
  if v_member is not null then perform public.recompute_paid_through(v_member); end if;
  insert into public.audit_log (actor_id, action, subject_id, detail)
  values (auth.uid(), 'dues.void', v_member, jsonb_build_object('payment', p_id));
end;
$$;

-- PART 3
insert into public.interests (name) values
  ('Football'), ('Music'), ('Faith and church'), ('Business and networking'), ('Farming'),
  ('Technology'), ('Travel'), ('Cooking'), ('Fitness'), ('Youth and students'),
  ('Women in community'), ('Volunteering'), ('Arts and culture');
