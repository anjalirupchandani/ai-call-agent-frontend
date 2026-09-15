import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      // Only name/email/password are sent to the API — confirmPassword is
      // a client-side check only, same signup() call as before.
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell activeTab="signup">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-white">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-[#A7B0D6]">Start building smarter conversations with AI.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField
          icon={User}
          label="Full name"
          type="text"
          required
          autoComplete="name"
          value={form.name}
          onChange={update("name")}
          placeholder="Full name"
        />

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
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          placeholder="Password"
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="shrink-0 text-[#5C6699] transition-colors hover:text-[#A7B0D6]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <AuthField
          icon={Lock}
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          placeholder="Confirm password"
        />

        {error && <p className="rounded-xl bg-[rgba(239,91,78,0.12)] px-3 py-2 text-sm text-[#FF9086]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="auth-dark-submit mt-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
          {!submitting && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#8791BC]">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[#C4B5FD] hover:text-white">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}