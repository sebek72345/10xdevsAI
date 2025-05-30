// src/types.ts
import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// --- Database Entity Aliases ---
// These types are direct aliases or extensions of the database row types.

/**
 * Represents a flashcard record from the 'flashcards' table.
 * Directly maps to `Tables<'flashcards'>`.
 */
export type FlashcardRow = Tables<"flashcards">;

/**
 * Represents a generation session record from the 'generations' table.
 * Directly maps to `Tables<'generations'>`.
 */
export type GenerationRow = Tables<"generations">;

// --- DTOs (Data Transfer Objects) ---

/**
 * DTO for a single flashcard.
 * This is typically used when returning flashcard data from the API.
 */
export type FlashcardDto = FlashcardRow;

/**
 * DTO for a single AI generation session.
 * This is used when returning generation session data from the API.
 */
export type GenerationDto = GenerationRow;

/**
 * Common DTO for pagination details.
 */
export interface PaginationDto {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
}

/**
 * Response DTO for listing flashcards.
 * Contains an array of flashcards and pagination information.
 */
export interface ListFlashcardsResponseDto {
    data: FlashcardDto[];
    pagination: PaginationDto;
}

/**
 * Response DTO for listing AI generation sessions.
 * Contains an array of generation sessions and pagination information.
 */
export interface ListGenerationsResponseDto {
    data: GenerationDto[];
    pagination: PaginationDto;
}

/**
 * DTO for a flashcard suggestion from AI generation.
 * This is used within the `GenerateFlashcardsResponseDto`.
 */
export interface SuggestedFlashcardDto {
    /** Client-generated temporary ID for UI tracking before saving. */
    tempId: string;
    /** The front content of the suggested flashcard. */
    front: string;
    /** The back content of the suggested flashcard. */
    back: string;
}

/**
 * Response DTO for the `POST /ai/generate-flashcards` endpoint.
 * Contains the ID of the generation session and an array of suggested flashcards.
 */
export interface GenerateFlashcardsResponseDto {
    /** The ID of the created 'generations' record. */
    generationId: bigint;
    suggestedFlashcards: SuggestedFlashcardDto[];
    metadata: {
        /** The AI model used for generation. */
        modelUsed: GenerationRow["model"];
        /** Hash of the source text used for generation. */
        sourceTextHash: GenerationRow["source_text_hash"];
        /** Number of suggestions returned from the AI. */
        generatedCount: GenerationRow["generated_count"];
    };
}

/**
 * Response DTO for the `POST /flashcards` endpoint after creating flashcards.
 */
export interface CreateFlashcardsResponseDto {
    /** Array of the successfully created flashcard objects. */
    data: FlashcardDto[];
    summary: {
        totalCreated: number;
        manualCount: number;
        aiGeneratedCount: number;
    };
}

// --- Command Models ---
// These types represent the expected request payloads for API endpoints.

/**
 * Payload for creating a flashcard manually.
 * Uses a subset of fields from `TablesInsert<'flashcards'>` and specifies 'source'.
 */
export type ManualFlashcardCreatePayload = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
    source: "manual";
};

/**
 * Payload for creating a flashcard from an AI suggestion.
 * Uses a subset of fields from `TablesInsert<'flashcards'>` and adds AI-specific fields.
 * 'generationId' corresponds to 'generations.id' and is required.
 */
export type AiGeneratedFlashcardCreatePayload = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
    source: "ai_generated";
    /** The ID of the generation session this flashcard originates from. Typed to match 'generations.id'. */
    generationId: bigint;
    wasEdited: boolean;
};

/**
 * Union type for a single flashcard creation payload.
 * It can be either manually created or AI-generated, distinguished by the 'source' field.
 */
export type FlashcardCreatePayload = ManualFlashcardCreatePayload | AiGeneratedFlashcardCreatePayload;

/**
 * Command model for the `POST /flashcards` endpoint.
 * Allows creating one or more flashcards.
 */
export interface CreateFlashcardsCommand {
    flashcards: FlashcardCreatePayload[];
}

/**
 * Command model for the `PUT /flashcards/{flashcardId}` endpoint.
 * Allows updating the 'front' or 'back' of a flashcard.
 * Derived from `TablesUpdate<'flashcards'>` to ensure fields are optional and types match the database schema.
 */
export type UpdateFlashcardCommand = Pick<TablesUpdate<"flashcards">, "front" | "back">;

/**
 * Command model for the `POST /ai/generate-flashcards` endpoint.
 * Used to initiate AI-powered flashcard generation.
 */
export interface GenerateFlashcardsCommand {
    /** The source text to generate flashcards from. */
    sourceText: string;
    /**
     * Optional AI model identifier. Defaults to a preconfigured model if not provided.
     * Type is derived from 'generations.model'.
     */
    model?: TablesInsert<"generations">["model"];
}
