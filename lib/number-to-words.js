/**
 * Converts a number to English words in uppercase.
 * Example: 60000 → "SIXTY THOUSAND"
 */

const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

const scales = ['', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION'];

function convertHundreds(num) {
  let result = '';
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' HUNDRED';
    num %= 100;
    if (num > 0) result += ' AND ';
  }
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += '-' + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }
  return result;
}

export function numberToWords(amount) {
  if (amount === 0) return 'ZERO';
  if (isNaN(amount) || amount < 0) return '';

  const intPart = Math.floor(amount);
  const cents = Math.round((amount - intPart) * 100);

  if (intPart === 0 && cents > 0) {
    return convertHundreds(cents) + ' CENTS';
  }

  let words = '';
  let scaleIndex = 0;
  let remaining = intPart;

  const parts = [];
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      const scale = scales[scaleIndex];
      parts.unshift(scale ? chunkWords + ' ' + scale : chunkWords);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  words = parts.join(', ');

  if (cents > 0) {
    words += ' AND ' + convertHundreds(cents) + ' CENTS';
  }

  return words;
}

export function numberToWordsWithCurrency(amount, currency = 'US DOLLARS') {
  const words = numberToWords(amount);
  return words ? words + ' ' + currency : '';
}
