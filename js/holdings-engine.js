/* ═══════════════════════════════════════════════════════════
   INVESTR — Holdings Engine v1.0
   Derives current portfolio from transaction history.
   Method: weighted average cost. (FIFO = future option.)
   Single source of truth: transactions → holdings.
═══════════════════════════════════════════════════════════ */

'use strict';

/* Read transactions from storage (same key as journal) */
function loadTransactions() {
  const saved = Store.get('investr-transactions');
  if (saved) { try { return JSON.parse(saved); } catch(e){} }
  return [];
}

/* Derive holdings per ticker using average cost.
   Returns array: [{ ticker, name, acc, accColor, intent, qty,
                     avgBuy, totalCost, realizedPnl }]
   Only tickers with qty > 0 are "current holdings".          */
function deriveHoldings(transactions) {
  const map = {}; // ticker → state

  // process oldest first
  const txs = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));

  txs.forEach(t => {
    const k = t.ticker;
    if (!map[k]) {
      map[k] = {
        ticker: k, name: t.name || k, acc: t.acc, accColor: t.accColor,
        intent: t.intent, qty: 0, totalCost: 0, avgBuy: 0, realizedPnl: 0,
      };
    }
    const h = map[k];
    const fee = (t.price * t.qty) * ((t.feeRate || 0) / 100);

    if (t.type === 'buy') {
      // average cost: add to cost basis (incl. fee)
      h.totalCost += (t.price * t.qty) + fee;
      h.qty += t.qty;
      h.avgBuy = h.qty > 0 ? h.totalCost / h.qty : 0;
      // keep latest account/intent context
      h.acc = t.acc; h.accColor = t.accColor; h.intent = t.intent;
    } else if (t.type === 'sell') {
      // realized P&L = (sell price - avgBuy) * qty - fee
      const costOfSold = h.avgBuy * t.qty;
      const proceeds = (t.price * t.qty) - fee;
      h.realizedPnl += proceeds - costOfSold;
      h.qty -= t.qty;
      h.totalCost -= costOfSold;
      if (h.qty <= 0.0000001) { h.qty = 0; h.totalCost = 0; h.avgBuy = 0; }
    }
  });

  return Object.values(map);
}

/* Group current holdings (qty>0) by account */
function groupByAccount(holdings) {
  const groups = {};
  holdings.filter(h => h.qty > 0).forEach(h => {
    const acc = h.acc || 'Lainnya';
    if (!groups[acc]) groups[acc] = { acc, color: h.accColor, items: [] };
    groups[acc].items.push(h);
  });
  return Object.values(groups);
}

/* expose */
window.HoldingsEngine = { loadTransactions, deriveHoldings, groupByAccount };
