# REST API Plan

## 1. Resources

-   **Users**: Represents application users. Primarily managed by Supabase Auth.
    -   Corresponding DB Table: `auth.users` (managed by Supabase)
-   **Flashcards**: Represents individual flashcards created manually or by AI.
    -   Corresponding DB Table: `public.flashcards`
-   **Generations**: Represents AI flashcard generation sessions and their metrics.
    -   Corresponding DB Table: `public.generations`
-   **AI (Conceptual Resource for Generation Task)**: Represents the AI generation capability. Does not directly map to a single table for all its actions but orchestrates interactions with `public.generations` and external AI services.
-   **Generation Error Logs**: (Internal) Logs errors from AI generation. Not directly exposed via user API for creation, but data is stored.
    -   Corresponding DB Table: `public.generation_error_logs`

## 2. Endpoints

All endpoints are prefixed with `/api`. All user-specific data endpoints require authentication.

### 2.2. Flashcard Endpoints

#### `POST /flashcards`
-   **Description**: Create one or more flashcards (either manually or from AI suggestions). If from AI suggestions, updates relevant `generations` counters.
-   **HTTP Method**: `POST`
-   **URL Path**: `/flashcards`
-   **Query Parameters**: None
-   **Request Payload**:
    ```json
    {
        "flashcards": [
            // For manual creation
            {
                "front": "What is a REST API?",
                "back": "A Representational State Transfer API is an architectural style...",
                "source": "manual"
            },
            // For AI-generated flashcard (accepted suggestion)
            {
                "front": "AI suggested question",
                "back": "AI suggested answer",
                "source": "ai_generated",
                "generationId": "bigint", // ID of the generation session
                "wasEdited": false // true if user edited the AI suggestion before accepting
            }
            // ... more flashcards
        ]
    }
    ```
-   **Response Payload**: Array of created flashcard objects.
    ```json
    {
        "data": [
            {
                "id": "bigint",
                "front": "string",
                "back": "string",
                "source": "string", // 'manual' or 'ai_generated'
                "generation_id": "bigint" | null,
                "user_id": "uuid",
                "created_at": "timestampz",
                "updated_at": "timestampz"
            }
            // ... more created flashcards
        ],
        "summary": {
            "totalCreated": "integer",
            "manualCount": "integer",
            "aiGeneratedCount": "integer"
        }
    }
    ```
-   **Success Codes**:
    -   `201 Created`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., missing fields, validation errors like length, empty flashcards array).
    -   `401 Unauthorized`: User not authenticated.
    -   `404 Not Found`: If any `generationId` is provided but the generation session doesn't exist.
    -   `500 Internal Server Error`.

#### `GET /flashcards`
-   **Description**: List all flashcards for the authenticated user. Supports pagination and filtering.
-   **HTTP Method**: `GET`
-   **URL Path**: `/flashcards`
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1): Page number for pagination.
    -   `limit` (integer, optional, default: 20): Number of items per page.
    -   `sortBy` (string, optional, default: 'created_at:desc'): Field to sort by (e.g., `created_at:asc`, `updated_at:desc`).
    -   `filterByType` (string, optional): Filter by source type ('manual' or 'ai_generated').
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
        "data": [
            {
                "id": "bigint",
                "front": "string",
                "back": "string",
                "source": "string",
                "generation_id": "bigint" | null,
                "user_id": "uuid",
                "created_at": "timestampz",
                "updated_at": "timestampz"
            }
            // ... more flashcards
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 100,
            "limit": 20
        }
    }
    ```
-   **Success Codes**:
    -   `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid query parameters.
    -   `401 Unauthorized`.
    -   `500 Internal Server Error`.

#### `GET /flashcards/{flashcardId}`
-   **Description**: Get a specific flashcard by its ID.
-   **HTTP Method**: `GET`
-   **URL Path**: `/flashcards/{flashcardId}`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
        "id": "bigint",
        "front": "string",
        "back": "string",
        "source": "string",
        "generation_id": "bigint" | null,
        "user_id": "uuid",
        "created_at": "timestampz",
        "updated_at": "timestampz"
    }
    ```
-   **Success Codes**:
    -   `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`.
    -   `403 Forbidden`: If user tries to access a flashcard they don't own.
    -   `404 Not Found`: Flashcard not found.
    -   `500 Internal Server Error`.

#### `PUT /flashcards/{flashcardId}`
-   **Description**: Update an existing flashcard.
-   **HTTP Method**: `PUT`
-   **URL Path**: `/flashcards/{flashcardId}`
-   **Query Parameters**: None
-   **Request Payload**:
    ```json
    {
        "front": "Updated question text", // Optional
        "back": "Updated answer text"    // Optional
    }
    ```
-   **Response Payload**: The updated flashcard object.
    ```json
    {
        "id": "bigint",
        "front": "string",
        "back": "string",
        "source": "string",
        "generation_id": "bigint" | null,
        "user_id": "uuid",
        "created_at": "timestampz",
        "updated_at": "timestampz" // Will be updated
    }
    ```
-   **Success Codes**:
    -   `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., validation errors like length).
    -   `401 Unauthorized`.
    -   `403 Forbidden`: User doesn't own the flashcard.
    -   `404 Not Found`: Flashcard not found.
    -   `500 Internal Server Error`.

