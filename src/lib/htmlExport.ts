import { storage } from './storage';

/**
 * Escapes characters for safe embedding inside HTML content.
 */
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a complete, single-file standalone offline HTML dashboard.
 * Contains all user data embedded directly into the document.
 * Zero external dependencies, CDN links, or network requests required.
 */
export function generateCompleteStandaloneHtml(data: Record<string, any>): string {
  const generatedAt = new Date().toLocaleString();
  const dateIso = new Date().toISOString().slice(0, 10);
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const notes = Array.isArray(data.notes) ? data.notes : [];
  const journal = Array.isArray(data.journal) ? data.journal : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const accounts = Array.isArray(data.financeAccounts) ? data.financeAccounts : [];
  const transactions = Array.isArray(data.finance) ? data.finance : [];
  const loans = Array.isArray(data.loans) ? data.loans : [];
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const people = Array.isArray(data.people) ? data.people : [];
  const healthProfile = data.healthProfile || {};

  const totalLiquid = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalDebt = loans.reduce((sum, l) => sum + (Number(l.outstanding) || 0), 0);
  const completedTasks = tasks.filter(t => t.done).length;
  const openTasks = tasks.length - completedTasks;

  // JSON safe for embedding inside <script>
  const serializedJson = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Om-LifeOS Complete Offline Dashboard · ${escapeHtml(dateIso)}</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #eef2ff;
      --success: #10b981;
      --success-light: #ecfdf5;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .dark {
      --bg: #090d16;
      --card-bg: #111827;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #1e293b;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-light: #1e1b4b;
      --success: #10b981;
      --success-light: #064e3b;
      --warning: #f59e0b;
      --danger: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 0;
      transition: background-color 0.2s, color 0.2s;
    }

    /* Top Navigation Bar */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      font-family: serif;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--text);
      transition: all 0.15s;
      text-decoration: none;
    }

    .btn:hover { background: var(--bg); }
    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .btn-primary:hover { background: var(--primary-hover); }

    /* Main Container */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Tabs Bar */
    .nav-tabs {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 4px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin-bottom: 24px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .tab-btn:hover { color: var(--text); background: var(--bg); }
    .tab-btn.active {
      background: var(--primary);
      color: white;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .pill-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(0,0,0,0.08);
    }
    .tab-btn.active .pill-badge {
      background: rgba(255,255,255,0.25);
      color: white;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .metric-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .metric-value {
      font-size: 24px;
      font-weight: 800;
      margin-top: 4px;
      letter-spacing: -0.02em;
    }

    .metric-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Section Header & Filter */
    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .search-input {
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--text);
      font-size: 13px;
      width: 260px;
      outline: none;
    }
    .search-input:focus { border-color: var(--primary); }

    /* Tables */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: var(--bg);
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg); }

    /* Badges */
    .tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: var(--bg);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .tag-high { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .tag-med { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .tag-low { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
    .tag-done { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .card-meta {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .card-body {
      font-size: 13px;
      color: var(--text);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 999px;
      transition: width 0.3s;
    }

    .json-code {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--bg);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    footer {
      text-align: center;
      padding: 32px 24px;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      margin-top: 48px;
    }

    @media print {
      header, .nav-tabs, .btn, .search-input { display: none !important; }
      .tab-content { display: block !important; margin-bottom: 30px; }
      body { background: white; color: black; }
    }
  </style>
</head>
<body>

  <!-- Top Navigation Header -->
  <header>
    <div class="brand">
      <div class="brand-logo">ॐ</div>
      <div>
        <div class="brand-title">Om-LifeOS Complete Offline Dashboard</div>
        <div class="brand-subtitle">Self-Contained Sovereign Snapshot · Generated: ${escapeHtml(generatedAt)}</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn" onclick="toggleDarkMode()">🌓 Toggle Theme</button>
      <button class="btn" onclick="window.print()">🖨 Print / Save PDF</button>
      <button class="btn btn-primary" onclick="downloadBackupJson()">💾 Download Raw .omlifeos</button>
    </div>
  </header>

  <div class="container">
    <!-- Top KPI Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Active Tasks</div>
        <div class="metric-value">${openTasks} <span style="font-size: 14px; font-weight: 500; color: var(--text-muted)">/ ${tasks.length} total</span></div>
        <div class="metric-sub">${completedTasks} tasks completed</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Liquid Net Worth</div>
        <div class="metric-value">₹${totalLiquid.toLocaleString('en-IN')}</div>
        <div class="metric-sub">${accounts.length} bank & cash accounts</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Liabilities</div>
        <div class="metric-value" style="color: ${totalDebt > 0 ? 'var(--danger)' : 'var(--text)'}">₹${totalDebt.toLocaleString('en-IN')}</div>
        <div class="metric-sub">${loans.length} active loans</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Goals & Strategy</div>
        <div class="metric-value">${goals.length}</div>
        <div class="metric-sub">Active long-term milestones</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Knowledge & Journal</div>
        <div class="metric-value">${notes.length + journal.length}</div>
        <div class="metric-sub">${notes.length} notes · ${journal.length} journal logs</div>
      </div>
    </div>

    <!-- Navigation Tabs Bar -->
    <nav class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('dashboard')">📊 Dashboard</button>
      <button class="tab-btn" onclick="switchTab('tasks')">📋 Tasks <span class="pill-badge">${tasks.length}</span></button>
      <button class="tab-btn" onclick="switchTab('finance')">💰 Finance & Ledger <span class="pill-badge">₹${totalLiquid.toLocaleString('en-IN')}</span></button>
      <button class="tab-btn" onclick="switchTab('notes')">📝 Notes <span class="pill-badge">${notes.length}</span></button>
      <button class="tab-btn" onclick="switchTab('journal')">📖 Journal <span class="pill-badge">${journal.length}</span></button>
      <button class="tab-btn" onclick="switchTab('goals')">🎯 Goals & Missions <span class="pill-badge">${goals.length}</span></button>
      <button class="tab-btn" onclick="switchTab('routines')">⚡ Routines & Habits <span class="pill-badge">${routines.length + habits.length}</span></button>
      <button class="tab-btn" onclick="switchTab('people')">👥 People & Network <span class="pill-badge">${people.length}</span></button>
      <button class="tab-btn" onclick="switchTab('raw')">💾 Raw Database JSON</button>
    </nav>

    <!-- Tab 1: Dashboard Overview -->
    <section id="tab-dashboard" class="tab-content active">
      <div class="section-header">
        <h2 class="section-title">High-Impact Focus & Life Pillars</h2>
      </div>

      <div class="cards-grid">
        <div class="card">
          <div class="card-title">🎯 Active Top Goals</div>
          <div style="margin-top: 10px;">
            ${goals.length === 0 ? '<div style="color:var(--text-muted); font-size:12px;">No active goals yet.</div>' : goals.slice(0, 4).map(g => `
              <div style="margin-bottom: 12px;">
                <div style="display:flex; justify-content:space-between; font-size: 13px; font-weight: 600;">
                  <span>${escapeHtml(g.title)}</span>
                  <span>${Number(g.progress || 0)}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Number(g.progress || 0)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">💰 Liquid Cash Reserve</div>
          <div style="margin-top: 10px;">
            ${accounts.length === 0 ? '<div style="color:var(--text-muted); font-size:12px;">No accounts recorded.</div>' : accounts.map(a => `
              <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px;">
                <span style="font-weight: 600;">${escapeHtml(a.name)} <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${escapeHtml(a.type)})</span></span>
                <span style="font-family:var(--font-mono); font-weight:700;">₹${Number(a.balance || 0).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">⚡ Daily Routines</div>
          <div style="margin-top: 10px;">
            ${routines.length === 0 ? '<div style="color:var(--text-muted); font-size:12px;">No routines set.</div>' : routines.map(r => `
              <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px;">
                <span><strong>${escapeHtml(r.startTime || '')} - ${escapeHtml(r.endTime || '')}</strong> ${escapeHtml(r.name)}</span>
                <span class="tag">${escapeHtml(r.frequency || 'Daily')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Tab 2: Tasks & Planner -->
    <section id="tab-tasks" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Tasks & Daily Command (${tasks.length})</h2>
        <input type="text" class="search-input" id="search-tasks" placeholder="Search tasks..." oninput="filterTable('tasks-table', this.value)">
      </div>

      <div class="table-container">
        <table id="tasks-table">
          <thead>
            <tr>
              <th style="width: 50px;">Status</th>
              <th>Task Title & Details</th>
              <th>Priority</th>
              <th>Domain</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>
                  <span class="tag ${t.done ? 'tag-done' : ''}">${t.done ? '✓ Done' : 'Open'}</span>
                </td>
                <td>
                  <div style="font-weight: 600; font-size: 14px; text-decoration: ${t.done ? 'line-through' : 'none'}; color: ${t.done ? 'var(--text-muted)' : 'inherit'};">
                    ${escapeHtml(t.title)}
                  </div>
                  ${t.description ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(t.description)}</div>` : ''}
                </td>
                <td>
                  <span class="tag ${t.priority === 'High' ? 'tag-high' : t.priority === 'Medium' ? 'tag-med' : 'tag-low'}">
                    ${escapeHtml(t.priority || 'Medium')}
                  </span>
                </td>
                <td><span class="tag">${escapeHtml(t.domain || 'general')}</span></td>
                <td style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(t.dueAt || t.date || '—')}</td>
              </tr>
            `).join('')}
            ${tasks.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">No tasks recorded.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 3: Finance & Ledger -->
    <section id="tab-finance" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Transactions Ledger (${transactions.length})</h2>
        <input type="text" class="search-input" id="search-finance" placeholder="Search transactions..." oninput="filterTable('finance-table', this.value)">
      </div>

      <div class="table-container">
        <table id="finance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Note / Description</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => `
              <tr>
                <td style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(tx.date || '—')}</td>
                <td>
                  <span class="tag ${tx.type === 'income' ? 'tag-done' : tx.type === 'expense' ? 'tag-high' : 'tag-low'}">
                    ${escapeHtml(tx.type || 'expense')}
                  </span>
                </td>
                <td><strong>${escapeHtml(tx.category || 'General')}</strong></td>
                <td>${escapeHtml(tx.note || '—')}</td>
                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${tx.type === 'income' ? 'var(--success)' : 'inherit'};">
                  ${tx.type === 'income' ? '+' : '-'}₹${Number(tx.amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            `).join('')}
            ${transactions.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">No transactions recorded.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 4: Notes & Notebooks -->
    <section id="tab-notes" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Notes & Knowledge Repository (${notes.length})</h2>
      </div>

      <div class="cards-grid">
        ${notes.map(n => `
          <div class="card">
            <div class="card-title">${escapeHtml(n.title || 'Untitled Note')}</div>
            <div class="card-meta">
              <span class="tag">${escapeHtml(n.category || 'General')}</span>
              <span>${escapeHtml(n.date || '')}</span>
              ${n.tags ? `<span>#${escapeHtml(n.tags)}</span>` : ''}
            </div>
            <div class="card-body">${escapeHtml(n.body || n.points || '')}</div>
          </div>
        `).join('')}
        ${notes.length === 0 ? '<div style="color: var(--text-muted); font-size: 13px;">No notes recorded.</div>' : ''}
      </div>
    </section>

    <!-- Tab 5: Journal -->
    <section id="tab-journal" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Journal Entries & Daily Reflection (${journal.length})</h2>
      </div>

      <div class="cards-grid">
        ${journal.map(j => `
          <div class="card">
            <div class="card-title">${escapeHtml(j.title || 'Daily Reflection')}</div>
            <div class="card-meta">
              <span>📅 ${escapeHtml(j.date || '')}</span>
            </div>
            <div class="card-body">${escapeHtml(j.text || '')}</div>
          </div>
        `).join('')}
        ${journal.length === 0 ? '<div style="color: var(--text-muted); font-size: 13px;">No journal entries recorded.</div>' : ''}
      </div>
    </section>

    <!-- Tab 6: Goals -->
    <section id="tab-goals" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Goals & Strategic Milestones (${goals.length})</h2>
      </div>

      <div class="cards-grid">
        ${goals.map(g => `
          <div class="card">
            <div class="card-title">${escapeHtml(g.title)}</div>
            <div class="card-meta">
              <span class="tag">${escapeHtml(g.category || 'Goal')}</span>
              <span class="tag ${g.status === 'completed' ? 'tag-done' : ''}">${escapeHtml(g.status || 'Active')}</span>
            </div>
            <div style="margin-top: 10px;">
              <div style="display:flex; justify-content:space-between; font-size: 12px; font-weight: 600;">
                <span>Progress</span>
                <span>${Number(g.progress || 0)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Number(g.progress || 0)}%"></div>
              </div>
            </div>
          </div>
        `).join('')}
        ${goals.length === 0 ? '<div style="color: var(--text-muted); font-size: 13px;">No goals recorded.</div>' : ''}
      </div>
    </section>

    <!-- Tab 7: Routines & Habits -->
    <section id="tab-routines" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Routines & Atomic Habits</h2>
      </div>

      <div class="cards-grid">
        <div class="card">
          <div class="card-title">🌅 Daily Routines (${routines.length})</div>
          <div style="margin-top: 12px;">
            ${routines.map(r => `
              <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
                <div style="font-weight: 700; font-size: 14px;">${escapeHtml(r.name)}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  ⏰ ${escapeHtml(r.startTime || '')} - ${escapeHtml(r.endTime || '')} · ${escapeHtml(r.frequency || 'Daily')}
                </div>
                ${r.note ? `<div style="font-size: 12px; margin-top: 4px;">${escapeHtml(r.note)}</div>` : ''}
              </div>
            `).join('')}
            ${routines.length === 0 ? '<div style="color: var(--text-muted); font-size: 12px;">No routines recorded.</div>' : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-title">🔥 Atomic Habits (${habits.length})</div>
          <div style="margin-top: 12px;">
            ${habits.map(h => `
              <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
                <div style="font-weight: 700; font-size: 14px;">${escapeHtml(h.name)}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  Frequency: ${escapeHtml(h.frequency || 'Daily')} · Target: ${escapeHtml(h.timesPerDay || 1)}x per day
                </div>
              </div>
            `).join('')}
            ${habits.length === 0 ? '<div style="color: var(--text-muted); font-size: 12px;">No habits recorded.</div>' : ''}
          </div>
        </div>
      </div>
    </section>

    <!-- Tab 8: People -->
    <section id="tab-people" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Relationships & People Roster (${people.length})</h2>
      </div>

      <div class="cards-grid">
        ${people.map(p => `
          <div class="card">
            <div class="card-title">${escapeHtml(p.name || 'Unnamed')}</div>
            <div class="card-meta">
              <span class="tag">${escapeHtml(p.relation || 'Contact')}</span>
              ${p.organization ? `<span>🏢 ${escapeHtml(p.organization)}</span>` : ''}
            </div>
            ${p.phone ? `<div style="font-size: 12px; margin-top: 4px;">📞 ${escapeHtml(p.phone)}</div>` : ''}
            ${p.email ? `<div style="font-size: 12px; margin-top: 2px;">✉️ ${escapeHtml(p.email)}</div>` : ''}
            ${p.notes ? `<div style="font-size: 12px; margin-top: 6px; color: var(--text-muted);">${escapeHtml(p.notes)}</div>` : ''}
          </div>
        `).join('')}
        ${people.length === 0 ? '<div style="color: var(--text-muted); font-size: 13px;">No contacts recorded.</div>' : ''}
      </div>
    </section>

    <!-- Tab 9: Raw Database JSON -->
    <section id="tab-raw" class="tab-content">
      <div class="section-header">
        <h2 class="section-title">Raw Database JSON Snapshot</h2>
        <div style="display:flex; gap: 8px;">
          <button class="btn" onclick="copyRawJson()">📋 Copy JSON</button>
          <button class="btn btn-primary" onclick="downloadBackupJson()">💾 Download .omlifeos File</button>
        </div>
      </div>
      <div class="json-code" id="raw-json-container">Loading JSON data...</div>
    </section>
  </div>

  <footer>
    <strong>Om-LifeOS Canonical Sovereign Architecture</strong> · 100% Offline & Sovereign · Local Hard Drive & Browser Native
  </footer>

  <!-- Raw Embedded JSON Payload -->
  <script id="om-lifeos-data" type="application/json">
${serializedJson}
  </script>

  <script>
    // Tab switching
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (activeBtn) activeBtn.classList.add('active');

      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
    }

    // Dark mode toggle
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('om-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }

    if (localStorage.getItem('om-theme') === 'dark' || (!localStorage.getItem('om-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Live search filter inside tables
    function filterTable(tableId, query) {
      const q = query.toLowerCase().trim();
      const table = document.getElementById(tableId);
      if (!table) return;
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(r => {
        const text = r.textContent.toLowerCase();
        r.style.display = text.includes(q) ? '' : 'none';
      });
    }

    // Load Raw JSON into formatted container
    try {
      const dataEl = document.getElementById('om-lifeos-data');
      if (dataEl) {
        const parsed = JSON.parse(dataEl.textContent);
        const container = document.getElementById('raw-json-container');
        if (container) {
          container.textContent = JSON.stringify(parsed, null, 2);
        }
      }
    } catch (e) {
      console.error('Failed to parse raw payload', e);
    }

    // Copy JSON to clipboard
    function copyRawJson() {
      const dataEl = document.getElementById('om-lifeos-data');
      if (!dataEl) return;
      navigator.clipboard.writeText(dataEl.textContent.trim()).then(() => {
        alert('✓ Entire JSON database copied to clipboard!');
      });
    }

    // Download backup JSON file
    function downloadBackupJson() {
      const dataEl = document.getElementById('om-lifeos-data');
      if (!dataEl) return;
      const blob = new Blob([dataEl.textContent.trim()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Om-LifeOS-Complete-Backup-' + new Date().toISOString().slice(0, 10) + '.omlifeos';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  </script>
</body>
</html>`;
}

/**
 * Triggers a client-side download of the complete standalone HTML dashboard.
 */
export async function downloadCompleteStandaloneHtml(): Promise<void> {
  const data = await storage.exportAllData();
  const htmlContent = generateCompleteStandaloneHtml(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Om-LifeOS-Complete-Offline-Dashboard-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
