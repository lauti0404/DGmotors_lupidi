type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(_request: unknown, response: VercelResponse) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const timestamp = new Date().toISOString();
  if (!url || !key) {
    response.status(500).json({ ok: false, timestamp });
    return;
  }
  try {
    const result = await fetch(`${url}/rest/v1/perfiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    response.status(result.ok ? 200 : 502).json({ ok: result.ok, timestamp });
  } catch {
    response.status(502).json({ ok: false, timestamp });
  }
}
