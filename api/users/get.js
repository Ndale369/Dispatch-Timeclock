import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const users = await kv.get("timeclock-users");
    res.status(200).json(users || []);
  } catch (err) {
    console.error("KV GET error:", err);
    res.status(200).json([]);
  }
}