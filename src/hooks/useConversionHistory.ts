import { useState, useCallback, useEffect } from 'react';
import type { ConversionHistoryItem, DataFormat } from '../types';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'conversion_history';
const MAX_HISTORY = 50;

export function useConversionHistory() {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addHistory = useCallback((input: string, output: string, sourceFormat: DataFormat, targetFormat: DataFormat) => {
    const item: ConversionHistoryItem = {
      id: generateId(),
      timestamp: Date.now(),
      sourceFormat,
      targetFormat,
      input,
      output,
    };
    setHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    history,
    addHistory,
    clearHistory,
    removeHistory,
  };
}
