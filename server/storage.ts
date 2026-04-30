// Storage helper — supports Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
// Falls back gracefully for local dev without storage configured.

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key ? { url, key } : null;
};

const BUCKET = "nocarbontr-files";

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const cfg = getSupabaseConfig();

  if (!cfg) {
    console.warn("[Storage] No Supabase config — file not persisted:", relKey);
    return { key: relKey, url: `/api/files/${relKey}` };
  }

  const blob = typeof data === "string"
    ? new Blob([data], { type: contentType })
    : new Blob([data as Uint8Array], { type: contentType });

  const uploadUrl = `${cfg.url}/storage/v1/object/${BUCKET}/${relKey}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: blob,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Storage upload failed (${res.status}): ${msg}`);
  }

  const publicUrl = `${cfg.url}/storage/v1/object/public/${BUCKET}/${relKey}`;
  return { key: relKey, url: publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { key: relKey, url: `/api/files/${relKey}` };
  return { key: relKey, url: `${cfg.url}/storage/v1/object/public/${BUCKET}/${relKey}` };
}
