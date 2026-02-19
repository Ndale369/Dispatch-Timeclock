import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await kv.get('users');
    return res.status(200).json(users || []);
  }

  if (req.method === 'POST') {
    const users = req.body;
    await kv.set('users', users);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}