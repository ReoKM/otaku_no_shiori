-- W1タスク#3: 初期スキーマ + RLSポリシー
-- 参照仕様: docs/03_tech_stack.md データモデル草案 / RLS要件

create extension if not exists pgcrypto;

-- =========================================================
-- users (Supabase Auth の auth.users に紐づく公開プロフィール)
-- =========================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  auth_provider text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (id = auth.uid());

create policy "users_update_own"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- auth.users への新規登録時に public.users へ自動でプロフィール行を作る
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, auth_provider, display_name)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'provider', 'unknown'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at を自動更新する共通関数
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- shiori (しおり本体)
-- =========================================================
create table public.shiori (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  trip_type text not null check (trip_type in ('live', 'seichi', 'stage', 'other')),
  purpose text,
  cover text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shiori_user_id_idx on public.shiori (user_id);

alter table public.shiori enable row level security;

create trigger shiori_set_updated_at
  before update on public.shiori
  for each row execute function public.set_updated_at();

create policy "shiori_select_own"
  on public.shiori for select
  using (user_id = auth.uid());

create policy "shiori_insert_own"
  on public.shiori for insert
  with check (user_id = auth.uid());

create policy "shiori_update_own"
  on public.shiori for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "shiori_delete_own"
  on public.shiori for delete
  using (user_id = auth.uid());

-- =========================================================
-- packing_items (持ち物リスト: F2)
-- =========================================================
create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  shiori_id uuid not null references public.shiori (id) on delete cascade,
  label text not null,
  is_checked boolean not null default false,
  sort_order integer not null default 0
);

create index packing_items_shiori_id_idx on public.packing_items (shiori_id);

alter table public.packing_items enable row level security;

create policy "packing_items_select_own"
  on public.packing_items for select
  using (exists (
    select 1 from public.shiori s
    where s.id = packing_items.shiori_id and s.user_id = auth.uid()
  ));

create policy "packing_items_insert_own"
  on public.packing_items for insert
  with check (exists (
    select 1 from public.shiori s
    where s.id = packing_items.shiori_id and s.user_id = auth.uid()
  ));

create policy "packing_items_update_own"
  on public.packing_items for update
  using (exists (
    select 1 from public.shiori s
    where s.id = packing_items.shiori_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shiori s
    where s.id = packing_items.shiori_id and s.user_id = auth.uid()
  ));

create policy "packing_items_delete_own"
  on public.packing_items for delete
  using (exists (
    select 1 from public.shiori s
    where s.id = packing_items.shiori_id and s.user_id = auth.uid()
  ));

-- =========================================================
-- todos (TODOリスト: F3)
-- =========================================================
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  shiori_id uuid not null references public.shiori (id) on delete cascade,
  label text not null,
  due_date date,
  is_done boolean not null default false,
  sort_order integer not null default 0
);

create index todos_shiori_id_idx on public.todos (shiori_id);

alter table public.todos enable row level security;

create policy "todos_select_own"
  on public.todos for select
  using (exists (
    select 1 from public.shiori s
    where s.id = todos.shiori_id and s.user_id = auth.uid()
  ));

create policy "todos_insert_own"
  on public.todos for insert
  with check (exists (
    select 1 from public.shiori s
    where s.id = todos.shiori_id and s.user_id = auth.uid()
  ));

create policy "todos_update_own"
  on public.todos for update
  using (exists (
    select 1 from public.shiori s
    where s.id = todos.shiori_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shiori s
    where s.id = todos.shiori_id and s.user_id = auth.uid()
  ));

create policy "todos_delete_own"
  on public.todos for delete
  using (exists (
    select 1 from public.shiori s
    where s.id = todos.shiori_id and s.user_id = auth.uid()
  ));

-- =========================================================
-- itinerary_entries (旅程: F4)
-- =========================================================
create table public.itinerary_entries (
  id uuid primary key default gen_random_uuid(),
  shiori_id uuid not null references public.shiori (id) on delete cascade,
  day_date date not null,
  time time,
  title text not null,
  place_name text,
  memo text,
  sort_order integer not null default 0
);

create index itinerary_entries_shiori_id_idx on public.itinerary_entries (shiori_id);

alter table public.itinerary_entries enable row level security;

create policy "itinerary_entries_select_own"
  on public.itinerary_entries for select
  using (exists (
    select 1 from public.shiori s
    where s.id = itinerary_entries.shiori_id and s.user_id = auth.uid()
  ));

