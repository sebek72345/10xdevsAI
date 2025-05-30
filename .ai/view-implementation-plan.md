# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia tworzenie jednej lub wielu fiszek. Obsługuje fiszki tworzone ręcznie przez użytkownika oraz fiszki pochodzące z sugestii AI. W przypadku fiszek generowanych przez AI, punkt końcowy aktualizuje odpowiednie liczniki w tabeli `generations` (np. `accepted_unedited_count`, `accepted_edited_count`), aby śledzić, jak sugestie AI są wykorzystywane. Każda utworzona fiszka jest powiązana z uwierzytelnionym użytkownikiem.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/flashcards` (zakładając standardowy prefiks `/api` dla endpointów Astro)
-   **Parametry**:
    -   Wymagane: Brak parametrów ścieżki lub zapytania.
    -   Opcjonalne: Brak.
-   **Request Body**:
    -   Typ zawartości: `application/json`
    -   Struktura:
        ```json
        {
            "flashcards": [
                // Przykład fiszki tworzonej ręcznie
                {
                    "front": "What is a REST API?",
                    "back": "A Representational State Transfer API is an architectural style...",
                    "source": "manual"
                },
                // Przykład fiszki generowanej przez AI (zaakceptowana sugestia)
                {
                    "front": "AI suggested question for Capital of France",
                    "back": "Paris",
                    "source": "ai_generated",
                    "generationId": 123, // ID z tabeli 'generations'
                    "wasEdited": false // true, jeśli użytkownik edytował sugestię AI
                }
                // ... można dodać więcej obiektów fiszek
            ]
        }
        ```
    -   Walidacja ciała żądania:
        -   `flashcards`: Musi być tablicą i nie może być pusta.
        -   Każdy obiekt w `flashcards`:
            -   `front`: String, wymagany, niepusty, max 500 znaków.
            -   `back`: String, wymagany, niepusty, max 500 znaków.
            -   `source`: String, wymagany, musi być `"manual"` lub `"ai_generated"`.
            -   Jeśli `source` == `"ai_generated"`:
                -   `generationId`: Liczba (bigint), wymagana, musi być dodatnia i istnieć w tabeli `generations`.
                -   `wasEdited`: Boolean, wymagany.

## 3. Wykorzystywane typy
-   **Command Model (Request)**: `CreateFlashcardsCommand` (z `src/types.ts`)
    ```typescript
    import type { FlashcardCreatePayload, GenerationRow } from "./types"; // Zakładając, że typy są w tym samym pliku lub poprawnie importowane

    export interface CreateFlashcardsCommand {
        flashcards: FlashcardCreatePayload[];
    }

    export type ManualFlashcardCreatePayload = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
        source: "manual";
    };
    
    export type AiGeneratedFlashcardCreatePayload = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
        source: "ai_generated";
        generationId: GenerationRow["id"]; // BIGINT
        wasEdited: boolean;
    };

    export type FlashcardCreatePayload = ManualFlashcardCreatePayload | AiGeneratedFlashcardCreatePayload;
    ```
