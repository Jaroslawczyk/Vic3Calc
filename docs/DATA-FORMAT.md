# Data format

**[Русская версия — DATA-FORMAT.ru.md](DATA-FORMAT.ru.md)**

Every record shares three fields:

| Field | Meaning |
|---|---|
| `id` | internal key, and half of the translation key (`good.coal`) |
| `name` | English fallback name; other languages override it in `app/lang/` |
| `confidence` | `'verified'` (checked against the wiki) or `'approx'` (best effort — the app shows a `?` badge) |

`kind` is **reserved**: the registry sets it to the record type and will
overwrite yours. That is why a production-method group's own field is called
`rowKind`. The registry warns loudly if a data file tries to set `kind`.

---

## Good — `app/data/goods.js`

```js
{ id: 'coal', name: 'Coal', category: 'industrial', basePrice: 30,
  icon: 'Goods_coal', confidence: 'verified', order: 21 }
```

| Field | Meaning |
|---|---|
| `category` | `staple` \| `industrial` \| `luxury` \| `military` \| `abstract` |
| `basePrice` | £ — the game's base price; the market moves ±75% around it |
| `abstract` | `true` for construction / bureaucracy / innovation: modelled as goods so the same solver works, but never traded |
| `aka` | former name, e.g. Engines was Locomotives before 1.5 |

## Building — `app/data/buildings.js`

```js
{ id: 'steel_mills', name: 'Steel Mills', group: 'manufacturing',
  constructionCost: 400, produces: ['steel'], unlockTech: 'tech_pig_iron',
  pmGroups: ['pmg_steel_base', 'pmg_automation_heavy', 'pmg_ownership_industry'],
  icon: 'Building_steel_mills', confidence: 'approx', order: 56 }
```

| Field | Meaning |
|---|---|
| `group` | see `building_groups.js`; supplies defaults for anything omitted |
| `constructionCost` | construction points for **one** level |
| `produces` | every good it *can* make across all methods — used for "who can make steel?" |
| `pmGroups` | the switch-rows shown in the game's building panel, in order |
| `infraUsage` / `providesInfra` | per level; omit `infraUsage` to inherit the group |
| `abstractOutput` | `'construction'` \| `'bureaucracy'` \| `'innovation'` |
| `militaryKind` | `'army'` \| `'navy'`; with `battalionsPerLevel` |
| `maxPerState`, `autoBuilt` | one-per-state; built by the game rather than you |

A building on its own produces nothing. What it produces is decided by the
production methods switched on.

## Production method group — `app/data/pm_groups.js`

One row in the game's building panel. You pick exactly one method per row, and
the building's totals are the **sum** across rows.

```js
{ id: 'pmg_steel_base', name: 'Base Production', rowKind: 'base', order: 1 }
```

`rowKind` matters more than it looks:

| `rowKind` | Default when the app picks for you |
|---|---|
| `base` | the most advanced method you have unlocked |
| `automation` | the most advanced you have unlocked |
| `ownership` | the most advanced you have unlocked |
| `secondary` | **off**, unless the chain actually wants what it makes |
| `mobilization` | off; switched on per army on the Military screen |

That `secondary` rule is load-bearing. Turning every optional row on by default
makes each engine carry the input cost of a car *and* a tank *and* an aeroplane
at once, which inflates a chain until it becomes mathematically unsolvable.

## Production method — `app/data/pm_*.js`

Written through the `V3.pmList` helper so a table reads like the game's panel:

```js
V3.pmList('pmg_steel_base', [
  ['pm_bessemer_process', 'Bessemer Process', {
    icon: 'Method_bessemer_process', tech: 'tech_steel',
    in:   { iron: 45, coal: 30 },
    out:  { steel: 45 },
    jobs: { laborers: 4000, machinists: 1000 },
    pollution: 16
  }],
  ...
]);
```

| Key | Meaning |
|---|---|
| `in` / `out` | goods per level per week — exactly the numbers the game's panel shows |
| `jobs` | employment **delta** per level; automation rows are negative on purpose |
| `tech` | required technology id, or omitted |
| `pollution`, `infra` | per level |
| `unit` | military only: `{ offense, defense, kind }` |
| `warMult` | military only: multiplier on `in` while mobilised |
| `note` | free text shown in the method picker |

**Order in the array is the upgrade order.** The app assumes later entries are
strictly better; that is what "use the best method I have unlocked" relies on.

**`__primary`** as a good id means "this building's first `produces` entry". It
lets one shared set of methods serve every plantation, and lets the
fertilisation row raise cotton yield on a cotton plantation instead of
inexplicably growing wheat there.

## Profession — `app/data/pops.js`

```js
{ id: 'machinists', name: 'Machinists', strata: 'poor',
  wageWeight: 2, qualification: 'basic', icon: 'Pop_machinists' }
```

`wageWeight` is the share of the building's wage pool one pop takes relative to
a labourer. `qualification` is `none` / `basic` / `educated` and drives the
"you cannot staff this yet" warnings. `owner: true` means paid from profit.

## Technology — `app/data/technologies.js`

Only a gate: `{ id, name, era: 1..5, category }`. The app does not simulate the
tech tree; it only needs to answer "is this method available to me yet?".

## Almanac article — `app/data/almanac.js`

Structure only — every sentence lives in `app/lang/*.js` and is referenced by
key, so translating the whole guide means translating one file. Block types:
`p`, `tip`, `warn`, `steps`, `goods`, `formula`, `allFormulas`, `compare`,
`table`, and `chain` — a **live** worked example that runs the real solver.

---

## The pack file — `something.v3pack.json`

Everything you add or change, in one file you can send to anyone.

```json
{
  "format": "vic3calc.pack",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "gameDataRevision": "2026-09-08",
  "title": "Anbennar goods pack",
  "author": "someone",
  "createdAt": "2026-09-08T10:00:00.000Z",

  "data": {
    "good":     { "mithril": { "name": "Mithril", "category": "industrial",
                               "basePrice": 120, "icon": "Goods_iron" } },
    "building": { "steel_mills": { "constructionCost": 380 } },
    "pm":       { "pm_bessemer_process": { "outputs": { "steel": 50 } } }
  },

  "chains":   [ { "id": "chain_a1b2", "name": "Steel 200", "targets": [ ... ] } ],
  "settings": { }
}
```

Rules that make packs safe to stack:

- A record under `data` is a **patch**, not a replacement: only the fields you
  changed are stored, so a later update to `app/data/` still reaches the fields
  you did not touch.
- `{ "__deleted": true }` hides a shipped record.
- Loading in *merge* mode keeps what you already have; *replace* wipes first.
- A chain whose id already exists is given a new one rather than overwriting.
- `icon` may be a key from `app/data/icon_manifest.js`, or a `data:` URL — so a
  custom icon travels inside the same file, with no images to copy.
- A pack from a newer `formatVersion` is refused rather than half-applied.