create policy "itinerary_entries_insert_own"
  on public.itinerary_entries for insert
  with check (exists (
    select 1 from public.shiori s
    where s.id = itinerary_entries.shiori_id and s.user_id = auth.uid()
  ));

create policy "itinerary_entries_update_own"
  on public.itinerary_entries for update
  using (exists (
    select 1 from public.shiori s
    where s.id = itinerary_entries.shiori_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shiori s
    where s.id = itinerary_entries.shiori_id and s.user_id = auth.uid()
  ));

create policy "itinerary_entries_delete_own"
  on public.itinerary_entries for delete
  using (exists (
    select 1 from public.shiori s
    where s.id = itinerary_entries.shiori_id and s.user_id = auth.uid()
  ));

-- =========================================================
-- spots (運営シード + UGCスポット: F5)
-- =========================================================
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  area text,
  source text not null default 'ugc' check (source in ('seed', 'ugc')),
  status text not null default 'private' check (status in ('private', 'pending', 'public')),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index spots_created_by_idx on public.spots (created_by);

alter table public.spots enable row level security;

-- 公開シード or 公開UGCは全員読み取り可
create policy "spots_select_public"
  on public.spots for select
  using (status = 'public' or source = 'seed');

-- 自分が作った非公開/申請中スポットは本人のみ読み取り可
create policy "spots_select_own"
  on public.spots for select
  using (created_by = auth.uid());

-- UGCスポットの新規作成は本人名義・private状態のみ
create policy "spots_insert_own_ugc"
  on public.spots for insert
  with check (
    created_by = auth.uid()
    and source = 'ugc'
    and status = 'private'
  );

create policy "spots_update_own"
  on public.spots for update
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and source = 'ugc'
    and status in ('private', 'pending')
  );

create policy "spots_delete_own"
  on public.spots for delete
  using (created_by = auth.uid());

-- =========================================================
-- shiori_spots (しおり内の行きたいスポット: F5)
-- =========================================================
create table public.shiori_spots (
  shiori_id uuid not null references public.shiori (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  memo text,
  is_visited boolean not null default false,
  primary key (shiori_id, spot_id)
);

alter table public.shiori_spots enable row level security;

create policy "shiori_spots_select_own"
  on public.shiori_spots for select
  using (exists (
    select 1 from public.shiori s
    where s.id = shiori_spots.shiori_id and s.user_id = auth.uid()
  ));

create policy "shiori_spots_insert_own"
  on public.shiori_spots for insert
  with check (exists (
    select 1 from public.shiori s
    where s.id = shiori_spots.shiori_id and s.user_id = auth.uid()
  ));

create policy "shiori_spots_update_own"
  on public.shiori_spots for update
  using (exists (
    select 1 from public.shiori s
    where s.id = shiori_spots.shiori_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shiori s
    where s.id = shiori_spots.shiori_id and s.user_id = auth.uid()
  ));

create policy "shiori_spots_delete_own"
  on public.shiori_spots for delete
  using (exists (
    select 1 from public.shiori s
    where s.id = shiori_spots.shiori_id and s.user_id = auth.uid()
  ));

-- =========================================================
-- photos (写真とログ: F6)
-- =========================================================
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  shiori_id uuid not null references public.shiori (id) on delete cascade,
  day_date date,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index photos_shiori_id_idx on public.photos (shiori_id);

alter table public.photos enable row level security;

create policy "photos_select_own"
  on public.photos for select
  using (exists (
    select 1 from public.shiori s
    where s.id = photos.shiori_id and s.user_id = auth.uid()
  ));

create policy "photos_insert_own"
  on public.photos for insert
  with check (exists (
    select 1 from public.shiori s
    where s.id = photos.shiori_id and s.user_id = auth.uid()
  ));

create policy "photos_update_own"
  on public.photos for update
  using (exists (
    select 1 from public.shiori s
    where s.id = photos.shiori_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shiori s
    where s.id = photos.shiori_id and s.user_id = auth.uid()
  ));

create policy "photos_delete_own"
  on public.photos for delete
  using (exists (
    select 1 from public.shiori s
    where s.id = photos.shiori_id and s.user_id = auth.uid()
  ));

-- =========================================================
-- Storage: 写真バケット(F6)
-- docs/03_tech_stack.md: Max File Size 2MB + 許可MIMEタイプを必ず制限(多層防御)
-- storage_path 規約: "{user_id}/{shiori_id}/{filename}"
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  2097152, -- 2MB
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_photos_select_own"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_photos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
