# HomeLedger — Household Budget Site

[![best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/0xDimzy/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/0xDimzy/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

A household budget site that runs entirely from its own files, in a desktop
browser or on a phone, with no network requests at all.

## What it does

- **Overview** (`#/`): this month at a glance — income, spending, what is left
  over, a budget-health verdict, a donut chart of spending by category, top
  categories and savings-goal progress.
- **Budget Planner** (`#/planner`): monthly income vs expenses. Add, remove
  and edit line items; totals, what is left over and the savings rate update
  live as you type. Figures are saved on the device (localStorage).
- **Spending Breakdown** (`#/breakdown`): donut and bar charts of spending by
  category plus a table comparing each category with last month.
- **Savings Goals** (`#/goals`): target, saved so far and monthly contribution
  per goal, with a live projected finish date. Add or remove goals.
- **50/30/20 Guide** (`#/guide`): the needs/wants/savings rule explained, a
  working calculator for any after-tax income, your own budget compared with
  the guide, and a worked $5,000 example.
- **Money Tips** (`#/tips`): ten practical tips grouped by area. Tick the ones
  you will use and the page totals what they save — $386 a month for all ten.

All figures are a fictional sample household; edit them in the planner and the
whole site follows. Charts are hand-written SVG (see `app/charts.js`).

## Run it

Serve `app/` with any static server and open `index.html`, for example:

```sh
cd app && python3 -m http.server 8080
```

Then open <http://localhost:8080>. No build step, no dependencies.

## Layout

```
main.ts            hand-in program (copies app/ + screenshots/ to /output,
                   writes dossier.json with vendor/makefun-frontend.ts)
vendor/            make.fun dossier library, unchanged from the kit
app/
  index.html       shell: top bar, navigation, footer
  style.css        all styling (system fonts, no webfonts)
  main.js          hash router, live updates, event wiring
  views.js         one renderer per page
  data.js          sample household figures, tips, localStorage persistence
  budget.js        totals, category sums, 50/30/20 split
  goals.js         savings-goal projection maths
  charts.js        hand-written SVG donut + bar charts
  format.js        money and date formatting
screenshots/      real renders of the site in headless Chromium
```

## License

MIT — see `LICENSE`.
