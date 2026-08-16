const TIER_ABBREVIATIONS: Record<string, string> = {
  silver: 'SV',
  gold: 'GD',
  platinum: 'PL',
  diamond: 'DM',
};

export function tierAbbreviation(tierCode: string): string {
  return TIER_ABBREVIATIONS[tierCode.toLowerCase()] ?? tierCode.slice(0, 2).toUpperCase();
}

function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Last word of the given name, uppercased, diacritics stripped — e.g. "Nguyễn Thị Hạnh" -> "HANH" */
export function nameAbbreviation(fullName: string): string {
  const cleaned = stripDiacritics(fullName.trim()).replace(/[^a-zA-Z\s]/g, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? 'MEM';
  return last.toUpperCase();
}

function randomDigits(length: number): string {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

export function generateReferralCode(fullName: string): string {
  return `SM-${nameAbbreviation(fullName)}-${randomDigits(3)}`;
}

export function generateCardCode(tierCode: string): string {
  return `SM-${tierAbbreviation(tierCode)}-${randomDigits(4)}`;
}

export function generateVoucherCode(): string {
  return `SMV-${randomDigits(5)}`;
}

export function generateReferralDisplayCode(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `GT-${yy}${mm}-${randomDigits(3)}`;
}
