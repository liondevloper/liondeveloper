import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { adminApi } from './api';

// Wide Lion Digital Solution logo, made at build time from the uploaded logo (see pwa-icons.ts).
const FULL_LOGO = '/brand/lion-full-logo.png';

export default function Login({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const admin = await adminApi.login(email, password);
      onSignedIn(admin.email);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit}>
        <span className="admin-login-logo">
          <img src={FULL_LOGO} alt="Lion Digital Solution - Build, Create, Grow" width={900} height={242} />
        </span>
        <span className="admin-kicker">Lion Digital Solution</span>
        <h1>Admin sign in</h1>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button className="admin-button" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : <>Sign in <LogIn size={16} /></>}
        </button>
      </form>
    </div>
  );
}
