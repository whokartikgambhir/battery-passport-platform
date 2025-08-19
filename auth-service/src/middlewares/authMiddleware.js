const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'http://auth-service:5000/api/auth';
const AUTH_INTROSPECT_URL = `${AUTH_BASE_URL}/introspect`;
const AUTH_TIMEOUT_MS = Number(process.env.AUTH_TIMEOUT_MS || 1500);

/**
 * Middleware to authenticate requests using JWT
 * Validates token by calling the auth service introspect endpoint
 * 
 * @param req object containing authorization header with Bearer token
 * @param res response object
 * @param next callback to pass control to the next middleware
 * @returns response object with 401 Unauthorized if invalid, otherwise attaches user to req and calls next
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    const resp = await fetch(AUTH_INTROSPECT_URL, {
      method: 'POST',
      headers: { Authorization: authHeader },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!resp.ok) {
      let body = null;
      try { body = await resp.json(); } catch {}
      return res.status(401).json({ message: body?.error || 'Unauthorized' });
    }

    const data = await resp.json();
    if (!data.valid || !data.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = data.user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
