-- Supabase SQL: Run this in the SQL Editor of your Supabase project

-- Users table
create table users (
  id uuid primary key,
  nickname text not null,
  emoji text not null,
  room_id text not null,
  created_at timestamptz default now()
);

create index idx_users_room on users(room_id);

-- Checkins table
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  room_id text not null,
  date text not null, -- YYYY-MM-DD in Asia/Shanghai
  note text,
  created_at timestamptz default now()
);

-- Allow multiple checkins per day (no unique constraint on user+room+date)
create index idx_checkins_user_room_date on checkins(user_id, room_id, date);
create index idx_checkins_room on checkins(room_id);
create index idx_checkins_user on checkins(user_id);

-- Enable Row Level Security
alter table users enable row level security;
alter table checkins enable row level security;

-- Allow anonymous access (anon key)
create policy "Anyone can read users" on users for select using (true);
create policy "Anyone can insert users" on users for insert with check (true);
create policy "Anyone can read checkins" on checkins for select using (true);
create policy "Anyone can insert checkins" on checkins for insert with check (true);
create policy "Anyone can delete checkins" on checkins for delete using (true);
