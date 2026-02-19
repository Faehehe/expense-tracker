import { useState, useEffect } from 'react';
import { useExpenses } from '../hooks/useExpenses';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ExpenseList({ refreshKey }) {
  const [filterCategory, setFilterCategory] = useState('');
  const [sort, setSort] = useState('date_desc');

  const { expenses, categories, loading, error, total, refetch } =
    useExpenses({ category: filterCategory, sort });

  useEffect(() => {
    if (refreshKey > 0) refetch();
  }, [refreshKey]); // eslint-disable-line

  return (
    <section className="expense-list-section">
      <div className="list-header">
        <h2>Expenses</h2>
        <div className="list-controls">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="total-bar">
        <span>
          {filterCategory ? `Total for "${filterCategory}"` : 'Total'}:{' '}
          <strong>{formatCurrency(total)}</strong>
        </span>
        <span className="count">{expenses.length} item{expenses.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <p className="state-msg">Loading…</p>}
      {error && (
        <div className="state-msg error">
          <p>Failed to load: {error}</p>
          <button onClick={refetch} className="btn-retry">Retry</button>
        </div>
      )}
      {!loading && !error && expenses.length === 0 && (
        <p className="state-msg empty">No expenses yet. Add one above!</p>
      )}

      {!loading && expenses.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Category</th>
                <th>Description</th><th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td data-label="Date">{formatDate(exp.date)}</td>
                  <td data-label="Category"><span className="badge">{exp.category}</span></td>
                  <td data-label="Description">{exp.description}</td>
                  <td data-label="Amount" className="amount-col">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="total-label">
                  {filterCategory ? `Total (${filterCategory})` : 'Total'}
                </td>
                <td className="amount-col total-value">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}