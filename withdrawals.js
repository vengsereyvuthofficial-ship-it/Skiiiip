import { requireAdmin } from '../../lib/auth.js';
import { listPendingWithdrawals, getWithdrawal, saveWithdrawal, removeFromPending, getUserById, saveUser } from '../../lib/db.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const withdrawals = await listPendingWithdrawals();
    return res.status(200).json({ withdrawals });
  }

  if (req.method === 'POST') {
    const { id, action } = req.body || {};
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'بيانات غير صحيحة' });
    }
    const w = await getWithdrawal(id);
    if (!w) return res.status(404).json({ error: 'طلب السحب غير موجود' });
    if (w.status !== 'pending') return res.status(400).json({ error: 'تم التعامل مع هذا الطلب مسبقًا' });

    if (action === 'approve') {
      w.status = 'paid';
    } else {
      w.status = 'rejected';
      const owner = await getUserById(w.userId);
      if (owner) {
        owner.balance += w.amount; // refund since the amount was deducted at request time
        await saveUser(owner);
      }
    }
    await saveWithdrawal(w);
    await removeFromPending(id);
    return res.status(200).json({ ok: true, withdrawal: w });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
