import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseClient } from "@/db/supabase.client";

interface AuthFormProps {
    mode?: "signin" | "signup";
    onSuccess?: () => void;
}

export function AuthForm({ mode = "signin", onSuccess }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(mode === "signup");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                const { error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                setSuccess("Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.");
            } else {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // Przekierowanie po udanym logowaniu
                window.location.href = "/";
            }

            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Wystąpił błąd podczas autoryzacji");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    {isSignUp ? "Zarejestruj się" : "Zaloguj się"}
                </CardTitle>
                <CardDescription>
                    {isSignUp
                        ? "Utwórz nowe konto, aby kontynuować"
                        : "Wprowadź swoje dane, aby się zalogować"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="twoj@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            Hasło
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Wprowadź hasło"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                            {success}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading
                            ? "Przetwarzanie..."
                            : isSignUp
                                ? "Zarejestruj się"
                                : "Zaloguj się"}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="text-sm text-primary hover:underline"
                        disabled={isLoading}
                    >
                        {isSignUp
                            ? "Masz już konto? Zaloguj się"
                            : "Nie masz konta? Zarejestruj się"}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
} 