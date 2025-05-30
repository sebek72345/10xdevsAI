### 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

Supabase automatycznie tworzy tabelę `auth.users` w schemacie `auth`. Dla celów aplikacji będziemy odnosić się do niej. Kluczowe kolumny w `auth.users` to:
- `id` (uuid, Primary Key) - ID użytkownika
- `email` (text) - Email użytkownika
- `encrypted_password` (text) - Zahaszowane hasło użytkownika
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Rozszerzenie `pgcrypto` jest wymagane dla funkcji `gen_random_uuid()`, jeśli byłaby używana; migracja włącza je poleceniem `CREATE EXTENSION IF NOT EXISTS pgcrypto;`. Supabase domyślnie je udostępnia.

#### Tabela: `public.generations`

Przechowuje informacje o sesjach generowania fiszek przez AI, w tym metryki i dane dotyczące wydajności.

```sql
CREATE TABLE public.generations (
    id bigserial PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR NOT NULL,
    generated_count INT4 NOT NULL DEFAULT 0,
    accepted_unedited_count INT4 NOT NULL DEFAULT 0,
    accepted_edited_count INT4 NOT NULL DEFAULT 0,
    source_text_hash VARCHAR NOT NULL,
    source_text_length INT4 NOT NULL,
    generation_duration INT4, -- Czas trwania w milisekundach lub sekundach
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT check_generated_count_positive CHECK (generated_count >= 0),
    CONSTRAINT check_accepted_counts_positive CHECK (accepted_unedited_count >= 0 AND accepted_edited_count >= 0),
    CONSTRAINT check_source_text_length_positive CHECK (source_text_length > 0),
    CONSTRAINT check_generation_duration_positive CHECK (generation_duration IS NULL OR generation_duration >= 0)
);
```

#### Tabela: `public.flashcards`

Przechowuje wszystkie fiszki, powiązane z sesjami generowania lub stworzone manualnie (choć obecny schemat nie rozróżnia typów w ten sposób).

```sql
CREATE TABLE public.flashcards (
    id bigserial PRIMARY KEY,
    front VARCHAR(500) NOT NULL,
    back VARCHAR(500) NOT NULL,
    source VARCHAR NOT NULL,
    generation_id BIGINT REFERENCES public.generations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT check_front_length CHECK (char_length(front) > 0 AND char_length(front) <= 500),
    CONSTRAINT check_back_length CHECK (char_length(back) > 0 AND char_length(back) <= 500),
    CONSTRAINT check_source_length CHECK (char_length(source) > 0)
);
```

#### Tabela: `public.generation_error_logs`

Przechowuje logi błędów, które wystąpiły podczas procesów generowania fiszek przez AI.

```sql
CREATE TABLE public.generation_error_logs (
    id bigserial PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR NOT NULL,
    source_text_hash VARCHAR NOT NULL,
    source_text_length INT4 NOT NULL,
    error_code VARCHAR NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT check_source_text_length_positive_errors CHECK (source_text_length > 0),
    CONSTRAINT check_error_code_not_empty CHECK (char_length(error_code) > 0),
    CONSTRAINT check_error_message_not_empty CHECK (char_length(error_message) > 0)
);
```

Automatyczne aktualizowanie `updated_at`:
```sql
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_generations_timestamp
BEFORE UPDATE ON public.generations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_flashcards_timestamp
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
```
(Uwaga: Trigger `trigger_set_timestamp` nie jest stosowany do tabeli `generation_error_logs` w migracji).

### 2. Relacje między tabelami

-   **`auth.users` (1) -> (N) `public.generations`**: Jeden użytkownik może mieć wiele sesji generowania. Relacja zaimplementowana przez `generations.user_id` jako klucz obcy wskazujący na `auth.users.id` (`ON DELETE CASCADE`).
-   **`auth.users` (1) -> (N) `public.flashcards`**: Jeden użytkownik może mieć wiele fiszek. Relacja zaimplementowana przez `flashcards.user_id` jako klucz obcy wskazujący na `auth.users.id` (`ON DELETE CASCADE`).
-   **`public.generations` (1) -> (N) `public.flashcards`**: Jedna sesja generowania może dać wiele fiszek. Relacja zaimplementowana przez `flashcards.generation_id` jako klucz obcy wskazujący na `public.generations.id` (`ON DELETE SET NULL`).
-   **`auth.users` (1) -> (N) `public.generation_error_logs`**: Jeden użytkownik może mieć wiele logów błędów generowania. Relacja zaimplementowana przez `generation_error_logs.user_id` jako klucz obcy wskazujący na `auth.users.id` (`ON DELETE CASCADE`).

### 3. Indeksy

```sql
-- Indeksy dla tabeli generations
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_user_id_created_at ON public.generations(user_id, created_at DESC);
CREATE INDEX idx_generations_source_text_hash ON public.generations(source_text_hash);

-- Indeksy dla tabeli flashcards
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON public.flashcards(generation_id);
CREATE INDEX idx_flashcards_user_id_created_at ON public.flashcards(user_id, created_at DESC);

-- Indeksy dla tabeli generation_error_logs
CREATE INDEX idx_generation_error_logs_user_id ON public.generation_error_logs(user_id);
CREATE INDEX idx_generation_error_logs_user_id_created_at ON public.generation_error_logs(user_id, created_at DESC);
CREATE INDEX idx_generation_error_logs_source_text_hash ON public.generation_error_logs(source_text_hash);
```

