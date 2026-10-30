import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoiceTotals, roundCurrency } from '../src/domain/invoiceMath.js';

test('invoice totals calculate line amounts and GST in INR-safe decimals', () => {
  const result = calculateInvoiceTotals([
    { description: 'Freight', quantity: 2, unitPrice: 1250.25 },
    { description: 'Handling', quantity: 1, unitPrice: 499.50 }
  ], 18);
  assert.deepEqual(result.lines.map(x => x.amount), [2500.5, 499.5]);
  assert.equal(result.subtotal, 3000);
  assert.equal(result.gstAmount, 540);
  assert.equal(result.total, 3540);
});

test('invoice math rejects invalid quantity, rate and empty invoices', () => {
  assert.throws(() => calculateInvoiceTotals([], 18), RangeError);
  assert.throws(() => calculateInvoiceTotals([{ quantity: 0, unitPrice: 10 }], 18), RangeError);
  assert.throws(() => calculateInvoiceTotals([{ quantity: 1, unitPrice: 10 }], 101), RangeError);
});

test('currency rounding uses two decimal places', () => {
  assert.equal(roundCurrency(12.345), 12.35);
});
