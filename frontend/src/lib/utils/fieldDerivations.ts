/**
 * Field Derivation Engine
 * Applies derivation formulas to pre-populate Full App fields from Quick App data
 */

export interface FieldDerivation {
  targetFieldId: string;
  sourceFieldId: string;
  formula: string;
  description?: string;
  mapping?: string; // JSON string for range_midpoint mappings
  editable?: boolean;
}

export interface DerivationResult {
  fieldId: string;
  value: any;
  derivedFrom: string[];
  formula: string;
  editable: boolean;
}

/**
 * Apply all derivations to pre-populate fields
 * @param derivations - Array of derivation definitions from Neo4j
 * @param sourceData - The Quick App responses
 * @returns Object with derived field values
 */
export function applyDerivations(
  derivations: FieldDerivation[],
  sourceData: Record<string, any>
): Record<string, DerivationResult> {
  const results: Record<string, DerivationResult> = {};

  // Group derivations by target field (for sum operations with multiple sources)
  const derivationsByTarget = groupBy(derivations, 'targetFieldId');

  for (const [targetFieldId, targetDerivations] of Object.entries(derivationsByTarget)) {
    const result = applyDerivation(targetDerivations, sourceData);
    if (result !== null && result !== undefined) {
      results[targetFieldId] = {
        fieldId: targetFieldId,
        value: result.value,
        derivedFrom: result.sources,
        formula: result.formula,
        editable: targetDerivations[0]?.editable !== false,
      };
    }
  }

  return results;
}

/**
 * Apply a single derivation (may have multiple sources for sum)
 */
function applyDerivation(
  derivations: FieldDerivation[],
  sourceData: Record<string, any>
): { value: any; sources: string[]; formula: string } | null {
  if (derivations.length === 0) return null;

  const formula = derivations[0].formula;
  const sources: string[] = [];

  switch (formula) {
    case 'copy': {
      const sourceFieldId = derivations[0].sourceFieldId;
      const value = sourceData[sourceFieldId];
      if (value !== undefined && value !== null && value !== '') {
        sources.push(sourceFieldId);
        return { value, sources, formula };
      }
      return null;
    }

    case 'sum': {
      let sum = 0;
      let hasValue = false;

      for (const derivation of derivations) {
        const value = sourceData[derivation.sourceFieldId];
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          if (!isNaN(numValue)) {
            sum += numValue;
            hasValue = true;
            sources.push(derivation.sourceFieldId);
          }
        }
      }

      if (hasValue) {
        return { value: sum, sources, formula };
      }
      return null;
    }

    case 'range_midpoint': {
      const derivation = derivations[0];
      const sourceFieldId = derivation.sourceFieldId;
      const value = sourceData[sourceFieldId];

      if (value && derivation.mapping) {
        try {
          const mapping = JSON.parse(derivation.mapping);
          const mappedValue = mapping[value];
          // Skip if mapping returns null (e.g., "Unknown" FICO) or undefined
          if (mappedValue !== undefined && mappedValue !== null) {
            sources.push(sourceFieldId);
            return { value: mappedValue, sources, formula };
          }
        } catch (e) {
          console.error('Failed to parse mapping for range_midpoint:', e);
        }
      }
      return null;
    }

    case 'calculate': {
      // For future custom calculations
      // Could implement a safe expression evaluator here
      console.warn('Calculate formula not yet implemented');
      return null;
    }

    default:
      console.warn(`Unknown derivation formula: ${formula}`);
      return null;
  }
}

/**
 * Group array by key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Merge derived values with existing responses
 * Only fills in fields that are empty in the existing responses
 * @param existingResponses - Current form responses
 * @param derivedResults - Results from applyDerivations
 * @returns Merged responses with derived values for empty fields
 */
export function mergeWithDerivedValues(
  existingResponses: Record<string, any>,
  derivedResults: Record<string, DerivationResult>
): Record<string, any> {
  const merged = { ...existingResponses };

  for (const [fieldId, result] of Object.entries(derivedResults)) {
    // Only pre-fill if the field is empty
    const existingValue = existingResponses[fieldId];
    if (existingValue === undefined || existingValue === null || existingValue === '') {
      merged[fieldId] = result.value;
    }
  }

  return merged;
}

/**
 * Get list of fields that were auto-filled
 * Useful for showing indicators on the UI
 */
export function getAutoFilledFields(
  derivedResults: Record<string, DerivationResult>,
  existingResponses: Record<string, any>
): string[] {
  const autoFilled: string[] = [];

  for (const [fieldId, result] of Object.entries(derivedResults)) {
    const existingValue = existingResponses[fieldId];
    if (existingValue === undefined || existingValue === null || existingValue === '') {
      autoFilled.push(fieldId);
    }
  }

  return autoFilled;
}