### 4. Zasady PostgreSQL (Row Level Security - RLS)

Zakładamy, że RLS jest włączone dla tabel `public.generations`, `public.flashcards` oraz `public.generation_error_logs`.

```sql
-- Włączenie RLS dla tabel (zgodnie z migracją)
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Zasady RLS dla tabeli generations
CREATE POLICY "authenticated users can view own generations" ON public.generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can view own generations" ON public.generations FOR SELECT TO anon USING (auth.uid() = user_id);
CREATE POLICY "authenticated users can create own generations" ON public.generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anonymous users can create own generations" ON public.generations FOR INSERT TO anon WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can update own generations" ON public.generations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anonymous users can update own generations" ON public.generations FOR UPDATE TO anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can delete own generations" ON public.generations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can delete own generations" ON public.generations FOR DELETE TO anon USING (auth.uid() = user_id);

-- Zasady RLS dla tabeli flashcards
CREATE POLICY "authenticated users can view own flashcards" ON public.flashcards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can view own flashcards" ON public.flashcards FOR SELECT TO anon USING (auth.uid() = user_id);
CREATE POLICY "authenticated users can create own flashcards" ON public.flashcards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anonymous users can create own flashcards" ON public.flashcards FOR INSERT TO anon WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can update own flashcards" ON public.flashcards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anonymous users can update own flashcards" ON public.flashcards FOR UPDATE TO anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can delete own flashcards" ON public.flashcards FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can delete own flashcards" ON public.flashcards FOR DELETE TO anon USING (auth.uid() = user_id);

-- Zasady RLS dla tabeli generation_error_logs
CREATE POLICY "authenticated users can view own generation errors" ON public.generation_error_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can view own generation errors" ON public.generation_error_logs FOR SELECT TO anon USING (auth.uid() = user_id);
CREATE POLICY "authenticated users can create own generation errors" ON public.generation_error_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anonymous users can create own generation errors" ON public.generation_error_logs FOR INSERT TO anon WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can delete own generation errors" ON public.generation_error_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anonymous users can delete own generation errors" ON public.generation_error_logs FOR DELETE TO anon USING (auth.uid() = user_id);
-- (Uwaga: Migracja nie definiuje polityk UPDATE dla generation_error_logs)
```

### 5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

1.  **Struktura tabel**: Schemat został zaktualizowany na podstawie migracji `20241225152300_create_flashcards_schema.sql`. Wprowadza on tabele `generations` do śledzenia sesji generowania fiszek przez AI, `flashcards` do przechowywania samych fiszek oraz `generation_error_logs` do logowania błędów.
2.  **Identyfikatory**: Tabele `generations`, `flashcards`, `generation_error_logs` używają `bigserial` jako klucza głównego (auto-inkrementujący `BIGINT`), a nie `UUID` jak w poprzedniej wersji planu dla `flashcards`.
3.  **Pola fiszek**: Tabela `flashcards` zawiera teraz kolumny `front` (odpowiednik `question`), `back` (odpowiednik `answer`) oraz `source`. Usunięto pola związane bezpośrednio ze Spaced Repetition (`sr_due_date`, `sr_stability`, etc.) oraz pola `type` i `review_status` (wraz z powiązanymi typami ENUM), które były w poprzedniej koncepcji schematu. Długości `VARCHAR` dla `front` i `back` to 500 znaków.
4.  **Śledzenie generowania AI**: Tabela `generations` przechowuje metryki dotyczące procesu generowania fiszek, takie jak liczba wygenerowanych, zaakceptowanych (bez edycji i po edycji) fiszek, hash i długość tekstu źródłowego oraz czas trwania generacji.
5.  **Logowanie błędów**: Tabela `generation_error_logs` służy do szczegółowego zapisywania błędów napotkanych podczas generowania fiszek przez AI, włączając w to kod błędu i jego opis.
6.  **Trigger `updated_at`**: Funkcja `trigger_set_timestamp()` automatycznie aktualizuje pole `updated_at` w tabelach `generations` i `flashcards` przy każdej modyfikacji wiersza. Nie jest stosowany do `generation_error_logs` zgodnie z migracją.
7.  **RLS dla roli `anon`**: Polityki RLS zostały rozszerzone o obsługę roli `anon` (użytkowników anonimowych/niezalogowanych). Pozwalają one na operacje na "własnych" danych, co może wymagać specyficznej konfiguracji JWT dla anonimowych użytkowników w Supabase, aby `auth.uid()` zwracało dla nich unikalny identyfikator. W standardowej konfiguracji, dla roli `anon`, `auth.uid()` zwraca `NULL`, co mogłoby oznaczać, że te polityki nie zadziałają zgodnie z intencją "własności" danych bez dodatkowych ustawień. Należy to zweryfikować.
8.  **Brak typów ENUM i funkcjonalności Spaced Repetition**: Obecna migracja nie definiuje typów ENUM (takich jak `flashcard_type`, `flashcard_review_status`) ani nie zawiera pól do implementacji algorytmu Spaced Repetition w tabeli `flashcards`. Jeśli te funkcjonalności są nadal wymagane, będą musiały zostać dodane w osobnych, przyszłych migracjach i odpowiednio uwzględnione w planie bazy danych.
9.  **Wykorzystanie Supabase**: Schemat opiera się na standardowych funkcjach Supabase, takich jak `auth.users` dla użytkowników i `auth.uid()` w politykach RLS.