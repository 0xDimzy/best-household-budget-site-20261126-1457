// Page renderers: each returns an HTML string for one hash route.
// All figures come from the live state, so every page agrees with the planner.

import { money, money2, pct, esc, monthLabel } from './format.js';
import { totalIncome, totalExpenses, remaining, categoryTotals, actualSplit, targetSplit } from './budget.js';
import { donutChart, barChart, PALETTE } from './charts.js';
import { monthsToGoal, projectedDate, goalProgress } from './goals.js';
import { TIPS } from './data.js';

export const CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Health', 'Family', 'Lifestyle', 'Debt & savings'];

function sectionHead(kicker, title, blurb) {
  return `<div class="page-head"><p class="kicker">${kicker}</p><h1>${title}</h1><p class="lede">${blurb}</p></div>`;
}

function healthVerdict(state) {
  const inc = totalIncome(state);
  const exp = totalExpenses(state);
  const left = inc - exp;
  const rate = inc ? (left / inc) * 100 : 0;
  const split = actualSplit(state);
  const needsShare = inc ? (split.needs / inc) * 100 : 0;
  if (left < 0) {
    return { tone: 'bad', text: `This month spends ${money(-left)} more than it brings in. Trim a want or two in the planner to get back to balance.` };
  }
  if (rate >= 20 && needsShare <= 55) {
    return { tone: 'good', text: `A healthy month: you keep ${rate.toFixed(0)}% of income and needs sit at ${needsShare.toFixed(0)}% of income, close to the 50/30/20 guide.` };
  }
  if (needsShare > 60) {
    return { tone: 'warn', text: `Needs take ${needsShare.toFixed(0)}% of income, above the 50% guide. Housing and food are the levers — see the tips page for cuts that do not hurt.` };
  }
  return { tone: 'warn', text: `You keep ${rate.toFixed(0)}% of income. Push the savings rate towards 20% and the budget will fund your goals months earlier.` };
}

// ---------------------------------------------------------------- dashboard
export function viewDashboard(state) {
  const inc = totalIncome(state);
  const exp = totalExpenses(state);
  const left = inc - exp;
  const cats = categoryTotals(state);
  const verdict = healthVerdict(state);
  const top = cats.slice(0, 5);
  const goalsHtml = state.goals.map((g) => {
    const p = goalProgress(g);
    const m = monthsToGoal(g);
    const when = m === 0 ? 'reached' : (Number.isFinite(m) ? monthLabel(projectedDate(g)) : 'never at this rate');
    return `<a class="goal-mini" href="#/goals">
      <span class="goal-mini-name">${esc(g.name)}</span>
      <span class="goal-mini-amt">${money(g.saved)} of ${money(g.target)}</span>
      <span class="progress"><span class="progress-fill" style="width:${(p * 100).toFixed(0)}%"></span></span>
      <span class="goal-mini-when">${(p * 100).toFixed(0)}% · ${when}</span></a>`;
  }).join('');

  return `
  ${sectionHead('Overview · ' + esc(state.month), esc(state.household) + ' — this month at a glance',
    'Income, spending, what is left over and how the savings goals are tracking. Every figure below comes from the budget planner.')}
  <div class="verdict verdict-${verdict.tone}">${verdict.text}</div>
  <div class="stat-grid">
    <div class="stat-card"><p class="stat-label">Monthly income</p><p class="stat-num">${money(inc)}</p><p class="stat-sub">${state.income.length} sources</p></div>
    <div class="stat-card"><p class="stat-label">Monthly spending</p><p class="stat-num">${money(exp)}</p><p class="stat-sub">${state.expenses.length} planned lines</p></div>
    <div class="stat-card ${left < 0 ? 'stat-bad' : 'stat-good'}"><p class="stat-label">Left over</p><p class="stat-num">${money(left)}</p><p class="stat-sub">${inc ? (left / inc * 100).toFixed(1) : '0.0'}% of income saved</p></div>
    <div class="stat-card"><p class="stat-label">Biggest category</p><p class="stat-num">${cats[0] ? esc(cats[0].category) : '—'}</p><p class="stat-sub">${cats[0] ? money(cats[0].total) + ' · ' + (cats[0].share * 100).toFixed(0) + '% of spending' : ''}</p></div>
  </div>
  <div class="two-col">
    <section class="card">
      <h2>Where the money goes</h2>
      <div class="donut-wrap">${donutChart(cats.map((c) => ({ label: c.category, value: c.total })))}</div>
      <ul class="legend">${cats.map((c, i) => `<li><span class="dot" style="background:${PALETTE[i % PALETTE.length]}"></span>${esc(c.category)}<b>${money(c.total)}</b><span class="legend-pct">${(c.share * 100).toFixed(0)}%</span></li>`).join('')}</ul>
      <p class="card-link"><a href="#/breakdown">Full spending breakdown &rarr;</a></p>
    </section>
    <section class="card">
      <h2>Top spending categories</h2>
      ${barChart(top.map((c) => ({ label: c.category, value: c.total })))}
      <h2 class="sub-h">Savings goals</h2>
      <div class="goal-minis">${goalsHtml}</div>
      <p class="card-link"><a href="#/goals">Track all savings goals &rarr;</a></p>
    </section>
  </div>
  <section class="card">
    <h2>Start here</h2>
    <div class="quick-links">
      <a href="#/planner"><b>Plan the budget</b><span>Add, edit or remove income and expense lines — totals update as you type.</span></a>
      <a href="#/guide"><b>Try the 50/30/20 rule</b><span>Split any after-tax income into needs, wants and savings in seconds.</span></a>
      <a href="#/tips"><b>Cut $386 a month</b><span>Ten practical tips, picked for this household — tick the ones you will use.</span></a>
    </div>
  </section>`;
}

