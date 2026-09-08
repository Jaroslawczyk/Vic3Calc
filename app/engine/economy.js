/* ============================================================================
 * app/engine/economy.js - Money.
 * ---------------------------------------------------------------------------
 * EN: Turns a solved chain into pounds per week.
 *
 *       revenue   = Σ(output × price)
 *       inputCost = Σ(input  × price)
 *       wages     = Σ(workers × wageWeight) × baseWage × wageMultiplier
 *       profit    = revenue − inputCost − wages
 *
 *     TWO HONEST CAVEATS, because money is where a calculator can mislead:
 *
 *     1. Prices here are BASE prices. In game the market moves them up to ±75%,
 *        and a chain that looks profitable at base price can be a loss-maker
 *        once you flood your own market with the thing you are making. Switch
 *        Settings -> Prices to "custom" and type in what your market actually
 *        shows to get a real answer.
 *
 *     2. `baseWagePerWorker` is a tuning knob, not a game constant. It is set
 *        so a typical factory lands in a believable place; adjust it in
 *        Settings until a building you own in your save matches, then every
 *        other number in the app becomes trustworthy at once.
 *
 * RU: Превращает решённую цепочку в фунты в неделю.
 *
 *     ДВЕ ЧЕСТНЫЕ ОГОВОРКИ - потому что именно на деньгах калькулятор проще
 *     всего вводит в заблуждение:
 *
 *     1. Здесь БАЗОВЫЕ цены. В игре рынок двигает их до ±75%, и цепочка,
 *        прибыльная по базовой цене, может стать убыточной, когда вы завалите
 *        собственный рынок своим же товаром. Переключите Настройки -> Цены на
 *        "свои" и впишите то, что реально показывает ваш рынок.
 *
 *     2. `baseWagePerWorker` - это ручка настройки, а не игровая константа.
 *        Подгоните её в настройках под здание из своего сохранения - и все
 *        остальные числа в программе сразу станут достоверными.
 * ==========================================================================*/
(function (V3) {
  'use strict';

  var E = V3.Economy = {};

  /** Weighted worker count - the thing wages are actually proportional to. */
  E.weightedWorkers = function (jobs) {
    return V3.util.sum(Object.keys(jobs || {}), function (p) {
      var pop = V3.db.pop(p);
      if (!pop || pop.owner || pop.unpaid) return 0;   // owners live off profit
      return (jobs[p] || 0) * (pop.wageWeight || 0);
    });
  };

  /** Money picture for a single solved node. */
  E.node = function (ctx, node) {
    var revenue = V3.util.sum(Object.keys(node.outputs), function (g) {
      return node.outputs[g] * ctx.price(g);
    });
    var inputCost = V3.util.sum(Object.keys(node.inputs), function (g) {
      return node.inputs[g] * ctx.price(g);
    });
    var wages = E.weightedWorkers(node.jobs)
              * ctx.opt.baseWagePerWorker
              * (ctx.opt.wageMultiplier || 1);

    var profit = revenue - inputCost - wages;
    return {
      revenue: revenue,
      inputCost: inputCost,
      wages: wages,
      profit: profit,
      profitPerLevel: node.levels ? profit / node.levels : 0,
      /** Weeks of profit to pay back what it cost to build. Infinity if loss-making. */
      paybackWeeks: profit > 0 ? (node.constructionCost / profit) : Infinity,
      margin: revenue > 0 ? profit / revenue : 0
    };
  };

  /**
   * Money picture for a whole solution.
   * `internal` money (inputs bought from your own chain) is netted out, so
   * `netProfit` is what the chain earns AS A WHOLE, not the sum of the parts.
   */
  E.solution = function (ctx, solution) {
    var perNode = {};
    var gross = { revenue: 0, inputCost: 0, wages: 0, profit: 0 };

    solution.nodes.forEach(function (n) {
      var m = E.node(ctx, n);
      perNode[n.buildingId] = m;
      gross.revenue += m.revenue;
      gross.inputCost += m.inputCost;
      gross.wages += m.wages;
      gross.profit += m.profit;
    });

    // What the chain buys from outside, and what it can actually sell.
    var importCost = 0, exportRevenue = 0, finalValue = 0;
    Object.keys(solution.goods).forEach(function (g) {
      var row = solution.goods[g];
      var p = ctx.price(g);
      importCost += (row.imported || 0) * p;
      exportRevenue += (row.surplus || 0) * p;
      finalValue += (row.finalDemand || 0) * p;
    });

    return {
      perNode: perNode,
      gross: gross,
      importCost: importCost,
      exportRevenue: exportRevenue,
      finalValue: finalValue,
      /** The number that matters: what the chain nets per week once running. */
      netProfit: gross.profit,
      totalWages: gross.wages,
      constructionCost: solution.totals.constructionCost,
      paybackWeeks: gross.profit > 0
        ? solution.totals.constructionCost / gross.profit
        : Infinity
    };
  };

  /**
   * Wage bill split by social class - useful for the "who gets rich off this"
   * question, which in Victoria 3 decides your politics.
   */
  E.wagesByStrata = function (ctx, jobs) {
    var out = { poor: 0, middle: 0, upper: 0 };
    Object.keys(jobs || {}).forEach(function (p) {
      var pop = V3.db.pop(p);
      if (!pop) return;
      var w = (jobs[p] || 0) * (pop.wageWeight || 0)
            * ctx.opt.baseWagePerWorker * (ctx.opt.wageMultiplier || 1);
      out[pop.strata] = (out[pop.strata] || 0) + w;
    });
    return out;
  };

})(window.V3);
