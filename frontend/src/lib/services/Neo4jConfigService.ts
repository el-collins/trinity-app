import neo4j, { Driver, Session, Integer } from 'neo4j-driver';
import { config } from '../config';

/**
 * Helper to convert all Neo4j integers in an object to JavaScript numbers
 */
function convertIntegers(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Integer.isInteger(obj)) {
    return obj.toNumber();
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertIntegers);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertIntegers(obj[key]);
    }
    return result;
  }

  return obj;
}

class Neo4jConfigService {
  private driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );
  }

  public getSession(): Session {
    return this.driver.session();
  }

  public async closeDriver(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Fetches the complete form structure for a given loan type.
   * Uses the new direct REQUIRES_FIELD relationship model.
   * Fields are grouped by their 'section' property.
   */
  public async getLoanTypeConfig(loanTypeId: string) {
    const session = this.getSession();
    try {
      // First, get the loan type info
      const loanTypeResult = await session.run(
        `
        MATCH (lt:LoanType {id: $loanTypeId})
        RETURN lt
        `,
        { loanTypeId }
      );

      if (loanTypeResult.records.length === 0) {
        return null;
      }

      // Convert Neo4j integers to JS numbers
      const loanTypeNode = convertIntegers(loanTypeResult.records[0].get('lt').properties);

      // Get all fields for this loan type with conditional relationships
      const fieldsResult = await session.run(
        `
        MATCH (lt:LoanType {id: $loanTypeId})-[:REQUIRES_FIELD]->(f:Field)
        OPTIONAL MATCH (trigger:Field)-[cond:CONDITIONALLY_SHOWS]->(f)
        WITH f, collect({
          triggerField: trigger.id,
          when: cond.when,
          operator: cond.operator
        }) as conditions
        RETURN f, conditions
        ORDER BY f.section, f.order
        `,
        { loanTypeId }
      );

      // Group fields by section
      const sectionMap = new Map<string, any[]>();

      for (const record of fieldsResult.records) {
        // Convert Neo4j integers to JS numbers
        const fieldNode = convertIntegers(record.get('f').properties);
        const conditions = record.get('conditions').filter((c: any) => c.triggerField !== null);

        const sectionName = fieldNode.section || 'general';

        if (!sectionMap.has(sectionName)) {
          sectionMap.set(sectionName, []);
        }

        // Build showIf from conditions or field properties
        let showIf = null;
        if (conditions.length > 0) {
          showIf = {
            field: conditions[0].triggerField,
            value: conditions[0].when,
            operator: conditions[0].operator || 'equals'
          };
        } else if (fieldNode.show_if) {
          showIf = {
            field: fieldNode.show_if,
            value: fieldNode.show_if_value,
            operator: 'equals'
          };
        }

        sectionMap.get(sectionName)!.push({
          id: fieldNode.id,
          name: fieldNode.name,
          label: fieldNode.label,
          type: fieldNode.type,
          required: fieldNode.required,
          order: fieldNode.order,
          placeholder: fieldNode.placeholder,
          validation: fieldNode.validation,
          options: fieldNode.options,
          helpText: fieldNode.help_text,
          ghlField: fieldNode.ghl_field,
          encrypted: fieldNode.encrypted,
          showIf: showIf,
          // Derivation metadata for pre-filling from Quick App
          derivedFrom: fieldNode.derived_from,
          derivationFormula: fieldNode.derivation_formula,
          derivationDescription: fieldNode.derivation_description
        });
      }

      // Define section order and labels
      const sectionOrder: Record<string, { order: number; label: string; description?: string }> = {
        'contact': { order: 1, label: 'Contact Information', description: 'Your contact details' },
        'contact_info': { order: 1, label: 'Contact Information', description: 'Your contact details' },
        'quick_app_contact': { order: 1, label: 'Contact Information', description: 'Your contact details' },
        'quick_app_business': { order: 2, label: 'Business Information', description: 'Tell us about your business' },
        'quick_app_financial': { order: 3, label: 'Financial Qualification', description: 'Financial details to help us find the right loan' },
        'business_info': { order: 2, label: 'Business Information', description: 'Details about your business' },
        'tax_control': { order: 3, label: 'Tax & Control Information', description: 'Tax and ownership details' },
        'legal': { order: 4, label: 'Legal Information', description: 'Legal disclosures' },
        'extended_legal': { order: 5, label: 'Additional Legal Information', description: 'Additional legal questions' },
        'owner_info': { order: 6, label: 'Owner/Principal Information', description: 'Information about business owners' },
        'financial': { order: 7, label: 'Financial Information', description: 'Sales and revenue information' },
        'mca_financial': { order: 7, label: 'MCA Financial Details', description: 'Merchant cash advance specific information' },
        'equipment_info': { order: 8, label: 'Equipment Information', description: 'Details about the equipment' },
        'trade_references': { order: 9, label: 'Trade References', description: 'Business trade references' },
        'bank_references': { order: 10, label: 'Bank References', description: 'Banking information' },
        'accountant_references': { order: 11, label: 'Accountant References', description: 'Accountant contact information' },
        'daily_contact': { order: 12, label: 'Daily Contact', description: 'Daily contact person details' },
        'accounts_receivable': { order: 13, label: 'Accounts Receivable', description: 'A/R information for invoice financing' },
        'factoring_quick_details': { order: 14, label: 'Invoice Details', description: 'Invoice factoring specific information' },
        'financing_quick_details': { order: 14, label: 'Invoice Details', description: 'Invoice financing specific information' },
        'loc_specific': { order: 15, label: 'Line of Credit Details', description: 'Line of credit specific information' },
        'sba_specific': { order: 15, label: 'SBA Details', description: 'SBA loan specific information' },
        'authorization': { order: 99, label: 'Authorization & Consent', description: 'Review and sign the application' },
        'general': { order: 50, label: 'Additional Information', description: 'Other information' }
      };

      // Build sections array from map
      const sections = Array.from(sectionMap.entries())
        .map(([sectionId, fields]) => {
          const sectionInfo = sectionOrder[sectionId] || { order: 50, label: sectionId, description: '' };
          return {
            id: sectionId,
            name: sectionInfo.label,
            label: sectionInfo.label,
            order: sectionInfo.order,
            description: sectionInfo.description,
            fields: fields.sort((a, b) => (a.order || 0) - (b.order || 0))
          };
        })
        .sort((a, b) => a.order - b.order);

      return {
        loanType: {
          id: loanTypeNode.id,
          name: loanTypeNode.name,
          displayName: loanTypeNode.display_name,
          description: loanTypeNode.description,
          tier: loanTypeNode.tier,
          estimatedTime: loanTypeNode.estimated_time,
          ghlTag: loanTypeNode.ghl_tag,
          isPreliminary: loanTypeNode.is_preliminary
        },
        sections: sections
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Get conditional relationships for dynamic field visibility
   */
  public async getConditionalRelationships(loanTypeId: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (lt:LoanType {id: $loanTypeId})-[:REQUIRES_FIELD]->(dependent:Field)
        MATCH (trigger:Field)-[r:CONDITIONALLY_SHOWS]->(dependent)
        RETURN trigger.id as triggerFieldId,
               r.when as triggerValue,
               r.operator as operator,
               dependent.id as dependentFieldId
        `,
        { loanTypeId }
      );

      return result.records.map(record => ({
        triggerFieldId: record.get('triggerFieldId'),
        triggerValue: record.get('triggerValue'),
        operator: record.get('operator') || 'equals',
        dependentFieldId: record.get('dependentFieldId')
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Get field derivation mappings for pre-filling Full App from Quick App
   */
  public async getFieldDerivations() {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (target:Field)-[r:DERIVES_FROM]->(source:Field)
        RETURN target.id as targetFieldId,
               source.id as sourceFieldId,
               r.formula as formula,
               r.description as description,
               r.mapping as mapping,
               r.editable as editable
        `
      );

      return result.records.map(record => ({
        targetFieldId: record.get('targetFieldId'),
        sourceFieldId: record.get('sourceFieldId'),
        formula: record.get('formula'),
        description: record.get('description'),
        mapping: record.get('mapping'),
        editable: record.get('editable')
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Get all available loan types
   */
  public async getAllLoanTypes() {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (lt:LoanType)
        RETURN lt
        ORDER BY lt.tier, lt.name
        `
      );

      return result.records.map(record => {
        const lt = record.get('lt').properties;
        return {
          id: lt.id,
          name: lt.name,
          displayName: lt.display_name,
          description: lt.description,
          tier: lt.tier,
          estimatedTime: lt.estimated_time,
          ghlTag: lt.ghl_tag,
          isPreliminary: lt.is_preliminary
        };
      });
    } finally {
      await session.close();
    }
  }
}

// Singleton instance
export const neo4jConfigService = new Neo4jConfigService();