// ----------------------------------------------------------------- planner
function incomeRow(line) {
  return `<div class="line-row" data-kind="income" data-id="${line.id}">
    <input class="line-label" type="text" value="${esc(line.label)}" data-field="label" aria-label="Income source">
    <span class="line-cur">$</span>
    <input class="line-amount" type="number" min="0" step="1" value="${line.amount}" data-field="amount" aria-label="Monthly amount">
    <button class="line-del" data-action="del-line" title="Remove this line" aria-label="Remove ${esc(line.label)}">&times;</button>
  </div>`;
}

function expenseRow(line) {
  const opts = CATEGORIES.map((c) => `<option ${c === line.category ? 'selected' : ''}>${c}</option>`).join('');
  return `<div class="line-row line-row-exp" data-kind="expense" data-id="${line.id}">
    <select class="line-cat" data-field="category" aria-label="Category">${opts}</select>
    <input class="line-label" type="text" value="${esc(line.label)}" data-field="label" aria-label="Expense description">
    <span class="line-cur">$</span>
    <input class="line-amount" type="number" min="0" step="1" value="${line.amount}" data-field="amount" aria-label="Monthly amount">
    <button class="line-del" data-action="del-line" title="Remove this line" aria-label="Remove ${esc(line.label)}">&times;</button>
  </div>`;
}

