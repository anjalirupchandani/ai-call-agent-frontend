import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell activeTab="login">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Sign in to your account to continue.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField
          icon={Mail}
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={update("email")}
          placeholder="Email address"
        />

        <AuthField
          icon={Lock}
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          value={form.password}
          onChange={update("password")}
          placeholder="Password"
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="shrink-0 text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        {error && <p className="rounded-xl bg-[var(--color-warn-dim)] px-3 py-2 text-sm text-[var(--color-warn-ink)]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="auth-dark-submit mt-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Login"}
          {!submitting && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--color-ink-muted)]">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-[var(--color-accent-ink)] hover:text-[var(--color-accent)]">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
