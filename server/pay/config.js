import { createHash } from 'node:crypto';

/**
 * The three payment modes are kept apart on purpose and never share credentials,
 * provider URLs or database rows.
 *
 *   mock                 Nothing leaves this server. No bank, no UPI, no money.
 *   hyperswitch_sandbox  Real calls to Hyperswitch's hosted sandbox with test keys.
 *   hyperswitch_live     Real calls with live keys. Real money. Gated by env + approval.
 */
export const MODES = {
  MOCK: 'mock',
  SANDBOX: 'hyperswitch_sandbox',
  LIVE: 'hyperswitch_live',
};

export const ALL_MODES = [MODES.MOCK, MODES.SANDBOX, MODES.LIVE];

export const HYPERSWITCH_BASE_URL = {
  [MODES.SANDBOX]: 'https://sandbox.hyperswitch.io',
  [MODES.LIVE]: 'https://api.hyperswitch.io',
};

const env = (key) => (process.env[key] || '').trim();

/**
 * Merchant sessions must never be signable with the admin secret: the admin
 * middleware verifies a token without checking who it was issued to, so a shared
 * secret would let a merchant token open the admin panel. Deriving a separate key
 * keeps one env var to manage while making the two signing keys unrelated.
 */
export function merchantSessionSecret() {
  const explicit = env('PAY_SESSION_SECRET');
  if (explicit) return explicit;
  const base = env('SESSION_SECRET');
  if (!base) return '';
  return createHash('sha256').update(`${base}|pay-merchant-session`).digest('hex');
}

/** A mode is usable only when every credential it needs is present. */
export function modeAvailability() {
  const sandboxKey = env('HYPERSWITCH_SANDBOX_API_KEY');
  const liveKey = env('HYPERSWITCH_LIVE_API_KEY');
  const liveEnabled = env('PAY_LIVE_MODE_ENABLED') === 'true';

  return {
    [MODES.MOCK]: { available: true, reason: '' },
    [MODES.SANDBOX]: {
      available: Boolean(sandboxKey),
      reason: sandboxKey ? '' : 'HYPERSWITCH_SANDBOX_API_KEY is not set',
    },
    [MODES.LIVE]: {
      available: Boolean(liveKey && liveEnabled),
      reason: !liveKey
        ? 'HYPERSWITCH_LIVE_API_KEY is not set'
        : !liveEnabled
          ? 'PAY_LIVE_MODE_ENABLED is not true'
          : '',
    },
  };
}

export function isModeAvailable(mode) {
  return modeAvailability()[mode]?.available === true;
}

/** Credentials for a mode, or null when the mode is not configured. */
export function hyperswitchCredentials(mode) {
  if (mode !== MODES.SANDBOX && mode !== MODES.LIVE) return null;
  if (!isModeAvailable(mode)) return null;
  const apiKey = mode === MODES.LIVE ? env('HYPERSWITCH_LIVE_API_KEY') : env('HYPERSWITCH_SANDBOX_API_KEY');
  return {
    baseUrl: HYPERSWITCH_BASE_URL[mode],
    apiKey,
    profileId: env(mode === MODES.LIVE ? 'HYPERSWITCH_LIVE_PROFILE_ID' : 'HYPERSWITCH_SANDBOX_PROFILE_ID'),
    responseHashKey: env(
      mode === MODES.LIVE ? 'HYPERSWITCH_LIVE_RESPONSE_HASH_KEY' : 'HYPERSWITCH_SANDBOX_RESPONSE_HASH_KEY',
    ),
  };
}