export function viewPlanner(state) {
  const inc = totalIncome(state);
  const exp = totalExpenses(state);
  const left = inc - exp;
  return `
  ${sectionHead('Budget planner · ' + esc(state.month), 'Plan this month\u2019s budget',
    'Add, edit or remove lines — totals, what is left over and the savings rate all update as you type. Figures are saved on this device.')}
  <div class="totals-strip" id="planner-totals">
    <div><span>Income</span><strong id="tot-income">${money(inc)}</strong></div>
    <div><span>Spending</span><strong id="tot-expenses">${money(exp)}</strong></div>
    <div class="${left < 0 ? 'tot-bad' : 'tot-good'}"><span>Left over</span><strong id="tot-left">${money(left)}</strong></div>
    <div><span>Savings rate</span><strong id="tot-rate">${inc ? (left / inc * 100).toFixed(1) : '0.0'}%</strong></div>
  </div>
  <div class="two-col">
    <section class="card">
      <h2>Income <span class="card-total" id="card-income">${money(inc)} / month</span></h2>
      <div id="income-rows">${state.income.map(incomeRow).join('')}</div>
      <button class="btn" data-action="add-income">+ Add income</button>
    </section>
    <section class="card">
      <h2>Expenses <span class="card-total" id="card-expenses">${money(exp)} / month</span></h2>
      <div id="expense-rows">${state.expenses.map(expenseRow).join('')}</div>
      <button class="btn" data-action="add-expense">+ Add expense</button>
    </section>
  </div>
  <div class="two-col">
    <section class="card">
      <h2>How the budget balances</h2>
      <p>Income <b>${money(inc)}</b> minus spending <b>${money(exp)}</b> leaves <b class="${left < 0 ? 'neg' : 'pos'}">${money(left)}</b> a month.
      ${left > 0
    ? `At this rate the household banks <b>${money(left * 12)}</b> over a year — enough to fund the emergency-fund goal in ${Math.max(1, Math.ceil((10000 - 4250) / Math.max(1, left)))} months if every spare dollar goes there.`
    : left === 0
      ? 'With nothing left over, the goals can only be funded by cutting spending — the tips page lists about $386 a month of cuts.'
      : 'Spending is above income this month. The breakdown page shows which categories grew, and the tips page lists cuts worth about $386 a month.'}</p>
      <p class="card-link"><a href="#/breakdown">See the spending breakdown &rarr;</a> <a href="#/goals">Check the savings goals &rarr;</a></p>
    </section>
    <section class="card">
      <h2>Reset the sample budget</h2>
      <p>Changed the figures and want the original household back? Resetting restores the sample income, expenses and goals, and clears your saved changes on this device.</p>
      <button class="btn btn-ghost" data-action="reset-budget">Reset to sample budget</button>
    </section>
  </div>`;
}

// --------------------------------------------------------------- breakdown
export function viewBreakdown(state) {
  const cats = categoryTotals(state);
  const exp = totalExpenses(state);
  const last = state.lastMonth || {};
  const rows = cats.map((c, i) => {
    const prev = last[c.category] || 0;
    const diff = c.total - prev;
    const diffHtml = prev
      ? `<span class="${diff > 0 ? 'neg' : 'pos'}">${diff > 0 ? '+' : ''}${money(diff)}</span>`
      : '<span class="muted">—</span>';
    return `<tr><td><span class="dot" style="background:${PALETTE[i % PALETTE.length]}"></span> ${esc(c.category)}</td>
      <td class="num">${money(c.total)}</td><td class="num">${(c.share * 100).toFixed(1)}%</td>
      <td class="num">${prev ? money(prev) : '—'}</td><td class="num">${diffHtml}</td></tr>`;
  }).join('');
  const biggest = cats[0];
  const housingShare = cats.find((c) => c.category === 'Housing');
  return `
  ${sectionHead('Spending breakdown · ' + esc(state.month), 'Where every dollar goes',
    'Housing, food and transport take most of a household budget. Compare each category with last month, then decide where a cut hurts least.')}
  <div class="two-col">
    <section class="card">
      <h2>Share of spending</h2>
      <div class="donut-wrap">${donutChart(cats.map((c) => ({ label: c.category, value: c.total })))}</div>
      <ul class="legend">${cats.map((c, i) => `<li><span class="dot" style="background:${PALETTE[i % PALETTE.length]}"></span>${esc(c.category)}<b>${money(c.total)}</b><span class="legend-pct">${(c.share * 100).toFixed(0)}%</span></li>`).join('')}</ul>
    </section>
    <section class="card">
      <h2>Categories, biggest first</h2>
      ${barChart(cats.map((c) => ({ label: c.category, value: c.total })))}
    </section>
  </div>
  <section class="card">
    <h2>Category table — this month vs last month</h2>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Category</th><th class="num">This month</th><th class="num">Share</th><th class="num">Last month</th><th class="num">Change</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total spending</td><td class="num">${money(exp)}</td><td class="num">100%</td><td class="num">${money(Object.values(last).reduce((a, b) => a + b, 0))}</td><td class="num">${exp - Object.values(last).reduce((a, b) => a + b, 0) >= 0 ? '+' : ''}${money(exp - Object.values(last).reduce((a, b) => a + b, 0))}</td></tr></tfoot>
    </table></div>
    <p>${biggest ? `<b>${esc(biggest.category)}</b> is the biggest slice at ${money(biggest.total)} (${(biggest.share * 100).toFixed(0)}% of spending). ` : ''}${housingShare ? `Housing alone is ${(housingShare.share * 100).toFixed(0)}% — under the common 30%-of-income rule for rent or a mortgage, which for this household is ${money(totalIncome(state) * 0.3)}. ` : ''}Food is the easiest category to move quickly: a weekly meal plan typically saves about $95 a month — see the tips page.</p>
    <p class="card-link"><a href="#/planner">Adjust the budget &rarr;</a> <a href="#/tips">Find savings &rarr;</a></p>
  </section>`;
}

