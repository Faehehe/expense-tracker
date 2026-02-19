import { useState, useRef } from 'react';
import { createExpense, ApiError } from '../api/expenses';

const CATEGORIES = [
  'Food','Transport','Housing','Healthcare',
  'Entertainment','Shopping','Utilities','Other',
];

function generateKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ExpenseForm({ onSuccess }) {
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [apiError, setApiError] = useState('');
  const idempotencyKeyRef = useRef(generateKey());

  const validate = () => {
    const errs = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) errs.amount = 'Enter a positive amount';
    else if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) errs.amount = 'Max 2 decimal places';
    if (!form.category) errs.category = 'Select a category';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('submitting');
    setApiError('');

    try {
      await createExpense({
        idempotencyKey: idempotencyKeyRef.current,
        amount: form.amount,
        category: form.category,
        description: form.description.trim(),
        date: form.date,
      });

      setStatus('success');
      setForm({ amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) });
      idempotencyKeyRef.current = generateKey();
      setErrors({});
      onSuccess();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setApiError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} noValidate className="expense-form">
      <h2>Add Expense</h2>

      <div className="form-row">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01"
            placeholder="0.00" value={form.amount} onChange={handleChange}
            aria-invalid={!!errors.amount} disabled={isSubmitting} />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category}
            onChange={handleChange} aria-invalid={!!errors.category} disabled={isSubmitting}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input id="description" name="description" type="text"
          placeholder="What was this for?" value={form.description}
          onChange={handleChange} maxLength={500}
          aria-invalid={!!errors.description} disabled={isSubmitting} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={form.date}
          onChange={handleChange} aria-invalid={!!errors.date} disabled={isSubmitting} />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </div>

      {apiError && <p className="api-error">{apiError}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? 'Saving…' : status === 'success' ? '✓ Saved!' : 'Add Expense'}
      </button>
    </form>
  );
}
