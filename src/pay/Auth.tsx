import { useState } from 'react';
import { payApi, type Merchant, type RegisterInput } from './api';

type Props = { onSignedIn: (merchant: Merchant) => void; accountsEnabled: boolean };

export default function Auth({ onSignedIn, accountsEnabled }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState<RegisterInput>({ email: '', password: '', businessName: '', contactPhone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof RegisterInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result =
        mode === 'login'
          ? await payApi.login(form.email, form.password)
          : await payApi.register(form);
      onSignedIn(result.merchant);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pay-auth">
      <h1>{mode === 'login' ? 'Merchant sign in' : 'Create a merchant account'}</h1>

      {!accountsEnabled && (
        <div className="pay-error">Accounts are disabled until the server has a session secret.</div>
      )}
      {error && <div className="pay-error">{error}</div>}

      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <label className="pay-field">
              <span>Business name</span>
              <input value={form.businessName} onChange={set('businessName')} autoComplete="organization" required />
            </label>
            <label className="pay-field">
              <span>Phone</span>
              <input value={form.contactPhone} onChange={set('contactPhone')} inputMode="tel" autoComplete="tel" />
            </label>
          </>
        )}

        <label className="pay-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} inputMode="email" autoComplete="email" required />
        </label>

        <label className="pay-field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 10 : undefined}
            required
          />
        </label>

        <button className="button button-gold pay-submit" type="submit" disabled={busy || !accountsEnabled}>
          {busy ? 'Working' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="pay-swap">
        {mode === 'login' ? 'No account yet? ' : 'Already registered? '}
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </p>

      <p className="pay-note">
        New accounts start in mock mode. Live payments stay locked until your KYC and payment provider approval are on file.
      </p>
    </div>
  );
}