// ------------------------------------------------------------------- goals
function goalCard(g, idx) {
  const p = goalProgress(g);
  const m = monthsToGoal(g);
  const left = Math.max(0, g.target - g.saved);
  const date = projectedDate(g);
  const when = m === 0 ? 'Goal reached — well done!' : (Number.isFinite(m)
    ? `${m} month${m === 1 ? '' : 's'} to go · done around ${monthLabel(date)}`
    : 'Never at this monthly amount — raise the contribution or lower the target');
  return `<article class="card goal-card" data-goal="${g.id}">
    <div class="goal-head"><h2>${esc(g.name)}</h2>
      <button class="line-del" data-action="del-goal" data-goal="${g.id}" title="Remove this goal" aria-label="Remove ${esc(g.name)}">&times;</button></div>
    <p class="goal-note">${esc(g.note)}</p>
    <div class="goal-figures">
      <label>Target <span class="cur-wrap">$<input type="number" min="0" step="50" value="${g.target}" data-goal-field="target" data-goal="${g.id}" aria-label="Goal target"></span></label>
      <label>Saved so far <span class="cur-wrap">$<input type="number" min="0" step="10" value="${g.saved}" data-goal-field="saved" data-goal="${g.id}" aria-label="Amount saved so far"></span></label>
      <label>Monthly contribution <span class="cur-wrap">$<input type="number" min="0" step="10" value="${g.monthly}" data-goal-field="monthly" data-goal="${g.id}" aria-label="Monthly contribution"></span></label>
    </div>
    <div class="progress progress-lg"><span class="progress-fill" style="width:${(p * 100).toFixed(1)}%"></span></div>
    <p class="goal-status" data-goal-status="${g.id}"><b>${(p * 100).toFixed(0)}% funded</b> · ${money(g.saved)} of ${money(g.target)} · ${money(left)} left</p>
    <p class="goal-when" data-goal-when="${g.id}">${when}</p>
    <p class="goal-hint">${idx === 0 ? 'Tip: an emergency fund comes first — it stops one broken boiler from becoming credit-card debt.' : ''}</p>
  </article>`;
}

export function viewGoals(state) {
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalMonthly = state.goals.reduce((s, g) => s + g.monthly, 0);
  return `
  ${sectionHead('Savings goals', 'Save for what matters, on a date you can see',
    'Set a target, say what you put aside each month, and the tracker works out the finish date. Edit any figure — the date moves with it.')}
  <div class="stat-grid stat-grid-3">
    <div class="stat-card"><p class="stat-label">Saved across all goals</p><p class="stat-num">${money(totalSaved)}</p><p class="stat-sub">of ${money(totalTarget)} in targets</p></div>
    <div class="stat-card"><p class="stat-label">Monthly contributions</p><p class="stat-num">${money(totalMonthly)}</p><p class="stat-sub">${money(totalMonthly * 12)} a year</p></div>
    <div class="stat-card"><p class="stat-label">Goals on track</p><p class="stat-num">${state.goals.filter((g) => Number.isFinite(monthsToGoal(g))).length} / ${state.goals.length}</p><p class="stat-sub">a goal with no monthly amount has no finish date</p></div>
  </div>
  <div class="goal-grid">${state.goals.map(goalCard).join('')}</div>
  <section class="card">
    <h2>Add a savings goal</h2>
    <form id="add-goal-form" class="add-goal">
      <label>Goal name <input type="text" id="new-goal-name" placeholder="e.g. New washing machine" required maxlength="60"></label>
      <label>Target amount <span class="cur-wrap">$<input type="number" id="new-goal-target" min="1" step="10" value="1000" required></span></label>
      <label>Saved so far <span class="cur-wrap">$<input type="number" id="new-goal-saved" min="0" step="10" value="0"></span></label>
      <label>Monthly contribution <span class="cur-wrap">$<input type="number" id="new-goal-monthly" min="0" step="10" value="100"></span></label>
      <button class="btn" type="submit">Add goal</button>
    </form>
    <p class="muted">Your goals are saved on this device, with the rest of the budget.</p>
  </section>`;
}

