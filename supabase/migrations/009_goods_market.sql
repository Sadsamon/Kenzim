-- Kenzim Phase 5a: Marketplace for imported goods (catalog, cart, orders, fees).
-- Run in the Supabase SQL Editor. If the paste gets cut off, run it in three parts (split at PART 2 and PART 3).

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 60),
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id),
  name text not null check (char_length(name) between 2 and 120),
  category text check (char_length(category) <= 40),
  description text check (char_length(description) <= 1000),
  image_path text,
  price_kes numeric(12,2) not null check (price_kes >= 0),
  weight_kg numeric(8,3) check (weight_kg is null or weight_kg >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.products (active, retailer_id);

create table public.fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  kind text not null check (kind in ('percent_of_subtotal','flat_per_order','per_kg')),
  value numeric(10,4) not null check (value >= 0),
  active boolean not null default true
);

create table public.goods_orders (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  member_name text not null,
  kes_per_usd numeric(10,4) not null,
  subtotal_usd numeric(12,2) not null,
  fees_usd numeric(12,2) not null,
  total_usd numeric(12,2) not null,
  status text not null default 'placed'
    check (status in ('placed','paid','ordered','in_transit','ready_for_collection','collected','cancelled')),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.goods_orders (member_id, created_at desc);
create index on public.goods_orders (status, created_at);

create table public.goods_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.goods_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_snapshot text not null,
  price_kes_snapshot numeric(12,2) not null,
  qty int not null check (qty between 1 and 100),
  line_usd numeric(12,2) not null
);
create table public.goods_order_fees (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.goods_orders(id) on delete cascade,
  name text not null,
  amount_usd numeric(12,2) not null
);

alter table public.retailers enable row level security;
alter table public.products enable row level security;
alter table public.fee_rules enable row level security;
alter table public.goods_orders enable row level security;
alter table public.goods_order_items enable row level security;
alter table public.goods_order_fees enable row level security;

create policy retailers_read on public.retailers for select to authenticated using (true);
create policy retailers_write on public.retailers for all to authenticated
  using (public.has_permission('catalog.manage')) with check (public.has_permission('catalog.manage'));
create policy products_read on public.products for select to authenticated using (true);
create policy products_write on public.products for all to authenticated
  using (public.has_permission('catalog.manage')) with check (public.has_permission('catalog.manage'));
create policy fees_read on public.fee_rules for select to authenticated
  using (public.has_permission('catalog.manage') or public.has_permission('orders.manage'));
create policy fees_write on public.fee_rules for all to authenticated
  using (public.has_permission('catalog.manage')) with check (public.has_permission('catalog.manage'));

create policy orders_read on public.goods_orders for select to authenticated
  using (member_id = auth.uid() or public.has_permission('orders.manage'));
create policy order_items_read on public.goods_order_items for select to authenticated
  using (exists (select 1 from public.goods_orders o where o.id = order_id
         and (o.member_id = auth.uid() or public.has_permission('orders.manage'))));
create policy order_fees_read on public.goods_order_fees for select to authenticated
  using (exists (select 1 from public.goods_orders o where o.id = order_id
         and (o.member_id = auth.uid() or public.has_permission('orders.manage'))));
-- No insert/update/delete policies on the order tables: orders are created and changed only by the functions below.

-- Treasurers and catalog managers may set the exchange rate and collection point
create policy settings_market on public.app_settings for all to authenticated
  using (public.has_permission('catalog.manage') and key in ('kes_per_usd','collection_point'))
  with check (public.has_permission('catalog.manage') and key in ('kes_per_usd','collection_point'));

