import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  autoFocus?: boolean;
  min?: number;
  max?: number;
}

/**
 * CurrencyInput - Formata valores monetários em Real brasileiro (BRL)
 * Permite digitação natural com preenchimento de centavos automático (ex: digitar 1500 vira R$ 15,00).
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  id,
  className = '',
  placeholder = 'R$ 0,00',
  disabled = false,
  prefix = 'R$ ',
  autoFocus = false,
  min = 0,
  max
}) => {
  // Convert number to integer cents for mask tracking
  const formatCents = (cents: number): string => {
    const val = cents / 100;
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Keep an internal cents representation based on incoming value prop
  const [cents, setCents] = useState<number>(() => Math.round((Number(value) || 0) * 100));

  useEffect(() => {
    const nextCents = Math.round((Number(value) || 0) * 100);
    if (nextCents !== cents) {
      setCents(nextCents);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const nextCents = Math.floor(cents / 10);
      setCents(nextCents);
      onChange(nextCents / 100);
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      setCents(0);
      onChange(0);
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const digit = parseInt(e.key, 10);
      // Maximum safe value (R$ 999.999,99)
      if (cents > 99999999) return;
      const nextCents = cents * 10 + digit;
      if (max !== undefined && nextCents / 100 > max) return;
      setCents(nextCents);
      onChange(nextCents / 100);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    // Normalize pasted text like "1.250,50" or "1250.50" or "R$ 45,00"
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= min) {
      const nextCents = Math.round(parsed * 100);
      setCents(nextCents);
      onChange(nextCents / 100);
    }
  };

  const displayString = cents === 0 && !value ? '' : `${prefix}${formatCents(cents)}`;

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={displayString}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={() => {}} // Controlled by onKeyDown for reliable masking
      className={className}
    />
  );
};
