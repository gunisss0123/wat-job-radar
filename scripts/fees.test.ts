import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateAgencyTotalBudget } from '../lib/feesData';

const quote = {
  agencyQuoteThb: 80000, usdRate: 34, flightTicketThb: 45000,
  pocketMoneyUsd: 850, housingDepositUsd: 0,
  visaIncluded: false, sevisIncluded: false, sevisChargeThb: 3900,
};

test('missing quote cannot produce a complete budget', () => {
  const result = calculateAgencyTotalBudget({ ...quote, agencyQuoteThb: null });
  assert.equal(result.grandTotalThb, null);
});

test('uses the quoted SEVIS charge instead of adding government SEVIS again', () => {
  const result = calculateAgencyTotalBudget(quote);
  assert.equal(result.govFeesThb, 185 * 34 + 3900);
  assert.equal(result.grandTotalThb, 80000 + 185 * 34 + 3900 + 45000 + 850 * 34);
});

test('fees already included in a quote are not added twice', () => {
  const result = calculateAgencyTotalBudget({ ...quote, visaIncluded: true, sevisIncluded: true });
  assert.equal(result.govFeesThb, 0);
});

test('unknown inclusion prevents a misleading total', () => {
  assert.equal(calculateAgencyTotalBudget({ ...quote, sevisIncluded: null }).grandTotalThb, null);
  assert.equal(calculateAgencyTotalBudget({ ...quote, visaIncluded: null }).grandTotalThb, null);
});

test('unknown SEVIS invoice charge is not silently replaced by $35', () => {
  assert.equal(calculateAgencyTotalBudget({ ...quote, sevisChargeThb: null }).grandTotalThb, null);
});

test('invalid money or exchange rate cannot produce a total', () => {
  for (const invalid of [0, -1, NaN, Infinity]) {
    assert.equal(calculateAgencyTotalBudget({ ...quote, usdRate: invalid }).grandTotalThb, null);
  }
  assert.equal(calculateAgencyTotalBudget({ ...quote, flightTicketThb: -1 }).grandTotalThb, null);
});

test('a zero deposit remains valid', () => {
  assert.equal(typeof calculateAgencyTotalBudget(quote).grandTotalThb, 'number');
});
