import { calculatorEngine } from './calculatorEngine';

export interface ToolField {
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: { value: string; label: string }[];
  default: string;
  step?: string;
  placeholder?: string;
}

export interface ToolConfig {
  name: string;
  category: string;
  description: string;
  formula?: string;
  isConverter?: boolean;
  unitType?: 'generic' | 'nepal_land' | 'nepal_length' | 'nepal_volume' | 'nepal_weight' | 'currency' | 'temp';
  unitGroup?: string;
  defaultUnitFrom?: string;
  defaultUnitTo?: string;
  fields: ToolField[];
  calculate: (f1: string, f2: string, f3: string, f4: string, uFrom?: string, uTo?: string) => string;
}

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Quick
  'Basic': {
    name: 'Basic',
    category: 'quick',
    description: 'Standard arithmetic calculations',
    fields: [
      { label: 'Operand A', type: 'number', default: '100' },
      {
        label: 'Operator',
        type: 'select',
        options: [
          { value: '+', label: '+' },
          { value: '-', label: '-' },
          { value: '*', label: '×' },
          { value: '/', label: '÷' },
          { value: '%', label: '%' },
          { value: '^', label: '^' }
        ],
        default: '+'
      },
      { label: 'Operand B', type: 'number', default: '25' }
    ],
    calculate: (f1, f2, f3) => String(calculatorEngine.basic(f1, f2, f3))
  },
  'Scientific': {
    name: 'Scientific',
    category: 'quick',
    description: 'Advanced math expression evaluator with sin, cos, sqrt, log, pow',
    formula: 'Supports sqrt, sin, cos, tan, log, ln, pi, e, pow(^)',
    fields: [
      { label: 'Expression', type: 'text', default: 'sqrt(144) + sin(30) * 10', placeholder: 'e.g. 5^2 + log(100)' }
    ],
    calculate: (f1) => String(calculatorEngine.scientific(f1))
  },
  'Percentage': {
    name: 'Percentage',
    category: 'quick',
    description: 'Find percentage, percentage of value, or change',
    fields: [
      { label: 'Value A', type: 'number', default: '500' },
      { label: 'Value B (%)', type: 'number', default: '15' },
      {
        label: 'Calculation Mode',
        type: 'select',
        options: [
          { value: 'pctOf', label: 'B% of A' },
          { value: 'whatPct', label: 'What % is A of B' },
          { value: 'increase', label: '% Increase/Decrease from A to B' }
        ],
        default: 'pctOf'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.percentageAdvanced(f1, f2, f3 || 'pctOf')
  },
  'Fraction': {
    name: 'Fraction',
    category: 'quick',
    description: 'Fraction simplification, decimal conversion and GCD',
    fields: [
      { label: 'Numerator', type: 'number', default: '36' },
      { label: 'Denominator', type: 'number', default: '48' }
    ],
    calculate: (f1, f2) => calculatorEngine.simplifyFraction(f1, f2)
  },
  'Ratio': {
    name: 'Ratio',
    category: 'quick',
    description: 'Simplify ratios or divide a total quantity into ratio shares',
    fields: [
      { label: 'Part A', type: 'number', default: '16' },
      { label: 'Part B', type: 'number', default: '9' },
      { label: 'Total Amount to Divide (Optional)', type: 'number', default: '1000' }
    ],
    calculate: (f1, f2, f3) => {
      const simplified = calculatorEngine.ratio(f1, f2);
      if (f3 && Number(f3) > 0) {
        return `Simplified: ${simplified} | ${calculatorEngine.ratioDivide(f3, f1, f2)}`;
      }
      return `Simplified Ratio: ${simplified}`;
    }
  },
  'Average': {
    name: 'Average',
    category: 'quick',
    description: 'Calculate Mean, Median, Sum, Min, and Max from a list of numbers',
    fields: [
      { label: 'Comma-separated numbers', type: 'text', default: '45, 88, 72, 95, 60, 83', placeholder: 'e.g. 10, 20, 30' }
    ],
    calculate: (f1) => {
      const arr = f1.split(/[\s,]+/).map(x => Number(x.trim())).filter(Number.isFinite);
      const res = calculatorEngine.average(arr);
      return `Mean (Avg): ${res.avg.toFixed(2)} | Median: ${res.median} | Sum: ${res.sum} | Range: [${res.min} - ${res.max}] (Count: ${res.count})`;
    }
  },
  'Discount': {
    name: 'Discount',
    category: 'quick',
    description: 'Calculate discount amount and final price after percentage off',
    fields: [
      { label: 'Original Price (₹)', type: 'number', default: '1200' },
      { label: 'Discount Percentage (%)', type: 'number', default: '20' }
    ],
    calculate: (f1, f2) => calculatorEngine.discount(f1, f2)
  },
  'Tip': {
    name: 'Tip',
    category: 'quick',
    description: 'Calculate dining tip and final bill',
    fields: [
      { label: 'Bill Amount (₹)', type: 'number', default: '1500' },
      { label: 'Tip Percentage (%)', type: 'number', default: '10' }
    ],
    calculate: (f1, f2) => calculatorEngine.tip(f1, f2)
  },
  'Bill Split': {
    name: 'Bill Split',
    category: 'quick',
    description: 'Split shared bills among people including tip and tax',
    fields: [
      { label: 'Total Bill (₹)', type: 'number', default: '4800' },
      { label: 'Number of People', type: 'number', default: '4' },
      { label: 'Tip (%)', type: 'number', default: '5' },
      { label: 'Tax (%)', type: 'number', default: '5' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.billSplit(f1, f2, Number(f3) || 0, Number(f4) || 0)
  },
  'Tax': {
    name: 'Tax',
    category: 'quick',
    description: 'Compute GST / VAT / Sales Tax (Exclusive or Inclusive)',
    fields: [
      { label: 'Amount (₹)', type: 'number', default: '2500' },
      { label: 'Tax Rate (%)', type: 'number', default: '18' },
      {
        label: 'Calculation Type',
        type: 'select',
        options: [
          { value: 'exclusive', label: 'Tax Exclusive (Add Tax on Top)' },
          { value: 'inclusive', label: 'Tax Inclusive (Already Included in Price)' }
        ],
        default: 'exclusive'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.tax(f1, f2, f3 === 'inclusive')
  },

  // Money
  'EMI / Loan': {
    name: 'EMI / Loan',
    category: 'money',
    description: 'Equal Monthly Installment (EMI) for home, personal, or car loans',
    formula: 'E = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)',
    fields: [
      { label: 'Loan Principal (₹)', type: 'number', default: '500000' },
      { label: 'Annual Interest Rate (%)', type: 'number', default: '9.5', step: '0.1' },
      { label: 'Tenure (Months)', type: 'number', default: '60' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.emi(f1, f2, f3)
  },
  'Simple Interest': {
    name: 'Simple Interest',
    category: 'money',
    description: 'Standard Simple Interest formula (P × R × T / 100)',
    formula: 'SI = (P × R × T) / 100',
    fields: [
      { label: 'Principal (₹)', type: 'number', default: '100000' },
      { label: 'Annual Rate (%)', type: 'number', default: '8.5', step: '0.1' },
      { label: 'Time Period (Years)', type: 'number', default: '3' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.simpleInterest(f1, f2, f3)
  },
  'Compound Interest': {
    name: 'Compound Interest',
    category: 'money',
    description: 'Calculate compounding growth on deposits with different compounding frequencies',
    fields: [
      { label: 'Principal (₹)', type: 'number', default: '100000' },
      { label: 'Annual Rate (%)', type: 'number', default: '8.0', step: '0.1' },
      { label: 'Time (Years)', type: 'number', default: '5' },
      {
        label: 'Compounding Frequency',
        type: 'select',
        options: [
          { value: '1', label: 'Annually (Once a year)' },
          { value: '2', label: 'Semi-Annually (Twice a year)' },
          { value: '4', label: 'Quarterly (4 times a year)' },
          { value: '12', label: 'Monthly (12 times a year)' }
        ],
        default: '4'
      }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.compoundInterest(f1, f2, f3, Number(f4) || 1)
  },
  'SIP / Investment': {
    name: 'SIP / Investment',
    category: 'money',
    description: 'Systematic Investment Plan maturity with compound monthly returns',
    fields: [
      { label: 'Monthly Investment (₹)', type: 'number', default: '5000' },
      { label: 'Expected Annual Return (%)', type: 'number', default: '12.0', step: '0.1' },
      { label: 'Duration (Months)', type: 'number', default: '120' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.sip(f1, f2, f3)
  },
  'Savings': {
    name: 'Savings',
    category: 'money',
    description: 'Target savings goal planner and monthly gap calculator',
    fields: [
      { label: 'Target Savings Goal (₹)', type: 'number', default: '1000000' },
      { label: 'Current Savings (₹)', type: 'number', default: '250000' },
      { label: 'Months Left to Goal', type: 'number', default: '24' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.savings(f1, f2, f3)
  },
  'ROI': {
    name: 'ROI',
    category: 'money',
    description: 'Return on Investment percentage from gross gain and cost',
    fields: [
      { label: 'Final Total Return / Gain (₹)', type: 'number', default: '175000' },
      { label: 'Initial Cost / Investment (₹)', type: 'number', default: '100000' }
    ],
    calculate: (f1, f2) => calculatorEngine.roi(f1, f2)
  },
  'Profit & Loss': {
    name: 'Profit & Loss',
    category: 'money',
    description: 'Determine commercial profit or loss and percentage',
    fields: [
      { label: 'Cost Price (₹)', type: 'number', default: '800' },
      { label: 'Selling Price (₹)', type: 'number', default: '1150' }
    ],
    calculate: (f1, f2) => calculatorEngine.profitLoss(f1, f2)
  },
  'Inflation': {
    name: 'Inflation',
    category: 'money',
    description: 'Project how inflation erodes purchasing power over time',
    fields: [
      { label: 'Current Price / Value (₹)', type: 'number', default: '100000' },
      { label: 'Annual Inflation Rate (%)', type: 'number', default: '6.5', step: '0.1' },
      { label: 'Years Ahead', type: 'number', default: '10' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.inflation(f1, f2, f3)
  },
  'Salary': {
    name: 'Salary',
    category: 'money',
    description: 'Convert annual package to gross monthly and net in-hand salary',
    fields: [
      { label: 'Annual CTC / Salary (₹)', type: 'number', default: '1200000' },
      { label: 'Months per Year', type: 'number', default: '12' },
      { label: 'Estimated Tax & PF Deduction (%)', type: 'number', default: '15' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.salary(f1, Number(f2) || 12, Number(f3) || 0)
  },
  'Markup': {
    name: 'Markup',
    category: 'money',
    description: 'Calculate retail selling price given base cost and markup percentage',
    fields: [
      { label: 'Cost Price (₹)', type: 'number', default: '500' },
      { label: 'Markup Percentage (%)', type: 'number', default: '40' }
    ],
    calculate: (f1, f2) => calculatorEngine.markup(f1, f2)
  },
  'Margin': {
    name: 'Margin',
    category: 'money',
    description: 'Calculate gross profit margin percentage on selling price',
    fields: [
      { label: 'Selling Price (₹)', type: 'number', default: '700' },
      { label: 'Cost Price (₹)', type: 'number', default: '500' }
    ],
    calculate: (f1, f2) => calculatorEngine.margin(f1, f2)
  },
  'Break-even': {
    name: 'Break-even',
    category: 'money',
    description: 'Calculate units required to cover fixed overheads',
    fields: [
      { label: 'Fixed Costs (₹)', type: 'number', default: '200000' },
      { label: 'Price per Unit (₹)', type: 'number', default: '150' },
      { label: 'Variable Cost per Unit (₹)', type: 'number', default: '70' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.breakEven(f1, f2, f3)
  },
  'CAGR': {
    name: 'CAGR',
    category: 'money',
    description: 'Compound Annual Growth Rate of investments',
    fields: [
      { label: 'Initial Value (₹)', type: 'number', default: '100000' },
      { label: 'Final Value (₹)', type: 'number', default: '280000' },
      { label: 'Number of Years', type: 'number', default: '7' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.cagr(f1, f2, f3)
  },
  'Growth': {
    name: 'Growth',
    category: 'money',
    description: 'Percentage growth between two values',
    fields: [
      { label: 'Old / Base Value', type: 'number', default: '1250' },
      { label: 'New / Current Value', type: 'number', default: '1875' }
    ],
    calculate: (f1, f2) => calculatorEngine.growth(f1, f2)
  },
  'Pricing': {
    name: 'Pricing',
    category: 'money',
    description: 'Determine required selling price to achieve target profit margin',
    fields: [
      { label: 'Unit Cost (₹)', type: 'number', default: '450' },
      { label: 'Target Margin (%)', type: 'number', default: '35' }
    ],
    calculate: (f1, f2) => calculatorEngine.pricing(f1, f2)
  }
};
