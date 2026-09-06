const SLUG = 'transcript-tidy-reader';
export const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;

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

  return { unlocked: verdict?.valid ?? false, reason: verdict?.valid === false ? verdict.reason : undefined };
}
