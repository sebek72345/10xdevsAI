# Dokument wymagań produktu (PRD) - Flashcard AI App

## 1. Przegląd produktu
Flashcard AI App to aplikacja internetowa zaprojektowana, aby pomóc użytkownikom w efektywnym tworzeniu i nauce fiszek edukacyjnych. Głównym celem aplikacji jest zautomatyzowanie procesu tworzenia fiszek za pomocą sztucznej inteligencji (AI), co znacznie skraca czas potrzebny na ich przygotowanie w porównaniu do metod manualnych. Aplikacja skierowana jest do studentów oraz osób pracujących, które uczą się nowego języka i chcą wykorzystać metodę powtórek w interwałach (spaced repetition) do skuteczniejszego zapamiętywania. Kluczową korzyścią dla użytkownika jest oszczędność czasu oraz dostęp do efektywnej metody nauki.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem czasochłonnym i żmudnym. Użytkownicy muszą samodzielnie wyszukiwać definicje, tłumaczenia lub kluczowe informacje, a następnie przepisywać je na fiszki. Ten wysiłek często zniechęca do regularnego korzystania z fiszek oraz implementacji skutecznych technik nauki, takich jak spaced repetition, mimo ich udowodnionej efektywności w procesie zapamiętywania. Aplikacja ma na celu rozwiązanie tego problemu poprzez automatyzację generowania fiszek i integrację z systemem powtórek.

## 3. Wymagania funkcjonalne
Aplikacja w wersji MVP (Minimum Viable Product) będzie posiadać następujące funkcjonalności:

- FR-001: Generowanie fiszek przez AI na podstawie tekstu wprowadzonego przez użytkownika (metodą kopiuj-wklej, bądź upload pliku tekstowego).
- FR-002: Manualne tworzenie fiszek przez użytkownika.
- FR-003: Przeglądanie kolekcji utworzonych fiszek.
- FR-004: Edycja treści tekstowej istniejących fiszek.
- FR-005: Usuwanie fiszek z kolekcji użytkownika.
- FR-006: Prosty system kont użytkowników obejmujący rejestrację, logowanie, wylogowywanie, podstawowe zarządzanie sesją oraz bezpieczne przechowywanie danych.
- FR-007: Integracja z gotową biblioteką implementującą algorytm powtórek w interwałach (spaced repetition).
- FR-008: Rozróżnianie fiszek na typy: `auto_generated` (wygenerowane przez AI) oraz `manual` (stworzone ręcznie).
- FR-009: Prezentacja fiszek sugerowanych przez AI w formie listy do przeglądu przez użytkownika.
- FR-010: Możliwość "akceptacji" przez użytkownika fiszek wygenerowanych przez AI w celu dodania ich do swojej kolekcji.
- FR-011: Walidacja danych wejściowych użytkownika (np. długość tekstu dla AI, format pól formularzy).

## 4. Granice produktu
Następujące funkcje i cechy NIE wchodzą w zakres MVP:

- Implementacja własnego, zaawansowanego algorytmu powtórek (np. na wzór SuperMemo, Anki). Zostanie wykorzystana gotowa biblioteka.
- Import fiszek lub treści z plików w formatach takich jak PDF, DOCX itp.
- Możliwość współdzielenia zestawów fiszek pomiędzy różnymi użytkownikami.
- Integracje z innymi zewnętrznymi platformami edukacyjnymi lub narzędziami.
- Dedykowane aplikacje mobilne (iOS, Android). MVP będzie wyłącznie aplikacją webową.
- Edycja fiszek obejmująca elementy inne niż tekst (np. obrazy, dźwięk).
- Zaawansowane opcje formatowania tekstu w fiszkach.

Dodatkowe ograniczenia i założenia:
- Długość tekstu wejściowego dla funkcji generowania fiszek przez AI: od 1000 do 10000 znaków.
- Model AI użyty do generowania fiszek będzie rozwiązaniem prostym i możliwie tanim w utrzymaniu.
- Projekt będzie realizowany przez jednego dewelopera.
- Budżet projektu jest minimalny, co wpływa na wybór technologii i narzędzi.

## 5. Historyjki użytkowników

### Zarządzanie Kontem Użytkownika
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc zarejestrować konto w aplikacji używając adresu email i hasła, abym mógł zapisywać i zarządzać moimi fiszkami.
- Kryteria akceptacji:
    - Użytkownik może wprowadzić adres email.
    - Użytkownik może wprowadzić hasło.
    - Użytkownik może wprowadzić potwierdzenie hasła.
    - System waliduje format adresu email (np. obecność "@" i domeny).
    - System wymaga, aby hasło i potwierdzenie hasła były identyczne.
    - System wymaga hasła o minimalnej długości (np. 8 znaków).
    - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do panelu głównego aplikacji.
    - Nowe konto użytkownika jest tworzone w bazie danych.
    - Hasło użytkownika jest przechowywane w bazie danych w bezpieczny, zahashowany sposób.
    - W przypadku nieudanej rejestracji (np. email już istnieje, nieprawidłowe hasło) użytkownik otrzymuje czytelny komunikat o błędzie.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto używając adresu email i hasła, abym mógł uzyskać dostęp do moich zapisanych fiszek i funkcji aplikacji.
