import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  ShieldCheck, Trash2, TrendingUp, PiggyBank, Briefcase, Landmark,
  Calendar, Check, Download, AlertCircle, FileText
} from 'lucide-react';
import {
  FinanceAccount, FinanceTransaction, Loan, LoanPayment,
  Investment, SavingsPlan, Asset, Liability, FinancialGoal
} from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface FinanceViewProps {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  loans: Loan[];
  loanPayments?: LoanPayment[];
  investments: Investment[];
  savingsPlans: SavingsPlan[];
  assets?: Asset[];
  liabilities?: Liability[];
  financialGoals?: FinancialGoal[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  accounts,
  transactions,
  loans,
  loanPayments = [],
  investments,
  savingsPlans,
  assets = [],
  liabilities = [],
  financialGoals = [],
  onRefresh,
  onSuccess
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'loans' | 'investments' | 'savings' | 'balanceSheet'>('overview');

  // New Transaction Form state
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer' | 'investment' | 'loan'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAccount, setTxAccount] = useState(accounts[0]?.id || '');
  const [txToAccount, setTxToAccount] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(today);

  // New Account Form
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState<'bank' | 'cash' | 'wallet'>('bank');
  const [acctBalance, setAcctBalance] = useState('');

  // New Loan Form
  const [loanName, setLoanName] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTenure, setLoanTenure] = useState('60');

  // Loan Payment Form
  const [payLoanId, setPayLoanId] = useState(loans[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');
  const [payAcctId, setPayAcctId] = useState(accounts[0]?.id || '');

  // New Liability Form (in Loans & Liabilities)
  const [liabName, setLiabName] = useState('');
  const [liabVal, setLiabVal] = useState('');
  const [liabCategory, setLiabCategory] = useState('Credit Card');
  const [liabDueDate, setLiabDueDate] = useState('');

  // New Investment Form
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrentVal, setInvCurrentVal] = useState('');

  // New Savings Form
  const [saveName, setSaveName] = useState('');
  const [saveCurrent, setSaveCurrent] = useState('');
  const [saveTarget, setSaveTarget] = useState('');
  const [saveMonths, setSaveMonths] = useState('12');

  // Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetVal, setAssetVal] = useState('');

  // Transactions Filter
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer' | 'repayment' | 'investment'>('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ store: string; id: string; name: string } | null>(null);

  // Auto-synchronize dropdown selections when asynchronous data arrives
  useEffect(() => {
    if (accounts.length > 0) {
      if (!txAccount || !accounts.some(a => a.id === txAccount)) {
        setTxAccount(accounts[0].id);
      }
      if (!txToAccount || !accounts.some(a => a.id === txToAccount)) {
        setTxToAccount(accounts[1]?.id || accounts[0].id);
      }
      if (!payAcctId || !accounts.some(a => a.id === payAcctId)) {
        setPayAcctId(accounts[0].id);
      }
    }
  }, [accounts, txAccount, txToAccount, payAcctId]);

  useEffect(() => {
    if (loans.length > 0) {
      if (!payLoanId || !loans.some(l => l.id === payLoanId)) {
        setPayLoanId(loans[0].id);
      }
    }
  }, [loans, payLoanId]);

  // Core Financial Mathematics
  let income = 0;
  let expense = 0;
  let investmentFlow = 0;
  let loanReceived = 0;
  let repaymentFlow = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') income += amt;
    else if (t.type === 'expense') expense += amt;
    else if (t.type === 'investment') investmentFlow += amt;
    else if (t.type === 'loan') loanReceived += amt;
    else if (t.type === 'repayment') repaymentFlow += amt;
  });

  const operatingCashFlow = income - expense;
  const investingCashFlow = -investmentFlow;
  const financingCashFlow = loanReceived - repaymentFlow;
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  const liquidCash = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const investmentValue = investments.reduce((sum, i) => sum + (Number(i.currentValue) || Number(i.amount) || 0), 0);
  const manualAssetsVal = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  const totalAssets = liquidCash + investmentValue + manualAssetsVal;

  const totalLoanLiabilities = loans.reduce((sum, l) => sum + (Number(l.outstanding) || 0), 0);
  const manualLiabilitiesVal = liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalLiabilities = totalLoanLiabilities + manualLiabilitiesVal;

  const netWorth = totalAssets - totalLiabilities;

  const loanEmi = (p: number, r: number, n: number) => {
    if (!p || !n) return 0;
    const m = r / 1200;
    if (!m) return p / n;
    return (p * m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount);
    if (!amt || amt <= 0) return;
    const now = Date.now();

    const selectedAccount = txAccount || accounts[0]?.id;
    const selectedToAccount = txToAccount || accounts[1]?.id || accounts[0]?.id;

    if (txType === 'transfer') {
      if (!selectedAccount || !selectedToAccount || selectedAccount === selectedToAccount) {
        alert('Please choose distinct source and destination accounts.');
        return;
      }
      const fromAcct = accounts.find(a => a.id === selectedAccount);
      const toAcct = accounts.find(a => a.id === selectedToAccount);
      if (!fromAcct || !toAcct) return;

      fromAcct.balance -= amt;
      toAcct.balance += amt;
      await storage.put('financeAccounts', fromAcct);
      await storage.put('financeAccounts', toAcct);

      const tx: FinanceTransaction = {
        id: generateUUID(),
        type: 'transfer',
        amount: amt,
        category: 'Account Transfer',
        date: txDate,
        note: txNote.trim() || undefined,
        fromAccountId: selectedAccount,
        toAccountId: selectedToAccount,
        createdAt: now
      };
      await storage.put('finance', tx);
      onSuccess(`₹${amt.toLocaleString('en-IN')} transferred from ${fromAcct.name} to ${toAcct.name}`);
    } else {
      const acct = accounts.find(a => a.id === selectedAccount);
      if (acct) {
        if (txType === 'expense' || txType === 'investment') acct.balance -= amt;
        if (txType === 'income' || txType === 'loan') acct.balance += amt;
        await storage.put('financeAccounts', acct);
      }

      const tx: FinanceTransaction = {
        id: generateUUID(),
        type: txType,
        amount: amt,
        category: txCategory.trim() || (txType === 'income' ? 'Income' : 'Expense'),
        date: txDate,
        note: txNote.trim() || undefined,
        accountId: selectedAccount || null,
        createdAt: now
      };
      await storage.put('finance', tx);
      onSuccess('Transaction committed to ledger');
    }

    setTxAmount('');
    setTxNote('');
    onRefresh();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acctName.trim()) return;
    const opening = Number(acctBalance) || 0;
    const newAcct: FinanceAccount = {
      id: generateUUID(),
      name: acctName.trim(),
      type: acctType,
      balance: opening,
      openingBalance: opening,
      createdAt: Date.now()
    };
    await storage.put('financeAccounts', newAcct);
    onSuccess(`Account "${acctName}" created`);
    setAcctName('');
    setAcctBalance('');
    onRefresh();
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(loanPrincipal);
    if (!loanName.trim() || p <= 0) return;

    const newLoan: Loan = {
      id: generateUUID(),
      name: loanName.trim(),
      principal: p,
      rate: Number(loanRate) || 0,
      tenure: Number(loanTenure) || 12,
      dueDay: 5,
      outstanding: p,
      createdAt: Date.now()
    };
    await storage.put('loans', newLoan);
    setPayLoanId(newLoan.id);
    onSuccess('Loan liability registered');
    setLoanName('');
    setLoanPrincipal('');
    onRefresh();
  };

  const handleRecordLoanPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    const targetLoanId = payLoanId || loans[0]?.id;
    const loan = loans.find(l => l.id === targetLoanId);
    
    if (!loan) {
      alert('Please select a valid loan from the dropdown.');
      return;
    }
    if (amt <= 0) {
      alert('Please enter a payment amount greater than zero.');
      return;
    }

    const outstanding = Number(loan.outstanding) || 0;
    const paid = Math.min(amt, outstanding);
    const monthlyRate = (Number(loan.rate) || 0) / 1200;
    const interest = Math.min(paid, outstanding * monthlyRate);
    const principal = Math.max(0, paid - interest);

    const sourceAccountId = payAcctId || accounts[0]?.id;
    if (sourceAccountId) {
      const acct = accounts.find(a => a.id === sourceAccountId);
      if (acct) {
        acct.balance -= paid;
        await storage.put('financeAccounts', acct);
      }
    }

    loan.outstanding = Math.max(0, outstanding - principal);
    await storage.put('loans', loan);

    const paymentId = generateUUID();
    const payment: LoanPayment = {
      id: paymentId,
      loanId: loan.id,
      loanName: loan.name,
      amount: paid,
      principal,
      interest,
      date: today,
      accountId: sourceAccountId || null,
      createdAt: Date.now()
    };
    await storage.put('loanPayments', payment);

    const tx: FinanceTransaction = {
      id: generateUUID(),
      type: 'repayment',
      amount: paid,
      principal,
      interest,
      category: 'Loan Repayment',
      date: today,
      note: `${loan.name} (Principal: ₹${principal.toFixed(0)}, Interest: ₹${interest.toFixed(0)})`,
      accountId: sourceAccountId || null,
      linkedLoanId: loan.id,
      linkedLoanPaymentId: paymentId,
      createdAt: Date.now()
    };
    await storage.put('finance', tx);

    onSuccess(`Loan payment logged: Principal ₹${principal.toFixed(0)}, Interest ₹${interest.toFixed(0)}`);
    setPayAmount('');
    onRefresh();
  };

  // Add Liability (Other payables, Credit cards, Personal debts)
  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName.trim() || !liabVal) return;
    const l: Liability = {
      id: generateUUID(),
      name: liabName.trim(),
      amount: Number(liabVal) || 0
    };
    await storage.put('liabilities', l);
    onSuccess(`Liability "${liabName}" added`);
    setLiabName('');
    setLiabVal('');
    setLiabDueDate('');
    onRefresh();
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(invAmount);
    if (!invName.trim() || amt <= 0) return;

    const inv: Investment = {
      id: generateUUID(),
      name: invName.trim(),
      amount: amt,
      currentValue: Number(invCurrentVal) || amt,
      date: today,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('investments', inv);
    onSuccess('Investment added to portfolio');
    setInvName('');
    setInvAmount('');
    setInvCurrentVal('');
    onRefresh();
  };

  const handleCreateSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    const sp: SavingsPlan = {
      id: generateUUID(),
      name: saveName.trim(),
      currentAmount: Number(saveCurrent) || 0,
      targetAmount: Number(saveTarget) || 0,
      durationMonths: Number(saveMonths) || 12,
      createdAt: Date.now()
    };
    await storage.put('savingsPlans', sp);
    onSuccess('Savings goal registered');
    setSaveName('');
    setSaveCurrent('');
    setSaveTarget('');
    onRefresh();
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetVal) return;
    const a: Asset = {
      id: generateUUID(),
      name: assetName.trim(),
      value: Number(assetVal) || 0
    };
    await storage.put('assets', a);
    onSuccess(`Asset "${assetName}" saved to balance sheet`);
    setAssetName('');
    setAssetVal('');
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await storage.delete(deleteTarget.store, deleteTarget.id);
    onSuccess(`✓ Removed "${deleteTarget.name}"`);
    setDeleteTarget(null);
    onRefresh();
  };

  // Export Transactions as CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Note', 'AccountId'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.accountId || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-ledger-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onSuccess('Ledger exported as CSV');
  };

  const filteredTransactions = transactions.filter(t => {
    if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const match = `${t.category} ${t.note || ''} ${t.type} ${t.amount}`.toLowerCase();
      return match.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Finance & Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sovereign financial system: liquid accounts, cash flow, amortization loans, liabilities, investments, and net worth balance sheet.
          </p>
        </div>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Worth</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium truncate">
            Assets ₹{totalAssets.toLocaleString('en-IN')} - Debt ₹{totalLiabilities.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Liquid Cash</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            ₹{liquidCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">Across {accounts.length} bank & cash accounts</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Investments</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ₹{investmentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">{investments.length} portfolio assets</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Debt</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            ₹{totalLiabilities.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">
            {loans.length} loans · {liabilities.length} liabilities
          </div>
        </div>
      </div>

      {/* Submenu Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Cash Flow & Accounts' },
          { id: 'transactions', label: `Transactions (${transactions.length})` },
          { id: 'loans', label: `Loans & Liabilities (${loans.length + liabilities.length})` },
          { id: 'investments', label: `Investments (${investments.length})` },
          { id: 'savings', label: `Savings & Goals (${savingsPlans.length})` },
          { id: 'balanceSheet', label: `Assets & Balance Sheet (${assets.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview & Accounts */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Record Transaction Form (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Record Transaction</h2>
            </div>

            <form onSubmit={handleCreateTransaction} className="mt-4 space-y-3">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 rounded-lg py-1.5 font-medium transition-colors cursor-pointer ${
                    txType === 'expense' ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-700 dark:text-rose-400' : 'text-slate-500'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 rounded-lg py-1.5 font-medium transition-colors cursor-pointer ${
                    txType === 'income' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('transfer')}
                  className={`flex-1 rounded-lg py-1.5 font-medium transition-colors cursor-pointer ${
                    txType === 'transfer' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  Transfer
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {txType !== 'transfer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Category</label>
                    <input
                      type="text"
                      required
                      value={txCategory}
                      onChange={e => setTxCategory(e.target.value)}
                      placeholder="e.g. Groceries, Tech"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Account</label>
                    <select
                      value={txAccount || accounts[0]?.id || ''}
                      onChange={e => setTxAccount(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {accounts.length === 0 ? (
                        <option value="">No account available</option>
                      ) : (
                        accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">From Account</label>
                    <select
                      value={txAccount || accounts[0]?.id || ''}
                      onChange={e => setTxAccount(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">To Account</label>
                    <select
                      value={txToAccount || accounts[1]?.id || accounts[0]?.id || ''}
                      onChange={e => setTxToAccount(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Note / Memo</label>
                <input
                  type="text"
                  value={txNote}
                  onChange={e => setTxNote(e.target.value)}
                  placeholder="Optional detail or reference..."
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Commit Transaction to Ledger
              </button>
            </form>
          </div>

          {/* Accounts & Cash Flow Statement (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Liquid Accounts Manager */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Accounts & Wallets ({accounts.length})
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map(a => (
                  <div key={a.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">{a.type} account</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                        ₹{Number(a.balance).toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ store: 'financeAccounts', id: a.id, name: a.name })}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                        title="Delete account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Account Inline Form */}
              <form onSubmit={handleCreateAccount} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="New Account Name (e.g. HDFC, Cash Vault)"
                  value={acctName}
                  onChange={e => setAcctName(e.target.value)}
                  className="flex-1 min-w-[150px] h-8 rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={acctType}
                  onChange={e => setAcctType(e.target.value as any)}
                  className="h-8 rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
                <input
                  type="number"
                  placeholder="Opening ₹"
                  value={acctBalance}
                  onChange={e => setAcctBalance(e.target.value)}
                  className="w-24 h-8 rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                >
                  + Add Account
                </button>
              </form>
            </div>

            {/* Operating & Cash Flow Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                Cash Flow Statement
              </h2>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-500">Gross Income Received:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{income.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-500">Operating Expenses Paid:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-₹{expense.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40 font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Net Operating Cash Flow:</span>
                  <span className={`font-mono font-bold ${operatingCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{operatingCashFlow.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-500">Investments Capital Deployed:</span>
                  <span className="font-mono font-bold text-blue-600">-₹{investmentFlow.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-slate-900 dark:text-white">
                  <span>Net Ledger Delta:</span>
                  <span className={`font-mono ${netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ₹{netCashFlow.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Loans & Liabilities */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Forms: Create Loan, Record Payment & Add Liability */}
          <div className="lg:col-span-5 space-y-6">
            {/* Record EMI / Payment Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center justify-between">
                <span>Record Loan EMI / Payment</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-amortizes balance</span>
              </h2>
              <form onSubmit={handleRecordLoanPayment} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Select Loan ({loans.length} active)
                  </label>
                  <select
                    value={payLoanId || (loans[0]?.id ?? '')}
                    onChange={e => setPayLoanId(e.target.value)}
                    disabled={loans.length === 0}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  >
                    {loans.length === 0 ? (
                      <option value="">No active loans registered yet</option>
                    ) : (
                      loans.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} — Outstanding: ₹{Number(l.outstanding).toLocaleString('en-IN')}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="EMI amount"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Pay From Account</label>
                    <select
                      value={payAcctId || (accounts[0]?.id ?? '')}
                      onChange={e => setPayAcctId(e.target.value)}
                      disabled={accounts.length === 0}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loans.length === 0}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  Record Loan Repayment
                </button>
              </form>
            </div>

            {/* Register Loan Liability */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                Register New Loan
              </h2>
              <form onSubmit={handleCreateLoan} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Loan Name</label>
                  <input
                    type="text"
                    required
                    value={loanName}
                    onChange={e => setLoanName(e.target.value)}
                    placeholder="e.g. Home Mortgage, Vehicle Loan, Student Loan"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Principal (₹)</label>
                    <input
                      type="number"
                      required
                      value={loanPrincipal}
                      onChange={e => setLoanPrincipal(e.target.value)}
                      placeholder="100000"
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Interest %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanRate}
                      onChange={e => setLoanRate(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Months</label>
                    <input
                      type="number"
                      value={loanTenure}
                      onChange={e => setLoanTenure(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
                >
                  + Add Loan to Ledger
                </button>
              </form>
            </div>

            {/* Add Other Liabilities & Payables Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                Add Other Liability / Payable
              </h2>
              <form onSubmit={handleAddLiability} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Liability Name</label>
                  <input
                    type="text"
                    required
                    value={liabName}
                    onChange={e => setLiabName(e.target.value)}
                    placeholder="e.g. Credit Card Balance, IOU to Partner, Vendor Dues"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount Due (₹)</label>
                    <input
                      type="number"
                      required
                      value={liabVal}
                      onChange={e => setLiabVal(e.target.value)}
                      placeholder="15000"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Category</label>
                    <select
                      value={liabCategory}
                      onChange={e => setLiabCategory(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Vendor / Invoice">Vendor / Invoice</option>
                      <option value="Taxes Due">Taxes Due</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  + Register Liability
                </button>
              </form>
            </div>
          </div>

          {/* Right Lists: Active Loans and Other Liabilities */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Loans List with Amortization */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Loans & Amortization ({loans.length})
                </h2>
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  Total Debt: ₹{totalLoanLiabilities.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {loans.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active loans registered in system.
                  </div>
                ) : (
                  loans.map(l => {
                    const emi = loanEmi(l.principal, l.rate, l.tenure);
                    return (
                      <div key={l.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 transition-all hover:border-slate-200 dark:hover:border-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                              <span>{l.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {l.rate}% p.a. · {l.tenure} mos
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Original Principal: ₹{l.principal.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right flex items-start gap-2">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Outstanding</div>
                              <div className="font-mono text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                                ₹{Number(l.outstanding).toLocaleString('en-IN')}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ store: 'loans', id: l.id, name: l.name })}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              title="Delete loan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 text-[11px]">
                          <span className="text-slate-500">Calculated Monthly EMI:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ₹{emi.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Other Liabilities List */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Other Liabilities & Short-term Payables ({liabilities.length})
                </h2>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  Total: ₹{manualLiabilitiesVal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {liabilities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No short-term liabilities recorded.
                  </div>
                ) : (
                  liabilities.map(l => (
                    <div key={l.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 flex justify-between items-center group">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{l.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Payable / Liability</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          ₹{Number(l.amount).toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ store: 'liabilities', id: l.id, name: l.name })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                          title="Settle or delete liability"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Loan Payment History */}
            {loanPayments.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Recent Repayment Receipts ({loanPayments.length})
                </h2>
                <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs">
                  {loanPayments.slice().reverse().map(p => (
                    <div key={p.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{p.loanName}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.date} · Principal ₹{p.principal.toFixed(0)} + Interest ₹{p.interest.toFixed(0)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Investments Portfolio */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Add Investment Asset
            </h2>
            <form onSubmit={handleCreateInvestment} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Asset Name</label>
                <input
                  type="text"
                  required
                  value={invName}
                  onChange={e => setInvName(e.target.value)}
                  placeholder="e.g. Nifty 50 Index, Sovereign Gold, Tech Equity"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Invested Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={invAmount}
                    onChange={e => setInvAmount(e.target.value)}
                    placeholder="100000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Value (₹)</label>
                  <input
                    type="number"
                    value={invCurrentVal}
                    onChange={e => setInvCurrentVal(e.target.value)}
                    placeholder="115000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Register Investment in Portfolio
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Investment Portfolio ({investments.length})
              </h2>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                Portfolio: ₹{investmentValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {investments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No investment assets recorded yet.</div>
              ) : (
                investments.map(i => {
                  const invested = Number(i.amount) || 0;
                  const current = Number(i.currentValue || i.amount) || 0;
                  const gain = current - invested;
                  const roiPct = invested ? (gain / invested) * 100 : 0;
                  return (
                    <div key={i.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 flex justify-between items-center group">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{i.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Invested: ₹{invested.toLocaleString('en-IN')} · Date: {i.date}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            ₹{current.toLocaleString('en-IN')}
                          </div>
                          <div className={`font-mono text-[11px] font-bold ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {gain >= 0 ? '+' : ''}₹{gain.toLocaleString('en-IN')} ({roiPct.toFixed(1)}%)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ store: 'investments', id: i.id, name: i.name })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                          title="Delete investment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Savings & Goals */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Create Savings Plan
            </h2>
            <form onSubmit={handleCreateSavings} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Plan Name</label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="e.g. New Workstation, Emergency Vault, Travel Fund"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Amount (₹)</label>
                  <input
                    type="number"
                    value={saveCurrent}
                    onChange={e => setSaveCurrent(e.target.value)}
                    placeholder="25000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={saveTarget}
                    onChange={e => setSaveTarget(e.target.value)}
                    placeholder="100000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Register Savings Plan
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Active Savings Targets ({savingsPlans.length})
            </h2>
            <div className="mt-4 space-y-4">
              {savingsPlans.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No savings plans registered.</div>
              ) : (
                savingsPlans.map(sp => {
                  const target = Number(sp.targetAmount) || 1;
                  const current = Number(sp.currentAmount) || 0;
                  const pct = Math.min(100, (current / target) * 100);
                  return (
                    <div key={sp.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 group">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{sp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            ₹{current.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')} ({pct.toFixed(0)}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'savingsPlans', id: sp.id, name: sp.name })}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                            title="Delete savings plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Assets & Balance Sheet */}
      {activeTab === 'balanceSheet' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Asset Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Add Fixed / Physical Asset
            </h2>
            <form onSubmit={handleAddAsset} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Asset Title</label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  placeholder="e.g. Real Estate Property, Vehicle, Work Equipment"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Estimated Market Value (₹)</label>
                <input
                  type="number"
                  required
                  value={assetVal}
                  onChange={e => setAssetVal(e.target.value)}
                  placeholder="500000"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Register Asset on Balance Sheet
              </button>
            </form>
          </div>

          {/* Full Sovereign Balance Sheet */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex justify-between items-center">
              <span>Sovereign Balance Sheet</span>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Net Worth: ₹{netWorth.toLocaleString('en-IN')}
              </span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                  Total Assets (₹{totalAssets.toLocaleString('en-IN')})
                </h3>
                <div className="space-y-1.5 pl-2 border-l-2 border-emerald-500">
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>Liquid Bank & Cash ({accounts.length} accounts):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{liquidCash.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>Investment Portfolio ({investments.length} holdings):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{investmentValue.toLocaleString('en-IN')}</span>
                  </div>
                  {assets.map(a => (
                    <div key={a.id} className="flex justify-between py-1 text-slate-600 dark:text-slate-400 group">
                      <span className="flex items-center gap-1.5">
                        <span>• {a.name}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ store: 'assets', id: a.id, name: a.name })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{Number(a.value).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                  Total Liabilities (₹{totalLiabilities.toLocaleString('en-IN')})
                </h3>
                <div className="space-y-1.5 pl-2 border-l-2 border-rose-500">
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>Loan Balances ({loans.length} active):</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{totalLoanLiabilities.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>Other Liabilities ({liabilities.length} items):</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{manualLiabilitiesVal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Transactions List */}
      {activeTab === 'transactions' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Ledger Transactions ({filteredTransactions.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search ledger..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="h-8 w-44 rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 h-8 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All (${transactions.length})` },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
              { id: 'transfer', label: 'Transfers' },
              { id: 'repayment', label: 'Repayments' },
              { id: 'investment', label: 'Investments' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTxTypeFilter(f.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  txTypeFilter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No transactions match your current search or filter.
              </div>
            ) : (
              filteredTransactions.slice().reverse().map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {tx.category} {tx.note && <span className="font-normal text-slate-400">({tx.note})</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {tx.date} · <span className="capitalize font-medium">{tx.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ store: 'finance', id: tx.id, name: `${tx.category} (₹${tx.amount})` })}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete transaction record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Confirm Deletion"
        message={deleteTarget ? `Are you sure you want to remove "${deleteTarget.name}"? This action will permanently update your ledger.` : ''}
        confirmText="Remove Record"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
