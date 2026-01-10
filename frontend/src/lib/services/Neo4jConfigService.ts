import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config';

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
   * Fetches the complete form structure for a given loan type 
   * using the exact Cypher query structure validated in our tests.
   */
  public async getLoanTypeConfig(loanTypeId: string) {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (lt:LoanType {id: $loanTypeId})-[:REQUIRES_SECTION]->(s:Section)
        OPTIONAL MATCH (s)-[:CONTAINS_FIELD]->(f:Field)
        WITH lt, s, collect(f) as fields
        ORDER BY s.order
        WITH lt, collect({
            id: s.id,
            name: s.name,
            label: s.name,
            order: s.order,
            description: s.description,
            fields: [field IN fields WHERE field IS NOT NULL | {
              id: field.id,
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              order: field.order,
              placeholder: field.placeholder,
              validation: field.validation,
              options: field.options,
              showIf: {
                field: field.show_if_field,
                value: field.show_if_value
              }
            }]
          }) as sections
        RETURN {
          loanType: {
            id: lt.id,
            name: lt.name,
            tier: lt.tier,
            estimatedTime: lt.estimated_time_minutes,
            ownershipThreshold: lt.ownership_threshold
          },
          sections: sections
        } as formStructure
        `,
        { loanTypeId }
      );

      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('formStructure');
    } finally {
      await session.close();
    }
  }
}

// Singleton instance
export const neo4jConfigService = new Neo4jConfigService();
