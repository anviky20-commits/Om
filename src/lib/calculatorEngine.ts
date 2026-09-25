// 108-tool Comprehensive Calculator Engine

export const CALCULATOR_CATALOG: Record<string, string[]> = Object.freeze({
  quick: ['Basic', 'Scientific', 'Percentage', 'Fraction', 'Ratio', 'Average', 'Discount', 'Tip', 'Bill Split', 'Tax'],
  money: ['EMI / Loan', 'Simple Interest', 'Compound Interest', 'SIP / Investment', 'Savings', 'ROI', 'Profit & Loss', 'Inflation', 'Salary', 'Markup', 'Margin', 'Break-even', 'CAGR', 'Growth', 'Pricing'],
  gold: ['Gold Value', 'Gold Rate × Weight', 'Gold Weight Converter', 'Karat ↔ Purity', 'Pure Gold Weight', 'Jewellery Price', 'Making Charge', 'Wastage', 'GST / Tax', 'Buy / Sell Value', 'Silver Value'],
  health: ['BMI', 'BMR', 'TDEE', 'Calories', 'Macros', 'Body Fat', 'Water Intake', 'Running Pace', 'Age', 'Ideal Body Weight'],
  time: ['Date Difference', 'Age', 'Countdown', 'Working Days', 'Date Add / Subtract', 'Time Difference', 'Time Zone Offset', 'Unix Timestamp', 'Weekday'],
  converter: ['Length', 'Weight', 'Area', 'Volume', 'Temperature', 'Speed', 'Time', 'Energy', 'Pressure', 'Power', 'Data Size', 'Currency', 'Nepal Land', 'Nepal Length', 'Nepal Volume', 'Nepal Weight'],
  home: ['Room Area', 'Paint', 'Flooring', 'Tiles', 'Construction', 'Electricity Cost', 'Water Usage'],
  vehicle: ['Mileage', 'Fuel Cost', 'Trip Fuel', 'Running Cost', 'Vehicle Loan', 'Fuel Economy'],
  travel: ['Trip Budget', 'Distance', 'Travel Time', 'Fuel Budget', 'Travel Currency', 'Travel Time Zone'],
  business: ['Revenue', 'Margin', 'Markup', 'Break-even', 'CAGR', 'Business ROI', 'Growth', 'Pricing'],
  programmer: ['Binary', 'Decimal', 'Hexadecimal', 'Octal', 'Base Converter', 'Bitwise', 'Modulo', 'Data Size', 'Unix Timestamp', 'IP / Subnet']
});

export const NP_UNITS = {
  land: {
    sq_m: 1,
    sq_ft: 0.09290304,
    bigha: 72900 * 0.09290304,
    kattha: 3645 * 0.09290304,
    dhur: 182.25 * 0.09290304,
    ropani: 5476 * 0.09290304,
    aana: 342.25 * 0.09290304,
    paisa: 85.5625 * 0.09290304,
    daam: 21.390625 * 0.09290304
  },
  length: {
    m: 1,
    ft: 0.3048,
    angul: 0.01905,
    bitta: 0.2286,
    haat: 0.4572,
    danda: 1.8288,
    janjir: 4.1148,
    kosh: 3657.6,
    gaj: 0.9144
  },
  volume: {
    liter: 1,
    muri: 20 * 4.54596,
    pathi: 4.54596,
    kurwa: 1.13649,
    mana: 0.568245,
    chauthai: 0.14206125,
    muthi: 0.0568245
  },
  weight: {
    kg: 1,
    g: 0.001,
    tola: 0.0116638125,
    chatak: 0.0583190625,
    seer: 0.933105,
    dharn: 5.59863,
    maund: 37.3242,
    troy_oz: 0.0311034768
  }
};

