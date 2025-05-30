import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
    CreateFlashcardsCommand,
    CreateFlashcardsResponseDto,
    FlashcardDto,
    AiGeneratedFlashcardCreatePayload,
} from "../../types";
import type { TablesInsert, Tables } from "../../db/database.types";

// Custom error for service layer
export class ServiceError extends Error {
    status: number;
    constructor(message: string, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
    }
}

export class FlashcardService {
    private supabase: SupabaseClient;
    private user: User;

    constructor(supabase: SupabaseClient, user: User) {
        this.supabase = supabase;
        this.user = user;
    }

    public async createFlashcards(command: CreateFlashcardsCommand): Promise<CreateFlashcardsResponseDto> {
        let manualCount = 0;
        let aiGeneratedCount = 0;

        const flashcardsToInsert: TablesInsert<"flashcards">[] = [];
        // Store original payloads to link back after insert, for wasEdited flag
        const aiFlashcardPayloads = new Map<bigint, AiGeneratedFlashcardCreatePayload>();

        for (const flashcardPayload of command.flashcards) {
            const commonInsertData: Omit<
                TablesInsert<"flashcards">,
                "id" | "created_at" | "updated_at" | "source" | "generation_id"
            > = {
                front: flashcardPayload.front,
                back: flashcardPayload.back,
                user_id: this.user.id,
                // deck_id and SR fields are assumed to have DB defaults or be handled by other processes
            };

            if (flashcardPayload.source === "ai_generated") {
                const aiPayload = flashcardPayload as AiGeneratedFlashcardCreatePayload;
                const { data: generation, error: genError } = await this.supabase
                    .from("generations")
                    .select("id") // Only need to select 'id' to confirm existence and ownership (RLS handles ownership)
                    .eq("id", aiPayload.generationId)
                    .eq("user_id", this.user.id) // Explicit user_id check remains good practice
                    .maybeSingle();

                if (genError) {
                    console.error("Database error verifying generation:", genError);
                    throw new ServiceError("Database error while verifying generation.", 500);
                }
                if (!generation) {
                    throw new ServiceError(
                        `Generation with ID ${aiPayload.generationId} not found or access denied for user ${this.user.id}.`,
                        404
                    ); // Or 403
                }

                flashcardsToInsert.push({
                    ...commonInsertData,
                    source: "ai_generated",
                    generation_id: aiPayload.generationId as any, // Cast if TablesInsert expects number
                });
                aiFlashcardPayloads.set(aiPayload.generationId, aiPayload);
                aiGeneratedCount++;
            } else {
                flashcardsToInsert.push({
                    ...commonInsertData,
                    source: "manual",
                    generation_id: null,
                });
                manualCount++;
            }
        }

        if (flashcardsToInsert.length === 0) {
            // Should be caught by Zod, but as a safeguard:
            return {
                data: [],
                summary: { totalCreated: 0, manualCount: 0, aiGeneratedCount: 0 },
            };
        }

        const { data: insertedFlashcards, error: insertError } = await this.supabase
            .from("flashcards")
            .insert(flashcardsToInsert)
            .select(); // Select all fields of inserted rows

        if (insertError) {
            console.error("Error inserting flashcards:", insertError);
            throw new ServiceError(`Failed to create flashcards: ${insertError.message}`, 500);
        }

        if (!insertedFlashcards || insertedFlashcards.length === 0) {
            throw new ServiceError("Flashcard insertion attempt returned no data or failed silently.", 500);
        }

        // Update generation counters for AI-generated flashcards
        for (const flashcard of insertedFlashcards) {
            // Ensure flashcard.generation_id is treated as bigint if it's a number from DB
            const generationIdBigInt = flashcard.generation_id ? BigInt(flashcard.generation_id) : null;

            if (flashcard.source === "ai_generated" && generationIdBigInt) {
                const originalPayload = aiFlashcardPayloads.get(generationIdBigInt);
                if (originalPayload) {
                    const counterType = originalPayload.wasEdited ? "edited" : "unedited";
                    const { error: rpcError } = await this.supabase.rpc("increment_generation_counter", {
                        gen_id: generationIdBigInt, // Pass as bigint
                        count_type: counterType,
                    });

                    if (rpcError) {
                        // Log error and continue; don't let counter update failure block the whole process
                        console.error(`Failed to increment counter for generation ID ${generationIdBigInt}:`, rpcError);
                        // Optionally, add to a list of partial failures in response if critical
                    }
                }
            }
        }

        // Map to FlashcardDto, ensuring correct types (especially for id and generation_id)
        const responseData: FlashcardDto[] = insertedFlashcards.map((dbRow) => ({
            ...(dbRow as Tables<"flashcards">),
            // Ensure id and generation_id are consistently bigint or null for the DTO
            // Supabase might return number for bigint cols, so explicit conversion:
            id: BigInt(dbRow.id),
            generation_id: dbRow.generation_id ? BigInt(dbRow.generation_id) : null,
        }));

        return {
            data: responseData,
            summary: {
                totalCreated: responseData.length,
                manualCount,
                aiGeneratedCount,
            },
        };
    }
}
