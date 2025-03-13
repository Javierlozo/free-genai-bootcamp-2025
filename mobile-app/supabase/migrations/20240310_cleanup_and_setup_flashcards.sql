-- Drop existing tables (if they exist)
drop table if exists recipes cascade;
drop table if exists ingredients cascade;
drop table if exists recipe_ingredients cascade;
drop table if exists profiles cascade;

-- Create flashcards table
create table if not exists public.flashcards (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    word text not null,
    images text[] not null,
    last_reviewed timestamp with time zone,
    review_count integer default 0 not null
);

-- Create a function to increment review count
create or replace function increment_review_count()
returns integer
language sql
as $$
    select review_count + 1
    from flashcards
    where id = current_setting('flashcards.id')::uuid
$$;

-- Set up Row Level Security (RLS)
alter table public.flashcards enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.flashcards
    for select
    using (true);

create policy "Enable insert access for all users" on public.flashcards
    for insert
    with check (true);

create policy "Enable update access for all users" on public.flashcards
    for update
    using (true);

create policy "Enable delete access for all users" on public.flashcards
    for delete
    using (true); 