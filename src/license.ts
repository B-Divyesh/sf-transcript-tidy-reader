const SLUG = 'transcript-tidy-reader';
export const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;
export const CHECKOUT_URL = `https://api.sociobot.in/api/v1/products/${SLUG}/checkout`;

interface Verdict {
  valid: boolean;
  reason: string;
  checkedAt: number;
}

export async function getLicenseState(): Promise<{ unlocked: boolean; reason?: string }> {
  const stored = await browser.storage.local.get([LICENSE_KEY, VERDICT_KEY]);
  const token = stored[LICENSE_KEY] as string | undefined;
  const verdict = stored[VERDICT_KEY] as Verdict | undefined;
  if (!token) return { unlocked: false };

  const fresh = verdict && Date.now() - verdict.checkedAt < DAY;
  if (!fresh && navigator.onLine) void verifyLicense(token);
  return { unlocked: verdict?.valid ?? true, reason: verdict?.valid === false ? verdict.reason : undefined };
}

export async function saveAndVerifyLicense(token: string): Promise<{ valid: boolean; reason: string }> {
  const clean = token.trim();
  if (!clean) return { valid: false, reason: 'Enter the license from your receipt.' };
  await browser.storage.local.set({ [LICENSE_KEY]: clean });
  return verifyLicense(clean);
}

async function verifyLicense(token: string): Promise<{ valid: boolean; reason: string }> {
  try {
    const url = `https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Verification unavailable');
    const data = (await response.json()) as { valid: boolean; reason: string };
    await browser.storage.local.set({ [VERDICT_KEY]: { ...data, checkedAt: Date.now() } });
    return data;
  } catch {
    return { valid: true, reason: 'Offline; using the saved license.' };
  }
}