// ------------------------------------------------------------------- guide
export function viewGuide(state, incomeInput) {
  const income = incomeInput ?? totalIncome(state);
  const target = targetSplit(income);
  const actual = actualSplit(state);
  const actualTotal = actual.needs + actual.wants + actual.savings;
  const row = (name, what, targetAmt, actualAmt, color) => {
    const tPct = income ? (targetAmt / income) * 100 : 0;
    const aPct = actualTotal ? (actualAmt / actualTotal) * 100 : 0;
    return `<div class="split-row">
      <div class="split-head"><span class="dot" style="background:${color}"></span><b>${name}</b><span class="muted">${what}</span></div>
      <div class="split-bars">
        <div class="split-bar"><span class="split-bar-label">Guide</span><div class="bar-track"><div class="bar-fill" style="width:${tPct.toFixed(1)}%;background:${color}"></div></div><b>${money(targetAmt)}</b><span class="muted">${tPct.toFixed(0)}%</span></div>
        <div class="split-bar"><span class="split-bar-label">Your budget</span><div class="bar-track"><div class="bar-fill" style="width:${aPct.toFixed(1)}%;background:${color}"></div></div><b>${money(actualAmt)}</b><span class="muted">${aPct.toFixed(0)}%</span></div>
      </div></div>`;
  };
  return `
  ${sectionHead('The 50/30/20 guide', 'One rule that fits most households',
    'Split after-tax income three ways: 50% for needs, 30% for wants, 20% for savings and extra debt payments. It is a starting point, not a law — high rents bend it, and that is fine.')}
  <div class="two-col">
    <section class="card">
      <h2>50/30/20 calculator</h2>
      <label class="calc-label">Monthly after-tax income
        <span class="cur-wrap big">$<input type="number" id="guide-income" min="0" step="50" value="${income}" aria-label="Monthly after-tax income"></span>
      </label>
      <div class="split-results" id="guide-results">
        <div class="split-result"><span class="dot" style="background:#0e7a5f"></span><b>Needs — 50%</b><strong id="guide-needs">${money(target.needs)}</strong><span class="muted">rent, bills, groceries, transport, insurance</span></div>
        <div class="split-result"><span class="dot" style="background:#e9a13b"></span><b>Wants — 30%</b><strong id="guide-wants">${money(target.wants)}</strong><span class="muted">eating out, streaming, hobbies, holidays</span></div>
        <div class="split-result"><span class="dot" style="background:#4361ee"></span><b>Savings — 20%</b><strong id="guide-savings">${money(target.savings)}</strong><span class="muted">emergency fund, goals, extra debt payments</span></div>
      </div>
      <p class="muted">Try it: type a different income and the three amounts update at once. The “your budget” bars below use the figures from the planner.</p>
    </section>
    <section class="card">
      <h2>What counts as what?</h2>
      <dl class="def-list">
        <div><dt>Needs — 50%</dt><dd>Things you must pay to live and work: housing, utilities, groceries, transport, insurance, minimum debt payments, childcare.</dd></div>
        <div><dt>Wants — 30%</dt><dd>Things that make life better but are optional: restaurants, streaming, new clothes beyond replacements, holidays, hobbies.</dd></div>
        <div><dt>Savings — 20%</dt><dd>Emergency fund first, then goals and paying debt down faster than the minimum. Savings here means money that stays yours.</dd></div>
      </dl>
      <p><b>Rent eats more than 50%?</b> That is common in expensive cities. Shrink wants first, then look at the big lever — housing, transport or childcare — before giving up on saving entirely. Even 5% saved beats 0%.</p>
    </section>
  </div>
  <section class="card">
    <h2>Your budget against the guide</h2>
    <p>Your planner totals <b>${money(actualTotal)}</b> of spending a month. Here is how it splits, next to the guide for ${money(income)} of income:</p>
    ${row('Needs', 'housing, food, transport, utilities, health, family', target.needs, actual.needs, '#0e7a5f')}
    ${row('Wants', 'lifestyle and the fun parts of food and transport', target.wants, actual.wants, '#e9a13b')}
    ${row('Savings & debt', 'emergency fund and credit-card payments', target.savings, actual.savings, '#4361ee')}
    <p class="card-link"><a href="#/planner">Adjust the budget &rarr;</a> <a href="#/goals">Set a savings goal &rarr;</a></p>
  </section>
  <section class="card">
    <h2>Worked example — $5,000 a month</h2>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Bucket</th><th class="num">Share</th><th class="num">Amount</th><th>What it covers</th></tr></thead>
      <tbody>
        <tr><td>Needs</td><td class="num">50%</td><td class="num">$2,500</td><td>Rent $1,400 · groceries $550 · transport $250 · utilities $180 · insurance $120</td></tr>
        <tr><td>Wants</td><td class="num">30%</td><td class="num">$1,500</td><td>Eating out $300 · streaming $60 · hobbies $200 · holiday fund $400 · clothes $140 · fun $400</td></tr>
        <tr><td>Savings</td><td class="num">20%</td><td class="num">$1,000</td><td>Emergency fund $500 · holiday goal $250 · extra loan payment $250</td></tr>
      </tbody>
    </table></div>
    <p>On $5,000 a month the emergency fund reaches $6,000 in a year — two months of essential bills — while still leaving $1,500 for the enjoyable parts of life.</p>
  </section>`;
}

