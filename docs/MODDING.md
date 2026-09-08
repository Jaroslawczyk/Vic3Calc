# Mods and custom content

**[Русская версия — MODDING.ru.md](MODDING.ru.md)**

Nothing in this app is hard-coded to vanilla Victoria 3. If your mod adds a
resource, a factory, or a whole new industry, you can describe it here and the
calculator treats it exactly like shipped content — same solver, same diagram,
same build order, same warnings.

There are two ways in. **Use the first one.**

---

## 1. The Data tab (recommended)

Everything you do here is stored separately from the shipped files, shows a
badge everywhere in the app (`+` for something you created, `✎` for something
you edited), can be reverted one record at a time, and exports as a single file
you can send to anyone.

### Add a good

**Data → Goods → New**

- `id` — lower_case, unique, e.g. `mithril`
- Name, category, base price
- Icon — pick one of the 400+ shipped game icons, or **Use my own image** and
  drop in a PNG (under 512 KB; it is stored inside your pack, so there are no
  image files to copy)

### Add a building

**Data → Buildings → New**

- Group, construction cost
- **Can produce** — every good it might make. This is what the app searches when
  you ask "who can make mithril?"
- **Method rows** — which switch-rows it offers. Reuse a shipped one (e.g.
  `pmg_ownership_industry`) or create your own first.

### Add a production method

**Data → Method groups → New** for the row, then **Data → Production methods →
New** for each option in it.

- **Consumes / level** and **Produces / level** — the numbers the game's
  building panel shows
- **Employment / level** — by profession
- Requires technology, pollution, extra infrastructure

Order matters: the app assumes later methods in a row are strictly better, which
is what "use the best method I have unlocked" relies on. A row whose `rowKind`
is `secondary` should have its "no X" option first.

### Correct a number we got wrong

Any shipped record can be edited the same way. Only the fields you change are
stored, so a future update to `app/data/` still reaches everything you left
alone, and **Revert** puts the original back.

If you verified a number against your game, set its confidence to `verified`
too — that removes the `?` badge from everything computed with it.

### Share it

**Data → Export as a file** produces `something.v3pack.json` containing your
records, your saved chains, and optionally your settings. The person you send it
to opens **Data → Load someone's file** and sees exactly what you see.

Loading in *merge* mode keeps their own work; *replace* wipes it first. A chain
whose id already exists is renamed rather than overwriting theirs.

### Check your work

**Settings → Check the data for errors** validates the whole set: references to
things that do not exist, method groups with no methods, goods nobody can
produce. That is how mod data usually breaks, and it takes one click to find.

---

## 2. Editing the shipped files

Do this only if you want to change what *everyone* gets — a corrected vanilla
table, or a fork of the app for a specific total-conversion mod.

1. Edit the relevant file in `app/data/`. The format is documented in
   [DATA-FORMAT.md](DATA-FORMAT.md), and each file's header explains its own
   conventions.
2. If you add a new file, add one `<script>` line to `app/index.html` and one
   entry to the `FILES` list in `tools/selftest.js`.
3. If you add icons to `img/icons/`, regenerate the manifest:
   ```bash
   tools/gen-icon-manifest.sh
   ```
4. Add names for any new record to `app/lang/ru.js` (and any other language) —
   English falls back to the `name` field, other languages do not.
5. **Run the tests:**
   ```bash
   node tools/selftest.js
   ```

The self-test is not decoration. It catches dangling references, goods nobody
produces, method groups that ended up empty, missing translations, chains that
no longer converge, and build orders that came out backwards. Every one of those
has actually happened while building this.

---

## Things worth knowing before you start

**A building with several optional outputs.** Give it several `secondary` rows,
one per product, each with a "no X" option first. Do *not* put them all in one
`base` row — the app switches on exactly the secondary rows the chain needs, and
that is what stops an engine from carrying the cost of a car, a tank and an
aeroplane at once.

**A method shared by several buildings.** Use `__primary` as the good id in
`out`. It resolves to the building's first `produces` entry, which is how one
set of plantation methods serves coffee, tea, sugar and cotton.

**Ratios matter more than sizes.** How many buildings you need is decided by the
input:output *ratio*. If you only fix one thing, fix the ratios.

**Watch for runaway loops.** If your chain consumes more of something than it
can make, the solver will say so and name the building it grew fastest around.
That is a data problem, not a bug — check that building's ratio.
