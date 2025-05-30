import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

export function UserNav() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Sprawdź aktualną sesję
        const getSession = async () => {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                setUser(session?.user || null);
            } catch (error) {
                console.error("Error getting session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getSession();

        // Nasłuchuj zmian w autoryzacji
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            window.location.href = "/";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                    Witaj, {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    Wyloguj
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <a href="/auth/login">Zaloguj</a>
            </Button>
            <Button size="sm" asChild>
                <a href="/auth/register">Zarejestruj</a>
            </Button>
        </div>
    );
} 