- Kryteria akceptacji:
    - Użytkownik może wprowadzić zarejestrowany adres email.
    - Użytkownik może wprowadzić swoje hasło.
    - System weryfikuje poprawność wprowadzonych danych logowania.
    - Po pomyślnym zalogowaniu użytkownik jest przekierowany do panelu głównego aplikacji.
    - W przypadku nieudanego logowania (np. nieprawidłowy email lub hasło) użytkownik otrzymuje czytelny komunikat o błędzie.
    - System implementuje podstawowe zabezpieczenie przed próbami odgadnięcia hasła (np. tymczasowa blokada po kilku nieudanych próbach).

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć dostęp do mojego konta, szczególnie na urządzeniach współdzielonych.
- Kryteria akceptacji:
    - Użytkownik ma dostępny wyraźny przycisk lub opcję "Wyloguj".
    - Po kliknięciu "Wyloguj", sesja użytkownika jest kończona.
    - Użytkownik jest przekierowywany na stronę logowania lub stronę główną dla niezalogowanych użytkowników.

- ID: US-004
- Tytuł: Odzyskiwanie zapomnianego hasła (uproszczone)
- Opis: Jako użytkownik, który zapomniał hasła, chcę mieć prostą możliwość jego zresetowania, abym mógł odzyskać dostęp do mojego konta.
- Kryteria akceptacji:
    - Użytkownik może przejść do formularza odzyskiwania hasła (np. link "Zapomniałem hasła" na stronie logowania).
    - Użytkownik może wprowadzić swój adres email powiązany z kontem.
    - Jeśli email istnieje w systemie, na podany adres wysyłana jest wiadomość z linkiem do resetowania hasła (lub inną prostą instrukcją).
    - Link do resetowania hasła jest unikalny i ograniczony czasowo.
    - Po kliknięciu w link, użytkownik może ustawić nowe hasło, spełniające minimalne wymagania bezpieczeństwa.
    - Użytkownik może zalogować się przy użyciu nowego hasła.

### Generowanie Fiszek przez AI
- ID: US-005
- Tytuł: Wprowadzanie tekstu i inicjowanie generowania fiszek przez AI
- Opis: Jako użytkownik, chcę móc wkleić fragment tekstu (o długości 1000-10000 znaków) do dedykowanego pola i zainicjować proces generowania fiszek przez AI, aby system zaproponował mi gotowe materiały do nauki.
- Kryteria akceptacji:
    - Dostępne jest pole tekstowe (np. textarea) do wprowadzenia tekstu.
    - System informuje użytkownika o dopuszczalnym zakresie długości tekstu (1000-10000 znaków).
    - Przycisk "Generuj fiszki" jest aktywny tylko, gdy wprowadzony tekst mieści się w dopuszczalnym zakresie długości.
    - Po kliknięciu przycisku "Generuj fiszki", system rozpoczyna proces przetwarzania tekstu.
    - Podczas przetwarzania (które może chwilę potrwać), użytkownik widzi informację zwrotną o trwającym procesie (np. animacja ładowania, komunikat "Przetwarzanie...").
    - W przypadku błędu po stronie serwera lub AI podczas generowania, użytkownik otrzymuje stosowny komunikat.

- ID: US-006
- Tytuł: Przeglądanie listy fiszek zasugerowanych przez AI
- Opis: Jako użytkownik, po zakończeniu procesu generowania przez AI, chcę zobaczyć listę zasugerowanych fiszek (pytanie i odpowiedź) w czytelny sposób, abym mógł ocenić ich jakość i przydatność.
- Kryteria akceptacji:
    - Sugerowane fiszki są wyświetlane jako lista, gdzie każda pozycja zawiera wygenerowane "pytanie" i "odpowiedź".
    - Przy każdej sugerowanej fiszce znajdują się opcje: "Akceptuj", "Edytuj i Akceptuj", "Odrzuć".

- ID: US-007
- Tytuł: Akceptacja fiszki wygenerowanej przez AI
- Opis: Jako użytkownik, przeglądając listę sugestii AI, chcę móc zaakceptować pojedynczą fiszkę, która mi odpowiada, aby została ona dodana do mojej głównej kolekcji fiszek.
- Kryteria akceptacji:
    - Użytkownik może kliknąć przycisk "Akceptuj" przy wybranej sugerowanej fiszce.
    - Po akceptacji, fiszka jest dodawana do kolekcji użytkownika z typem `auto_generated`.
    - Zaakceptowana fiszka znika z listy sugestii lub jest wyraźnie oznaczona jako zaakceptowana.
    - Akcja akceptacji jest rejestrowana na potrzeby pomiaru metryki sukcesu (70% akceptacji).

