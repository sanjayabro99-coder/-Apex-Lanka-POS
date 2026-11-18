// Currency formatting and note calculation for Sri Lankan Rupee (LKR)

export function formatCurrency(amount: number, currency: string = 'රු.'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${currency} ${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface Denomination {
  note: number;
  count: number;
}

// Breakdown of notes to give for change
export function calculateDenominations(changeAmount: number): Denomination[] {
  if (changeAmount <= 0) return [];

  const notes = [5000, 1000, 500, 100, 50, 20, 10];
  let remaining = Math.floor(changeAmount);
  const result: Denomination[] = [];

  for (const note of notes) {
    if (remaining >= note) {
      const count = Math.floor(remaining / note);
      result.push({ note, count });
      remaining = remaining % note;
    }
  }

  return result;
}
