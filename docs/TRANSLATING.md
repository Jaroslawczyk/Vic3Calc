# Translating

**[Русская версия — TRANSLATING.ru.md](TRANSLATING.ru.md)**

Adding a language means copying **one file**. Nothing else in the app needs to
change.

## Three steps

1. Copy `app/lang/TEMPLATE.js` to `app/lang/<code>.js` — e.g. `de.js`, `pl.js`.
2. Fill in `code`, `name`, `flag`, then translate.
3. Add one line to `app/index.html`, next to the other languages:
   ```html
   <script src="lang/de.js"></script>
   ```

Open `app/lang/en.js` beside your file and translate the text to the **right**
of each colon. Never change the text on the left — those are the keys the
program looks strings up by.

You do not have to translate everything. Anything you leave out falls back to
English, so a half-finished translation is still useful.

## The two sections

**`ui`** — interface strings.

```js
'sum.workers': 'people employed',
'order.levels': '{n} levels',
```

`{braces}` are placeholders; keep them exactly as they are and the app
substitutes real values.

**`entities`** — names of game content, keyed `kind.id`.

```js
'good.coal': 'Kohle',
'building.steel_mills': 'Stahlwerke',
'pop.machinists': 'Maschinisten',
```

Look any id up in the Data tab, or in `app/data/`. English leaves this section
empty on purpose — it falls back to the `name` field in the data files — so use
`ru.js` as your model here, not `en.js`.

## Plural forms

English needs two forms, Russian needs three, and `1 уровней` reads as
obviously machine-made. So a value may be an **object of forms** instead of a
string:

```js
// English
'order.levels': { one: '{n} level', many: '{n} levels' },

// Russian
'order.levels': { one: '{n} уровень', few: '{n} уровня', many: '{n} уровней' },
```

The form is chosen from `{n}`. Built-in rules exist for English (`one`/`many`)
and Russian (`one`/`few`/`many`). If your language needs a different rule, add
it in your own file:

```js
V3.i18n.setPluralRule('pl', function (n) {
  var m10 = n % 10, m100 = n % 100;
  if (n === 1) return 'one';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
  return 'many';
});
```

A plain string still works everywhere, so you can ignore plurals entirely and
come back to them.

## Checking your work

**Settings → Language** lists every language file the app found and how complete
each one is:

```
Deutsch    interface 82% · content 40%
```

Interface completeness is measured against English. **Content completeness is
measured against the data registry** — the actual list of goods, buildings,
methods and technologies that exist — not against `en.js`, which is empty.

To get the exact list of what is still missing:

```bash
node tools/selftest.js
```

It prints coverage for every language and names the missing keys. There is an
assertion for Russian; add one for your language the same way if you want the
test to guard it.

## The Almanac

Every sentence of the in-app guide lives in the `ui` section under keys starting
`alm.` — the article *structure* is in `app/data/almanac.js` and needs no
translating. So the whole guide, twenty articles, is translated in the same one
file as everything else.

The worked examples inside it are computed live from the data tables, so they
are correct in every language without anyone touching them.
