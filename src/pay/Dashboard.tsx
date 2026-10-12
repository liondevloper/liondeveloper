import { formatDate, MODE_LABELS, MODE_MEANING, type Merchant, type PayConfig, type PaymentMode } from './api';

type Props = { merchant: Merchant; config: PayConfig };

const MODE_CLASS: Record<PaymentMode, string> = {
  mock: 'is-mock',
  hyperswitch_sandbox: 'is-sandbox',
  hyperswitch_live: 'is-live',
};

const MILESTONES = [
  { label: 'Merchant accounts', done: true },
  { label: 'API keys', done: false },
  { label: 'Payment orders and hosted checkout', done: false },
  { label: 'UPI through Hyperswitch sandbox', done: false },
  { label: 'Webhooks in and out', done: false },
  { label: 'Transaction history and filters', done: false },
  { label: 'Live mode gate and onboarding checks', done: false },
];

export default function Dashboard({ merchant, config }: Props) {
  const activeMode: PaymentMode = config.defaultMode;

  return (
    <>
      <div className={`pay-mode-bar ${MODE_CLASS[activeMode]}`}>
        <b>{MODE_LABELS[activeMode]} mode</b>
        <em>{MODE_MEANING[activeMode]}</em>
      </div>

      <div className="pay-grid pay-grid-2">
        <section className="pay-card">
          <h2>{merchant.businessName}</h2>
          <dl>
            <div className="pay-kv">
              <dt>Merchant ID</dt>
              <dd>{merchant.id}</dd>
            </div>
            <div className="pay-kv">
              <dt>Email</dt>
              <dd>{merchant.email}</dd>
            </div>
            {merchant.contactPhone && (
              <div className="pay-kv">
                <dt>Phone</dt>
                <dd>{merchant.contactPhone}</dd>
              </div>
            )}
            <div className="pay-kv">
              <dt>Registered</dt>
              <dd>{formatDate(merchant.createdAt)}</dd>
            </div>
            <div className="pay-kv">
              <dt>Live payments</dt>
              <dd>{merchant.liveAccess ? 'Approved' : 'Locked'}</dd>
            </div>
          </dl>
        </section>

        <section className="pay-card">
          <h2>Payment modes</h2>
          {config.modes.map((info) => (
            <div className="pay-mode-row" key={info.mode}>
              <div>
                <strong>{MODE_LABELS[info.mode]}</strong>
                <p>{info.available ? MODE_MEANING[info.mode] : info.reason}</p>
              </div>
              <span className={`pay-pill ${info.available ? 'is-on' : ''}`}>
                {info.available ? 'Ready' : 'Off'}
              </span>
            </div>
          ))}
        </section>
      </div>

      <div className="pay-grid">
        <section className="pay-card">
          <h2>Build progress</h2>
          <ol className="pay-steps">
            {MILESTONES.map((step) => (
              <li key={step.label} className={step.done ? 'is-done' : ''}>
                {step.label}
              </li>
            ))}
          </ol>
          <p className="pay-note">
            Only finished and tested milestones appear as done. Nothing on this page represents money received.
          </p>
        </section>
      </div>
    </>
  );
}
