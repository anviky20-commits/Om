import React, { useState } from 'react';
import { Calculator, Star, History, Copy, ArrowRight } from 'lucide-react';
import { CALCULATOR_CATALOG, CALC_UNIT_FACTORS, NP_UNITS, calculatorEngine } from '../lib/calculatorEngine';
import { CalcHistoryItem } from '../types';
import { storage, generateUUID } from '../lib/storage';

interface CalculatorViewProps {
  history: CalcHistoryItem[];
  favorites: string[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  history,
  favorites,
  onRefresh,
  onSuccess
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('quick');
  const [selectedTool, setSelectedTool] = useState<string>('Basic');

  // Dynamic input fields state
  const [field1, setField1] = useState('1000');
  const [field2, setField2] = useState('+');
  const [field3, setField3] = useState('500');
  const [field4, setField4] = useState('12');
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('ft');
  const [result, setResult] = useState<string>('—');

  const tools = CALCULATOR_CATALOG[selectedCategory] || [];

  const handleSelectTool = (tool: string) => {
    setSelectedTool(tool);
    setResult('—');

    // Preset reasonable defaults based on tool
    if (tool === 'Basic') {
      setField1('100'); setField2('+'); setField3('25');
    } else if (tool === 'EMI / Loan') {
      setField1('500000'); // Principal
      setField2('8.5'); // Rate %
      setField3('60'); // Months
    } else if (tool === 'SIP / Investment') {
      setField1('5000'); // Monthly
      setField2('12'); // Annual rate
      setField3('120'); // Months
    } else if (tool === 'Gold Value') {
      setField1('1'); // Tola / grams
      setField2('120000'); // Rate
    } else if (tool === 'BMI') {
      setField1('70'); // kg
      setField2('1.75'); // metres
    } else if (tool === 'BMR') {
      setField1('72'); setField2('178'); setField3('28'); setField4('male');
    } else if (tool === 'Date Difference') {
      setField1('2026-01-01'); setField2('2026-12-31');
    } else if (tool === 'Length') {
      setField1('10'); setUnitFrom('m'); setUnitTo('ft');
    } else if (tool === 'Nepal Land') {
      setField1('1'); setUnitFrom('ropani'); setUnitTo('sq_ft');
    }
  };

  const handleCalculate = async () => {
    try {
      let output: any = '';

      switch (selectedTool) {
        case 'Basic':
          output = calculatorEngine.basic(field1, field2, field3);
          break;
        case 'Scientific':
          output = calculatorEngine.scientific(field1);
          break;
        case 'Percentage':
          output = `${field2}% of ${field1} = ${calculatorEngine.percentage(field1, field2)}`;
          break;
        case 'Fraction':
          output = calculatorEngine.simplifyFraction(field1, field2);
          break;
        case 'Ratio':
          output = calculatorEngine.ratio(field1, field2);
          break;
        case 'Average': {
          const arr = field1.split(',').map(x => Number(x.trim())).filter(Number.isFinite);
          output = `Average: ${calculatorEngine.average(arr).toFixed(2)}`;
          break;
        }
        case 'Discount':
          output = calculatorEngine.discount(field1, field2);
          break;
        case 'Tip':
          output = calculatorEngine.tip(field1, field2);
          break;
        case 'Bill Split':
          output = calculatorEngine.billSplit(field1, field2, Number(field3) || 0);
          break;
        case 'Tax':
          output = calculatorEngine.tax(field1, field2);
          break;
        case 'EMI / Loan':
          output = calculatorEngine.emi(field1, field2, field3);
          break;
        case 'Simple Interest':
          output = calculatorEngine.simpleInterest(field1, field2, field3);
          break;
        case 'Compound Interest':
          output = calculatorEngine.compoundInterest(field1, field2, field3, Number(field4) || 1);
          break;
        case 'SIP / Investment':
          output = calculatorEngine.sip(field1, field2, field3);
          break;
        case 'Savings':
          output = calculatorEngine.savings(field1, field2, field3);
          break;
        case 'ROI':
          output = calculatorEngine.roi(field1, field2);
          break;
        case 'Profit & Loss':
          output = calculatorEngine.profitLoss(field1, field2);
          break;
        case 'Inflation':
          output = calculatorEngine.inflation(field1, field2, field3);
          break;
        case 'Salary':
          output = calculatorEngine.salary(field1, Number(field2) || 12, Number(field3) || 0);
          break;
        case 'Markup':
          output = calculatorEngine.markup(field1, field2);
          break;
        case 'Margin':
          output = calculatorEngine.margin(field1, field2);
          break;
        case 'Break-even':
          output = calculatorEngine.breakEven(field1, field2, field3);
          break;
        case 'CAGR':
          output = calculatorEngine.cagr(field1, field2, field3);
          break;
        case 'Growth':
          output = calculatorEngine.growth(field1, field2);
          break;
        case 'Pricing':
          output = calculatorEngine.pricing(field1, field2);
          break;
        case 'Gold Value':
        case 'Buy / Sell Value':
        case 'Silver Value':
          output = calculatorEngine.goldValue(field1, field2);
          break;
        case 'Karat ↔ Purity':
          output = calculatorEngine.karatPurity(field1, field2);
          break;
        case 'Pure Gold Weight':
          output = calculatorEngine.pureGoldWeight(field1, field2);
          break;
        case 'Jewellery Price':
          output = calculatorEngine.jewelleryPrice(field1, Number(field2) || 0, Number(field3) || 0, Number(field4) || 3);
          break;
        case 'BMI':
          output = calculatorEngine.bmi(field1, field2);
          break;
        case 'BMR':
          output = calculatorEngine.bmr(field1, field2, field3, field4);
          break;
        case 'TDEE':
          output = calculatorEngine.tdee(field1, field2);
          break;
        case 'Macros':
          output = calculatorEngine.macros(field1, Number(field2) || 30, Number(field3) || 40, Number(field4) || 30);
          break;
        case 'Water Intake':
          output = calculatorEngine.waterIntake(field1, Number(field2) || 35);
          break;
        case 'Running Pace':
          output = calculatorEngine.pace(field1, field2);
          break;
        case 'Age':
          output = calculatorEngine.age(field1);
          break;
        case 'Date Difference':
          output = calculatorEngine.dateDifference(field1, field2);
          break;
        case 'Working Days':
          output = calculatorEngine.workingDays(field1, field2);
          break;
        case 'Length':
        case 'Weight':
        case 'Area':
        case 'Volume':
        case 'Speed':
        case 'Time':
        case 'Energy':
        case 'Pressure':
        case 'Power':
          output = calculatorEngine.unit(field1, unitFrom, unitTo, CALC_UNIT_FACTORS[selectedTool]);
          break;
        case 'Temperature':
          output = calculatorEngine.temperature(field1, unitFrom, unitTo);
          break;
        case 'Nepal Land':
          output = calculatorEngine.unit(field1, unitFrom, unitTo, NP_UNITS.land);
          break;
        case 'Nepal Length':
          output = calculatorEngine.unit(field1, unitFrom, unitTo, NP_UNITS.length);
          break;
        case 'Nepal Volume':
          output = calculatorEngine.unit(field1, unitFrom, unitTo, NP_UNITS.volume);
          break;
        case 'Nepal Weight':
          output = calculatorEngine.unit(field1, unitFrom, unitTo, NP_UNITS.weight);
          break;
        case 'Room Area':
          output = calculatorEngine.roomArea(field1, field2);
          break;
        case 'Mileage':
          output = calculatorEngine.mileage(field1, field2);
          break;
        case 'Fuel Cost':
          output = calculatorEngine.fuelCost(field1, field2, field3);
          break;
        case 'Binary':
          output = `Decimal: ${parseInt(field1, 2)}`;
          break;
        case 'Decimal':
          output = `Binary: ${Number(field1).toString(2)} | Hex: ${Number(field1).toString(16).toUpperCase()}`;
          break;
        case 'Base Converter':
          output = calculatorEngine.baseConvert(field1, field2, field3);
          break;
        case 'IP / Subnet':
          output = calculatorEngine.ipSubnet(field1, field2);
          break;
        default:
          output = 'Calculation executed';
      }

      const resString = String(output);
      setResult(resString);

      // Save to calculation history
      const historyItem: CalcHistoryItem = {
        id: generateUUID(),
        tool: selectedTool,
        args: [field1, field2, field3, field4],
        result: resString,
        createdAt: Date.now()
      };
      await storage.put('calcHistory', historyItem);
      onRefresh();
    } catch (err: any) {
      setResult(`Error: ${err.message || 'Calculation failed'}`);
    }
  };

  const handleToggleFavorite = async () => {
    const appSettings = await storage.getSingleton<any>('appSettings') || {};
    const favs: string[] = appSettings.calcFavorites || [];
    const isFav = favs.includes(selectedTool);
    const updated = isFav ? favs.filter(f => f !== selectedTool) : [...favs, selectedTool];

    appSettings.calcFavorites = updated;
    await storage.setSingleton('appSettings', appSettings);
    onSuccess(isFav ? 'Removed from favorites' : '★ Added to favorites');
    onRefresh();
  };

  const isFavorite = favorites.includes(selectedTool);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Calculator & Computational Tools
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          108 domain-specific analytical engines: Financial EMI, SIP, Gold valuation, Nepal Land, Health, Programmer, Physics.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {Object.keys(CALCULATOR_CATALOG).map(catKey => {
          const isCat = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => {
                setSelectedCategory(catKey);
                const firstTool = CALCULATOR_CATALOG[catKey]?.[0] || 'Basic';
                handleSelectTool(firstTool);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isCat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {catKey} ({CALCULATOR_CATALOG[catKey]?.length})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tool Selector + Calculator Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tool Pills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Available Tools in {selectedCategory.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-1 text-xs font-semibold ${
                  isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {tools.map(tool => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleSelectTool(tool)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedTool === tool
                      ? 'bg-indigo-600 font-semibold text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Input Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedTool} Engine
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              {/* Dynamic Input Form */}
              {selectedTool === 'Basic' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Operand A</label>
                    <input
                      type="number"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Operator</label>
                    <select
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">×</option>
                      <option value="/">÷</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Operand B</label>
                    <input
                      type="number"
                      value={field3}
                      onChange={e => setField3(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {selectedTool === 'EMI / Loan' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Principal (₹)</label>
                    <input
                      type="number"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Annual Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tenure (Months)</label>
                    <input
                      type="number"
                      value={field3}
                      onChange={e => setField3(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {selectedTool === 'SIP / Investment' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Monthly Deposit (₹)</label>
                    <input
                      type="number"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Expected Return (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Duration (Months)</label>
                    <input
                      type="number"
                      value={field3}
                      onChange={e => setField3(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {(selectedTool === 'Gold Value' || selectedTool === 'Buy / Sell Value') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Weight (Tola / Grams)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Rate per Unit (₹)</label>
                    <input
                      type="number"
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {['Length', 'Weight', 'Area', 'Volume', 'Speed', 'Temperature', 'Nepal Land'].includes(selectedTool) && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Value</label>
                    <input
                      type="number"
                      step="any"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">From Unit</label>
                    <select
                      value={unitFrom}
                      onChange={e => setUnitFrom(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      {selectedTool === 'Nepal Land'
                        ? Object.keys(NP_UNITS.land).map(u => <option key={u} value={u}>{u}</option>)
                        : selectedTool === 'Temperature'
                        ? ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)
                        : Object.keys(CALC_UNIT_FACTORS[selectedTool] || {}).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">To Unit</label>
                    <select
                      value={unitTo}
                      onChange={e => setUnitTo(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      {selectedTool === 'Nepal Land'
                        ? Object.keys(NP_UNITS.land).map(u => <option key={u} value={u}>{u}</option>)
                        : selectedTool === 'Temperature'
                        ? ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)
                        : Object.keys(CALC_UNIT_FACTORS[selectedTool] || {}).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Generic fallback inputs if not custom rendered */}
              {!['Basic', 'EMI / Loan', 'SIP / Investment', 'Gold Value', 'Buy / Sell Value', 'Length', 'Weight', 'Area', 'Volume', 'Speed', 'Temperature', 'Nepal Land'].includes(selectedTool) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Input A</label>
                    <input
                      type="text"
                      value={field1}
                      onChange={e => setField1(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Input B</label>
                    <input
                      type="text"
                      value={field2}
                      onChange={e => setField2(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCalculate}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98"
              >
                Compute Calculation
              </button>

              {/* Result Container */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Computed Output
                </div>
                <div className="mt-2 font-mono text-base font-bold text-indigo-700 dark:text-indigo-300 break-words">
                  {result}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation History & Favorites (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <History className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Calculations</h2>
            </div>

            <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No calculations recorded yet.
                </div>
              ) : (
                history.slice().reverse().slice(0, 10).map(h => (
                  <div key={h.id} className="rounded-xl border border-slate-100 p-2.5 text-xs dark:border-slate-800">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{h.tool}</div>
                    <div className="mt-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 break-words">
                      {h.result}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
