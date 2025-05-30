import { z } from "zod";

const ManualFlashcardCreatePayloadSchema = z.object({
    front: z.string().min(1, "Front cannot be empty.").max(500, "Front cannot exceed 500 characters."),
    back: z.string().min(1, "Back cannot be empty.").max(500, "Back cannot exceed 500 characters."),
    source: z.literal("manual"),
});

const AiGeneratedFlashcardCreatePayloadSchema = z.object({
    front: z.string().min(1, "Front cannot be empty.").max(500, "Front cannot exceed 500 characters."),
    back: z.string().min(1, "Back cannot be empty.").max(500, "Back cannot exceed 500 characters."),
    source: z.literal("ai_generated"),
    generationId: z.bigint().positive("generationId must be a positive number."), // Match BIGINT type
    wasEdited: z.boolean(),
});

// Using z.union for the discriminated union based on 'source'
const FlashcardCreatePayloadSchema = z.discriminatedUnion("source", [
    ManualFlashcardCreatePayloadSchema,
    AiGeneratedFlashcardCreatePayloadSchema,
]);

export const CreateFlashcardsCommandSchema = z.object({
    flashcards: z.array(FlashcardCreatePayloadSchema).min(1, "Flashcards array cannot be empty."),
});

// To infer the TypeScript type from the schema for use elsewhere if needed
// export type CreateFlashcardsCommand = z.infer<typeof CreateFlashcardsCommandSchema>;
