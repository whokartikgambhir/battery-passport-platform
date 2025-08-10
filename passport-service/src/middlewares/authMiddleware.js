// internal dependencies
import { config } from '../config.js';

const AUTH_INTROSPECT_URL = `${config.authBaseUrl}/introspect`;

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.authTimeoutMs);

    const resp = await fetch(AUTH_INTROSPECT_URL, {
      method: 'POST',
      headers: { Authorization: authHeader },
      signal: controller.signal
    }).catch((e) => {
      throw e;
    });
    clearTimeout(timer);

    if (!resp || !resp.ok) {
      const body = await safeJson(resp);
      return res.status(401).json({ message: body?.error || 'Unauthorized' });
    }

    const data = await resp.json(); // { valid, user }
    if (!data.valid || !data.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = data.user; // { id, email, role }
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

async function safeJson(resp) {
  try { return await resp.json(); } catch { return null; }
}
