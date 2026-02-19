import { useState, useEffect, useCallback } from 'react';
import { getExpenses, getCategories } from '../api/expenses';

export function useExpenses(filters) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses(filters);
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.sort]); // eslint-disable-line

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return { expenses, categories, loading, error, total, refetch: fetchExpenses };
}