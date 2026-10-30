export function roundCurrency(value) {
  if (!Number.isFinite(Number(value))) throw new TypeError('A finite amount is required');
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(lines, gstRate = 0) {
  if (!Array.isArray(lines) || lines.length < 1) throw new RangeError('At least one invoice line is required');
  if (!Number.isFinite(Number(gstRate)) || Number(gstRate) < 0 || Number(gstRate) > 100) throw new RangeError('GST rate must be between 0 and 100');
  const pricedLines = lines.map(line => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) throw new RangeError('Invoice line quantity and price are invalid');
    return { ...line, quantity, unitPrice, amount: roundCurrency(quantity * unitPrice) };
  });
  const subtotal = roundCurrency(pricedLines.reduce((sum, line) => sum + line.amount, 0));
  const gstAmount = roundCurrency(subtotal * Number(gstRate) / 100);
  return { lines: pricedLines, subtotal, gstRate: Number(gstRate), gstAmount, total: roundCurrency(subtotal + gstAmount) };
}