#### `DELETE /flashcards/{flashcardId}`
-   **Description**: Delete a flashcard.
-   **HTTP Method**: `DELETE`
-   **URL Path**: `/flashcards/{flashcardId}`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload**: None (or a success message)
-   **Success Codes**:
    -   `204 No Content`
-   **Error Codes**:
    -   `401 Unauthorized`.
    -   `403 Forbidden`: User doesn't own the flashcard.
    -   `404 Not Found`: Flashcard not found.
    -   `500 Internal Server Error`.

### 2.3. AI Generation Endpoints

#### `POST /ai/generate-flashcards`
-   **Description**: Initiates AI-powered flashcard generation from user-provided text. Creates a `generations` record and returns suggested flashcards (not persisted in `flashcards` table yet).
-   **HTTP Method**: `POST`
-   **URL Path**: `/ai/generate-flashcards`
-   **Query Parameters**: None
-   **Request Payload**:
    ```json
    {
        "sourceText": "A long piece of text (1000-10000 characters) to generate flashcards from.",
        "model": "optional_ai_model_identifier" // Optional, defaults to a preconfigured model
    }
    ```
-   **Response Payload (Success)**:
    ```json
    {
        "generationId": "bigint", // ID of the created 'generations' record
        "suggestedFlashcards": [
            {
                "tempId": "client-generated-uuid-1", // Temporary ID for client-side tracking
                "front": "Suggested Question 1",
                "back": "Suggested Answer 1"
            }
            // ... more suggestions
        ],
        "metadata": {
            "modelUsed": "string",
            "sourceTextHash": "string",
            "generatedCount": "integer" // Number of suggestions returned
        }
    }
    ```
-   **Success Codes**:
    -   `200 OK` (if suggestions are returned) or `202 Accepted` (if it's a long-running job, though current design implies synchronous response of suggestions).
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., text too short/long, missing `sourceText`).
    -   `401 Unauthorized`.
    -   `429 Too Many Requests`: If rate limiting is applied and hit.
    -   `500 Internal Server Error`: General server error.
    -   `503 Service Unavailable`: AI service (Openrouter.ai) is down or error during AI processing. (Error details logged to `generation_error_logs`).

### 2.4. Generation Session Endpoints

#### `GET /generations`
-   **Description**: List all AI generation sessions for the authenticated user.
-   **HTTP Method**: `GET`
-   **URL Path**: `/generations`
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1)
    -   `limit` (integer, optional, default: 20)
    -   `sortBy` (string, optional, default: 'created_at:desc')
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
        "data": [
            {
                "id": "bigint",
                "user_id": "uuid",
                "model": "string",
                "generated_count": "integer",
                "accepted_unedited_count": "integer",
                "accepted_edited_count": "integer",
                "source_text_hash": "string",
                "source_text_length": "integer",
                "generation_duration": "integer" | null, // in ms
                "created_at": "timestampz",
                "updated_at": "timestampz"
            }
            // ... more generation sessions
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 100,
            "limit": 20
        }
    }
    ```
-   **Success Codes**:
    -   `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid query parameters.
    -   `401 Unauthorized`.
    -   `500 Internal Server Error`.

#### `GET /generations/{generationId}`
-   **Description**: Get details of a specific AI generation session.
-   **HTTP Method**: `GET`
-   **URL Path**: `/generations/{generationId}`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload**:
    ```json
    {
        "id": "bigint",
        "user_id": "uuid",
        "model": "string",
        "generated_count": "integer",
        "accepted_unedited_count": "integer",
        "accepted_edited_count": "integer",
        "source_text_hash": "string",
        "source_text_length": "integer",
        "generation_duration": "integer" | null,
        "created_at": "timestampz",
        "updated_at": "timestampz"
        // Optionally, could also include the flashcards created from this session if requested via a query param
    }
    ```
