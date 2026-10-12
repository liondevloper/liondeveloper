import { useCallback, useEffect, useState } from 'react';
import { AuthError, payApi, type Merchant, type PayConfig } from './api';
import Auth from './Auth';
import Dashboard from './Dashboard';
import './pay.css';

export default function PayApp() {
  const [config, setConfig] = useState<PayConfig | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [nextConfig, session] = await Promise.all([
        payApi.config(),
        payApi.me().catch((error) => {
          if (error instanceof AuthError) return null;
          throw error;
        }),
      ]);
      setConfig(nextConfig);
      setMerchant(session?.merchant ?? null);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await payApi.logout().catch(() => undefined);
    setMerchant(null);
  }

  return (
    <div className="pay-shell">
      <header className="pay-topbar">
        <div className="pay-logo">
          LION PAY
          <span>UPI</span>
        </div>
        {merchant && (
          <button className="button button-outline button-small" type="button" onClick={signOut}>
            Sign out
          </button>
        )}
      </header>

      <main className="pay-main">
        {loading && <div className="pay-loading">Loading</div>}

        {!loading && !config && (
          <div className="pay-error">The payments API is not responding. Check the server logs.</div>
        )}

        {!loading && config && !merchant && (
          <Auth accountsEnabled={config.accountsEnabled} onSignedIn={setMerchant} />
        )}

        {!loading && config && merchant && <Dashboard merchant={merchant} config={config} />}
      </main>
    </div>
  );
}
