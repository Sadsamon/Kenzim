-- Kenzim Phase 3c: Places to visit (attractions, restaurants, parks, malls, hotels, hospitals, schools).
-- Run in the Supabase SQL Editor. If the paste gets cut off, run it in two halves (split at PART 2).

create table public.places (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('attraction','restaurant','park','mall','hotel','hospital','school','other')),
  country text not null check (country in ('ZW','KE')),
  name text not null check (char_length(name) between 2 and 100),
  city text check (char_length(city) <= 80),
  description text check (char_length(description) <= 2000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  phone text check (char_length(phone) <= 30),
  website text check (char_length(website) <= 200),
  photo_paths text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.places (country, kind);

alter table public.places enable row level security;
create policy places_read on public.places for select to authenticated using (true);
create policy places_write on public.places for all to authenticated
  using (public.has_permission('places.manage')) with check (public.has_permission('places.manage'));

-- PART 2
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Starter attractions. Pins are approximate: the Tourist Guide can move or correct any of them in the app.
insert into public.places (kind, country, name, city, description, lat, lng) values
  ('attraction','ZW','Victoria Falls','Victoria Falls','One of the largest waterfalls in the world, known locally as Mosi-oa-Tunya, "the smoke that thunders". A UNESCO World Heritage Site shared with Zambia.',-17.9243,25.8572),
  ('attraction','ZW','Great Zimbabwe','Masvingo','The ruins of a large medieval stone city that gave the country its name. A UNESCO World Heritage Site.',-20.2675,30.9333),
  ('attraction','ZW','Hwange National Park','Hwange','Zimbabwe''s largest national park, famous for its elephants and wide variety of wildlife.',-18.9667,26.5),
  ('attraction','ZW','Matobo Hills','Bulawayo','Rounded granite hills, balancing rocks and ancient rock paintings south of Bulawayo. A UNESCO World Heritage Site.',-20.5,28.5),
  ('attraction','ZW','Mana Pools','Zambezi Valley','A wild stretch of the Zambezi floodplain where visitors can walk among wildlife. A UNESCO World Heritage Site.',-15.75,29.4),
  ('attraction','ZW','Lake Kariba','Kariba','One of the largest man-made lakes in the world, loved for houseboats, fishing and sunsets.',-16.52,28.8),
  ('attraction','ZW','Nyanga National Park','Nyanga','Cool highlands in the east with waterfalls, hiking trails and Mount Nyangani.',-18.3,32.75),
  ('attraction','ZW','Khami Ruins','Bulawayo','Stone ruins of a former capital near Bulawayo. A UNESCO World Heritage Site.',-20.17,28.37),
  ('attraction','ZW','Bvumba Highlands','Mutare','Misty mountain gardens and forests above Mutare, popular for walks and birdwatching.',-19.1,32.75),
  ('attraction','KE','Maasai Mara National Reserve','Narok','Kenya''s most famous wildlife reserve and the stage for the annual wildebeest migration.',-1.5,35.15),
  ('attraction','KE','Mount Kenya','Central Kenya','Africa''s second highest mountain, with glaciers, forests and trekking routes. A UNESCO World Heritage Site.',-0.1521,37.3084),
  ('attraction','KE','Amboseli National Park','Kajiado','Large elephant herds with Mount Kilimanjaro rising behind them.',-2.65,37.25),
  ('attraction','KE','Nairobi National Park','Nairobi','Wildlife with the city skyline in view, only minutes from the centre of Nairobi.',-1.3733,36.8583),
  ('attraction','KE','Diani Beach','Diani','Long white sand beach and warm Indian Ocean waters on the south coast.',-4.28,39.59),
  ('attraction','KE','Fort Jesus','Mombasa','A 16th century fort overlooking Mombasa harbour. A UNESCO World Heritage Site.',-4.0627,39.6796),
  ('attraction','KE','Lamu Old Town','Lamu','A centuries-old Swahili settlement of narrow streets and coral stone houses. A UNESCO World Heritage Site.',-2.27,40.9);
