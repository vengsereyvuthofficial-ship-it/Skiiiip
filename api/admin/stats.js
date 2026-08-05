import { requireAdmin } from '../../lib/auth.js';
import { getStats, listPendingWithdrawals } from '../../lib/db.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const stats = await getStats();
  const pending = await listPendingWithdrawals();
  return res.status(200).json({ ...stats, pendingWithdrawalsCount: pending.length });
}