-- PART 2
create or replace function public.quote_order(p_items jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_rate numeric; v_kes numeric := 0; v_weight numeric := 0; v_sub numeric;
  v_lines jsonb := '[]'::jsonb; v_fees jsonb := '[]'::jsonb; v_fee_total numeric := 0;
  it record; pr record; fr record; v_amt numeric;
begin
  if not public.is_verified() then raise exception 'Only verified members can order'; end if;
  select (value #>> '{}')::numeric into v_rate from public.app_settings where key = 'kes_per_usd';
  if v_rate is null or v_rate <= 0 then raise exception 'Prices are not set up yet. Please ask the Treasurer.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'Too many items in one order'; end if;

  for it in
    select (e->>'id')::uuid as id, sum((e->>'qty')::int) as qty
    from jsonb_array_elements(p_items) e group by 1
  loop
    if it.qty is null or it.qty < 1 or it.qty > 100 then raise exception 'Invalid quantity'; end if;
    select p.id, p.name, p.price_kes, p.weight_kg into pr from public.products p
      join public.retailers r on r.id = p.retailer_id
      where p.id = it.id and p.active and r.active;
    if pr.id is null then raise exception 'One of the items is no longer available'; end if;
    v_kes := v_kes + pr.price_kes * it.qty;
    v_weight := v_weight + coalesce(pr.weight_kg, 0) * it.qty;
    v_lines := v_lines || jsonb_build_object(
      'id', pr.id, 'name', pr.name, 'qty', it.qty, 'price_kes', pr.price_kes,
      'line_usd', round(pr.price_kes * it.qty / v_rate, 2));
  end loop;

  v_sub := round(v_kes / v_rate, 2);
  for fr in select name, kind, value from public.fee_rules where active order by name loop
    v_amt := case fr.kind
      when 'percent_of_subtotal' then round(v_sub * fr.value / 100, 2)
      when 'flat_per_order' then round(fr.value, 2)
      else round(fr.value * v_weight, 2) end;
    if v_amt > 0 then
      v_fees := v_fees || jsonb_build_object('name', fr.name, 'amount_usd', v_amt);
      v_fee_total := v_fee_total + v_amt;
    end if;
  end loop;

  return jsonb_build_object('rate', v_rate, 'subtotal_kes', v_kes, 'subtotal_usd', v_sub,
    'fees', v_fees, 'fees_usd', v_fee_total, 'total_usd', v_sub + v_fee_total, 'lines', v_lines);
end;
$$;

create or replace function public.place_order(p_items jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare q jsonb; v_id uuid; v_name text; l jsonb; f jsonb;
begin
  q := public.quote_order(p_items);
  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.goods_orders (member_id, member_name, kes_per_usd, subtotal_usd, fees_usd, total_usd)
  values (auth.uid(), v_name, (q->>'rate')::numeric, (q->>'subtotal_usd')::numeric, (q->>'fees_usd')::numeric, (q->>'total_usd')::numeric)
  returning id into v_id;
  for l in select * from jsonb_array_elements(q->'lines') loop
    insert into public.goods_order_items (order_id, product_id, name_snapshot, price_kes_snapshot, qty, line_usd)
    values (v_id, (l->>'id')::uuid, l->>'name', (l->>'price_kes')::numeric, (l->>'qty')::int, (l->>'line_usd')::numeric);
  end loop;
  for f in select * from jsonb_array_elements(q->'fees') loop
    insert into public.goods_order_fees (order_id, name, amount_usd) values (v_id, f->>'name', (f->>'amount_usd')::numeric);
  end loop;
  insert into public.notifications (user_id, kind, title, body, link)
  values (auth.uid(), 'order', 'Order placed',
          'Your order total is $' || to_char((q->>'total_usd')::numeric, 'FM999990.00') || '. Pay the Treasurer to confirm it.', '/market/orders/' || v_id);
  return v_id;
end;
$$;

create or replace function public.cancel_order(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.goods_orders set status = 'cancelled'
  where id = p_id and member_id = auth.uid() and status = 'placed';
  if not found then raise exception 'This order can no longer be cancelled'; end if;
end;
$$;

create or replace function public.set_order_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old text; v_member uuid;
  seq text[] := array['placed','paid','ordered','in_transit','ready_for_collection','collected'];
  v_body text;
begin
  if not public.has_permission('orders.manage') then raise exception 'Not allowed'; end if;
  select status, member_id into v_old, v_member from public.goods_orders where id = p_id;
  if v_old is null then raise exception 'Order not found'; end if;
  if v_old in ('collected','cancelled') then raise exception 'This order is already finished'; end if;
  if p_status <> 'cancelled' then
    if array_position(seq, p_status) is null then raise exception 'Unknown status'; end if;
    if array_position(seq, p_status) <= array_position(seq, v_old) then raise exception 'Choose a later step'; end if;
  end if;
  update public.goods_orders
  set status = p_status,
      paid_at = case when p_status = 'paid' then now() else paid_at end,
      paid_by = case when p_status = 'paid' then auth.uid() else paid_by end
  where id = p_id;
  v_body := case p_status
    when 'paid' then 'We have received your payment. Thank you!'
    when 'ordered' then 'Your items have been ordered.'
    when 'in_transit' then 'Your order is on its way to Zimbabwe.'
    when 'ready_for_collection' then 'Your order is ready. Please collect it at the collection point.'
    when 'collected' then 'Your order was collected. Enjoy!'
    else 'Your order was cancelled.' end;
  if v_member is not null then
    insert into public.notifications (user_id, kind, title, body, link)
    values (v_member, 'order', 'Order update', v_body, '/market/orders/' || p_id);
  end if;
  insert into public.audit_log (actor_id, action, subject_id, detail)
  values (auth.uid(), 'order.' || p_status, v_member, jsonb_build_object('order', p_id));
end;
$$;

-- PART 3
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

insert into public.retailers (name) values ('Quickmart'), ('Naivas')
on conflict (name) do nothing;
