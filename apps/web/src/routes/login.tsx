import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { KeyRound, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: "/invoices" });
    }
  },
  component: LoginPage,
});

type Mode = "signin" | "signup";
type Step = "initial" | "otp";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("initial");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const autoFillAbortRef = useRef<AbortController | null>(null);

  // Conditional UI: autofill passkey prompt — only in signin initial step
  useEffect(() => {
    if (mode !== "signin" || step !== "initial") {
      autoFillAbortRef.current?.abort();
      autoFillAbortRef.current = null;
      return;
    }
    if (
      typeof PublicKeyCredential !== "undefined" &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      void PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
        if (available && mode === "signin" && step === "initial") {
          const controller = new AbortController();
          autoFillAbortRef.current = controller;
          void authClient.signIn
            .passkey({ autoFill: true, fetchOptions: { signal: controller.signal } })
            .then((result) => {
              if (result && !result.error) {
                void navigate({ to: "/invoices" });
              }
            });
        }
      });
    }
    return () => {
      autoFillAbortRef.current?.abort();
      autoFillAbortRef.current = null;
    };
  }, [mode, step]);

  function switchMode(newMode: Mode) {
    autoFillAbortRef.current?.abort();
    autoFillAbortRef.current = null;
    setMode(newMode);
    setStep("initial");
    setError(null);
    setOtp("");
  }

  async function handlePasskeySignIn() {
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.passkey();
      if (result?.error) {
        setError(result.error.message ?? "Anmeldung fehlgeschlagen");
        return;
      }
      await navigate({ to: "/invoices" });
    } catch {
      setError("Passkey-Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!email) {
      setError("Bitte Email eingeben");
      return;
    }
    if (mode === "signup" && !name) {
      setError("Bitte Name eingeben");
      return;
    }
    autoFillAbortRef.current?.abort();
    autoFillAbortRef.current = null;
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message ?? "Code konnte nicht gesendet werden");
        return;
      }
      setStep("otp");
    } catch {
      setError("Code konnte nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp) {
      setError("Bitte Code eingeben");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const signInResult = await authClient.signIn.emailOtp({
        email,
        otp,
        ...(mode === "signup" && name ? { name } : {}),
      });
      if (signInResult.error) {
        setError(signInResult.error.message ?? "Ungültiger Code");
        return;
      }

      if (mode === "signup") {
        // Register a passkey for this device now that a session exists
        const passkeyResult = await authClient.passkey.addPasskey({ name: email });
        if (passkeyResult?.error) {
          // Passkey registration is optional; continue to workspace creation
          console.warn("[login] Passkey registration skipped:", passkeyResult.error.message);
        }
        await navigate({ to: "/workspace/new" });
      } else {
        await navigate({ to: "/invoices" });
      }
    } catch {
      setError("Verifizierung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-serif text-2xl font-medium tracking-wide">oni-invoice</span>
        </div>

        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border mb-6 text-sm">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === "signin" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === "signup" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Registrieren
            </button>
          </div>

          {step === "otp" ? (
            <OtpForm
              email={email}
              otp={otp}
              onOtpChange={setOtp}
              error={error}
              loading={loading}
              onSubmit={handleVerifyOtp}
              onBack={() => { setStep("initial"); setError(null); setOtp(""); }}
            />
          ) : mode === "signin" ? (
            <SignInForm
              email={email}
              onEmailChange={setEmail}
              emailRef={emailRef}
              error={error}
              loading={loading}
              onPasskeySignIn={handlePasskeySignIn}
              onSendOtp={handleSendOtp}
              onSwitchMode={() => switchMode("signup")}
            />
          ) : (
            <SignUpForm
              name={name}
              onNameChange={setName}
              email={email}
              onEmailChange={setEmail}
              error={error}
              loading={loading}
              onSendOtp={handleSendOtp}
              onSwitchMode={() => switchMode("signin")}
            />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Kein Passwort benötigt — dein Gerät schützt deinen Account.
        </p>
      </div>
    </div>
  );
}

function inputClass() {
  return "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20";
}

function btnClass(variant: "primary" | "secondary" = "primary") {
  const base = "flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-50";
  return variant === "primary"
    ? `${base} bg-foreground text-background hover:opacity-90`
    : `${base} border border-border text-foreground hover:bg-accent`;
}

function SignInForm({
  email, onEmailChange, emailRef, error, loading,
  onPasskeySignIn, onSendOtp, onSwitchMode,
}: {
  email: string; onEmailChange: (v: string) => void;
  emailRef: React.RefObject<HTMLInputElement | null>;
  error: string | null; loading: boolean;
  onPasskeySignIn: () => void; onSendOtp: () => void; onSwitchMode: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Email</label>
        <input
          ref={emailRef}
          type="email"
          autoComplete="username webauthn"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSendOtp(); }}
          placeholder="deine@email.ch"
          className={inputClass()}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button type="button" onClick={onPasskeySignIn} disabled={loading} className={btnClass("primary")}>
        <KeyRound className="size-4" />
        {loading ? "Wird geprüft…" : "Mit Passkey anmelden"}
      </button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>oder</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button type="button" onClick={onSendOtp} disabled={loading} className={btnClass("secondary")}>
        {loading ? "Wird gesendet…" : "Mit Email-Code anmelden"}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Noch kein Konto?{" "}
        <button type="button" onClick={onSwitchMode} className="underline underline-offset-2 text-foreground">
          Registrieren
        </button>
      </p>
    </div>
  );
}

function SignUpForm({
  name, onNameChange, email, onEmailChange, error, loading,
  onSendOtp, onSwitchMode,
}: {
  name: string; onNameChange: (v: string) => void;
  email: string; onEmailChange: (v: string) => void;
  error: string | null; loading: boolean;
  onSendOtp: () => void; onSwitchMode: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Name</label>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Max Muster"
          className={inputClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSendOtp(); }}
          placeholder="deine@email.ch"
          className={inputClass()}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button type="button" onClick={onSendOtp} disabled={loading} className={btnClass("primary")}>
        <Mail className="size-4" />
        {loading ? "Code wird gesendet…" : "Code per Email senden"}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Bereits registriert?{" "}
        <button type="button" onClick={onSwitchMode} className="underline underline-offset-2 text-foreground">
          Anmelden
        </button>
      </p>
    </div>
  );
}

function OtpForm({
  email, otp, onOtpChange, error, loading, onSubmit, onBack,
}: {
  email: string; otp: string; onOtpChange: (v: string) => void;
  error: string | null; loading: boolean;
  onSubmit: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground text-center">
        Wir haben einen Code an <strong className="text-foreground">{email}</strong> gesendet.
      </p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">6-stelliger Code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
          placeholder="123456"
          className={`${inputClass()} text-center tracking-widest text-lg`}
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button type="button" onClick={onSubmit} disabled={loading || otp.length < 6} className={btnClass("primary")}>
        <KeyRound className="size-4" />
        {loading ? "Wird geprüft…" : "Bestätigen"}
      </button>

      <button type="button" onClick={onBack} className="text-xs text-center text-muted-foreground underline underline-offset-2">
        Andere Email verwenden
      </button>
    </div>
  );
}
