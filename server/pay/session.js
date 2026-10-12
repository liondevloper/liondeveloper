import jwt from 'jsonwebtoken';
import { merchantSessionSecret } from './config.js';

export const MERCHANT_COOKIE = 'pay_merchant';
const SESSION_DAYS = 7;
const AUDIENCE = 'pay-merchant';
const ISSUER = 'lion-pay';

export const NO_SECRET_MESSAGE =
  'Merchant accounts are disabled until SESSION_SECRET (or PAY_SESSION_SECRET) is set on the server.';

export function sessionReady() {
  return Boolean(merchantSessionSecret());
}

export function issueSession(res, merchant) {
  const token = jwt.sign({ sub: merchant.id, email: merchant.email }, merchantSessionSecret(), {
    expiresIn: `${SESSION_DAYS}d`,
    audience: AUDIENCE,
    issuer: ISSUER,
  });
  res.cookie(MERCHANT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSession(res) {
  res.clearCookie(MERCHANT_COOKIE, { path: '/' });
}

/** Rejects tokens issued for any other audience, including the website's admin panel. */
export function requireMerchant(req, res, next) {
  if (!sessionReady()) return res.status(503).json({ error: NO_SECRET_MESSAGE });
  const token = req.cookies?.[MERCHANT_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    req.merchant = jwt.verify(token, merchantSessionSecret(), { audience: AUDIENCE, issuer: ISSUER });
    next();
  } catch {
    clearSession(res);
    res.status(401).json({ error: 'Session expired' });
  }
}
