// HomeLedger bootstrap: hash router, page rendering and live updates.
// Every control on every page writes back to the state and saves it, so the
// dashboard, planner, breakdown, goals and guide always agree.

import { loadState, saveState, resetState, TIPS } from './data.js';
import { money, monthLabel } from './format.js';
import { totalIncome, totalExpenses, remaining, targetSplit } from './budget.js';
import { monthsToGoal, projectedDate, goalProgress } from './goals.js';
import { viewDashboard, viewPlanner, viewBreakdown, viewGoals, viewGuide, viewTips } from './views.js';

const app = document.getElementById('app');
let state = loadState();
let guideIncome = null;

const ROUTES = {
  '': viewDashboard,
  planner: viewPlanner,
  breakdown: viewBreakdown,
  goals: viewGoals,
  guide: (s) => viewGuide(s, guideIncome),
  tips: viewTips,
};

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '').split('?')[0];
  return ROUTES[hash] ? hash : '';
}

function render() {
  const route = currentRoute();
  app.innerHTML = ROUTES[route](state);
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const name = a.getAttribute('data-nav');
    a.classList.toggle('active', (route === '' && name === 'dashboard') || route === name);
  });
  window.scrollTo(0, 0);
}

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

// --- planner live totals -------------------------------------------------
function refreshPlannerTotals() {
  const inc = totalIncome(state);
  const exp = totalExpenses(state);
  const left = inc - exp;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('tot-income', money(inc));
  set('tot-expenses', money(exp));
  set('tot-left', money(left));
  set('tot-rate', (inc ? (left / inc * 100).toFixed(1) : '0.0') + '%');
  set('card-income', money(inc) + ' / month');
  set('card-expenses', money(exp) + ' / month');
  const strip = document.getElementById('planner-totals');
  if (strip) {
    strip.children[2].className = left < 0 ? 'tot-bad' : 'tot-good';
  }
}

function readLineRow(row) {
  const kind = row.getAttribute('data-kind');
  const id = row.getAttribute('data-id');
  const list = kind === 'income' ? state.income : state.expenses;
  const line = list.find((l) => l.id === id);
  if (!line) return;
  const label = row.querySelector('[data-field="label"]');
  const amount = row.querySelector('[data-field="amount"]');
  const category = row.querySelector('[data-field="category"]');
  if (label) line.label = label.value;
  if (amount) line.amount = Math.max(0, Number(amount.value) || 0);
  if (category) line.category = category.value;
}

// --- goals live projection ------------------------------------------------
function refreshGoalCard(goal) {
  const p = goalProgress(goal);
  const m = monthsToGoal(goal);
  const left = Math.max(0, goal.target - goal.saved);
  const date = projectedDate(goal);
  const status = document.querySelector(`[data-goal-status="${goal.id}"]`);
  if (status) {
    status.innerHTML = `<b>${(p * 100).toFixed(0)}% funded</b> · ${money(goal.saved)} of ${money(goal.target)} · ${money(left)} left`;
  }
  const when = document.querySelector(`[data-goal-when="${goal.id}"]`);
  if (when) {
    when.textContent = m === 0 ? 'Goal reached — well done!' : (Number.isFinite(m)
      ? `${m} month${m === 1 ? '' : 's'} to go · done around ${monthLabel(date)}`
      : 'Never at this monthly amount — raise the contribution or lower the target');
  }
  const card = document.querySelector(`.goal-card[data-goal="${goal.id}"] .progress-fill`);
  if (card) card.style.width = (p * 100).toFixed(1) + '%';
}

// --- guide calculator ------------------------------------------------------
function refreshGuide() {
  const input = document.getElementById('guide-income');
  if (!input) return;
  guideIncome = Math.max(0, Number(input.value) || 0);
  const t = targetSplit(guideIncome);
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('guide-needs', money(t.needs));
  set('guide-wants', money(t.wants));
  set('guide-savings', money(t.savings));
}

// --- tips total ------------------------------------------------------------
function refreshTips() {
  const picked = new Set(state.pickedTips || []);
  const total = TIPS.filter((t) => picked.has(t.id)).reduce((s, t) => s + t.save, 0);
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('tips-total', money(total) + ' / mo');
  set('tips-year', money(total * 12) + ' over a year');
  set('tips-count', picked.size + ' of ' + TIPS.length);
}

// --- events -----------------------------------------------------------------
app.addEventListener('input', (ev) => {
  const t = ev.target;
  // Planner line edits.
  const row = t.closest('.line-row');
  if (row) {
    readLineRow(row);
    saveState(state);
    refreshPlannerTotals();
    return;
  }
  // Goal edits.
  if (t.hasAttribute('data-goal-field')) {
    const goal = state.goals.find((g) => g.id === t.getAttribute('data-goal'));
    if (goal) {
      goal[t.getAttribute('data-goal-field')] = Math.max(0, Number(t.value) || 0);
      saveState(state);
      refreshGoalCard(goal);
    }
    return;
  }
  // 50/30/20 calculator.
  if (t.id === 'guide-income') {
    refreshGuide();
  }
});

app.addEventListener('change', (ev) => {
  const t = ev.target;
  // Tip toggles.
  if (t.hasAttribute('data-tip-toggle')) {
    const id = t.getAttribute('data-tip-toggle');
    const picked = new Set(state.pickedTips || []);
    if (t.checked) picked.add(id); else picked.delete(id);
    state.pickedTips = [...picked];
    saveState(state);
    t.closest('.tip-card').classList.toggle('tip-on', t.checked);
    refreshTips();
  }
});

app.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (action === 'add-income') {
    state.income.push({ id: uid('inc'), label: 'New income', amount: 0 });
    saveState(state);
    render();
    const rows = document.querySelectorAll('#income-rows .line-row');
    const last = rows[rows.length - 1];
    if (last) last.querySelector('.line-label').focus();
  }
  if (action === 'add-expense') {
    state.expenses.push({ id: uid('exp'), category: 'Lifestyle', label: 'New expense', amount: 0 });
    saveState(state);
    render();
    const rows = document.querySelectorAll('#expense-rows .line-row');
    const last = rows[rows.length - 1];
    if (last) last.querySelector('.line-label').focus();
  }
  if (action === 'del-line') {
    const row = btn.closest('.line-row');
    if (!row) return;
    const kind = row.getAttribute('data-kind');
    const id = row.getAttribute('data-id');
    if (kind === 'income') state.income = state.income.filter((l) => l.id !== id);
    else state.expenses = state.expenses.filter((l) => l.id !== id);
    saveState(state);
    render();
  }
  if (action === 'del-goal') {
    const id = btn.getAttribute('data-goal');
    state.goals = state.goals.filter((g) => g.id !== id);
    saveState(state);
    render();
  }
  if (action === 'reset-budget') {
    state = resetState();
    guideIncome = null;
    render();
  }
});

app.addEventListener('submit', (ev) => {
  if (ev.target.id === 'add-goal-form') {
    ev.preventDefault();
    const name = document.getElementById('new-goal-name').value.trim();
    const target = Math.max(1, Number(document.getElementById('new-goal-target').value) || 0);
    const saved = Math.max(0, Number(document.getElementById('new-goal-saved').value) || 0);
    const monthly = Math.max(0, Number(document.getElementById('new-goal-monthly').value) || 0);
    if (!name) return;
    state.goals.push({
      id: uid('goal'),
      name,
      target,
      saved,
      monthly,
      note: 'Added by you — edit the figures any time.',
    });
    saveState(state);
    render();
  }
});

window.addEventListener('hashchange', render);
render();