-   **Success Codes**:
    -   `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`.
    -   `403 Forbidden`: User doesn't own the generation session.
    -   `404 Not Found`: Generation session not found.
    -   `500 Internal Server Error`.

## 3. Authentication and Authorization

-   **Mechanism**: Supabase built-in authentication will be used. Clients will authenticate with Supabase (e.g., email/password, OAuth) and receive a JWT.
-   **Implementation**:
    -   This JWT must be included in the `Authorization` header of API requests as a Bearer token (e.g., `Authorization: Bearer <SUPABASE_JWT>`).
    -   API endpoints (Astro API routes) will verify the JWT using Supabase libraries.
    -   The authenticated user's ID (`auth.uid()`) will be extracted from the JWT and used for database queries.
-   **Authorization**:
    -   Row Level Security (RLS) policies are defined in the PostgreSQL database for `public.flashcards`, `public.generations`, and `public.generation_error_logs`.
    -   These policies ensure that users can only access and modify their own data (e.g., `WHERE user_id = auth.uid()`).
    -   The API relies heavily on these RLS policies for data isolation between users.

## 4. Validation and Business Logic

### 4.1. Validation Conditions

-   **General**:
    -   Required fields must be present.
    -   Data types must match (e.g., strings, numbers).
-   **User Input for AI Generation (`POST /ai/generate-flashcards`)**:
    -   `sourceText`: Required, string, length between 1000 and 10000 characters (as per PRD US-005).
-   **Flashcard Creation/Update (`POST /flashcards`, `PUT /flashcards/{id}`)**:
    -   `front`: Required (on create), string, max length 200 characters, not empty (DB constraint).
    -   `back`: Required (on create), string, max length 500 characters, not empty (DB constraint).
    -   `source`: Required (on create), must be one of `'manual'` or `'ai_generated'`.
    -   `generationId`: Required if `source` is `'ai_generated'`. Must be a valid ID from `public.generations` table.
    -   `wasEdited`: Required boolean if `source` is `'ai_generated'`.
-   **Database Constraints**: All constraints defined in the DB schema (e.g., `CHECK` constraints on counts, lengths) are the ultimate source of truth and will result in DB errors if violated. API should perform pre-validation.

### 4.2. Business Logic Implementation

-   **AI Flashcard Generation (`POST /ai/generate-flashcards`)**:
    1.  Validate input (`sourceText` length).
    2.  Generate `source_text_hash`.
    3.  Create a new record in `public.generations` for the user, including `model`, `source_text_hash`, `source_text_length`. `user_id` is from JWT.
    4.  Call the external AI service (Openrouter.ai) with `sourceText`.
    5.  On successful AI response:
        -   Parse suggestions.
        -   Update the `generations` record with `generated_count` and `generation_duration`.
        -   Return `generationId` and suggested flashcards to the client.
    6.  On AI service error or processing error:
        -   Log details to `public.generation_error_logs` table (including `user_id`, `model`, `source_text_hash`, `error_code`, `error_message`).
        -   Return an appropriate error response to the client.
-   **Accepting AI-Suggested Flashcards (`POST /flashcards` with `source: 'ai_generated'`)**:
    1.  Validate input.
    2.  Verify the `generationId` belongs to the authenticated user and exists.
    3.  Create a new record in `public.flashcards` with `user_id` (from JWT), `front`, `back`, `source='ai_generated'`, and `generation_id`.
    4.  Atomically increment either `accepted_unedited_count` (if `wasEdited: false`) or `accepted_edited_count` (if `wasEdited: true`) in the `public.generations` record corresponding to `generationId`.
-   **Spaced Repetition**:
    -   As per PRD FR-007 and current DB schema, the API provides flashcard data (`GET /flashcards`).
    -   The client-side "gotowa biblioteka" is assumed to handle SR logic (selecting cards for review, tracking progress, scheduling next reviews).
    -   If server-side persistence of SR state is needed in the future, the API and DB schema will require extensions.
-   **Automatic `updated_at` Timestamps**:
    -   The database trigger `trigger_set_timestamp` automatically updates `updated_at` for `public.generations` and `public.flashcards` on any row update.
-   **Rate Limiting**:
    -   Consider implementing rate limiting (e.g., using Astro middleware) for sensitive or costly endpoints like `POST /ai/generate-flashcards` to prevent abuse.
