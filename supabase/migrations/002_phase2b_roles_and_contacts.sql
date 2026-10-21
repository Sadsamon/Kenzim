-- Kenzim Phase 2b. Run once in the Supabase SQL Editor (it is short, so paste it in one go).

-- One emergency contact of each kind per member
alter table public.emergency_contacts
  add constraint emergency_one_per_kind unique (user_id, kind);

-- New permissions for the About page, Chairman's letter and event photos
insert into public.permissions (key, description) values
  ('about.manage', 'Edit About Us and the Chairman''s letter'),
  ('gallery.manage', 'Manage event photos');

-- Roles that match the executive offices
insert into public.roles (key, name, is_system) values
  ('communications', 'Communications (PR)', true),
  ('organising_secretary', 'Organising Secretary', true),
  ('membership_secretary', 'Membership & Fundraising Secretary', true);

insert into public.role_permissions (role_id, permission_key)
select r.id, p.k from public.roles r
join (values
  ('communications','news.publish'), ('communications','about.manage'), ('communications','gallery.manage'),
  ('organising_secretary','events.manage'), ('organising_secretary','gallery.manage'),
  ('membership_secretary','members.verify'), ('membership_secretary','dues.view'),
  ('secretary','about.manage'), ('secretary','gallery.manage')
) as p(role_key, k) on p.role_key = r.key;
