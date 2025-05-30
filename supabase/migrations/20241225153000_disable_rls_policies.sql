-- migration: disable all rls policies for flashcard application
-- purpose: remove all row level security policies from flashcards, generations, and generation_error_logs tables
-- affected tables: flashcards, generations, generation_error_logs

-- drop rls policies for generations table
drop policy if exists "authenticated users can view own generations" on public.generations;
drop policy if exists "anonymous users can view own generations" on public.generations;
drop policy if exists "authenticated users can create own generations" on public.generations;
drop policy if exists "anonymous users can create own generations" on public.generations;
drop policy if exists "authenticated users can update own generations" on public.generations;
drop policy if exists "anonymous users can update own generations" on public.generations;
drop policy if exists "authenticated users can delete own generations" on public.generations;
drop policy if exists "anonymous users can delete own generations" on public.generations;

-- drop rls policies for flashcards table
drop policy if exists "authenticated users can view own flashcards" on public.flashcards;
drop policy if exists "anonymous users can view own flashcards" on public.flashcards;
drop policy if exists "authenticated users can create own flashcards" on public.flashcards;
drop policy if exists "anonymous users can create own flashcards" on public.flashcards;
drop policy if exists "authenticated users can update own flashcards" on public.flashcards;
drop policy if exists "anonymous users can update own flashcards" on public.flashcards;
drop policy if exists "authenticated users can delete own flashcards" on public.flashcards;
drop policy if exists "anonymous users can delete own flashcards" on public.flashcards;

-- drop rls policies for generation_error_logs table
drop policy if exists "authenticated users can view own generation errors" on public.generation_error_logs;
drop policy if exists "anonymous users can view own generation errors" on public.generation_error_logs;
drop policy if exists "authenticated users can create own generation errors" on public.generation_error_logs;
drop policy if exists "anonymous users can create own generation errors" on public.generation_error_logs;
drop policy if exists "authenticated users can delete own generation errors" on public.generation_error_logs;
drop policy if exists "anonymous users can delete own generation errors" on public.generation_error_logs;