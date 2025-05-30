import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
    const { supabase } = locals;

    try {
        // Pobierz aktualną sesję
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (session) {
            // Ustaw cookies dla sesji
            cookies.set("sb-access-token", session.access_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 dni
                path: "/",
            });

            cookies.set("sb-refresh-token", session.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 30, // 30 dni
                path: "/",
            });
        }

        return new Response(JSON.stringify({
            user: session?.user || null,
            session: session
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}; 