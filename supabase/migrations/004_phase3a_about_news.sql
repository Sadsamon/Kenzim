-- Kenzim Phase 3a: About Us, Chairman's letter, News feed with pop-ups.
-- Run in the Supabase SQL Editor. If the paste gets cut off, run it in two halves (split at the line marked PART 2).

create table public.about_page (
  id int primary key default 1 check (id = 1),
  history text not null default '',
  mission text not null default '',
  goals text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.chair_letters (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 150),
  body text not null check (char_length(body) between 10 and 8000),
  author_name text not null default 'The Chairperson',
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'admin' check (kind in ('admin','embassy','community')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  image_path text,
  pinned boolean not null default false,
  popup_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.popup_dismissals (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.news_posts(id) on delete cascade,
  primary key (user_id, post_id)
);

create index on public.news_posts (pinned desc, created_at desc);
create index on public.news_posts (popup_until);
create index on public.chair_letters (published_at desc);

alter table public.about_page enable row level security;
alter table public.chair_letters enable row level security;
alter table public.news_posts enable row level security;
alter table public.popup_dismissals enable row level security;

create policy about_read on public.about_page for select to authenticated using (true);
create policy about_update on public.about_page for update to authenticated
  using (public.has_permission('about.manage')) with check (public.has_permission('about.manage'));

create policy letters_read on public.chair_letters for select to authenticated using (true);
create policy letters_write on public.chair_letters for all to authenticated
  using (public.has_permission('about.manage')) with check (public.has_permission('about.manage'));

create policy news_read on public.news_posts for select to authenticated using (true);
create policy news_write on public.news_posts for all to authenticated
  using (public.has_permission('news.publish')) with check (public.has_permission('news.publish'));

create policy dismiss_own on public.popup_dismissals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- PART 2
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Starter text for the About page. The club should review and replace it in the app.
insert into public.about_page (id, history, mission, goals) values (
  1,
  E'Kenzim is the association of Kenyans living in, studying in and visiting Zimbabwe.\n\nThe 2026 to 2028 executive committee held its inaugural meeting in June 2026 and set out to build a closer, more active community, working hand in hand with the Kenyan Embassy in Harare.\n\n(The full history of the association will be added here by the executive.)',
  E'To give every Kenyan in Zimbabwe a true sense of belonging, a trusted place to connect, and support when they need it.',
  E'Grow an active, paid-up membership through personal outreach.\n\nRevive the Kenya Club as a monthly gathering at the embassy.\n\nHost family events such as an annual Fun Day.\n\nOffer Swahili lessons for children and support for Kenyan students.\n\nHelp newcomers settle in, with housing and job leads.\n\nPartner with the Kenyan Embassy on practical projects that benefit Kenyans here and back home.'
);
