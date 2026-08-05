import { requireAuth } from '../lib/auth.js';
import { getSettings, createWithdrawal, listUserWithdrawals, saveUser } from '../lib/db.js';

const WALLET_LABELS = {
  'USDT-TRC20': 'USDT (TRC20)',
  'USDT-BEP20': 'USDT (BEP20)',
  'BTC': 'Bitcoin (BTC)',
  'ETH': 'Ethereum (ETH)',
  'TRX': 'Tron (TRX)'
};

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const withdrawals = await listUserWithdrawals(user.id);
    return res.status(200).json({ withdrawals });
  }

  if (req.method === 'POST') {
    const amount = Number((req.body || {}).amount);
    const settings = await getSettings();

    if (!user.wallet || !user.wallet.address) {
      return res.status(400).json({ error: 'أضف عنوان محفظة رقمية أولًا من الملف الشخصي' });
    }
    if (!amount || amount < settings.minWithdraw) {
      return res.status(400).json({ error: `الحد الأدنى للسحب هو $${settings.minWithdraw.toFixed(2)}` });
    }
    if (amount > user.balance) {
      return res.status(400).json({ error: 'الرصيد غير كافٍ لإتمام هذا الطلب' });
    }

    user.balance -= amount;
    await saveUser(user);

    const withdrawal = await createWithdrawal({
      userId: user.id,
      userName: user.name,
      amount,
      wallet: WALLET_LABELS[user.wallet.type] || user.wallet.type,
      address: user.wallet.address
    });

    return res.status(201).json({ withdrawal });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
