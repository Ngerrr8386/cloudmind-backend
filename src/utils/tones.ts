/** Bảng tone phẳng — đồng bộ với frontend (CloudMind & Admin). */
export const TONES = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose', 'slate'] as const
export type Tone = (typeof TONES)[number]

export function isTone(v: unknown): v is Tone {
  return typeof v === 'string' && (TONES as readonly string[]).includes(v)
}
