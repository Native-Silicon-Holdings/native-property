import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const { login, loginWithSSO } = useAuth();
  const navigate = useNavigate();

  const authErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string') {
      return (err as Error).message;
    }
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required for password sign-in.');
      return;
    }
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'Failed to login. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = async () => {
    setError('');
    setSsoLoading(true);
    try {
      // Domain from email when present; else VITE_SSO_DOMAIN / default in AuthContext.
      const domain = email.includes('@') ? email.split('@')[1] : undefined;
      await loginWithSSO(domain);
      // Browser redirects to IdP; no navigate needed on success.
    } catch (err: unknown) {
      setError(authErrorMessage(err, 'SSO sign-in failed. Try password login or check your domain.'));
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="font-display text-3xl text-foreground">Native Estate</span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-display text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            The architecture of estate management
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={ssoLoading || loading}
            onClick={handleSSO}
            className="w-full btn btn-primary mb-6"
          >
            {ssoLoading ? 'Redirecting to SSO…' : 'Sign in with Native Silicon SSO'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-accent hover:opacity-80">
                  Forgot password?
                </a>
              </div>
            </div>

            <button type="submit" disabled={loading || ssoLoading} className="w-full btn btn-outline">
              {loading ? 'Signing in...' : 'Sign in with password'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register" className="w-full flex justify-center btn btn-outline">
                Create new account
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 Native Estate. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
