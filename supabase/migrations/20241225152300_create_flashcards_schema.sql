-- migration: create flashcard application schema
-- purpose: establish the core database structure for a flashcard application with ai generation tracking
-- affected tables: flashcards, generations, generation_error_logs
-- special considerations: implements ai generation tracking, error logging, and row level security

-- enable required extensions
create extension if not exists pgcrypto;

-- create trigger function for automatic timestamp updates
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create generations table
-- tracks ai generation sessions with metrics and performance data
create table public.generations (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    generated_count int4 not null default 0,
    accepted_unedited_count int4 not null default 0,
    accepted_edited_count int4 not null default 0,
    source_text_hash varchar not null,
    source_text_length int4 not null,
    generation_duration int4, -- duration in milliseconds or seconds
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- validation constraints
    constraint check_generated_count_positive check (generated_count >= 0),
    constraint check_accepted_counts_positive check (accepted_unedited_count >= 0 and accepted_edited_count >= 0),
    constraint check_source_text_length_positive check (source_text_length > 0),
    constraint check_generation_duration_positive check (generation_duration is null or generation_duration >= 0)
);

-- create flashcards table
-- stores individual flashcards linked to generation sessions
create table public.flashcards (
    id bigserial primary key,
    front varchar(500) not null,
    back varchar(500) not null,
    source varchar not null,
    generation_id bigint references public.generations(id) on delete set null,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- validation constraints
    constraint check_front_length check (char_length(front) > 0 and char_length(front) <= 500),
    constraint check_back_length check (char_length(back) > 0 and char_length(back) <= 500),
    constraint check_source_length check (char_length(source) > 0)
);

-- create generation error logs table
-- tracks errors that occur during ai generation processes
create table public.generation_error_logs (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    source_text_hash varchar not null,
    source_text_length int4 not null,
    error_code varchar not null,
    error_message text not null,
    created_at timestamptz not null default now(),

    -- validation constraints
    constraint check_source_text_length_positive_errors check (source_text_length > 0),
    constraint check_error_code_not_empty check (char_length(error_code) > 0),
    constraint check_error_message_not_empty check (char_length(error_message) > 0)
);

-- create triggers for automatic updated_at timestamp management
create trigger set_generations_timestamp
before update on public.generations
for each row
execute function public.trigger_set_timestamp();

create trigger set_flashcards_timestamp
before update on public.flashcards
for each row
execute function public.trigger_set_timestamp();

-- create performance indexes
-- indexes for generations table
create index idx_generations_user_id on public.generations(user_id);
create index idx_generations_user_id_created_at on public.generations(user_id, created_at desc);
create index idx_generations_source_text_hash on public.generations(source_text_hash);

-- indexes for flashcards table
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_generation_id on public.flashcards(generation_id);
create index idx_flashcards_user_id_created_at on public.flashcards(user_id, created_at desc);

-- indexes for generation_error_logs table
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);
create index idx_generation_error_logs_user_id_created_at on public.generation_error_logs(user_id, created_at desc);
create index idx_generation_error_logs_source_text_hash on public.generation_error_logs(source_text_hash);

-- enable row level security for all tables
alter table public.generations enable row level security;
alter table public.flashcards enable row level security;
alter table public.generation_error_logs enable row level security;

-- rls policies for generations table
create policy "authenticated users can view own generations"
on public.generations
for select
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can view own generations"
on public.generations
for select
to anon
using (auth.uid() = user_id);

create policy "authenticated users can create own generations"
on public.generations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "anonymous users can create own generations"
on public.generations
for insert
to anon
with check (auth.uid() = user_id);

create policy "authenticated users can update own generations"
on public.generations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "anonymous users can update own generations"
on public.generations
for update
to anon
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users can delete own generations"
on public.generations
for delete
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can delete own generations"
on public.generations
for delete
to anon
using (auth.uid() = user_id);

-- rls policies for flashcards table
create policy "authenticated users can view own flashcards"
on public.flashcards
for select
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can view own flashcards"
on public.flashcards
for select
to anon
using (auth.uid() = user_id);

create policy "authenticated users can create own flashcards"
on public.flashcards
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "anonymous users can create own flashcards"
on public.flashcards
for insert
to anon
with check (auth.uid() = user_id);

create policy "authenticated users can update own flashcards"
on public.flashcards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "anonymous users can update own flashcards"
on public.flashcards
for update
to anon
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users can delete own flashcards"
on public.flashcards
for delete
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can delete own flashcards"
on public.flashcards
for delete
to anon
using (auth.uid() = user_id);

-- rls policies for generation_error_logs table
create policy "authenticated users can view own generation errors"
on public.generation_error_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can view own generation errors"
on public.generation_error_logs
for select
to anon
using (auth.uid() = user_id);

create policy "authenticated users can create own generation errors"
on public.generation_error_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "anonymous users can create own generation errors"
on public.generation_error_logs
for insert
to anon
with check (auth.uid() = user_id);

create policy "authenticated users can delete own generation errors"
on public.generation_error_logs
for delete
to authenticated
using (auth.uid() = user_id);

create policy "anonymous users can delete own generation errors"
on public.generation_error_logs
for delete
to anon
using (auth.uid() = user_id); 