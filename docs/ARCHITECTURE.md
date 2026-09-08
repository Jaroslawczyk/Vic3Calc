# Architecture

**[Русская версия — ARCHITECTURE.ru.md](ARCHITECTURE.ru.md)**

## The one constraint that shaped everything

The app must run by double-clicking an icon: no installer, no Node, no console,
no internet. That means it is loaded over `file://`, and browsers refuse to load
ES modules over `file://`.

So: **plain `<script>` tags, no build step, no dependencies.** Everything hangs
off one global, `V3`. Data files are `.js` that register themselves rather than
`.json` that would need `fetch()` (also blocked over `file://`).

Every other decision follows from that one.

## Layers

```
core/     no game knowledge at all — registry, translation, storage, icons
data/     game knowledge, no logic — tables only
engine/   logic, no DOM — pure functions, every one takes a context first
ui/       DOM, no logic — reads state, draws, calls back into the engine
```

A layer may only use the ones above it. `engine/` never touches `document`;
that is what makes `tools/selftest.js` able to run the whole thing in Node.

## Load order

`app/index.html` lists every file in the order it must load, grouped and
commented. The rules:

1. `core/ns.js` first — it creates `V3`, `V3.views` and the event bus.
2. `core/registry.js` before any `data/` file — data files call `V3.define.*`.
3. `data/_meta.js` and `data/_helpers.js` before the tables that use them.
4. `lang/en.js` before other languages — English is the fallback.
5. `ui/app.js` last — it starts the app.

Adding a file means adding one `<script>` line and, if it is a data file, one
line in `tools/selftest.js`.

## The data layer, in one paragraph

Two stacked layers: **base** (`app/data/*.js`, shipped, never written) and
**user** (`localStorage`, your edits). `V3.db.*` always returns the merged view,
so nothing in the app can tell vanilla content from a mod. The user layer
serialises to a single `.v3pack.json`. Lists are memoised and the cache is
dropped on any write — the solver asks for the same list thousands of times per
recalculation, and re-sorting 226 production methods each time was the
difference between instant and visibly stuck.

## The update loop

```
user changes something
  -> V3.app.patch(fn)          mutate state.chain
  -> V3.app.recalc()           on the next animation frame
       -> V3.Solver.solve()    the fixed-point iteration
       -> V3.Economy / Construction
  -> bus.emit('solved')
  -> the open view redraws the parts that depend on the solution
```

Views never talk to each other. They read `V3.app.state` and listen on
`V3.bus`. That is why a new screen is ~150 lines and cannot break the others.

## Where to change what

| You want to… | Edit |
|---|---|
| Correct a game number for everyone | `app/data/*.js` |
| Correct it just for yourself | the Data tab in the app |
| Change how something is computed | `app/engine/*.js` **and** the text in `app/engine/formulas.js` |
| Change how something looks | `app/styles/` — colours only in `01-tokens.css` |
| Add a screen | a file in `app/ui/`, one `<script>` line, one entry in the `TABS` array in `ui/app.js` |
| Add a language | `app/lang/` — see [TRANSLATING.md](TRANSLATING.md) |
| Add a data *kind* | one entry in `KINDS` in `core/registry.js` |

## Testing

```bash
node tools/selftest.js
```

Loads core + data + engine in a Node sandbox with a browser-shaped stub, then:
checks every cross-reference resolves, verifies the throughput/employment rules,
solves nine real chains at their correct technology eras, asserts the build
order ends with the thing you asked for, and exercises economy, military and
research. 51 checks. Exit code 0 means fine; wire it into CI if you like.

Run it after *any* change to `app/data/` or `app/engine/`.

## Deliberate non-goals

- **No framework.** `ui/dom.js` is a 60-line `h()` function. That is enough.
- **No bundling or minification.** Someone who downloads this should be able to
  open any file and read it.
- **No server.** `tools/devserver.js` exists only so browser devtools are
  pleasant; the app never needs it.
