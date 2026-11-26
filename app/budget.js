// Budget maths: totals, category sums and the 50/30/20 split.
// Pure functions over the state object so the numbers can be tested on their own.

export function sumLines(lines) {
  return lines.reduce((total, line) => total + (Number(line.amount) || 0), 0);
}

export function totalIncome(state) {
  return sumLines(state.income);
}

export function totalExpenses(state) {
  return sumLines(state.expenses);
}

export function remaining(state) {
  return totalIncome(state) - totalExpenses(state);
}

// Category totals, biggest first: [{ category, total, share }] where share is
// the fraction of all spending (0..1).
export function categoryTotals(state) {
  const byCat = new Map();
  for (const line of state.expenses) {
    const cat = line.category || 'Other';
    byCat.set(cat, (byCat.get(cat) || 0) + (Number(line.amount) || 0));
  }
  const total = totalExpenses(state);
  return [...byCat.entries()]
    .map(([category, amount]) => ({ category, total: amount, share: total ? amount / total : 0 }))
    .sort((a, b) => b.total - a.total);
}

// Which budget bucket a category belongs to for the 50/30/20 rule.
export function bucketOf(category) {
  const needs = ['Housing', 'Food', 'Transport', 'Utilities', 'Health', 'Family'];
  const savings = ['Debt & savings'];
  if (needs.includes(category)) return 'needs';
  if (savings.includes(category)) return 'savings';
  return 'wants';
}

// Actual needs / wants / savings split of current spending, in dollars.
export function actualSplit(state) {
  const split = { needs: 0, wants: 0, savings: 0 };
  for (const line of state.expenses) {
    split[bucketOf(line.category)] += Number(line.amount) || 0;
  }
  return split;
}

// Target 50/30/20 amounts for a given after-tax income.
export function targetSplit(income) {
  return {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
  };
}
