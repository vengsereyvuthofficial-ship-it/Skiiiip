import { getUserByEmail } from '../../lib/db.js';
import { verifyPassword, signSession, setSessionCookie, publicUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'أدخل البريد الإلكتروني وكلمة المرور' });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    const token = signSession(user.id);
    setSessionCookie(res, token);
    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع، حاول مرة أخرى' });
  }
}
