-- Supabase SQL: Run this in the SQL Editor of your Supabase project

-- Users table
create table users (
  id uuid primary key,
  nickname text not null,
  emoji text not null,
  room_id text not null,
  recovery_code text not null,
  avatar_url text, -- 上传头像压缩后的 base64，为空则前端展示 emoji
  created_at timestamptz default now()
);

create index idx_users_room on users(room_id);
create unique index idx_users_room_recovery_code on users(room_id, recovery_code);

-- Checkins table
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  room_id text not null,
  date text not null, -- YYYY-MM-DD in Asia/Shanghai
  note text,
  is_makeup boolean not null default false, -- 是否为补卡（每周限 1 次，前端校验）
  rarity text, -- 稀有掉落：alien / diamond / rainbow / gold / silver，普通打卡为 null；补卡不参与掉落
  reward_claimed boolean not null default false, -- 实物奖券是否已兑换
  cancelled boolean not null default false, -- 已撤回。软删除，保留记录才能统计撤回次数
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
create policy "Anyone can update users" on users for update using (true); -- 修改昵称，缺这条更新会静默命中 0 行
create policy "Anyone can read checkins" on checkins for select using (true);
create policy "Anyone can insert checkins" on checkins for insert with check (true);
create policy "Anyone can update checkins" on checkins for update using (true); -- 奖券核销，缺这条更新会静默命中 0 行
create policy "Anyone can delete checkins" on checkins for delete using (true);
