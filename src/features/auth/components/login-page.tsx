import * as React from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';

import { useAuthContext } from '../auth-context';
import leftBg from '../assets/login-left-bg.svg';
import rightBg from '../assets/login-right-bg.svg';

const fieldLabel =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuthContext();

  const [form, setForm] = React.useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      navigate(paths.app.root.getHref(), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await login(form.username, form.password);
      navigate(paths.app.root.getHref(), { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header (full-width) ──────────────────────────────── */}
      <header className="border-foreground/10 bg-background/95 z-10 flex h-11 shrink-0 items-center justify-between border-b px-8 backdrop-blur-sm">
        <span className="font-headline text-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
          HyperDataLab
        </span>
      </header>

      {/* ── Main split panel ─────────────────────────────────── */}
      <div className="grid flex-1 lg:grid-cols-2">
        {/* LEFT — editorial panel */}
        <div
          className="relative hidden flex-col justify-between bg-cover bg-center p-12 lg:flex xl:p-16"
          style={{ backgroundImage: `url(${leftBg})` }}
        >
          {/* Left-to-right text readability overlay */}
          <div className="from-background/60 pointer-events-none absolute inset-0 bg-linear-to-r to-transparent" />

          <div className="relative z-10 space-y-3">
            <p className="text-muted-foreground font-mono text-[9px] tracking-[0.25em] uppercase">
              Research Writing Platform
            </p>
          </div>

          <div className="relative z-10 max-w-lg space-y-6">
            <h1 className="text-foreground font-serif text-5xl leading-[1.08] font-extrabold tracking-tight xl:text-6xl">
              Shape Your
              <br />
              Ideas.
              <br />
              Write With
              <br />
              Confidence.
            </h1>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
              Organize your ideas, work with friends, and build your paper step
              by step - from your first draft to the final version.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div className="space-y-0.5">
              <p className="text-muted-foreground/60 font-mono text-[8px] tracking-[0.2em] uppercase">
                Platform
              </p>
              <p className="text-foreground/80 font-mono text-[10px] tracking-wide">
                Academic Writing Suite
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div
          className="flex items-center justify-center bg-[#181512] bg-cover bg-center p-8"
          style={{ backgroundImage: `url(${rightBg})` }}
        >
          <div className="bg-background w-full max-w-md space-y-8 rounded-2xl p-10 shadow-2xl">
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-primary font-serif text-3xl font-extrabold tracking-tight">
                Sign in to HyperDataLab
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access the platform.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-username" className={fieldLabel}>
                  Email or Username
                </label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="you@example.com"
                    value={form.username}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, username: e.target.value }))
                    }
                    className="pl-10"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className={fieldLabel}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="pr-10 pl-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="border-input accent-foreground size-3.5 rounded"
                  />
                  <span className={fieldLabel}>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground font-mono text-[10px] tracking-widest uppercase transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
                  {error}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                variant="darkRed"
                className="bg-cta-hover w-full text-[11px] tracking-widest uppercase hover:opacity-90"
              >
                {isPending ? 'Signing in…' : 'Sign In →'}
              </Button>
            </form>

            {/* Footer note */}
            <p className="text-muted-foreground border-t pt-4 font-mono text-[9px] tracking-wider uppercase">
              Unauthorized access attempts are logged and reported.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer (full-width) ──────────────────────────────── */}
      <footer className="border-foreground/10 bg-background/95 z-10 flex h-10 shrink-0 items-center justify-between border-t px-8 backdrop-blur-sm">
        <p className="text-muted-foreground font-mono text-[8px] tracking-[0.18em] uppercase">
          © {new Date().getFullYear()} HyperDataLab
        </p>
      </footer>
    </div>
  );
};
