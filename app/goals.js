// Savings-goal maths: how long until a goal is reached and when that is.
// Pure functions, so the projection can be tested without the page.

export function monthsToGoal(goal) {
  const left = Math.max(0, (Number(goal.target) || 0) - (Number(goal.saved) || 0));
  const monthly = Number(goal.monthly) || 0;
  if (left <= 0) return 0;
  if (monthly <= 0) return Infinity;
  return Math.ceil(left / monthly);
}

// Projected completion date, as an ISO date string, counting from `from`
// (defaults to today). Returns null when the goal can never be reached at
// the current monthly contribution.
export function projectedDate(goal, from = new Date()) {
  const months = monthsToGoal(goal);
  if (!Number.isFinite(months)) return null;
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function goalProgress(goal) {
  const target = Number(goal.target) || 0;
  if (target <= 0) return 0;
  return Math.min(1, (Number(goal.saved) || 0) / target);
}
