import { CALC_UNIT_FACTORS, NP_UNITS, calculatorEngine } from './calculatorEngine';
import { ToolConfig } from './calculatorConfig';

export const REMAINING_TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Converters
  'Length': {
    name: 'Length',
    category: 'converter',
    description: 'Convert meters, feet, kilometers, inches, miles, and yards',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Length',
    defaultUnitFrom: 'm',
    defaultUnitTo: 'ft',
    fields: [{ label: 'Length Value', type: 'number', default: '10' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'm', uTo = 'ft') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Length)
  },
  'Weight': {
    name: 'Weight',
    category: 'converter',
    description: 'Convert kilograms, grams, pounds, ounces, and tons',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Weight',
    defaultUnitFrom: 'kg',
    defaultUnitTo: 'lb',
    fields: [{ label: 'Weight Value', type: 'number', default: '1' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'kg', uTo = 'lb') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Weight)
  },
  'Area': {
    name: 'Area',
    category: 'converter',
    description: 'Convert square meters, square feet, acres, and hectares',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Area',
    defaultUnitFrom: 'sq_m',
    defaultUnitTo: 'sq_ft',
    fields: [{ label: 'Area Value', type: 'number', default: '100' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'sq_m', uTo = 'sq_ft') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Area)
  },
  'Volume': {
    name: 'Volume',
    category: 'converter',
    description: 'Convert litres, millilitres, gallons, and cubic meters',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Volume',
    defaultUnitFrom: 'liter',
    defaultUnitTo: 'gallon',
    fields: [{ label: 'Volume Value', type: 'number', default: '10' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'liter', uTo = 'gallon') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Volume)
  },
  'Temperature': {
    name: 'Temperature',
    category: 'converter',
    description: 'Convert Celsius, Fahrenheit, and Kelvin',
    isConverter: true,
    unitType: 'temp',
    defaultUnitFrom: 'C',
    defaultUnitTo: 'F',
    fields: [{ label: 'Temperature Value', type: 'number', default: '37' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'C', uTo = 'F') =>
      calculatorEngine.temperature(f1, uFrom, uTo)
  },
  'Speed': {
    name: 'Speed',
    category: 'converter',
    description: 'Convert km/h, mph, m/s, and knots',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Speed',
    defaultUnitFrom: 'kmh',
    defaultUnitTo: 'mph',
    fields: [{ label: 'Speed Value', type: 'number', default: '100' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'kmh', uTo = 'mph') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Speed)
  },
  'Time': {
    name: 'Time',
    category: 'converter',
    description: 'Convert seconds, minutes, hours, days, weeks, and years',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Time',
    defaultUnitFrom: 'hour',
    defaultUnitTo: 'minute',
    fields: [{ label: 'Time Value', type: 'number', default: '2.5' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'hour', uTo = 'minute') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Time)
  },
  'Energy': {
    name: 'Energy',
    category: 'converter',
    description: 'Convert Joules, calories, kWh, and BTU',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Energy',
    defaultUnitFrom: 'kwh',
    defaultUnitTo: 'joule',
    fields: [{ label: 'Energy Value', type: 'number', default: '1' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'kwh', uTo = 'joule') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Energy)
  },
  'Pressure': {
    name: 'Pressure',
    category: 'converter',
    description: 'Convert Pascal, Bar, PSI, and Atmosphere',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Pressure',
    defaultUnitFrom: 'psi',
    defaultUnitTo: 'bar',
    fields: [{ label: 'Pressure Value', type: 'number', default: '32' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'psi', uTo = 'bar') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Pressure)
  },
  'Power': {
    name: 'Power',
    category: 'converter',
    description: 'Convert Watts, Kilowatts, and Horsepower',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Power',
    defaultUnitFrom: 'kw',
    defaultUnitTo: 'hp',
    fields: [{ label: 'Power Value', type: 'number', default: '75' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'kw', uTo = 'hp') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.Power)
  },
  'Data Size': {
    name: 'Data Size',
    category: 'converter',
    description: 'Convert Bytes, KB, MB, GB, TB, and PB',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'DataSize',
    defaultUnitFrom: 'GB',
    defaultUnitTo: 'MB',
    fields: [{ label: 'Data Size', type: 'number', default: '8' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'GB', uTo = 'MB') =>
      calculatorEngine.unit(f1, uFrom, uTo, CALC_UNIT_FACTORS.DataSize)
  },
  'Currency': {
    name: 'Currency',
    category: 'converter',
    description: 'Convert between USD, INR, NPR, EUR, GBP, AUD, CAD, AED, and JPY',
    isConverter: true,
    unitType: 'currency',
    defaultUnitFrom: 'USD',
    defaultUnitTo: 'NPR',
    fields: [{ label: 'Amount', type: 'number', default: '100' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'USD', uTo = 'NPR') =>
      calculatorEngine.currency(f1, uFrom, uTo)
  },
  'Nepal Land': {
    name: 'Nepal Land',
    category: 'converter',
    description: 'Convert Ropani, Aana, Paisa, Daam, Bigha, Kattha, Dhur, and Sq. Ft.',
    isConverter: true,
    unitType: 'nepal_land',
    defaultUnitFrom: 'ropani',
    defaultUnitTo: 'sq_ft',
    fields: [{ label: 'Land Quantity', type: 'number', default: '1' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'ropani', uTo = 'sq_ft') =>
      calculatorEngine.unit(f1, uFrom, uTo, NP_UNITS.land)
  },
  'Nepal Length': {
    name: 'Nepal Length',
    category: 'converter',
    description: 'Convert Haat, Bitta, Angul, Danda, Gaj, Kosh, Meter, and Feet',
    isConverter: true,
    unitType: 'nepal_length',
    defaultUnitFrom: 'haat',
    defaultUnitTo: 'ft',
    fields: [{ label: 'Length Quantity', type: 'number', default: '10' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'haat', uTo = 'ft') =>
      calculatorEngine.unit(f1, uFrom, uTo, NP_UNITS.length)
  },
  'Nepal Volume': {
    name: 'Nepal Volume',
    category: 'converter',
    description: 'Convert Muri, Pathi, Mana, Kurwa, Muthi, and Litres',
    isConverter: true,
    unitType: 'nepal_volume',
    defaultUnitFrom: 'muri',
    defaultUnitTo: 'liter',
    fields: [{ label: 'Volume Quantity', type: 'number', default: '1' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'muri', uTo = 'liter') =>
      calculatorEngine.unit(f1, uFrom, uTo, NP_UNITS.volume)
  },
  'Nepal Weight': {
    name: 'Nepal Weight',
    category: 'converter',
    description: 'Convert Dharni, Seer, Chatak, Maund, Tola, and Kilograms',
    isConverter: true,
    unitType: 'nepal_weight',
    defaultUnitFrom: 'dharn',
    defaultUnitTo: 'kg',
    fields: [{ label: 'Weight Quantity', type: 'number', default: '1' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'dharn', uTo = 'kg') =>
      calculatorEngine.unit(f1, uFrom, uTo, NP_UNITS.weight)
  },

  // Home
  'Room Area': {
    name: 'Room Area',
    category: 'home',
    description: 'Calculate floor area and wall perimeter',
    fields: [
      { label: 'Length (ft)', type: 'number', default: '15' },
      { label: 'Width (ft)', type: 'number', default: '12' }
    ],
    calculate: (f1, f2) => calculatorEngine.roomArea(f1, f2, 'ft')
  },
  'Paint': {
    name: 'Paint',
    category: 'home',
    description: 'Estimate litres of paint required for room walls and coats',
    fields: [
      { label: 'Room Length (ft)', type: 'number', default: '14' },
      { label: 'Room Width (ft)', type: 'number', default: '12' },
      { label: 'Ceiling Height (ft)', type: 'number', default: '10' },
      { label: 'Number of Coats', type: 'number', default: '2' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.paint(f1, f2, f3, Number(f4) || 2)
  },
  'Flooring': {
    name: 'Flooring',
    category: 'home',
    description: 'Calculate total flooring material needed including wastage',
    fields: [
      { label: 'Room Length (ft)', type: 'number', default: '16' },
      { label: 'Room Width (ft)', type: 'number', default: '14' },
      { label: 'Cutting Wastage (%)', type: 'number', default: '10' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.flooring(f1, f2, Number(f3) || 10)
  },
  'Tiles': {
    name: 'Tiles',
    category: 'home',
    description: 'Calculate number of ceramic or porcelain tiles for a room area',
    fields: [
      { label: 'Room Area (sq ft)', type: 'number', default: '250' },
      { label: 'Tile Width (Inches)', type: 'number', default: '24' },
      { label: 'Tile Height (Inches)', type: 'number', default: '24' },
      { label: 'Wastage (%)', type: 'number', default: '10' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.tiles(f1, f2, f3, Number(f4) || 10)
  },
  'Construction': {
    name: 'Construction',
    category: 'home',
    description: 'Estimator for building cost, cement, steel, and sand quantities',
    fields: [
      { label: 'Built-up Area (sq ft)', type: 'number', default: '1200' },
      { label: 'Estimated Rate / sq ft (₹)', type: 'number', default: '2500' }
    ],
    calculate: (f1, f2) => calculatorEngine.construction(f1, Number(f2) || 2500)
  },
  'Electricity Cost': {
    name: 'Electricity Cost',
    category: 'home',
    description: 'Calculate monthly electricity bill for heavy appliances',
    fields: [
      { label: 'Appliance Power (Watts)', type: 'number', default: '1500' },
      { label: 'Hours Used per Day', type: 'number', default: '8' },
      { label: 'Cost per Unit / kWh (₹)', type: 'number', default: '9.5', step: '0.1' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.electricityCost(f1, f2, f3, 30)
  },
  'Water Usage': {
    name: 'Water Usage',
    category: 'home',
    description: 'Monthly household water demand and tanker requirement',
    fields: [
      { label: 'Family Members', type: 'number', default: '4' },
      { label: 'Usage per Person / Day (L)', type: 'number', default: '135' }
    ],
    calculate: (f1, f2) => calculatorEngine.waterUsage(f1, Number(f2) || 135, 30)
  },

  // Vehicle
  'Mileage': {
    name: 'Mileage',
    category: 'vehicle',
    description: 'Calculate fuel economy in km/L and L/100km',
    fields: [
      { label: 'Distance Driven (km)', type: 'number', default: '450' },
      { label: 'Fuel Consumed (Litres)', type: 'number', default: '28' }
    ],
    calculate: (f1, f2) => calculatorEngine.mileage(f1, f2)
  },
  'Fuel Cost': {
    name: 'Fuel Cost',
    category: 'vehicle',
    description: 'Calculate trip fuel volume and monetary cost',
    fields: [
      { label: 'Distance (km)', type: 'number', default: '320' },
      { label: 'Vehicle Mileage (km/L)', type: 'number', default: '16.5', step: '0.1' },
      { label: 'Fuel Price per Litre (₹)', type: 'number', default: '102' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.fuelCost(f1, f2, f3)
  },
  'Trip Fuel': {
    name: 'Trip Fuel',
    category: 'vehicle',
    description: 'Calculate road trip fuel budget and per-passenger share',
    fields: [
      { label: 'Round-Trip Distance (km)', type: 'number', default: '600' },
      { label: 'Mileage (km/L)', type: 'number', default: '15' },
      { label: 'Fuel Price (₹/L)', type: 'number', default: '105' },
      { label: 'Number of Passengers', type: 'number', default: '4' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.tripFuel(f1, f2, f3, Number(f4) || 1)
  },
  'Running Cost': {
    name: 'Running Cost',
    category: 'vehicle',
    description: 'Estimate monthly car/bike ownership cost per kilometer',
    fields: [
      { label: 'Monthly Driving (km)', type: 'number', default: '1200' },
      { label: 'Mileage (km/L)', type: 'number', default: '16' },
      { label: 'Fuel Price (₹/L)', type: 'number', default: '102' },
      { label: 'Monthly Maintenance & Insurance (₹)', type: 'number', default: '2000' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.runningCost(f1, f2, f3, Number(f4) || 0)
  },
  'Vehicle Loan': {
    name: 'Vehicle Loan',
    category: 'vehicle',
    description: 'Calculate auto loan EMI and interest after down payment',
    fields: [
      { label: 'On-Road Vehicle Price (₹)', type: 'number', default: '800000' },
      { label: 'Down Payment (₹)', type: 'number', default: '150000' },
      { label: 'Interest Rate (%)', type: 'number', default: '9.0', step: '0.1' },
      { label: 'Tenure (Months)', type: 'number', default: '60' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.vehicleLoan(f1, f2, f3, Number(f4) || 60)
  },
  'Fuel Economy': {
    name: 'Fuel Economy',
    category: 'vehicle',
    description: 'Convert between km/L, L/100km, US MPG, and UK MPG',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'FuelEconomy',
    defaultUnitFrom: 'km_l',
    defaultUnitTo: 'mpg_us',
    fields: [{ label: 'Economy Value', type: 'number', default: '18' }],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'km_l', uTo = 'mpg_us') =>
      calculatorEngine.fuelEconomy(f1, uFrom, uTo)
  },

  // Travel
  'Trip Budget': {
    name: 'Trip Budget',
    category: 'travel',
    description: 'Plan total vacation budget across lodging, food, and transport',
    fields: [
      { label: 'Travelers', type: 'number', default: '2' },
      { label: 'Trip Days', type: 'number', default: '7' },
      { label: 'Hotel / Lodging per Night (₹)', type: 'number', default: '3500' },
      { label: 'Food per Person / Day (₹)', type: 'number', default: '1200' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.tripBudget(f1, f2, f3, f4, 5000)
  },
  'Distance': {
    name: 'Distance',
    category: 'travel',
    description: 'Calculate distance from average speed and travel time',
    fields: [
      { label: 'Average Speed (km/h)', type: 'number', default: '65' },
      { label: 'Travel Duration (Hours)', type: 'number', default: '4.5', step: '0.1' }
    ],
    calculate: (f1, f2) => calculatorEngine.travelDistance(f1, f2)
  },
  'Travel Time': {
    name: 'Travel Time',
    category: 'travel',
    description: 'Estimate journey duration from distance and speed',
    fields: [
      { label: 'Distance (km)', type: 'number', default: '280' },
      { label: 'Average Speed (km/h)', type: 'number', default: '55' }
    ],
    calculate: (f1, f2) => calculatorEngine.travelTime(f1, f2)
  },
  'Fuel Budget': {
    name: 'Fuel Budget',
    category: 'travel',
    description: 'Estimate required fuel budget for road travel',
    fields: [
      { label: 'Total Trip Distance (km)', type: 'number', default: '850' },
      { label: 'Vehicle Mileage (km/L)', type: 'number', default: '17' },
      { label: 'Fuel Price (₹/L)', type: 'number', default: '102' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.fuelCost(f1, f2, f3)
  },
  'Travel Currency': {
    name: 'Travel Currency',
    category: 'travel',
    description: 'Estimate currency exchange with card markup or conversion fee',
    fields: [
      { label: 'Amount to Convert', type: 'number', default: '50000' },
      {
        label: 'From Currency',
        type: 'select',
        options: [
          { value: 'INR', label: 'INR (₹)' },
          { value: 'NPR', label: 'NPR (Rs)' },
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' }
        ],
        default: 'INR'
      },
      {
        label: 'To Currency',
        type: 'select',
        options: [
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'AED', label: 'AED (Dirham)' },
          { value: 'THB', label: 'THB (Baht)' }
        ],
        default: 'USD'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.currency(f1, f2 || 'INR', f3 || 'USD')
  },
  'Travel Time Zone': {
    name: 'Travel Time Zone',
    category: 'travel',
    description: 'Calculate destination arrival time across time zones',
    fields: [
      { label: 'Departure UTC Offset (Hours)', type: 'number', default: '5.5' },
      { label: 'Flight Duration (Hours)', type: 'number', default: '8.5' },
      { label: 'Destination UTC Offset (Hours)', type: 'number', default: '0' }
    ],
    calculate: (f1, f2, f3) => {
      const depOffset = Number(f1) || 0;
      const flight = Number(f2) || 0;
      const destOffset = Number(f3) || 0;
      const diff = destOffset - depOffset;
      const effectiveFlightTime = flight + diff;
      return `Destination Time Offset: ${diff >= 0 ? '+' : ''}${diff} hrs | Effective Clock Difference upon landing: ${effectiveFlightTime.toFixed(1)} hrs`;
    }
  },

  // Business
  'Revenue': {
    name: 'Revenue',
    category: 'business',
    description: 'Calculate total gross turnover from volume and unit price',
    fields: [
      { label: 'Quantity / Units Sold', type: 'number', default: '2500' },
      { label: 'Selling Price per Unit (₹)', type: 'number', default: '350' }
    ],
    calculate: (f1, f2) => calculatorEngine.revenue(f1, f2)
  },
  'Business ROI': {
    name: 'Business ROI',
    category: 'business',
    description: 'Calculate net profit margin and commercial return on project capital',
    fields: [
      { label: 'Initial Project Capital (₹)', type: 'number', default: '500000' },
      { label: 'Gross Revenue Generated (₹)', type: 'number', default: '920000' },
      { label: 'Operating Costs (₹)', type: 'number', default: '150000' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.businessRoi(f1, f2, Number(f3) || 0)
  },

  // Programmer
  'Binary': {
    name: 'Binary',
    category: 'programmer',
    description: 'Convert base-2 binary string to Decimal, Hex, Octal, and ASCII',
    fields: [
      { label: 'Binary String (0s and 1s)', type: 'text', default: '10101010' }
    ],
    calculate: (f1) => {
      const res = calculatorEngine.programmerAllBases(f1, 2);
      return `Decimal: ${res.dec} | Hex: 0x${res.hex} | Octal: ${res.oct} | Character: ${res.char}`;
    }
  },
  'Decimal': {
    name: 'Decimal',
    category: 'programmer',
    description: 'Convert base-10 decimal integer to Binary, Hex, and Octal',
    fields: [
      { label: 'Decimal Integer', type: 'number', default: '255' }
    ],
    calculate: (f1) => {
      const res = calculatorEngine.programmerAllBases(f1, 10);
      return `Binary: ${res.bin} | Hex: 0x${res.hex} | Octal: ${res.oct} | Character: ${res.char}`;
    }
  },
  'Hexadecimal': {
    name: 'Hexadecimal',
    category: 'programmer',
    description: 'Convert base-16 hexadecimal to Decimal, Binary, and Octal',
    fields: [
      { label: 'Hex String (0-9, A-F)', type: 'text', default: 'FF' }
    ],
    calculate: (f1) => {
      const res = calculatorEngine.programmerAllBases(f1, 16);
      return `Decimal: ${res.dec} | Binary: ${res.bin} | Octal: ${res.oct} | Character: ${res.char}`;
    }
  },
  'Octal': {
    name: 'Octal',
    category: 'programmer',
    description: 'Convert base-8 octal to Decimal, Binary, and Hex',
    fields: [
      { label: 'Octal String (0-7)', type: 'text', default: '377' }
    ],
    calculate: (f1) => {
      const res = calculatorEngine.programmerAllBases(f1, 8);
      return `Decimal: ${res.dec} | Binary: ${res.bin} | Hex: 0x${res.hex} | Character: ${res.char}`;
    }
  },
  'Base Converter': {
    name: 'Base Converter',
    category: 'programmer',
    description: 'Convert numbers across arbitrary radix bases from 2 to 36',
    fields: [
      { label: 'Input Value', type: 'text', default: '255' },
      { label: 'From Base (2-36)', type: 'number', default: '10' },
      { label: 'To Base (2-36)', type: 'number', default: '16' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.baseConvert(f1, f2, f3)
  },
  'Bitwise': {
    name: 'Bitwise',
    category: 'programmer',
    description: 'Bitwise operations (AND, OR, XOR, NOT, Shift Left, Shift Right)',
    fields: [
      { label: 'Operand A (Integer)', type: 'number', default: '12' },
      {
        label: 'Bitwise Operator',
        type: 'select',
        options: [
          { value: 'AND', label: 'AND (&)' },
          { value: 'OR', label: 'OR (|)' },
          { value: 'XOR', label: 'XOR (^)' },
          { value: 'NOT', label: 'NOT (~A)' },
          { value: '<<', label: 'Shift Left (<<)' },
          { value: '>>', label: 'Shift Right (>>)' }
        ],
        default: 'AND'
      },
      { label: 'Operand B (Integer)', type: 'number', default: '25' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.bitwise(f1, f2 || 'AND', f3)
  },
  'Modulo': {
    name: 'Modulo',
    category: 'programmer',
    description: 'Integer division quotient, remainder, and modulo formula',
    fields: [
      { label: 'Dividend (A)', type: 'number', default: '47' },
      { label: 'Divisor (B)', type: 'number', default: '5' }
    ],
    calculate: (f1, f2) => calculatorEngine.modulo(f1, f2)
  },
  'IP / Subnet': {
    name: 'IP / Subnet',
    category: 'programmer',
    description: 'IPv4 CIDR network prefix, subnet mask, usable host range, and broadcast',
    fields: [
      { label: 'IPv4 Address', type: 'text', default: '192.168.1.1' },
      { label: 'CIDR Prefix (e.g. 24 for /24)', type: 'number', default: '24' }
    ],
    calculate: (f1, f2) => calculatorEngine.ipSubnet(f1, f2)
  }
};
