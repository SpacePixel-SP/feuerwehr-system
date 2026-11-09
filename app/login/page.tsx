"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Wechsel zwischen Login und Registrierung
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (isSignUp) {
      // REGISTRIERUNG
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Account erfolgreich erstellt! Du kannst dich jetzt anmelden.");
        setIsSignUp(false); // Zurück zum Login wechseln
      }
    } else {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push("/"); // Zum Dashboard weiterleiten
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 text-red-500 text-xl mb-2">
            🚒
          </div>
          <h1 className="text-xl font-bold text-white">
            {isSignUp ? "Account registrieren" : "FFW Leitstelle Login"}
          </h1>
          <p className="text-xs text-zinc-400">
            {isSignUp ? "Erstelle ein neues Einsatzkräfte-Konto." : "Bitte melde dich mit deinen Zugangsdaten an."}
          </p>
        </div>

        {/* Fehlermeldung */}
        {errorMessage && (
          <div className="bg-red-950/60 border border-red-800 text-red-400 text-xs p-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Erfolgsmeldung */}
        {successMessage && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs p-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@feuerwehr-rp.de"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-lg shadow-red-900/30 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Wird verarbeitet..." : isSignUp ? "Registrieren" : "Anmelden"}
          </button>
        </form>

        {/* Umschalter zwischen Login und Registrierung */}
        <div className="text-center border-t border-zinc-800 pt-4 space-y-2">
          <p className="text-xs text-zinc-400">
            {isSignUp ? "Bereits einen Account?" : "Noch kein Konto?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="text-red-400 hover:underline font-medium cursor-pointer"
            >
              {isSignUp ? "Hier anmelden" : "Jetzt registrieren"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}