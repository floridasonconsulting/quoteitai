import { Quote, QuoteAge, AgingSummary } from '@/types';

export const getQuoteAge = (quote: Quote): QuoteAge => {
  if (quote.status !== 'sent' || !quote.sentDate) {
    return 'fresh';
  }

  const sentDate = new Date(quote.sentDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return 'fresh';
  if (daysDiff <= 14) return 'warm';
  if (daysDiff <= 30) return 'aging';
  return 'stale';
};

export const getAgingSummary = (quotes: Quote[]): AgingSummary => {
  const summary: AgingSummary = {
    fresh: 0,
    warm: 0,
    aging: 0,
    stale: 0,
  };

  quotes.forEach(quote => {
    const age = getQuoteAge(quote);
    summary[age]++;
  });

  return summary;
};

export const generateQuoteNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `Q${year}${month}-${random}`;
};

export const calculateItemTotal = (quantity: number, price: number): number => {
  return quantity * price;
};

export const calculateQuoteTotal = (items: { quantity: number; price: number }[]): number => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.price), 0);
};
