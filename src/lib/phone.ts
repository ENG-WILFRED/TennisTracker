export interface PhoneFormattingResult {
  normalized?: string;
  error?: string;
}

export function formatKenyanMobileNumber(value: string): PhoneFormattingResult {
  if (!value || typeof value !== 'string') {
    return { error: 'Mobile number is required' };
  }

  const digits = value.trim().replace(/[^\d]/g, '');
  if (digits.length === 0) {
    return { error: 'Mobile number is required' };
  }

  if (digits.length === 10) {
    if (!digits.startsWith('0')) {
      return { error: 'A 10-digit number must start with 0' };
    }
    return { normalized: `254${digits.slice(1)}` };
  }

  if (digits.length === 12) {
    if (!digits.startsWith('254')) {
      return { error: 'A 12-digit number must start with 254' };
    }
    return { normalized: digits };
  }

  return {
    error: 'Mobile number must be either 10 digits starting with 0, or 12 digits starting with 254',
  };
}
