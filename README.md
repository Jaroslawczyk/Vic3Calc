# Victoria 3 Calculator

**[Русская версия — README.ru.md](README.ru.md)**

A planning tool for *Victoria 3*: it works out production chains, the workforce
behind them, what a war actually costs, and the order to build things in.

It runs from a folder. No installer, no Node, no console, no internet.

---

## Getting started

1. Double-click **`Создать ярлык на рабочем столе.vbs`** (*Create desktop
   shortcut*). It puts a **Vic3 Calculator** icon on your Desktop and changes
   nothing else — no registry, no installation.
2. Double-click that icon.

That's it. The app opens in its own window with no address bar and no tabs.

If you would rather not create a shortcut, double-click `Vic3Calculator.vbs`
directly, or open `app/index.html` in a browser.

**How it works:** the app is a web page, but the launcher opens it in *app mode*
using a Chromium browser you already have (Edge is on every Windows 11 machine)
with its own small private profile under `%LOCALAPPDATA%\Vic3Calculator`. Your
saved work never touches your normal browsing, and your normal browsing never
touches the app.

---

## What it does

### Calculator

Say what you want — *"200 steel a week"* — and the app works backwards through
every input, sizes each building, and tells you how many people of which
professions you will need.

The chain diagram zooms and pans. Each card shows one building's methods,
inputs, outputs, workforce by profession, infrastructure use, pollution and
weekly profit. Click a method to change it.

The right-hand column is the part you actually use while playing: a **numbered
build order** you work down inside the game, a **workforce breakdown** by social
class and profession, and the goods ledger.

Cards can be dragged into whatever arrangement you like; the arrows follow.

**Buying instead of building.** Say how much of a good you buy in per week and
the chain adjusts around it. Buy part of what you need and the producer simply
shrinks; buy all of it and it disappears from the plan.

Chains contain loops — steel needs tools, tools need steel — so the app solves
them the way an economist would, by iteration, rather than pretending the chain
is a tree. See [docs/FORMULAS.md](docs/FORMULAS.md).

### Build order and time

Three modes:

| Mode | What it optimises |
|---|---|
| **Fastest** | Construction sectors first. More total work, but everything after them arrives sooner. |
| **Cheapest** | Fewest construction points. You buy inputs from the market while you wait. |
| **No shortages** | Strict order from raw materials up, so nothing ever sits idle. |

Build time is **simulated week by week**, not divided, because every
construction sector you finish speeds up everything still in the queue. The app
shows the flat estimate next to it so you can see what the ramp-up is buying
you. You can switch the simulation off.

**"Work out the best number" of construction sectors.** One button. Sectors are
not free - they have to be built themselves and they drag wood, iron, tools and
steel in behind them - so the app re-solves the entire plan once per candidate
count and keeps the one that finishes soonest. It then shows the neighbouring
options, because the bottom of that curve is often flat and a cheaper plan one
step away is worth seeing.

### Military

Build the army you want, then flip the **peace / mobilised** toggle. Goods
consumption roughly doubles, mobilisation options add more on top per
battalion, and the app turns that bill into a factory count and a headcount —
using the same solver as the Calculator, because an army is just another order
placed with your industry.

That jump between the two numbers is the war you cannot afford, shown before
you declare it.

Navy, wages, officers and research are covered too.

### Almanac

A guide that cannot go stale: its worked examples are computed live from the
same tables the Calculator uses. Change a production method and the guide's
example changes with it. Twenty articles covering mechanics, strategy, war,
common mistakes, and every formula in the app.

### Data editor

Everything the calculator knows can be changed, and nothing you change touches
the shipped files. Add a good, a building, a production method; correct a
number we got wrong; give any of it an icon (400+ game icons included, or drop
in your own PNG).

Export the lot as **one `.v3pack.json` file**, send it to someone, they load it
and see exactly what you see. That is the whole sharing story — no installer,
no folders to copy. See [docs/MODDING.md](docs/MODDING.md).

---

## About the numbers — please read this

Goods and their base prices were read from the
[Victoria 3 Wiki](https://vic3.paradoxwikis.com/) and are solid.

**Production method figures — inputs, outputs, employment splits, construction
costs — are best-effort.** The shape of every formula is right; individual
numbers may not match your patch.

So the app marks its own uncertainty: anything derived from an unverified
number carries a small **`?`** badge. A calculator that hides where it is
guessing is worse than one that shows you.

Two clicks fix any of it: **Data → pick the record → edit**. Your value wins
from then on and travels in your pack. If you verify a number against your
game, please also flip its confidence to `verified` and share the pack.

Settings → *Check the data for errors* validates the whole table set.

---

## Languages

English and Russian are complete. Adding a language means copying **one file**:

1. Copy `app/lang/TEMPLATE.js` to `app/lang/<code>.js`
2. Translate the text to the right of each colon (never the left — those are keys)
3. Add one line to `app/index.html`: `<script src="lang/<code>.js"></script>`

Missing lines fall back to English, so a half-finished translation is still
useful. Settings → Language shows how complete each file is, and the self-check
lists exactly which keys are still missing.

Plural forms are supported — English needs two, Russian needs three. See
[docs/TRANSLATING.md](docs/TRANSLATING.md).

---

## For developers

```
app/
  index.html      load order, documented inline
  core/           namespace, data registry, translation, storage, icons
  data/           the game tables — edit these to change a number for everyone
  engine/         the maths; pure functions, no DOM, every one takes a context
  ui/             screens; one file per tab, ~100–500 lines each
  lang/           one file per language
  styles/         design tokens first, then base, components, layout, screens
img/icons/        433 game icons
tools/            self-test, icon manifest generator, dev server
docs/             this documentation, in English and Russian
```

No build step, no bundler, no dependencies. Plain `<script>` tags, because the
app has to run over `file://` and browsers refuse ES modules there.

**Run the tests after any change to `app/data/` or `app/engine/`:**

```bash
node tools/selftest.js
```

It loads the same files the app loads, checks every cross-reference, solves a
dozen real chains, and asserts the answers are sane. Exit code 0 means fine.

Optional, for browser devtools:

```bash
node tools/devserver.js
```

More: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/DATA-FORMAT.md](docs/DATA-FORMAT.md) ·
[docs/FORMULAS.md](docs/FORMULAS.md) ·
[docs/MODDING.md](docs/MODDING.md) ·
[docs/TRANSLATING.md](docs/TRANSLATING.md)

---

## Credits

Game icons and game data belong to **Paradox Interactive**. This is an
unofficial, fan-made planning tool and is not affiliated with Paradox.

Data transcribed from the community [Victoria 3 Wiki](https://vic3.paradoxwikis.com/).