export const CALC_UNIT_FACTORS: Record<string, Record<string, number>> = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, yd: 0.9144, mi: 1609.344 },
  Weight: { g: 0.001, kg: 1, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
  Area: { sq_m: 1, sq_km: 1e6, sq_ft: 0.09290304, sq_yd: 0.83612736, acre: 4046.8564224, hectare: 10000 },
  Volume: { liter: 1, ml: 0.001, m3: 1000, gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473 },
  Speed: { mps: 1, kmh: 0.2777777778, mph: 0.44704, knot: 0.5144444444 },
  Time: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800 },
  Energy: { joule: 1, kj: 1000, calorie: 4.184, kcal: 4184, wh: 3600, kwh: 3600000 },
  Pressure: { pa: 1, kpa: 1000, bar: 100000, psi: 6894.757293, atm: 101325 },
  Power: { w: 1, kw: 1000, hp: 745.6998716 },
  Gold: { g: 1, kg: 1000, tola: 11.6638125, troy_oz: 31.1034768 },
  DataSize: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }
};

const n = (v: any): number => {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error('Invalid number');
  return x;
};
const pos = (v: any): number => {
  const x = n(v);
  if (x <= 0) throw new Error('Value must be greater than zero');
  return x;
};
const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
};
const dateObj = (v: any): Date => {
  const d = v instanceof Date ? new Date(v.getTime()) : new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date/time');
  return d;
};

export class CalculatorEngine {
  basic(a: any, op: string, b: any) {
    const na = n(a);
    const nb = n(b);
    if (op === '+') return na + nb;
    if (op === '-') return na - nb;
    if (op === '*' || op === '×') return na * nb;
    if (op === '/' || op === '÷') return nb === 0 ? 'Cannot divide by zero' : na / nb;
    if (op === '%') return na % nb;
    throw new Error('Unsupported operation');
  }

