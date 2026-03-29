import { kv } from "@vercel/kv";

export async function GET() {
  const users = await kv.get("timeclock-users");
  return Response.json(users || []);
}