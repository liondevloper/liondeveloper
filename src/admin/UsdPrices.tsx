import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from './api';
import { mergeContent, type SiteContent } from '../data/site';
import { USD_CARE_PRICES, USD_PLAN_PRICES, type UsdCareTier, type UsdPlan } from '../data/region';

// Visitors in India see the rupee prices from the Content page. Everyone else sees the dollar prices set here.
// A blank box falls back to the standard dollar price for that package.

const dollars = (amount: number | undefined) => (amount ? `$${amount.toLocaleString('en-US')}` : '');

function PriceBox({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} placeholder={fallback || '$0'} onChange={(event) => onChange(event.target.value)} />
      <small className="admin-hint">{fallback ? `Blank shows ${fallback}` : 'Blank keeps the same text as India'}</small>
    </label>
  );
}

export default function UsdPrices() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [savedCopy, setSavedCopy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .getContent()
      .then((stored) => {
        const merged = mergeContent(stored);
        setContent(merged);
        setSavedCopy(JSON.stringify(merged));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load prices'));
  }, []);

  if (error && !content) return <p className="admin-error">{error}</p>;
  if (!content) return <p className="admin-muted">Loading...</p>;

  const plans = content.pricing as UsdPlan[];
  const tiers = content.care.tiers as UsdCareTier[];
  const dirty = JSON.stringify(content) !== savedCopy;

  const updatePlan = (index: number, usdPrice: string) => {
    setContent({ ...content, pricing: plans.map((plan, i) => (i === index ? { ...plan, usdPrice } : plan)) });
    setMessage('');
  };
  const updateTier = (index: number, changes: Partial<UsdCareTier>) => {
    setContent({ ...content, care: { ...content.care, tiers: tiers.map((tier, i) => (i === index ? { ...tier, ...changes } : tier)) } });
    setMessage('');
  };

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await adminApi.saveContent(content);
      setSavedCopy(JSON.stringify(content));
      setMessage('Saved. Visitors outside India now see these prices.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-content-head">
        <div>
          <h1>Dollar prices</h1>
          <p className="admin-muted">
            Visitors in India see the rupee (₹) prices from the Content page. Visitors in every other country see the dollar ($) prices below.
            Type them like $399. Rupee prices and package names are changed on the Content page.
          </p>
        </div>
        <div className="admin-actions">
          {message && <span className="admin-success">{message}</span>}
          {error && <span className="admin-error">{error}</span>}
          <button type="button" className="admin-button" onClick={save} disabled={busy || !dirty}>
            <Save size={14} /> {busy ? 'Saving...' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <h2>Website packages</h2>
      <div className="admin-repeater">
        {plans.map((plan, index) => (
          <article className="admin-item" key={index}>
            <header><strong>{plan.name || 'Untitled'}</strong><span className="admin-muted">India: {plan.price || '—'}</span></header>
            <div className="admin-item-body">
              <PriceBox label="Price outside India ($)" value={plan.usdPrice ?? ''} fallback={dollars(USD_PLAN_PRICES[plan.name])} onChange={(value) => updatePlan(index, value)} />
            </div>
          </article>
        ))}
      </div>

      <h2>Website Care Plan</h2>
      <div className="admin-repeater">
        {tiers.map((tier, index) => (
          <article className="admin-item" key={index}>
            <header><strong>{tier.name || 'Untitled'}</strong><span className="admin-muted">India: {tier.price} / {tier.yearlyPrice}</span></header>
            <div className="admin-item-body">
              <div className="admin-row">
                <PriceBox label="Monthly outside India ($)" value={tier.usdPrice ?? ''} fallback={dollars(USD_CARE_PRICES[tier.name]?.monthly)} onChange={(usdPrice) => updateTier(index, { usdPrice })} />
                <PriceBox label="Yearly outside India ($)" value={tier.usdYearlyPrice ?? ''} fallback={dollars(USD_CARE_PRICES[tier.name]?.yearly)} onChange={(usdYearlyPrice) => updateTier(index, { usdYearlyPrice })} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
