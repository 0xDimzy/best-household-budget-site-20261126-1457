// Default household figures and persistence for HomeLedger.
// Everything is sample data for a fictional four-person household; the user
// edits it in the planner and it is saved to localStorage on this device only.

export const STORAGE_KEY = 'homeledger-v1';

export function defaultState() {
  return {
    household: 'The Rivera Household',
    month: 'November 2026',
    income: [
      { id: 'inc-1', label: 'Primary salary (after tax)', amount: 4600 },
      { id: 'inc-2', label: "Partner's salary (after tax)", amount: 2150 },
      { id: 'inc-3', label: 'Weekend freelance work', amount: 480 },
      { id: 'inc-4', label: 'Savings interest', amount: 35 },
    ],
    expenses: [
      { id: 'exp-1', category: 'Housing', label: 'Mortgage payment', amount: 1850 },
      { id: 'exp-2', category: 'Housing', label: 'Home insurance', amount: 145 },
      { id: 'exp-3', category: 'Housing', label: 'Repairs & upkeep', amount: 90 },
      { id: 'exp-4', category: 'Food', label: 'Weekly groceries', amount: 640 },
      { id: 'exp-5', category: 'Food', label: 'Eating out', amount: 180 },
      { id: 'exp-6', category: 'Food', label: 'Coffee & snacks', amount: 65 },
      { id: 'exp-7', category: 'Transport', label: 'Car payment', amount: 320 },
      { id: 'exp-8', category: 'Transport', label: 'Fuel', amount: 170 },
      { id: 'exp-9', category: 'Transport', label: 'Bus & train passes', amount: 85 },
      { id: 'exp-10', category: 'Transport', label: 'Car insurance', amount: 110 },
      { id: 'exp-11', category: 'Utilities', label: 'Electricity', amount: 130 },
      { id: 'exp-12', category: 'Utilities', label: 'Water & sewer', amount: 55 },
      { id: 'exp-13', category: 'Utilities', label: 'Internet', amount: 70 },
      { id: 'exp-14', category: 'Utilities', label: 'Mobile phones', amount: 95 },
      { id: 'exp-15', category: 'Health', label: 'Health insurance', amount: 260 },
      { id: 'exp-16', category: 'Health', label: 'Pharmacy & dental', amount: 45 },
      { id: 'exp-17', category: 'Health', label: 'Gym membership', amount: 40 },
      { id: 'exp-18', category: 'Family', label: 'After-school care', amount: 420 },
      { id: 'exp-19', category: 'Family', label: 'School supplies', amount: 60 },
      { id: 'exp-20', category: 'Family', label: "Kids' activities", amount: 75 },
      { id: 'exp-21', category: 'Lifestyle', label: 'Streaming services', amount: 45 },
      { id: 'exp-22', category: 'Lifestyle', label: 'Hobbies & books', amount: 80 },
      { id: 'exp-23', category: 'Lifestyle', label: 'Clothing', amount: 120 },
      { id: 'exp-24', category: 'Debt & savings', label: 'Credit card payment', amount: 150 },
      { id: 'exp-25', category: 'Debt & savings', label: 'Emergency fund', amount: 300 },
    ],
    goals: [
      { id: 'goal-1', name: 'Emergency fund', target: 10000, saved: 4250, monthly: 300, note: 'Six months of essential bills, kept in a high-yield savings account.' },
      { id: 'goal-2', name: 'Family summer holiday', target: 3200, saved: 1150, monthly: 200, note: 'Two weeks by the coast — flights, stay and spending money.' },
      { id: 'goal-3', name: 'Next car deposit', target: 8000, saved: 2600, monthly: 350, note: 'Deposit for a reliable used family car in about eighteen months.' },
    ],
    pickedTips: ['tip-mealplan', 'tip-subs', 'tip-thermostat'],
    // Last month's spending per category, for the breakdown comparison.
    lastMonth: {
      Housing: 2055, Food: 900, Transport: 700, Utilities: 340,
      Health: 330, Family: 540, Lifestyle: 250, 'Debt & savings': 450,
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.income) || !Array.isArray(parsed.expenses)) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: the page still works for this session.
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  return defaultState();
}

// Money-saving tips shown on the tips page. `save` is the typical monthly
// saving for an average household that follows the tip.
export const TIPS = [
  { id: 'tip-mealplan', group: 'Food', title: 'Plan meals for the week', save: 95, body: 'Write the week\u2019s dinners before you shop, buy only what the list needs, and cook two batch meals on Sunday. Households that plan waste far less food and make fewer impulse trips to the store.' },
  { id: 'tip-subs', group: 'Bills', title: 'Audit subscriptions every quarter', save: 38, body: 'List every streaming, app and membership charge, cancel anything unused for 30 days, and share a family plan instead of paying for two. The average household finds two or three forgotten charges.' },
  { id: 'tip-thermostat', group: 'Home', title: 'Set the thermostat back 2\u00b0', save: 27, body: 'Heating and cooling are the biggest slice of most utility bills. A 2\u00b0 setback while you sleep or are out trims the bill without anyone noticing.' },
  { id: 'tip-generic', group: 'Food', title: 'Swap brands on staples', save: 42, body: 'Store-brand flour, rice, tinned tomatoes and cleaning products are usually made in the same factories as the big names. Try them on ten staples and keep the ones nobody can tell apart.' },
  { id: 'tip-24h', group: 'Spending', title: 'The 24-hour rule for wants', save: 60, body: 'Any non-essential purchase over $50 waits a full day. Most of the time the urge passes; what is left is stuff you actually wanted, bought once instead of twice.' },
  { id: 'tip-fuel', group: 'Transport', title: 'Bundle errands into one trip', save: 33, body: 'One planned loop for groceries, school runs and the pharmacy beats five separate drives. Keep a running errand list on the fridge and go when it is full.' },
  { id: 'tip-autopay', group: 'Money', title: 'Pay yourself first, automatically', save: 0, body: 'Move savings out on payday, before spending starts — even $50 a month. Money you never see is money you never miss, and it turns saving from a decision into a habit.' },
  { id: 'tip-coupons', group: 'Food', title: 'Buy seasonal, buy in bulk', save: 48, body: 'Fruit and vegetables in season cost a fraction of out-of-season imports, and pantry staples bought in bulk on sale can cut a grocery bill by a tenth.' },
  { id: 'tip-energy', group: 'Home', title: 'Switch off standby power', save: 18, body: 'TVs, consoles and chargers on standby sip power all day. A switched power strip by the TV pays for itself in a few months.' },
  { id: 'tip-library', group: 'Family', title: 'Use the library before the shop', save: 25, body: 'Books, films, kids\u2019 activities and even tool lending live at the public library. Borrow first, buy only the things the family returns to again and again.' },
];
