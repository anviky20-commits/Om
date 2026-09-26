import { calculatorEngine } from './calculatorEngine';
import { ToolConfig } from './calculatorConfig';

export const EXTENDED_TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Gold
  'Gold Value': {
    name: 'Gold Value',
    category: 'gold',
    description: 'Calculate gold value from weight and rate per unit',
    fields: [
      { label: 'Weight', type: 'number', default: '1' },
      { label: 'Rate per Unit (₹)', type: 'number', default: '125000' },
      {
        label: 'Unit',
        type: 'select',
        options: [
          { value: 'tola', label: 'Tola (11.664 g)' },
          { value: 'g', label: 'Grams (1 g)' },
          { value: 'kg', label: 'Kilograms (1 kg)' },
          { value: 'troy_oz', label: 'Troy Ounce (31.103 g)' }
        ],
        default: 'tola'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.goldValue(f1, f2, f3 || 'tola')
  },
  'Gold Rate × Weight': {
    name: 'Gold Rate × Weight',
    category: 'gold',
    description: 'Compute precise gold cost across various weights',
    fields: [
      { label: 'Weight', type: 'number', default: '2.5' },
      { label: 'Current Rate (₹)', type: 'number', default: '125000' },
      {
        label: 'Unit',
        type: 'select',
        options: [
          { value: 'tola', label: 'Tola' },
          { value: 'g', label: 'Grams' },
          { value: 'aana', label: 'Aana' },
          { value: 'pav', label: 'Pav (10 Tola)' }
        ],
        default: 'tola'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.goldValue(f1, f2, f3 || 'tola')
  },
  'Gold Weight Converter': {
    name: 'Gold Weight Converter',
    category: 'gold',
    description: 'Convert between Tola, Gram, Pav, Aana, Ratti, and Troy Oz',
    isConverter: true,
    unitType: 'generic',
    unitGroup: 'Gold',
    defaultUnitFrom: 'tola',
    defaultUnitTo: 'g',
    fields: [
      { label: 'Gold Weight', type: 'number', default: '1' }
    ],
    calculate: (f1, _f2, _f3, _f4, uFrom = 'tola', uTo = 'g') => calculatorEngine.goldWeightConverter(f1, uFrom, uTo)
  },
  'Karat ↔ Purity': {
    name: 'Karat ↔ Purity',
    category: 'gold',
    description: 'Convert between Karats (24K, 22K, 18K) and Gold Purity Percentage',
    fields: [
      { label: 'Value to Convert', type: 'number', default: '22' },
      {
        label: 'Conversion Direction',
        type: 'select',
        options: [
          { value: 'karatToPurity', label: 'Karat to Purity % (e.g. 22K → 91.67%)' },
          { value: 'purityToKarat', label: 'Purity % to Karat (e.g. 91.67% → 22K)' }
        ],
        default: 'karatToPurity'
      }
    ],
    calculate: (f1, f2) => calculatorEngine.karatPurity(f1, f2 || 'karatToPurity')
  },
  'Pure Gold Weight': {
    name: 'Pure Gold Weight',
    category: 'gold',
    description: 'Calculate 24K pure gold net content from alloy weight and karat',
    fields: [
      { label: 'Gross Jewellery Weight (g / tola)', type: 'number', default: '15' },
      { label: 'Karat (e.g. 22, 18, 14)', type: 'number', default: '22' }
    ],
    calculate: (f1, f2) => calculatorEngine.pureGoldWeight(f1, f2)
  },
  'Jewellery Price': {
    name: 'Jewellery Price',
    category: 'gold',
    description: 'Complete jewellery billing with Making Charges, Wastage, and GST',
    fields: [
      { label: 'Gold Value (₹)', type: 'number', default: '85000' },
      { label: 'Making Charge (%)', type: 'number', default: '8' },
      { label: 'Wastage (Jaddi) (%)', type: 'number', default: '2' },
      { label: 'GST / Tax (%)', type: 'number', default: '3' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.jewelleryPrice(f1, Number(f2) || 0, Number(f3) || 0, Number(f4) || 3)
  },
  'Making Charge': {
    name: 'Making Charge',
    category: 'gold',
    description: 'Calculate craftsmanship making fee on gold jewellery',
    fields: [
      { label: 'Gold Value (₹)', type: 'number', default: '75000' },
      { label: 'Making Charge (%)', type: 'number', default: '10' }
    ],
    calculate: (f1, f2) => calculatorEngine.makingCharge(f1, f2)
  },
  'Wastage': {
    name: 'Wastage',
    category: 'gold',
    description: 'Calculate jewellery melting wastage (Jaddi / Karda) loss',
    fields: [
      { label: 'Jewellery Weight (g)', type: 'number', default: '25' },
      { label: 'Wastage Percentage (%)', type: 'number', default: '3' },
      { label: 'Gold Rate per Gram (₹)', type: 'number', default: '10500' }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.wastage(f1, f2, f3)
  },
  'GST / Tax': {
    name: 'GST / Tax',
    category: 'gold',
    description: 'Standard 3% precious metals Goods & Services Tax calculation',
    fields: [
      { label: 'Precious Metal Subtotal (₹)', type: 'number', default: '120000' },
      { label: 'GST Rate (%)', type: 'number', default: '3' }
    ],
    calculate: (f1, f2) => calculatorEngine.tax(f1, f2, false)
  },
  'Buy / Sell Value': {
    name: 'Buy / Sell Value',
    category: 'gold',
    description: 'Compare buy and sell rates with purity deduction to evaluate dealer spread',
    fields: [
      { label: 'Gross Weight (g)', type: 'number', default: '20' },
      { label: 'Dealer Buying Rate /g (₹)', type: 'number', default: '9800' },
      { label: 'Dealer Selling Rate /g (₹)', type: 'number', default: '10500' },
      { label: 'Purity Percentage (%)', type: 'number', default: '91.6' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.buySellValue(f1, f2, f3, Number(f4) || 91.6)
  },
  'Silver Value': {
    name: 'Silver Value',
    category: 'gold',
    description: 'Calculate silver metal value by weight in grams or kilograms',
    fields: [
      { label: 'Weight', type: 'number', default: '500' },
      { label: 'Rate per Kilogram (₹)', type: 'number', default: '95000' },
      {
        label: 'Weight Unit',
        type: 'select',
        options: [
          { value: 'g', label: 'Grams' },
          { value: 'kg', label: 'Kilograms' }
        ],
        default: 'g'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.silverValue(f1, f2, f3 === 'g')
  },

  // Health
  'BMI': {
    name: 'BMI',
    category: 'health',
    description: 'Body Mass Index and healthy weight category',
    formula: 'BMI = weight(kg) / height(m)²',
    fields: [
      { label: 'Weight (kg)', type: 'number', default: '72' },
      { label: 'Height (cm)', type: 'number', default: '175' }
    ],
    calculate: (f1, f2) => calculatorEngine.bmi(f1, f2, true)
  },
  'BMR': {
    name: 'BMR',
    category: 'health',
    description: 'Mifflin-St Jeor Basal Metabolic Rate (calories burned at rest)',
    fields: [
      { label: 'Weight (kg)', type: 'number', default: '70' },
      { label: 'Height (cm)', type: 'number', default: '175' },
      { label: 'Age (Years)', type: 'number', default: '28' },
      {
        label: 'Biological Sex',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ],
        default: 'male'
      }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.bmr(f1, f2, f3, f4 || 'male')
  },
  'TDEE': {
    name: 'TDEE',
    category: 'health',
    description: 'Total Daily Energy Expenditure based on activity multiplier',
    fields: [
      { label: 'Basal Metabolic Rate (BMR kcal)', type: 'number', default: '1650' },
      {
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: 'sedentary', label: 'Sedentary (Desk job, little exercise)' },
          { value: 'light', label: 'Light (Exercise 1-3 days/week)' },
          { value: 'moderate', label: 'Moderate (Exercise 3-5 days/week)' },
          { value: 'heavy', label: 'Heavy (Hard exercise 6-7 days/week)' },
          { value: 'athlete', label: 'Athlete (Physical job or 2x training)' }
        ],
        default: 'moderate'
      }
    ],
    calculate: (f1, f2) => calculatorEngine.tdee(f1, f2 || 'moderate')
  },
  'Calories': {
    name: 'Calories',
    category: 'health',
    description: 'Personalized calorie intake for maintenance, fat loss, or muscle gain',
    fields: [
      { label: 'Weight (kg)', type: 'number', default: '72' },
      { label: 'Height (cm)', type: 'number', default: '175' },
      { label: 'Age (Years)', type: 'number', default: '26' },
      {
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'heavy', label: 'Heavy' }
        ],
        default: 'moderate'
      }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.calories(f1, f2, f3, 'male', f4 || 'moderate')
  },
  'Macros': {
    name: 'Macros',
    category: 'health',
    description: 'Macronutrient breakdown (Protein, Carbs, Fats) in grams',
    fields: [
      { label: 'Target Daily Calories (kcal)', type: 'number', default: '2200' },
      { label: 'Protein Ratio (%)', type: 'number', default: '30' },
      { label: 'Carbs Ratio (%)', type: 'number', default: '40' },
      { label: 'Fats Ratio (%)', type: 'number', default: '30' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.macros(f1, Number(f2) || 30, Number(f3) || 40, Number(f4) || 30)
  },
  'Body Fat': {
    name: 'Body Fat',
    category: 'health',
    description: 'US Navy Body Fat percentage formula',
    fields: [
      {
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ],
        default: 'male'
      },
      { label: 'Waist Circumference (cm)', type: 'number', default: '84' },
      { label: 'Neck Circumference (cm)', type: 'number', default: '38' },
      { label: 'Height (cm)', type: 'number', default: '175' }
    ],
    calculate: (f1, f2, f3, f4) => calculatorEngine.bodyFat(f1 || 'male', f2, f3, f4)
  },
  'Water Intake': {
    name: 'Water Intake',
    category: 'health',
    description: 'Optimal daily hydration target in millilitres and litres',
    fields: [
      { label: 'Body Weight (kg)', type: 'number', default: '68' },
      { label: 'Intake Multiplier (ml per kg)', type: 'number', default: '35' }
    ],
    calculate: (f1, f2) => calculatorEngine.waterIntake(f1, Number(f2) || 35)
  },
  'Running Pace': {
    name: 'Running Pace',
    category: 'health',
    description: 'Pace per kilometer and average speed for runs or walks',
    fields: [
      { label: 'Distance (km)', type: 'number', default: '5.0', step: '0.1' },
      { label: 'Total Time (Minutes)', type: 'number', default: '28' }
    ],
    calculate: (f1, f2) => calculatorEngine.pace(f1, f2)
  },
  'Age': {
    name: 'Age',
    category: 'health',
    description: 'Chronological age breakdown in years, months, and days',
    fields: [
      { label: 'Date of Birth', type: 'date', default: '1998-05-15' }
    ],
    calculate: (f1) => calculatorEngine.age(f1)
  },
  'Ideal Body Weight': {
    name: 'Ideal Body Weight',
    category: 'health',
    description: 'Devine & Robinson clinical ideal weight range for height',
    fields: [
      { label: 'Height (cm)', type: 'number', default: '175' },
      {
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ],
        default: 'male'
      }
    ],
    calculate: (f1, f2) => calculatorEngine.idealBodyWeight(f1, f2 || 'male')
  },

  // Time
  'Date Difference': {
    name: 'Date Difference',
    category: 'time',
    description: 'Calendar span between two dates in days, weeks, and months',
    fields: [
      { label: 'Start Date', type: 'date', default: '2026-01-01' },
      { label: 'End Date', type: 'date', default: '2026-12-31' }
    ],
    calculate: (f1, f2) => calculatorEngine.dateDifference(f1, f2)
  },
  'Countdown': {
    name: 'Countdown',
    category: 'time',
    description: 'Days and hours remaining until an upcoming event or deadline',
    fields: [
      { label: 'Target Date / Event', type: 'date', default: '2026-12-31' }
    ],
    calculate: (f1) => calculatorEngine.countdown(f1)
  },
  'Working Days': {
    name: 'Working Days',
    category: 'time',
    description: 'Count business weekdays (Mon-Fri) excluding weekends',
    fields: [
      { label: 'Start Date', type: 'date', default: '2026-01-01' },
      { label: 'End Date', type: 'date', default: '2026-06-30' }
    ],
    calculate: (f1, f2) => calculatorEngine.workingDays(f1, f2)
  },
  'Date Add / Subtract': {
    name: 'Date Add / Subtract',
    category: 'time',
    description: 'Add or subtract a number of days to find future or past dates',
    fields: [
      { label: 'Base Date', type: 'date', default: '2026-03-25' },
      { label: 'Number of Days', type: 'number', default: '45' },
      {
        label: 'Operation',
        type: 'select',
        options: [
          { value: '+', label: 'Add (+) Days' },
          { value: '-', label: 'Subtract (-) Days' }
        ],
        default: '+'
      }
    ],
    calculate: (f1, f2, f3) => calculatorEngine.dateAddSubtract(f1, f2, f3 || '+')
  },
  'Time Difference': {
    name: 'Time Difference',
    category: 'time',
    description: 'Elapsed hours and minutes between two timestamps',
    fields: [
      { label: 'Start Time (HH:MM)', type: 'time', default: '09:15' },
      { label: 'End Time (HH:MM)', type: 'time', default: '17:45' }
    ],
    calculate: (f1, f2) => calculatorEngine.timeDifference(f1, f2)
  },
  'Time Zone Offset': {
    name: 'Time Zone Offset',
    category: 'time',
    description: 'Convert current time to target UTC offset',
    fields: [
      { label: 'Target UTC Offset (Hours)', type: 'number', default: '5.75', step: '0.25' }
    ],
    calculate: (f1) => calculatorEngine.timeZoneOffset(f1)
  },
  'Unix Timestamp': {
    name: 'Unix Timestamp',
    category: 'time',
    description: 'Convert between Unix epoch timestamps and human dates',
    fields: [
      { label: 'Input Value', type: 'text', default: '1774435200' },
      {
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'toDate', label: 'Unix Timestamp → Date' },
          { value: 'toTimestamp', label: 'Date String → Unix Timestamp' }
        ],
        default: 'toDate'
      }
    ],
    calculate: (f1, f2) => calculatorEngine.unixTimestamp(f1, f2 || 'toDate')
  },
  'Weekday': {
    name: 'Weekday',
    category: 'time',
    description: 'Find day of the week, leap year status, and calendar details',
    fields: [
      { label: 'Select Date', type: 'date', default: '2026-09-25' }
    ],
    calculate: (f1) => calculatorEngine.weekday(f1)
  }
};
