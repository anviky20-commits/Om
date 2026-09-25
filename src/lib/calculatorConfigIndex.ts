import { TOOL_CONFIGS, ToolConfig } from './calculatorConfig';
import { EXTENDED_TOOL_CONFIGS } from './calculatorConfigExtended';
import { REMAINING_TOOL_CONFIGS } from './calculatorConfigRemaining';
import { CALCULATOR_CATALOG } from './calculatorEngine';

export const ALL_TOOL_CONFIGS: Record<string, ToolConfig> = {
  ...TOOL_CONFIGS,
  ...EXTENDED_TOOL_CONFIGS,
  ...REMAINING_TOOL_CONFIGS
};

export const getToolConfig = (toolName: string): ToolConfig => {
  if (ALL_TOOL_CONFIGS[toolName]) {
    return ALL_TOOL_CONFIGS[toolName];
  }
  // Safe fallback for any newly added tool
  return {
    name: toolName,
    category: 'quick',
    description: `Computational tool for ${toolName}`,
    fields: [
      { label: 'Input A', type: 'number', default: '100' },
      { label: 'Input B', type: 'number', default: '10' }
    ],
    calculate: (f1, f2) => `Result for ${toolName}: ${Number(f1) + Number(f2)}`
  };
};
