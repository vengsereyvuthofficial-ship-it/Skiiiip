import { getStats } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const stats = await getStats();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('stats error', err);
    return res.status(200).json({ totalUsers: 0, totalLinks: 0, totalPaidOut: 0 });
  }
}
