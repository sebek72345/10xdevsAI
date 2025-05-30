import type { APIRoute } from "astro";
import type { CreateFlashcardsCommand, CreateFlashcardsResponseDto } from "../../../types";
import type { User, SupabaseClient } from "@supabase/supabase-js"; // Added SupabaseClient
import { CreateFlashcardsCommandSchema } from "../../../lib/validators/flashcard.validators";
import { FlashcardService } from "../../../lib/services/flashcard.service"; // Added import
// Import Zod schema and FlashcardService once they are created
// import { CreateFlashcardsCommandSchema } from "../../../lib/validators/flashcard.validators";
// import { FlashcardService } from "../../../lib/services/flashcard.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
    const { locals, request } = context;
    // Cast to include user and SupabaseClient with its proper type
    const { supabase, user } = locals as { supabase: SupabaseClient; user: User | null };

    if (!supabase) {
        return new Response(JSON.stringify({ message: "Supabase client not found." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!user) {
        return new Response(JSON.stringify({ message: "User not authenticated." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let command: CreateFlashcardsCommand;
    try {
        const body = await request.json();
        // Need to handle BigInt conversion for generationId if present
        // Zod's default parser for JSON won't handle BigInts automatically
        // A custom preprocessor or parsing individual fields might be needed
        // For now, let's assume BigInts are handled or not present for simplicity in this step
        // This will be addressed properly when implementing the service logic.
        const parsed = CreateFlashcardsCommandSchema.safeParse(body);
        if (!parsed.success) {
            return new Response(JSON.stringify({ message: "Invalid request body", errors: parsed.error.flatten() }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        command = parsed.data;
    } catch (e) {
        // Changed to 'e' to avoid conflict if 'error' is used later
        console.error("Invalid JSON format:", e);
        return new Response(JSON.stringify({ message: "Invalid JSON format." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (command.flashcards.length === 0) {
        return new Response(JSON.stringify({ message: "Flashcards array cannot be empty." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const flashcardService = new FlashcardService(supabase, user);
        const result: CreateFlashcardsResponseDto = await flashcardService.createFlashcards(command);

        return new Response(
            JSON.stringify(result),
            { status: 201, headers: { "Content-Type": "application/json" } } // 201 Created
        );
    } catch (err: unknown) {
        // Changed to unknown for better type safety
        console.error("Error in FlashcardService or endpoint:", err);

        let message = "An unexpected error occurred.";
        let status = 500;

        if (err instanceof Error) {
            message = err.message;
            // Attempt to get status from custom error properties if they exist
            if ("status" in err && typeof (err as any).status === "number") {
                status = (err as any).status;
            }
        }

        return new Response(JSON.stringify({ message }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
};
