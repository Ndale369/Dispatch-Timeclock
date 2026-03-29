import { kv } from "@vercel/kv";

export async function POST(req) {
  try {
    const body = await req.json();

    // Expecting: { users: [...] }
    if (!body || !body.users) {
      return new Response(
        JSON.stringify({ error: "Missing users array" }),
        { status: 400 }
      );
    }

    await kv.set("users", body.users);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("KV SET ERROR:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save users" }),
      { status: 500 }
    );
  }
}