- ID: US-008
- Tytuł: Edycja fiszki wygenerowanej przez AI przed jej akceptacją
- Opis: Jako użytkownik, jeśli zasugerowana przez AI fiszka jest prawie idealna, chcę mieć możliwość szybkiej edycji jej treści (pytania lub odpowiedzi) przed ostatecznym zaakceptowaniem i dodaniem do mojej kolekcji.
- Kryteria akceptacji:
    - Użytkownik może wybrać opcję "Edytuj i Akceptuj" przy sugerowanej fiszce.
    - Pola tekstowe pytania i odpowiedzi dla tej fiszki stają się edytowalne.
    - Użytkownik może zmodyfikować tekst pytania i/lub odpowiedzi.
    - Po dokonaniu edycji, użytkownik może zapisać zmiany i zaakceptować fiszkę.
    - Edytowana i zaakceptowana fiszka jest dodawana do kolekcji z typem `auto_generated`.

- ID: US-009
- Tytuł: Odrzucenie niechcianej fiszki zasugerowanej przez AI
- Opis: Jako użytkownik, przeglądając listę sugestii AI, chcę móc odrzucić fiszki, które są niepoprawne, nieprzydatne lub zduplikowane.
- Kryteria akceptacji:
    - Użytkownik może kliknąć przycisk "Odrzuć" przy wybranej sugerowanej fiszce.
    - Odrzucona fiszka jest usuwana z listy sugestii i nie jest dodawana do kolekcji użytkownika.

### Manualne Tworzenie Fiszek
- ID: US-010
- Tytuł: Manualne tworzenie nowej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki, wprowadzając własne pytanie i odpowiedź, gdy mam specyficzną informację do zapamiętania, której AI nie wygenerowało.
- Kryteria akceptacji:
    - Dostępny jest formularz do manualnego tworzenia fiszek.
    - Formularz zawiera dwa pola tekstowe: "Pytanie" i "Odpowiedź".
    - Oba pola są wymagane do zapisu fiszki.
    - Po wypełnieniu pól i kliknięciu "Zapisz", nowa fiszka jest dodawana do kolekcji użytkownika z typem `manual`.
    - Użytkownik otrzymuje potwierdzenie zapisania fiszki.

### Zarządzanie Kolekcją Fiszek
- ID: US-011
- Tytuł: Przeglądanie osobistej kolekcji fiszek
- Opis: Jako użytkownik, chcę móc przeglądać listę wszystkich moich zapisanych fiszek (zarówno tych wygenerowanych przez AI, jak i stworzonych manualnie), abym mógł nimi zarządzać.
- Kryteria akceptacji:
    - Wyświetlana jest lista wszystkich fiszek należących do zalogowanego użytkownika.
    - Każda fiszka na liście pokazuje przynajmniej fragment pytania oraz informację o jej typie (`auto_generated` lub `manual`).
    - Przy każdej fiszce na liście dostępne są opcje "Edytuj" i "Usuń".
    - Jeśli lista fiszek jest długa, zaimplementowana jest paginacja lub przewijanie.

- ID: US-012
- Tytuł: Edycja istniejącej fiszki w kolekcji
- Opis: Jako użytkownik, chcę móc edytować treść tekstową (pytanie i/lub odpowiedź) istniejącej fiszki w mojej kolekcji, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:
    - Użytkownik może wybrać opcję "Edytuj" dla dowolnej fiszki ze swojej kolekcji.
    - Po wybraniu edycji, wyświetlany jest formularz z załadowaną aktualną treścią pytania i odpowiedzi fiszki.
    - Użytkownik może zmodyfikować tekst w polach pytania i odpowiedzi.
    - Po zapisaniu zmian, treść fiszki w kolekcji użytkownika jest zaktualizowana.

- ID: US-013
- Tytuł: Usuwanie fiszki z kolekcji
- Opis: Jako użytkownik, chcę móc usunąć fiszkę z mojej kolekcji, jeśli uznam, że nie jest mi już potrzebna.
- Kryteria akceptacji:
    - Użytkownik może wybrać opcję "Usuń" dla dowolnej fiszki ze swojej kolekcji.
    - Przed ostatecznym usunięciem, system wyświetla prośbę o potwierdzenie tej operacji.
    - Po potwierdzeniu przez użytkownika, fiszka jest trwale usuwana z jego kolekcji.