// -------------------------------------------------------------------- tips
export function viewTips(state) {
  const picked = new Set(state.pickedTips || []);
  const totalSave = TIPS.filter((t) => picked.has(t.id)).reduce((s, t) => s + t.save, 0);
  const groups = [...new Set(TIPS.map((t) => t.group))];
  const cards = groups.map((g) => {
    const items = TIPS.filter((t) => t.group === g).map((t) => {
      const on = picked.has(t.id);
      return `<article class="tip-card ${on ? 'tip-on' : ''}" data-tip="${t.id}">
        <label class="tip-check"><input type="checkbox" data-tip-toggle="${t.id}" ${on ? 'checked' : ''} aria-label="Use tip: ${esc(t.title)}"><span>I'll use this</span></label>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.body)}</p>
        <p class="tip-save">${t.save > 0 ? `Saves about <b>${money(t.save)} / month</b>` : 'Builds the saving habit — worth more than any single cut'}</p>
      </article>`;
    }).join('');
    return `<h2 class="tip-group">${esc(g)}</h2><div class="tip-grid">${items}</div>`;
  }).join('');
  return `
  ${sectionHead('Money-saving tips', 'Small changes, counted in dollars',
    'Ten tips that work for an ordinary household. Tick the ones you will actually do and the page adds up what they are worth.')}
  <div class="stat-grid stat-grid-3">
    <div class="stat-card stat-good"><p class="stat-label">Your picked tips save</p><p class="stat-num" id="tips-total">${money(totalSave)} / mo</p><p class="stat-sub" id="tips-year">${money(totalSave * 12)} over a year</p></div>
    <div class="stat-card"><p class="stat-label">Tips picked</p><p class="stat-num" id="tips-count">${picked.size} of ${TIPS.length}</p><p class="stat-sub">tick a card to add or remove it</p></div>
    <div class="stat-card"><p class="stat-label">All ten tips together</p><p class="stat-num">${money(TIPS.reduce((s, t) => s + t.save, 0))} / mo</p><p class="stat-sub">${money(TIPS.reduce((s, t) => s + t.save, 0) * 12)} over a year</p></div>
  </div>
  ${cards}
  <section class="card">
    <h2>What $386 a month becomes</h2>
    <p>Every tip above, followed together, is worth about <b>$386 a month</b> — <b>$4,632 a year</b>. That alone funds the family holiday goal in under nine months, or covers more than half the emergency fund. Start with the two biggest: meal planning ($95) and the 24-hour rule ($60).</p>
    <p class="card-link"><a href="#/planner">Put the savings in the budget &rarr;</a></p>
  </section>`;
}
