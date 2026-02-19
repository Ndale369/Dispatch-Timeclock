import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const { users } = req.body;
    await kv.set("timeclock-users", users);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("KV SET error:", err);
    res.status(500).json({ ok: false });
  }
}