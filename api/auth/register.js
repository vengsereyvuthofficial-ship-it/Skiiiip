import { createUser, getUserByEmail } from '../../lib/db.js';
import { hashPassword, signSession, setSessionCookie, publicUser } from '../../lib/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'أدخل اسمًا صحيحًا' });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجّل بالفعل' });
    }

    const passwordHash = await hashPassword(password);
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const isAdmin = adminEmail && adminEmail === String(email).trim().toLowerCase();

    const user = await createUser({ name: String(name).trim(), email, passwordHash, isAdmin });
    const token = signSession(user.id);
    setSessionCookie(res, token);
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err && err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجّل بالفعل' });
    }
    console.error('register error', err);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع، حاول مرة أخرى' });
  }
}
