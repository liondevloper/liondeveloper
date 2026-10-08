import { useState, type FormEvent } from 'react';
import { adminApi } from './api';

export default function Settings({ email }: { email: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await adminApi.changePassword(current, next);
      setCurrent('');
      setNext('');
      setMessage('Password changed.');
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Could not change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Settings</h1>
      <p className="admin-muted">Signed in as {email}</p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>Change password</h2>
        <label>
          Current password
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </label>
        <label>
          New password
          <input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <p className="admin-error">{error}</p>}
        {message && <p className="admin-success">{message}</p>}
        <button className="admin-button" type="submit" disabled={busy}>
          {busy ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
