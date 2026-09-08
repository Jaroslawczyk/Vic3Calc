/* ============================================================================
 * tools/selftest.js - Headless check of the data tables and the engine.
 * ---------------------------------------------------------------------------
 * EN: Run this after editing anything in app/data/ or app/engine/:
 *
 *         node tools/selftest.js
 *
 *     It loads the same files the app loads (everything except the interface,
 *     which needs a browser), then:
 *       - checks every cross-reference actually resolves,
 *       - solves a handful of real chains and asserts the answers are sane,
 *       - prints a worked example so you can eyeball the numbers.
 *
 *     Exit code 0 = fine, 1 = something is broken. Safe to wire into CI.
 *
 * RU: Запускайте после правок в app/data/ или app/engine/:
 *
 *         node tools/selftest.js
 *
 *     Скрипт грузит те же файлы, что и программа (кроме интерфейса, которому
 *     нужен браузер), затем проверяет все перекрёстные ссылки, решает
 *     несколько настоящих цепочек и печатает разбор, чтобы числа можно было
 *     оценить глазами.
 *
 *     Код выхода 0 - всё в порядке, 1 - что-то сломано.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', 'app');

// ---------------------------------------------------------------------------
// A browser-shaped hole just big enough for the core, data and engine files.
// ---------------------------------------------------------------------------
const store = {};
const sandbox = {
  console,
  setTimeout, clearTimeout, requestAnimationFrame: (f) => setTimeout(f, 0),
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; }
  },
  document: {
    documentElement: { setAttribute() {} },
    createElement: () => ({ style: {}, addEventListener() {}, click() {} }),
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {}
  }
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const FILES = [
  'core/ns.js', 'core/registry.js', 'core/i18n.js', 'core/num.js',
  'core/storage.js', 'core/userdata.js',
  'data/icon_manifest.js', 'core/icons.js',
  'data/_meta.js', 'data/_helpers.js',
  'data/goods.js', 'data/pops.js', 'data/building_groups.js', 'data/buildings.js',
  'data/pm_groups.js', 'data/pm_primary.js', 'data/pm_industry.js',
  'data/pm_infrastructure.js', 'data/pm_military.js',
  'data/technologies.js', 'data/almanac.js',
  'engine/formulas.js', 'engine/context.js', 'engine/building_calc.js',
  'engine/solver.js', 'engine/economy.js', 'engine/construction.js',
  'engine/military.js', 'engine/research.js',
  'lang/en.js', 'lang/ru.js'
];

let failures = 0;
let checks = 0;

function fail(msg) { failures++; console.error('  ✗ ' + msg); }
function ok(msg) { checks++; console.log('  ✓ ' + msg); }
function assert(cond, msg) { cond ? ok(msg) : fail(msg); }
function section(title) { console.log('\n—— ' + title + ' ' + '—'.repeat(Math.max(0, 60 - title.length))); }

// ---------------------------------------------------------------------------
section('Loading');
for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  try {
    vm.runInContext(fs.readFileSync(full, 'utf8'), sandbox, { filename: rel });
  } catch (e) {
    fail('could not load ' + rel + ': ' + e.message);
    process.exit(1);
  }
}
const V3 = sandbox.V3;
ok(FILES.length + ' files loaded');

V3.userdata.load();
V3.i18n.set('en');

assert(V3.problems.length === 0,
  'no problems reported while registering data' +
  (V3.problems.length ? ': ' + JSON.stringify(V3.problems.slice(0, 5)) : ''));

// ---------------------------------------------------------------------------
section('Table sizes');
const counts = {
  goods: V3.db.goods().length,
  buildings: V3.db.buildings().length,
  methods: V3.db.pms().length,
  methodGroups: V3.db.pmGroups().length,
  professions: V3.db.pops().length,
  technologies: V3.db.techs().length,
  almanac: V3.db.almanacs().length,
  icons: V3.icons.all().length
};
Object.keys(counts).forEach((k) => console.log('  ' + String(counts[k]).padStart(5) + '  ' + k));
assert(counts.goods > 40, 'goods table populated');
assert(counts.buildings > 40, 'buildings table populated');
assert(counts.methods > 100, 'production methods populated');
assert(counts.icons > 400, 'icon manifest populated');

// ---------------------------------------------------------------------------
section('Cross-references');
let dangling = 0;
V3.db.buildings().forEach((b) => {
  (b.pmGroups || []).forEach((g) => {
    if (!V3.db.has('pmGroup', g)) { fail(b.id + ' -> missing pmGroup ' + g); dangling++; }
  });
  (b.produces || []).forEach((g) => {
    if (!V3.db.has('good', g)) { fail(b.id + ' -> missing good ' + g); dangling++; }
  });
  if (b.unlockTech && !V3.db.has('tech', b.unlockTech)) {
    fail(b.id + ' -> missing tech ' + b.unlockTech); dangling++;
  }
  if (!V3.db.has('buildingGroup', b.group)) { fail(b.id + ' -> missing group ' + b.group); dangling++; }
});
V3.db.pms().forEach((p) => {
  if (!V3.db.has('pmGroup', p.group)) { fail(p.id + ' -> missing pmGroup ' + p.group); dangling++; }
  Object.keys(p.inputs || {}).concat(Object.keys(p.outputs || {})).forEach((g) => {
    if (g === '__primary') return;
    if (!V3.db.has('good', g)) { fail(p.id + ' -> missing good ' + g); dangling++; }
  });
  Object.keys(p.jobs || {}).forEach((j) => {
    if (!V3.db.has('pop', j)) { fail(p.id + ' -> missing pop ' + j); dangling++; }
  });
  if (p.unlockTech && !V3.db.has('tech', p.unlockTech)) {
    fail(p.id + ' -> missing tech ' + p.unlockTech); dangling++;
  }
});
if (!dangling) ok('every reference resolves');

// Every non-abstract good should have at least one producer, or the solver can
// only ever report it as an unfixable deficit.
const orphans = V3.db.goods()
  .filter((g) => !g.abstract && !V3.db.producersOf(g.id).length)
  .map((g) => g.id);
assert(orphans.length === 0, 'every good has a producer' +
  (orphans.length ? ' (missing: ' + orphans.join(', ') + ')' : ''));

// Every PM group referenced by a building should have at least one method.
const emptyGroups = V3.db.pmGroups()
  .filter((g) => !V3.db.pmsOfGroup(g.id).length)
  .map((g) => g.id);
assert(emptyGroups.length === 0, 'every method group has methods' +
  (emptyGroups.length ? ' (empty: ' + emptyGroups.join(', ') + ')' : ''));

// ---------------------------------------------------------------------------
section('Translations');
['en', 'ru'].forEach((code) => {
  const cov = V3.i18n.coverage(code);
  console.log('  ' + code + ': interface ' + cov.ui + '%, content ' + cov.entities + '%');
});
const ruMissing = V3.i18n.coverage('ru').missing;
assert(ruMissing.length === 0,
  'every shipped record has a Russian name' +
  (ruMissing.length ? ' (missing ' + ruMissing.length + ': ' +
    ruMissing.slice(0, 10).join(', ') + ')' : ''));

// ---------------------------------------------------------------------------
section('Building maths');
const ctx = V3.Context.create({ era: 3 });

const steel = V3.BuildingCalc.evaluate(ctx, {
  buildingId: 'steel_mills',
  pms: V3.Context.defaultPMs(ctx, 'steel_mills'),
  levels: 10
});
assert(steel.outputs.steel > 0, 'steel mills produce steel');
assert(steel.inputs.iron > 0, 'steel mills consume iron');
assert(Object.keys(steel.jobs).length > 0, 'steel mills employ someone');
assert(steel.throughput > 1, 'economy of scale applies at 10 levels (' +
  steel.throughput.toFixed(2) + '×)');

// Throughput must scale goods but NOT jobs - the rule the whole app rests on.
const one = V3.BuildingCalc.evaluate(ctx, {
  buildingId: 'steel_mills', pms: V3.Context.defaultPMs(ctx, 'steel_mills'), levels: 1
});
const jobsPerLevel10 = steel.jobs.laborers / 10;
assert(Math.abs(jobsPerLevel10 - one.jobs.laborers) < 1e-6,
  'jobs scale linearly with levels, unaffected by throughput');
assert(steel.outputs.steel / 10 > one.outputs.steel,
  'output per level rises with throughput');

// Default method selection: optional rows off, ownership on the first entry.
// Both of these have been wrong at some point and both distort the whole chain.
{
  const motorPms = V3.Context.defaultPMs(
    V3.Context.create({ era: 5 }), 'motor_industry', ['engines']);
  const motorPer = V3.BuildingCalc.perLevel(
    V3.Context.create({ era: 5 }), 'motor_industry', motorPms);
  assert(!motorPer.outputs.tanks && !motorPer.outputs.aeroplanes,
    'a motor industry asked for engines does not also build tanks and aeroplanes');

  const farmPms = V3.Context.defaultPMs(ctx, 'wheat_farm', ['grain']);
  const farmPer = V3.BuildingCalc.perLevel(ctx, 'wheat_farm', farmPms);
  assert(!farmPer.jobs.bureaucrats && farmPer.jobs.aristocrats > 0,
    'a farm defaults to aristocratic ownership, not government-run');
}

// Plantations share one method row; __primary must resolve per building.
const coffee = V3.BuildingCalc.evaluate(ctx, {
  buildingId: 'coffee_plantation',
  pms: V3.Context.defaultPMs(ctx, 'coffee_plantation'), levels: 1
});
assert(coffee.outputs.coffee > 0, 'shared plantation method resolves to coffee');
assert(!coffee.outputs.__primary, 'no unresolved __primary placeholder leaks out');

// ---------------------------------------------------------------------------
section('Chain solver');

function solveFor(goodId, amount, era) {
  const c = V3.Context.create({ era: era === undefined ? 3 : era });
  const plan = V3.Solver.autoPlan(c, goodId, amount, {});
  return { ctx: c, plan, solution: V3.Solver.solve(c, plan) };
}

// [good, era] - a few of these genuinely do not exist before their era, which
// is the point: asking for automobiles in era 3 must fail loudly, not quietly.
[['clothes', 3], ['steel', 3], ['tools', 3], ['small_arms', 3], ['groceries', 3],
 ['ironclads', 3], ['automobiles', 5], ['tanks', 5], ['aeroplanes', 5]]
  .forEach(([g, era]) => {
    const r = solveFor(g, 100, era);
    const s = r.solution;
    const errors = s.warnings.filter((w) => w.level === 'error');
    const good = s.converged && s.nodes.length > 0 && s.totals.workers > 0 && !errors.length;
    assert(good,
      (g + ' (era ' + era + ')').padEnd(22) + '→ ' +
      String(s.nodes.length).padStart(2) + ' buildings, ' +
      String(Math.round(s.totals.levels)).padStart(4) + ' levels, ' +
      String(Math.round(s.totals.workers)).padStart(7) + ' workers' +
      (errors.length ? '  ERRORS: ' + errors.map((w) => w.code + ':' + (w.good || '')).join(',') : '') +
      (s.converged ? '' : '  DID NOT CONVERGE'));
  });

// The same good BEFORE its technology exists must produce a loud error rather
// than an empty chain that looks like it worked.
{
  const early = solveFor('automobiles', 100, 3).solution;
  assert(early.warnings.some((w) => w.code === 'PRODUCER_CANNOT_MAKE'),
    'asking for automobiles in era 3 reports PRODUCER_CANNOT_MAKE');
}

// The loop case: tools need steel, steel needs coal, coal mines need tools.
const toolsRun = solveFor('tools', 200);
assert(toolsRun.solution.converged,
  'cyclic chain (tools ↔ steel ↔ coal) converges in ' +
  toolsRun.solution.iterations + ' iterations');

// Doubling demand must roughly double the chain. Compared on EXACT levels:
// the rounded-up figures are dominated by ceiling slack at these small sizes.
// Slightly under 2× is correct and expected - economy of scale means a bigger
// stack of the same building is more efficient per level.
const a = solveFor('clothes', 100).solution.totals.levelsExact;
const b = solveFor('clothes', 200).solution.totals.levelsExact;
assert(b > a * 1.85 && b <= a * 2.0,
  'doubling demand slightly-less-than-doubles the chain, thanks to economy of scale (' +
  a.toFixed(1) + ' → ' + b.toFixed(1) + ' = ' + (b / a).toFixed(3) + '×)');

// Marking a good as imported must remove its producer from the chain.
const cImp = V3.Context.create({ era: 3 });
const planImp = V3.Solver.autoPlan(cImp, 'clothes', 100, { imported: { fabric: 999 } });
const solImp = V3.Solver.solve(cImp, planImp);
assert(!solImp.nodes.some((n) => n.buildingId === 'cotton_plantation'),
  'importing fabric removes the cotton plantation from the chain');

// PARTIAL imports must shrink the producer, not delete it. "I buy half my
// coal" is a normal plan and used to be impossible to express.
{
  const c = V3.Context.create({ era: 3 });
  const plan = V3.Solver.autoPlan(c, 'clothes', 100, {});
  const full = V3.Solver.solve(c, plan);
  const coalNeeded = full.goods.coal ? full.goods.coal.consumed : 0;

  const half = V3.util.deepClone(plan);
  half.imported = { coal: coalNeeded / 2 };
  const solHalf = V3.Solver.solve(c, half);

  const mineFull = full.nodes.find((n) => n.buildingId === 'coal_mine');
  const mineHalf = solHalf.nodes.find((n) => n.buildingId === 'coal_mine');
  assert(mineHalf && mineFull && mineHalf.levelsExact < mineFull.levelsExact * 0.75,
    'buying half the coal shrinks the mine instead of removing it (' +
    (mineFull ? mineFull.levelsExact.toFixed(2) : '?') + ' → ' +
    (mineHalf ? mineHalf.levelsExact.toFixed(2) : 'gone') + ' levels)');
}

// Buildings left behind by an edit must not clutter the plan. Removing a
// target used to leave its whole supply chain on the diagram at zero levels.
{
  const c = V3.Context.create({ era: 3 });
  const plan = V3.Solver.autoPlan(c, 'clothes', 100, {});
  // Keep the producers, drop the demand - exactly what removing a goal does.
  plan.targets = [];
  const sol = V3.Solver.solve(c, plan);
  assert(sol.nodes.length === 0 && sol.unused.length > 0,
    'a chain with no demand reports ' + sol.unused.length +
    ' unused buildings and draws none of them');
}

// ---------------------------------------------------------------------------
section('Construction ramp');
const cs = V3.Context.create({ era: 3, country: { constructionPoints: 50 } });
const csPlan = V3.Solver.autoPlan(cs, 'steel', 300, {});
csPlan.producers.construction = 'construction_sector';
csPlan.targets.push({ good: 'construction', amount: 60 });
const csSol = V3.Solver.solve(cs, csPlan);
const order = V3.Construction.order(cs, csSol, 'fastest');
assert(order.length > 0, 'build order produced (' + order.length + ' steps)');

const firstIsConstruction = order[0] &&
  V3.db.building(order[0].node.buildingId).abstractOutput === 'construction';
assert(firstIsConstruction, '"fastest" puts the construction sector first');

// The thing you asked for must be built LAST, after everything that feeds it.
// This is the assertion that catches a broken ordering algorithm: with a naive
// topological sort on a cyclic chain it comes out first.
['clothes', 'small_arms', 'groceries'].forEach((g) => {
  const c = V3.Context.create({ era: 3 });
  const sol = V3.Solver.solve(c, V3.Solver.autoPlan(c, g, 100, {}));
  const ord = V3.Construction.order(c, sol, 'fastest');
  const last = ord[ord.length - 1];
  const makesTarget = last && (last.node.outputs[g] || 0) > 0;
  assert(makesTarget,
    'chain for ' + g + ' ends with the building that makes it (' +
    (last ? last.node.buildingId : '—') + ')');

  // And nothing should be labelled "cycle broken" unless it really is stuck.
  const broken = ord.filter((r) => r.reason === 'CYCLE_BROKEN').length;
  assert(broken < ord.length / 2,
    '  only ' + broken + ' of ' + ord.length + ' steps sit in a broken cycle');
});

// "How many construction sectors is it worth building?" - the button that
// re-solves the whole plan once per candidate and keeps the fastest.
{
  const c = V3.Context.create({ era: 3, country: { constructionPoints: 20 } });
  const plan = V3.Solver.autoPlan(c, 'transportation', 100, {});
  const t0 = Date.now();
  const advice = V3.Construction.suggestConstructionSectors(c, plan);
  const ms = Date.now() - t0;

  assert(advice.best && advice.baseline,
    'construction sector search returns an answer (' + advice.curve.length +
    ' options in ' + ms + 'ms)');
  assert(advice.best.weeks <= advice.baseline.weeks,
    'the suggested count is no slower than building none (' +
    advice.baseline.weeks + 'w → ' + advice.best.weeks + 'w, saving ' +
    advice.saved + 'w)');
  assert(advice.best.levels === 0 || advice.best.cost > advice.baseline.cost,
    'and it is honest that the sectors cost extra construction (' +
    Math.round(advice.baseline.cost) + ' → ' + Math.round(advice.best.cost) + ' points)');
  assert(ms < 3000, 'the search is fast enough to sit behind a button (' + ms + 'ms)');
}

const withRamp = V3.Construction.simulate(cs, order, { countRamp: true });
const noRamp = V3.Construction.simulate(cs, order, { countRamp: false });
assert(withRamp.weeks <= noRamp.weeks,
  'ramp-up finishes no later than flat (' + withRamp.weeks + 'w vs ' + noRamp.weeks + 'w)');
assert(withRamp.finalPoints > withRamp.startingPoints,
  'construction points grow during the build (' +
  Math.round(withRamp.startingPoints) + ' → ' + Math.round(withRamp.finalPoints) + ')');

// ---------------------------------------------------------------------------
section('Economy');
const eco = V3.Economy.solution(ctx, solveFor('clothes', 100).solution);
assert(isFinite(eco.gross.revenue) && eco.gross.revenue > 0, 'revenue computed');
assert(isFinite(eco.totalWages) && eco.totalWages > 0, 'wages computed');
assert(isFinite(eco.netProfit), 'net profit computed (' + Math.round(eco.netProfit) + ')');

// ---------------------------------------------------------------------------
section('Military');
const force = {
  units: [{
    buildingId: 'barracks', levels: 50,
    pms: V3.Context.defaultPMs(ctx, 'barracks')
  }],
  mobilization: ['mob_basic_supplies']
};
const mil = V3.Military.evaluate(ctx, force);
assert(mil.battalions === 50, '50 barracks levels = 50 battalions');
assert(Object.keys(mil.goodsPeace).length > 0, 'peacetime goods bill computed');
assert(mil.upkeepWar > mil.upkeepPeace,
  'war costs more than peace (' + Math.round(mil.upkeepPeace) + ' → ' +
  Math.round(mil.upkeepWar) + ' per week)');
assert(mil.offenseTotal > 0, 'strength computed');

const cmp = V3.Military.industryComparison(ctx, mil, {});
assert(cmp.war.totals.levels >= cmp.peace.totals.levels,
  'war needs at least as much industry as peace (' +
  Math.round(cmp.peace.totals.levels) + ' → ' + Math.round(cmp.war.totals.levels) + ' levels)');

// ---------------------------------------------------------------------------
section('Research');
const res = V3.Research.evaluate(
  V3.Context.create({ era: 3, country: { literacyPct: 50 } }),
  { universityLevels: 20 }
);
assert(res.produced > 0, 'universities produce innovation');
assert(res.effective <= res.cap, 'innovation is capped by literacy');

// ---------------------------------------------------------------------------
section('Worked example: 100 clothes / week, era 3');
{
  const r = solveFor('clothes', 100);
  const o = V3.Construction.order(r.ctx, r.solution, 'fastest');
  o.forEach((row) => {
    const n = row.node;
    console.log('  ' + String(row.step).padStart(2) + '. ' +
      V3.i18n.name(n.building).padEnd(26) +
      ' ×' + String(Math.ceil(n.levelsExact)).padStart(3) +
      '   workers ' + String(Math.round(
        Object.values(n.jobs).reduce((s, v) => s + v, 0))).padStart(7));
  });
  const sim = V3.Construction.simulate(r.ctx, o);
  console.log('  ' + '-'.repeat(60));
  console.log('  total ' + Math.round(r.solution.totals.workers) + ' workers, ' +
    Math.round(r.solution.totals.constructionCost) + ' construction points, ' +
    sim.weeks + ' weeks at ' + Math.round(sim.startingPoints) + ' pts/week');
}

// ---------------------------------------------------------------------------
section('Result');
console.log('  ' + checks + ' checks passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