  scientific(expr: string) {
    const s = String(expr).trim().toLowerCase();
    if (!/^[0-9+\-*/%().,\s_a-z]+$/.test(s)) throw new Error('Invalid characters in expression');
    const f = s
      .replace(/pi/g, 'Math.PI')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/pow\(/g, 'Math.pow(')
      .replace(/sin\(/g, 'Math.sin(Math.PI/180*')
      .replace(/cos\(/g, 'Math.cos(Math.PI/180*')
      .replace(/tan\(/g, 'Math.tan(Math.PI/180*');
    if (/[a-z]/i.test(f.replace(/Math\.(PI|sqrt|abs|log10|log|pow|sin|cos|tan)/g, ''))) {
      throw new Error('Unsupported function or identifier');
    }
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${f})`)();
  }

  percentage(value: any, pct: any) {
    return (n(value) * n(pct)) / 100;
  }

  fraction(a: any, b: any) {
    const na = Math.trunc(n(a));
    const nb = Math.trunc(n(b));
    if (!nb) throw new Error('Denominator cannot be zero');
    return na / nb;
  }

  simplifyFraction(a: any, b: any) {
    const na = Math.trunc(n(a));
    const nb = Math.trunc(n(b));
    if (!nb) throw new Error('Denominator cannot be zero');
    const d = gcd(na, nb);
    return `${na / d} / ${nb / d} (${(na / nb).toFixed(4)})`;
  }

  ratio(a: any, b: any) {
    const na = Math.trunc(n(a));
    const nb = Math.trunc(n(b));
    const d = gcd(na, nb);
    return `${na / d} : ${nb / d}`;
  }

  average(values: any[]) {
    const a = values.map(Number).filter(Number.isFinite);
    return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  }

  discount(price: any, pct: any) {
    const np = n(price);
    const disc = this.percentage(np, pct);
    return `Discount: ₹${disc.toFixed(2)} | Final: ₹${(np - disc).toFixed(2)}`;
  }

  tip(bill: any, pct: any) {
    const nb = n(bill);
    const tp = this.percentage(nb, pct);
    return `Tip: ₹${tp.toFixed(2)} | Total Bill: ₹${(nb + tp).toFixed(2)}`;
  }

  billSplit(total: any, people: any, tipPct = 0) {
    const nt = n(total);
    const np = pos(people);
    const grand = nt + this.percentage(nt, tipPct);
    return `Total: ₹${grand.toFixed(2)} | Per Person (${np}): ₹${(grand / np).toFixed(2)}`;
  }

  tax(amount: any, rate: any) {
    const na = n(amount);
    const tx = this.percentage(na, rate);
    return `Tax: ₹${tx.toFixed(2)} | Total: ₹${(na + tx).toFixed(2)}`;
  }

  emi(principal: any, annualRate: any, months: any) {
    const p = n(principal);
    const r = n(annualRate) / 1200;
    const m = pos(months);
    if (!r) return `Monthly EMI: ₹${(p / m).toFixed(2)}`;
    const emiVal = (p * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1);
    const totalPay = emiVal * m;
    const interest = totalPay - p;
    return `Monthly EMI: ₹${emiVal.toFixed(2)} | Total Interest: ₹${interest.toFixed(2)} | Total Payment: ₹${totalPay.toFixed(2)}`;
  }

  simpleInterest(p: any, r: any, t: any) {
    const np = n(p), nr = n(r), nt = n(t);
    const si = (np * nr * nt) / 100;
    return `Interest: ₹${si.toFixed(2)} | Total Amount: ₹${(np + si).toFixed(2)}`;
  }

  compoundInterest(p: any, r: any, t: any, nper = 1) {
    const np = n(p), nr = n(r), nt = n(t), comp = pos(nper);
    const total = np * Math.pow(1 + nr / (100 * comp), comp * nt);
    return `Interest: ₹${(total - np).toFixed(2)} | Total Amount: ₹${total.toFixed(2)}`;
  }

  sip(monthly: any, annualRate: any, months: any) {
    const m = n(monthly), r = n(annualRate) / 1200, nMonths = pos(months);
    const totalInvested = m * nMonths;
    const futureVal = r ? m * ((Math.pow(1 + r, nMonths) - 1) / r) * (1 + r) : totalInvested;
    const wealthGain = futureVal - totalInvested;
    return `Invested: ₹${totalInvested.toFixed(2)} | Returns: ₹${wealthGain.toFixed(2)} | Maturity: ₹${futureVal.toFixed(2)}`;
  }

  savings(target: any, current: any, months: any) {
    const tgt = n(target), cur = n(current), m = n(months);
    const rem = Math.max(0, tgt - cur);
    const monthlyNeeded = m > 0 ? rem / m : 0;
    return `Remaining Needed: ₹${rem.toFixed(2)} | Monthly Savings: ₹${monthlyNeeded.toFixed(2)}`;
  }

  roi(gain: any, cost: any) {
    const c = n(cost);
    if (!c) throw new Error('Cost cannot be 0');
    const pct = ((n(gain) - c) / c) * 100;
    return `ROI: ${pct.toFixed(2)}%`;
  }

  profitLoss(cost: any, sale: any) {
    const c = n(cost), s = n(sale);
    const diff = s - c;
    const pct = c ? (diff / c) * 100 : 0;
    return diff >= 0 ? `Profit: +₹${diff.toFixed(2)} (+${pct.toFixed(2)}%)` : `Loss: -₹${Math.abs(diff).toFixed(2)} (${pct.toFixed(2)}%)`;
  }

  inflation(value: any, rate: any, years: any) {
    const res = n(value) * Math.pow(1 + n(rate) / 100, n(years));
    return `Future Value: ₹${res.toFixed(2)}`;
  }

  salary(annual: any, months = 12, taxRate = 0) {
    const gross = n(annual) / pos(months);
    const tax = this.percentage(gross, taxRate);
    return `Gross/Mo: ₹${gross.toFixed(2)} | Tax: ₹${tax.toFixed(2)} | Net/Mo: ₹${(gross - tax).toFixed(2)}`;
  }

  markup(cost: any, pct: any) {
    const c = n(cost);
    return `Selling Price: ₹${(c + this.percentage(c, pct)).toFixed(2)}`;
  }

  margin(price: any, cost: any) {
    const p = n(price);
    const m = p ? ((p - n(cost)) / p) * 100 : 0;
    return `Profit Margin: ${m.toFixed(2)}%`;
  }

  breakEven(fixedCost: any, price: any, variableCost: any) {
    const contribution = n(price) - n(variableCost);
    if (contribution <= 0) return 'Price must be higher than variable cost';
    const units = n(fixedCost) / contribution;
    return `Break-Even Quantity: ${Math.ceil(units)} units`;
  }

  cagr(begin: any, end: any, years: any) {
    const b = n(begin), e = n(end), y = pos(years);
    const res = (Math.pow(e / b, 1 / y) - 1) * 100;
    return `CAGR: ${res.toFixed(2)}%`;
  }

  growth(oldVal: any, newVal: any) {
    const o = n(oldVal), nv = n(newVal);
    const pct = o ? ((nv - o) / o) * 100 : 0;
    return `Growth: ${pct.toFixed(2)}%`;
  }

  pricing(cost: any, targetMarginPct: any) {
    const c = n(cost), m = n(targetMarginPct);
    if (m >= 100) throw new Error('Margin must be less than 100%');
    const price = c / (1 - m / 100);
    return `Target Price: ₹${price.toFixed(2)}`;
  }

  goldValue(weight: any, ratePerUnit: any) {
    const total = n(weight) * n(ratePerUnit);
    return `Gold Value: ₹${total.toFixed(2)}`;
  }

  karatPurity(value: any, mode = 'karatToPurity') {
    const v = n(value);
    return mode === 'purityToKarat' ? `${(v * 24 / 100).toFixed(1)} Karat` : `${((v / 24) * 100).toFixed(2)}% Pure Gold`;
  }

  pureGoldWeight(weight: any, karat: any) {
    const res = n(weight) * (n(karat) / 24);
    return `Pure Gold Weight: ${res.toFixed(3)} units`;
  }

  jewelleryPrice(goldValue: any, makingPct = 0, wastagePct = 0, taxPct = 0) {
    const gv = n(goldValue);
    const subtotal = gv * (1 + n(wastagePct) / 100) * (1 + n(makingPct) / 100);
    const tax = this.percentage(subtotal, taxPct);
    return `Subtotal: ₹${subtotal.toFixed(2)} | GST (${taxPct}%): ₹${tax.toFixed(2)} | Final Price: ₹${(subtotal + tax).toFixed(2)}`;
  }

  bmi(kg: any, m: any) {
    const w = pos(kg), h = pos(m);
    const val = w / (h * h);
    const status = val < 18.5 ? 'Underweight' : val < 25 ? 'Normal weight' : val < 30 ? 'Overweight' : 'Obese';
    return `BMI: ${val.toFixed(2)} (${status})`;
  }

  bmr(weightKg: any, heightCm: any, age: any, sex = 'male') {
    const w = n(weightKg), h = n(heightCm), a = n(age);
    const bmrVal = sex === 'female' ? 10 * w + 6.25 * h - 5 * a - 161 : 10 * w + 6.25 * h - 5 * a + 5;
    return `BMR: ${Math.round(bmrVal)} kcal/day`;
  }

  tdee(bmr: any, activity: string) {
    const factors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, athlete: 1.9 };
    const val = n(bmr) * (factors[activity] ?? 1.2);
    return `TDEE (Daily Calorie Need): ${Math.round(val)} kcal/day`;
  }

  macros(calories: any, proteinPct = 30, carbPct = 40, fatPct = 30) {
    const c = n(calories);
    const p = Math.round(((c * n(proteinPct)) / 100) / 4);
    const cb = Math.round(((c * n(carbPct)) / 100) / 4);
    const f = Math.round(((c * n(fatPct)) / 100) / 9);
    return `Protein: ${p}g | Carbs: ${cb}g | Fats: ${f}g`;
  }

  waterIntake(weightKg: any, mlPerKg = 35) {
    const ml = n(weightKg) * n(mlPerKg);
    return `Recommended Daily Water: ${ml} ml (~${(ml / 1000).toFixed(1)} L)`;
  }

  pace(distanceKm: any, timeMinutes: any) {
    const d = pos(distanceKm), t = n(timeMinutes);
    const sec = (t * 60) / d;
    const min = Math.floor(sec / 60);
    const remSec = Math.round(sec % 60);
    const kmh = d / (t / 60);
    return `Pace: ${min}:${remSec < 10 ? '0' : ''}${remSec} min/km | Speed: ${kmh.toFixed(1)} km/h`;
  }

  age(birth: any, asOf = new Date()) {
    const b = dateObj(birth), d = dateObj(asOf);
    let y = d.getFullYear() - b.getFullYear();
    let m = d.getMonth() - b.getMonth();
    let day = d.getDate() - b.getDate();
    if (day < 0) {
      m--;
      day += new Date(d.getFullYear(), d.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    return `Age: ${y} years, ${m} months, ${day} days`;
  }

  dateDifference(a: any, b: any) {
    const diff = Math.round(Math.abs(dateObj(b).getTime() - dateObj(a).getTime()) / 86400000);
    return `Difference: ${diff} days`;
  }

  workingDays(a: any, b: any) {
    let d = dateObj(a), e = dateObj(b), count = 0;
    if (d > e) [d, e] = [e, d];
    const cur = new Date(d.getTime());
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return `Working Days (Mon-Fri): ${count} days`;
  }

  unit(value: any, from: string, to: string, factors: Record<string, number>) {
    if (!factors[from] || !factors[to]) throw new Error(`Unknown unit conversion: ${from} to ${to}`);
    const res = (n(value) * factors[from]) / factors[to];
    return `${res.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`;
  }

  temperature(value: any, from: string, to: string) {
    const v = n(value);
    const c = from === 'C' ? v : from === 'F' ? ((v - 32) * 5) / 9 : v - 273.15;
    const finalVal = to === 'C' ? c : to === 'F' ? (c * 9) / 5 + 32 : c + 273.15;
    return `${finalVal.toFixed(2)} °${to}`;
  }

  roomArea(length: any, width: any) {
    const area = n(length) * n(width);
    return `Area: ${area.toFixed(2)} sq units`;
  }

  mileage(distanceKm: any, fuelLitres: any) {
    const km = n(distanceKm), l = pos(fuelLitres);
    return `Mileage: ${(km / l).toFixed(2)} km/L`;
  }

  fuelCost(distanceKm: any, mileageKmPerL: any, pricePerL: any) {
    const litres = n(distanceKm) / pos(mileageKmPerL);
    const cost = litres * n(pricePerL);
    return `Fuel Required: ${litres.toFixed(1)} L | Total Cost: ₹${cost.toFixed(2)}`;
  }

  baseConvert(value: any, fromBase: any, toBase: any) {
    const dec = parseInt(String(value).trim(), n(fromBase));
    if (Number.isNaN(dec)) throw new Error('Invalid number for base ' + fromBase);
    return dec.toString(n(toBase)).toUpperCase();
  }

  ipSubnet(ip: string, cidr: any) {
    const parts = String(ip).trim().split('.').map(Number);
    const c = n(cidr);
    if (parts.length !== 4 || parts.some(x => x < 0 || x > 255) || c < 0 || c > 32) {
      throw new Error('Invalid IPv4 address or CIDR');
    }
    const val = parts.reduce((a, x) => (a * 256 + x) >>> 0, 0);
    const mask = c === 0 ? 0 : (0xffffffff << (32 - c)) >>> 0;
    const net = (val & mask) >>> 0;
    const bcast = (net | (~mask >>> 0)) >>> 0;
    const fmt = (x: number) => [(x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join('.');
    const usable = c >= 31 ? Math.max(0, 2 ** (32 - c)) : 2 ** (32 - c) - 2;
    return `Network: ${fmt(net)} | Broadcast: ${fmt(bcast)} | Usable Hosts: ${usable.toLocaleString()}`;
  }
}

export const calculatorEngine = new CalculatorEngine();
