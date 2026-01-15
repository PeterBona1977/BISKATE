-- CMS (Content Management System) Schema
drop table if exists public.cms_media cascade;
drop table if exists public.cms_sections cascade;
drop table if exists public.cms_menus cascade;
drop table if exists public.cms_pages cascade;

-- CMS Pages
create table public.cms_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  content text,
  meta_title text,
  meta_description text,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

-- CMS Sections (reusable content blocks)
create table public.cms_sections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('hero', 'features', 'testimonials', 'cta', 'custom')),
  content jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CMS Menus
create table public.cms_menus (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text not null check (location in ('header', 'footer', 'sidebar')),
  items jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CMS Media (file uploads)
create table public.cms_media (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  url text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.cms_pages enable row level security;
alter table public.cms_sections enable row level security;
alter table public.cms_menus enable row level security;
alter table public.cms_media enable row level security;

-- Public can view published pages
create policy "Anyone can view published pages"
  on public.cms_pages
  for select
  using (is_published = true);

-- Admins can manage all CMS content
create policy "Admins can manage pages"
  on public.cms_pages
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can manage sections"
  on public.cms_sections
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can manage menus"
  on public.cms_menus
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can manage media"
  on public.cms_media
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Indexes
create index idx_cms_pages_slug on public.cms_pages(slug);
create index idx_cms_pages_published on public.cms_pages(is_published);
create index idx_cms_sections_type on public.cms_sections(type);
create index idx_cms_menus_location on public.cms_menus(location);

-- Insert sample data
insert into public.cms_pages (title, slug, content, meta_title, meta_description, is_published) values
('Sobre Nós', 'sobre', '<h1>Sobre o BISKATE</h1><p>A plataforma líder de freelancing em Portugal.</p>', 'Sobre Nós - BISKATE', 'Conheça a história do BISKATE', true),
('Termos de Serviço', 'termos', '<h1>Termos de Serviço</h1><p>Leia os nossos termos...</p>', 'Termos de Serviço', 'Termos e condições de uso', true);

insert into public.cms_sections (name, type, content, is_active) values
('Hero Principal', 'hero', '{"title": "Encontre o talento perfeito", "subtitle": "Milhares de freelancers prontos para ajudar"}'::jsonb, true),
('Funcionalidades', 'features', '{"items": [{"title": "Seguro", "description": "Pagamentos protegidos"}]}'::jsonb, true);

insert into public.cms_menus (name, location, items, is_active) values
('Menu Principal', 'header', '[{"label": "Início", "url": "/"}, {"label": "Sobre", "url": "/sobre"}]'::jsonb, true);