### Integracja z Systemem Powtórek (Spaced Repetition)
- ID: US-014
- Tytuł: Rozpoczęcie sesji nauki z powtórkami
- Opis: Jako użytkownik, chcę móc rozpocząć sesję nauki, podczas której system będzie mi prezentował fiszki do powtórzenia zgodnie z zasadami algorytmu spaced repetition.
- Kryteria akceptacji:
    - Użytkownik ma dostępną opcję (np. przycisk "Rozpocznij naukę" lub "Powtórka") do zainicjowania sesji.
    - System, na podstawie wybranej biblioteki algorytmu powtórek, wybiera fiszki, które są "do powtórki" w danym momencie.
    - Jeśli są fiszki do powtórki, rozpoczyna się sesja i wyświetlana jest pierwsza fiszka (strona z pytaniem).
    - Jeśli nie ma żadnych fiszek zaplanowanych do powtórki, użytkownik otrzymuje stosowny komunikat (np. "Brak fiszek do powtórki na dziś. Wróć później!").

- ID: US-015
- Tytuł: Prezentacja fiszki podczas sesji powtórek
- Opis: Jako użytkownik, podczas sesji nauki, chcę najpierw zobaczyć stronę z pytaniem fiszki, a następnie mieć możliwość samodzielnego odsłonięcia odpowiedzi.
- Kryteria akceptacji:
    - Podczas sesji powtórek, system wyświetla aktualną fiszkę, pokazując domyślnie tylko jej stronę z "pytaniem".
    - Dostępna jest opcja (np. przycisk "Pokaż odpowiedź", kliknięcie na fiszkę) pozwalająca użytkownikowi odsłonić "odpowiedź".
    - Po akcji użytkownika, strona z "odpowiedzią" fiszki staje się widoczna.

- ID: US-016
- Tytuł: Ocena znajomości fiszki i planowanie kolejnej powtórki
- Opis: Jako użytkownik, po zobaczeniu odpowiedzi na fiszkę podczas sesji nauki, chcę móc ocenić, jak dobrze ją pamiętałem, aby system mógł odpowiednio zaplanować jej następną powtórkę.
- Kryteria akceptacji:
    - Po odsłonięciu odpowiedzi, użytkownikowi prezentowane są opcje oceny swojej znajomości fiszki (np. "Nie wiem", "Trudne", "Dobrze", "Łatwe" - w zależności od możliwości wybranej biblioteki SR).
    - Wybór oceny przez użytkownika jest przekazywany do algorytmu spaced repetition, który aktualizuje harmonogram powtórki dla tej fiszki.
    - Po ocenie, system automatycznie przechodzi do następnej fiszki w sesji (jeśli są kolejne) lub informuje o zakończeniu sesji.

### Ogólne i Obsługa Błędów
- ID: US-017
- Tytuł: Informacja zwrotna o walidacji długości tekstu dla AI
- Opis: Jako użytkownik, próbując wygenerować fiszki przez AI, chcę otrzymać natychmiastowy i jasny komunikat, jeśli wprowadzony przeze mnie tekst jest za krótki lub za długi.
- Kryteria akceptacji:
    - System na bieżąco (lub przed próbą wysłania) sprawdza długość tekstu w polu do generowania fiszek AI.
    - Jeśli tekst ma mniej niż 1000 znaków, użytkownik widzi komunikat np. "Wprowadzony tekst jest za krótki. Minimalna długość to 1000 znaków."
    - Jeśli tekst ma więcej niż 10000 znaków, użytkownik widzi komunikat np. "Wprowadzony tekst jest za długi. Maksymalna długość to 10000 znaków."
    - Przycisk inicjujący generowanie fiszek jest nieaktywny, jeśli tekst nie spełnia kryteriów długości.

## 6. Metryki sukcesu
Sukces produktu w wersji MVP będzie mierzony za pomocą następujących wskaźników:

1.  Poziom akceptacji fiszek generowanych przez AI:
    - Cel: Co najmniej 70% fiszek wygenerowanych przez AI jest akceptowanych (tj. dodawanych do kolekcji) przez użytkowników.
    - Pomiar: Stosunek liczby fiszek `auto_generated`, dla których użytkownik kliknął przycisk "Akceptuj" (lub dokonał edycji i zaakceptował), do całkowitej liczby unikalnych fiszek zasugerowanych przez AI i zaprezentowanych użytkownikom.

2.  Stopień wykorzystania funkcji generowania AI:
    - Cel: Co najmniej 75% wszystkich nowo tworzonych fiszek w systemie jest generowanych z wykorzystaniem funkcji AI.
    - Pomiar: Stosunek liczby fiszek o typie `auto_generated` do całkowitej liczby fiszek (typu `auto_generated` + `manual`) w kolekcjach wszystkich użytkowników, mierzony w określonych przedziałach czasowych.
