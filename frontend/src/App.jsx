import { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import './App.css';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <p>Track where your money goes</p>
      </header>
      <main className="app-main">
        <ExpenseForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        <ExpenseList refreshKey={refreshKey} />
      </main>
    </div>
  );
}