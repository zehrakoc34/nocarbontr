const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
});

export async function sbSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase select failed: ${await res.text()}`);
  return res.json();
}

export async function sbInsert<T>(table: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${await res.text()}`);
  const rows = await res.json();
  return rows[0];
}

export async function sbUpdate(table: string, match: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase update failed: ${await res.text()}`);
}

export async function sbDelete(table: string, match: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase delete failed: ${await res.text()}`);
}
