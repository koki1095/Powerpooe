import { useSettings } from '../context/SettingsContext';

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
};

export const formatCurrency = (amount, currency = 'USD') => {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const useCurrencyFormatter = () => {
  const { settings } = useSettings();
  
  return {
    format: (amount) => formatCurrency(amount, settings.currency),
    symbol: currencySymbols[settings.currency] || '$',
    currency: settings.currency,
  };
};