-   **DTO (Response)**: `CreateFlashcardsResponseDto` (z `src/types.ts`)
    ```typescript
    import type { FlashcardDto } from "./types"; // Zakładając, że typy są w tym samym pliku lub poprawnie importowane

    export interface CreateFlashcardsResponseDto {
        data: FlashcardDto[];
        summary: {
            totalCreated: number;
            manualCount: number;
            aiGeneratedCount: number;
        };
    }

    // FlashcardDto jest aliasem dla FlashcardRow (Tables<'flashcards'>)
    export type FlashcardRow = Tables<"flashcards">;
    export interface FlashcardDto extends FlashcardRow { }
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (201 Created)**:
    ```json
    {
        "data": [
            {
                "id": 1, // bigint
                "front": "What is a REST API?",
                "back": "A Representational State Transfer API is an architectural style...",
                "source": "manual",
                "generation_id": null, // bigint | null
                "user_id": "user-uuid-string", // uuid
                "created_at": "2023-10-27T10:00:00.000Z", // timestampz
                "updated_at": "2023-10-27T10:00:00.000Z"  // timestampz
            },
            {
                "id": 2,
                "front": "AI suggested question for Capital of France",
                "back": "Paris",
                "source": "ai_generated",
                "generation_id": 123,
                "user_id": "user-uuid-string",
                "created_at": "2023-10-27T10:00:00.000Z",
                "updated_at": "2023-10-27T10:00:00.000Z"
            }
        ],
        "summary": {
            "totalCreated": 2,
            "manualCount": 1,
            "aiGeneratedCount": 1
        }
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Szczegółowy komunikat błędu walidacji.
    -   `401 Unauthorized`: Standardowa odpowiedź, jeśli użytkownik nie jest uwierzytelniony.
    -   `404 Not Found`: Jeśli podany `generationId` nie istnieje lub nie należy do użytkownika.
    -   `500 Internal Server Error`: Ogólny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/flashcards` z tablicą danych fiszek w ciele żądania.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie:
    -   Sprawdza, czy użytkownik jest uwierzytelniony za pomocą `context.locals.supabase`. Jeśli nie, zwraca 401.
    -   Jeśli tak, pobiera `user_id` z sesji Supabase.
3.  Handler endpointu Astro (`src/pages/api/flashcards/index.ts`):
    -   Odbiera `user_id` i klienta Supabase (`context.locals.supabase`).
    -   Waliduje ciało żądania za pomocą schemy Zod odpowiadającej `CreateFlashcardsCommand`. Jeśli walidacja nie przejdzie, zwraca 400.
    -   Sprawdza, czy tablica `flashcards` nie jest pusta. Jeśli jest, zwraca 400.
    -   Wywołuje metodę `createFlashcards` w `FlashcardService`, przekazując `user_id`, zwalidowane dane (`CreateFlashcardsCommand`) oraz instancję klienta Supabase.
4.  `FlashcardService` (`src/lib/services/flashcard.service.ts`):
    -   Otwiera transakcję bazodanową.
    -   Inicjalizuje liczniki: `totalCreated = 0`, `manualCount = 0`, `aiGeneratedCount = 0`.
    -   Iteruje po każdej fiszce w `command.flashcards`:
        -   Waliduje długość `front` i `back` (niepuste, <= 500 znaków). Jeśli błąd, odrzuca transakcję i zwraca błąd (prowadzący do 400).
        -   Ustawia `user_id` dla nowej fiszki.
        -   Jeśli `source` to `"manual"`:
            -   Przygotowuje obiekt `TablesInsert<'flashcards'>`.
            -   Dodaje do listy fiszek do wstawienia.
            -   Inkrementuje `manualCount`.
        -   Jeśli `source` to `"ai_generated"`:
            -   Sprawdza, czy `generationId` istnieje w tabeli `generations` i czy `user_id` w rekordzie `generations` pasuje do `user_id` z sesji.
                -   Zapytanie: `supabase.from('generations').select('id').eq('id', generationId).eq('user_id', userId).maybeSingle()`.
                -   Jeśli nie znaleziono (wynik `null` lub błąd), odrzuca transakcję i zwraca błąd (prowadzący do 404).
            -   Przygotowuje obiekt `TablesInsert<'flashcards'>` z `generation_id`.
            -   Dodaje do listy fiszek do wstawienia.
            -   Przygotowuje aktualizację dla tabeli `generations`:
                -   Jeśli `wasEdited` jest `true`, inkrementuje `accepted_edited_count`.
                -   Jeśli `wasEdited` jest `false`, inkrementuje `accepted_unedited_count`.
            -   Dodaje `generationId` i odpowiedni licznik do listy aktualizacji dla tabeli `generations`.
            -   Inkrementuje `aiGeneratedCount`.
    -   Wykonuje operację batch insert dla wszystkich przygotowanych fiszek do tabeli `public.flashcards`.
    -   Jeśli są aktualizacje dla tabeli `generations`, wykonuje je (np. pętla z `update` lub bardziej zaawansowana technika batch update, jeśli wspierana i efektywna).
    -   Jeśli wszystkie operacje bazodanowe powiodą się, zatwierdza transakcję.
    -   Jeśli jakakolwiek operacja zawiedzie, wycofuje transakcję.
    -   Oblicza `totalCreated = manualCount + aiGeneratedCount`.
    -   Zwraca utworzone fiszki (z `id`, `created_at`, `updated_at` wypełnionymi przez bazę) oraz obiekt `summary`.
5.  Handler endpointu Astro zwraca odpowiedź `201 Created` z danymi z `FlashcardService` lub odpowiedni kod błędu, jeśli wystąpił problem.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wszystkie żądania do tego endpointu muszą być uwierzytelnione. Middleware Astro i integracja z Supabase (`context.locals.supabase`) zapewniają weryfikację sesji użytkownika. `user_id` jest pobierany z zaufanego źródła (sesji Supabase).
-   **Autoryzacja**:
    -   Polityki RLS (Row Level Security) w Supabase dla tabeli `flashcards` zapewniają, że użytkownik może tworzyć fiszki tylko dla siebie (`WITH CHECK (auth.uid() = user_id)`).
    -   Dla fiszek typu `ai_generated`, `FlashcardService` musi jawnie zweryfikować, czy `generationId` należy do uwierzytelnionego użytkownika przed próbą aktualizacji licznika w tabeli `generations`. RLS w tabeli `generations` również zapewni, że użytkownik może modyfikować tylko własne rekordy generacji.
-   **Walidacja danych wejściowych**:
    -   Zod jest używany na poziomie handlera Astro do walidacji struktury i typów danych przychodzących.
    -   Dodatkowa walidacja (np. długości stringów, istnienie `generationId`) odbywa się w `FlashcardService`.
    -   Ograniczenia `CHECK` w bazie danych (`check_front_length`, `check_back_length`, etc. z `db-plan.md`) zapewniają dodatkową warstwę ochrony integralności danych.
-   **Ochrona przed Mass Assignment**: Użycie dedykowanych typów `CreateFlashcardsCommand` i `FlashcardCreatePayload` oraz jawne mapowanie na obiekty `TablesInsert<'flashcards'>` w serwisie zapobiega przypisywaniu niechcianych pól.
-   **Transakcyjność**: Użycie transakcji bazodanowych zapewnia, że operacje tworzenia fiszek i aktualizacji statystyk generacji są atomowe. Albo wszystkie się powiodą, albo żadna.

## 7. Obsługa błędów
-   **Błędy walidacji (400 Bad Request)**:
    -   Puste ciało żądania lub brak pola `flashcards`.
    -   Tablica `flashcards` jest pusta.
    -   Brakujące lub nieprawidłowe pola (`front`, `back`, `source`, `generationId`, `wasEdited`).
    -   Naruszenie ograniczeń długości dla `front` lub `back`.
    -   Nieprawidłowa wartość dla `source`.
    -   Zostanie zwrócona odpowiedź JSON z opisem błędu.
-   **Brak autoryzacji (401 Unauthorized)**:
    -   Jeśli żądanie nie zawiera ważnego tokenu sesji. Obsługiwane przez middleware.
-   **Nie znaleziono zasobu (404 Not Found)**:
    -   Jeśli `source` to `ai_generated` i podany `generationId` nie istnieje w tabeli `generations` lub nie należy do bieżącego użytkownika (RLS może spowodować, że nie zostanie znaleziony).
-   **Błędy serwera (500 Internal Server Error)**:
    -   Niepowodzenie transakcji bazodanowej.
    -   Inne nieoczekiwane wyjątki w logice serwera.
    -   Błędy te powinny być logowane po stronie serwera w celu analizy.

## 8. Rozważania dotyczące wydajności
-   **Operacje wsadowe (Batch Operations)**:
    -   Wstawianie wielu fiszek powinno być realizowane jako pojedyncza operacja batch insert do bazy danych (`supabase.from('flashcards').insert([...])`), a nie pojedyncze inserty w pętli, aby zminimalizować liczbę zapytań do bazy.
    -   Aktualizacje liczników w tabeli `generations` mogą być trudniejsze do zbatchowania w prosty sposób, jeśli każda fiszka AI może pochodzić z innej sesji generowania. Jeśli wiele fiszek pochodzi z tej samej sesji, aktualizację można zgrupować. W przeciwnym razie może być konieczne wykonanie kilku osobnych aktualizacji. Należy rozważyć wydajność tego podejścia dla dużej liczby fiszek AI z różnych sesji.
    -   Alternatywnie, można użyć funkcji PostgreSQL (RPC) do obsługi logiki aktualizacji liczników w ramach pojedynczego wywołania.
-   **Indeksy bazodanowe**:
    -   Indeks na `generations.id` i `generations.user_id` jest kluczowy dla szybkiego sprawdzania istnienia i własności `generationId`. Zgodnie z `db-plan.md` istnieją odpowiednie indeksy (`idx_generations_user_id`).
    -   Indeksy na `flashcards.user_id` są również istotne dla przyszłych zapytań.
-   **Rozmiar payloadu**: Chociaż nie ma jawnych ograniczeń, bardzo duże payloady (tysiące fiszek) mogą wpłynąć na wydajność i zużycie pamięci. Należy rozważyć rozsądny limit po stronie klienta lub serwera, jeśli okaże się to problemem.

## 9. Etapy wdrożenia
1.  **Konfiguracja endpointu Astro**:
    -   Utworzyć plik `src/pages/api/flashcards/index.ts`.
    -   Zdefiniować funkcję `POST` i upewnić się, że `export const prerender = false;` jest ustawione.
    -   Zintegrować z middleware w celu uzyskania `user_id` i `supabaseClient` z `Astro.locals`.
2.  **Walidacja Zod**:
    -   Zdefiniować schemę Zod dla `CreateFlashcardsCommand` (może być w `src/lib/validators/flashcard.validators.ts` lub podobnym miejscu).
    -   Użyć schemy do walidacji `Astro.request.json()` w handlerze endpointu.
3.  **Utworzenie `FlashcardService`**:
    -   Utworzyć plik `src/lib/services/flashcard.service.ts`.
    -   Zaimplementować metodę `async createFlashcards(userId: string, command: CreateFlashcardsCommand, supabase: SupabaseClient): Promise<CreateFlashcardsResponseDto>`.
4.  **Implementacja logiki w `FlashcardService`**:
    -   Rozpoczęcie transakcji (np. `supabase.rpc('with_transaction', { /* ... */ })` jeśli używamy funkcji pomocniczej lub zarządzamy transakcją poprzez kolejne wywołania w ramach połączenia). Supabase JS v2 nie ma jawnych API `beginTransaction/commit/rollback` dla prostych operacji, więc atomowość może wymagać opakowania logiki w funkcję PostgreSQL wywoływaną przez RPC, lub starannego zarządzania błędami i potencjalnymi ręcznymi krokami kompensacyjnymi (mniej idealne). *Należy zbadać najlepsze praktyki transakcyjne z Supabase JS v2 dla tego przypadku.*
        *Aktualizacja:* Prostszym podejściem bez jawnych transakcji po stronie klienta JS jest poleganie na tym, że każda operacja `insert` czy `update` jest atomowa sama w sobie, i obsługa błędów tak, aby nie zostawić systemu w niespójnym stanie. Jeśli pełna atomowość dla wielu operacji jest krytyczna, funkcja PostgreSQL (RPC) jest zalecana. Dla tego planu założymy, że wykonujemy operacje sekwencyjnie i polegamy na obsłudze błędów.
    -   Iteracja po fiszkach, walidacja długości.
    -   Weryfikacja `generationId` (zapytanie do `generations` table, sprawdzanie `user_id`).
    -   Przygotowanie danych do wstawienia do `flashcards`.
    -   Przygotowanie danych do aktualizacji `generations`.
5.  **Operacje bazodanowe w `FlashcardService`**:
    -   Wykonanie `supabase.from('flashcards').insert(arrayOfFlashcardsToInsert).select()`.
    -   Dla każdej aktualizacji `generations`: `supabase.from('generations').update({ counter_field: increment(...) }).eq('id', generationId)`. (Należy rozważyć, jak efektywnie wykonać inkrementację). Można użyć funkcji PostgreSQL do atomowej inkrementacji lub pobrać wartość, inkrementować w JS i zapisać - to drugie mniej bezpieczne przy współbieżności. Lepsze może być `supabase.rpc('increment_generation_counter', { gen_id: generationId, count_type: 'edited' | 'unedited' })`.
6.  **Obsługa błędów i zwrot odpowiedzi**:
    -   Implementacja logiki `try...catch` w serwisie i handlerze.
    -   Zwracanie poprawnych kodów statusu HTTP i obiektów odpowiedzi.
7.  **Testowanie**:
    -   Testy jednostkowe dla `FlashcardService` (mockując Supabase client).
    -   Testy integracyjne dla endpointu API (używając narzędzia takiego jak Postman lub testów automatycznych frameworka Astro).
    -   Scenariusze testowe:
        -   Poprawne tworzenie (ręczne, AI, mieszane).
        -   Pusta tablica `flashcards`.
        -   Brakujące/nieprawidłowe pola.
        -   Za długie `front`/`back`.
        -   Nieistniejący `generationId`.
        -   `generationId` należący do innego użytkownika.
        -   Błędy bazy danych (symulowane).
8.  **Dokumentacja**:
    -   Upewnić się, że endpoint jest udokumentowany (np. w OpenAPI/Swagger, jeśli projekt tego wymaga). Ten plan może służyć jako podstawa. 