import { requireAdmin } from '../../lib/auth.js';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../../lib/db.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const settings = await getSettings();
    return res.status(200).json({ settings });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const settings = {
      cpm: clampNumber(body.cpm, 0, 1000, DEFAULT_SETTINGS.cpm),
      adsPerVisit: clampNumber(body.adsPerVisit, 1, 10, DEFAULT_SETTINGS.adsPerVisit),
      userSharePct: clampNumber(body.userSharePct, 0, 100, DEFAULT_SETTINGS.userSharePct),
      minWithdraw: clampNumber(body.minWithdraw, 0, 100000, DEFAULT_SETTINGS.minWithdraw),
      stageSeconds: clampNumber(body.stageSeconds, 5, 300, DEFAULT_SETTINGS.stageSeconds)
    };
    await saveSettings(settings);
    return res.status(200).json({ ok: true, settings });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function clampNumber(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
