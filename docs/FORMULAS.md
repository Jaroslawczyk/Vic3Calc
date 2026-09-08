# Formulas

**[Русская версия — FORMULAS.ru.md](FORMULAS.ru.md)**

Every formula is also registered in `app/engine/formulas.js`, shown under result
panels in the app, and listed in the Almanac. **If you change a calculation,
change the text there in the same commit** — a stale explanation is worse than
none.

---

## One building

```
per level  = Σ (the one method chosen in each row)
throughput = 1 + economyOfScale + bonuses
             economyOfScale = min(levels, cap) × 1%      cap = 25 levels

goods in   = per-level in  × levels × throughput
goods out  = per-level out × levels × throughput
workers    = per-level jobs × levels                 ← no throughput
```

Three rules follow, and they explain almost every surprise:

1. **Methods add up.** One row per group; the totals are the sum. Automation
   rows carry negative employment on purpose, and are clamped at zero.
2. **Throughput scales goods but not jobs.** A level-20 factory turns the same
   workforce into 20% more goods. That is why stacking levels in one state
   beats spreading them thin.
3. **Employment is a ceiling, not a promise.** If the state has no machinists,
   the building runs under capacity. The app warns instead of assuming.

`app/engine/building_calc.js`

---

## A whole chain

You ask for 200 steel. Steel needs iron and coal. Iron mines need tools. Tool
workshops need steel. So the answer to *"how much steel do I need"* depends on
the answer to *"how much steel do I need"*. Walking the tree top-down loops
forever.

Treat it as what it is — an input-output economy — and solve it the way
economists do:

```
x = finalDemand + A · x
```

`x` is how much of everything must be produced; `A` says how much of each good
one unit of another consumes. Start from nothing and apply the equation
repeatedly. Each pass adds the next ring of upstream demand, the additions
shrink every time, and after a few dozen passes the numbers stop moving. That
fixed point **is** the answer, and loops need no special case.

```
levels(building) = max over the goods it supplies of
                     (demand − imported) ÷ (output per level × throughput)
```

If the numbers *don't* stop moving, the chain consumes more of something than it
can make. The solver stops after 200 passes and names the runaway building
rather than returning nonsense.

`app/engine/solver.js`

**Goods ledger**

```
balance = produced + imported − consumed − finalDemand
```

A shortfall is only reported when it exceeds `max(0.05, flow × 0.0001)` — the
iteration leaves a few parts per million of residue, and reporting that as
"short by 0" trains people to ignore the warning strip.

---

## Money

```
revenue   = Σ (output × price)
inputCost = Σ (input  × price)
wages     = Σ (workers × wageWeight) × baseWage × wageMultiplier
profit    = revenue − inputCost − wages
```

Two honest caveats:

- Prices default to **base** prices. Your market moves them ±75%, and a chain
  that looks profitable at base price can be a loss-maker once you flood your
  own market with the thing you are making. Goods → Prices → type in what your
  market actually shows.
- `baseWagePerWorker` (default 0.08) is a **tuning knob, not a game constant**.
  Adjust it in Settings until a building you own in your save matches, and every
  other money figure in the app becomes trustworthy at once.

`app/engine/economy.js`

---

## Build order

A plain topological sort does not apply: a real chain is one big loop, so there
is no "first" building and naive algorithms produce arbitrary orders — an
earlier version of this file confidently told you to build the textile mill
before the cotton.

The right tool is **condensation**. Tarjan's algorithm finds the strongly
connected components — exactly the sets of buildings that mutually depend on
each other — and collapsing each into one vertex leaves a graph that is
guaranteed acyclic and *can* be ordered. Tarjan emits components in the order we
want: a component only after everything it depends on.

Inside a loop someone must go first and idle for a while. The app picks the
member that depends least on the rest of its own loop and labels only that one
"cycle broken" — honest and actionable, instead of shrugging at every building.

`app/engine/construction.js`

---

## Build time

```
cost = Σ (levels × building cost) × (1 + government cost modifier)
```

The naive answer is `cost ÷ pointsPerWeek`. That is wrong whenever the plan
contains construction sectors, because each one you finish makes every
remaining building arrive sooner — the curve bends. Building ten construction
sectors first and then your industry is routinely faster than building the
industry directly, even though it is more total work, and no amount of dividing
will show you that.

So the queue is simulated:

```
every week:
    available = weekly construction points
    walk the queue front to back:
        give each site up to maxWeeklyPerBuilding, while points last
    any construction sector level finishing this week
        raises weekly construction points from next week on
```

The flat estimate is shown next to it so you can see what the ramp-up buys. The
simulation can be switched off.

### How many construction sectors are worth building?

There is a real optimum and no closed form for it. Each sector level makes
everything after it arrive sooner, but has to be built itself and pulls wood,
iron, tools and steel in behind it - more buildings, more construction work. Too
few and you crawl; too many and the last ones finish after the job they were
meant to speed up.

So the app does not guess. For each candidate count it rebuilds the whole plan -
sectors, their suppliers, everything - orders it, simulates the queue, and keeps
the count that finishes soonest. The scan stops early once the time has been
getting worse for several counts in a row, because the curve is U-shaped. A
typical chain is searched in around 15 ms.

A useful thing the search reveals: with low starting construction, front-loading
many sectors is *slower*, because you have to build them at your current crawl
before any of them pay off.

---

## Military

```
weekly goods = Σ over battalions of (peacetime input × warMultiplier if mobilised)
             + mobilisation options, billed per battalion

offence = Σ (battalions × method offence)      — relative, not a battle prediction
```

Those goods then go through the ordinary chain solver, because an army is just
another order placed with your factories. The app computes the peace and war
bills separately: the gap between them is what actually decides whether a
country can fight.

`app/engine/military.js`

---

## Research

```
produced  = Σ (university levels × method output)
cap       = literacy-driven ceiling
effective = min(produced, cap)
weeks per technology = cost ÷ effective
```

Research is the one chain where the bottleneck is usually not buildings. Past
the literacy ceiling, extra university levels employ academics and produce
nothing — the app shows both numbers side by side so that is visible at a
glance.

`app/engine/research.js`
