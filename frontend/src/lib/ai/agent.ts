import { aiClient } from './client';
import { FORM_PLANNER_PROMPT, FIELD_ASSISTANT_PROMPT } from './prompts';
import { LoanTypeDefinition, FormSection } from '../types/schema';

export interface AgenticDecision {
  action: 'show_section' | 'skip_section' | 'request_document' | 'suggest_field' | 'optimize_order';
  reasoning: string;
  data: any;
}

export interface FieldSuggestion {
  suggestion: string;
  explanation: string;
  confidence: number;
}

/**
 * Form Agent - AI-powered form flow controller
 * 
 * Makes intelligent decisions about:
 * - Which sections to show
 * - Which sections to skip
 * - What documents to request
 * - How to optimize the form flow
 */
export class FormAgent {
  /**
   * Plan the next section based on current context
   */
  async planNextSection(context: {
    loanType: string;
    currentSection: string;
    responses: Record<string, any>;
    entityMap: LoanTypeDefinition;
    completedSections: string[];
  }): Promise<AgenticDecision> {
    try {
      const prompt = `
CONTEXT:
- Loan Type: ${context.loanType}
- Current Section: ${context.currentSection}
- Completed Sections: ${context.completedSections.join(', ')}
- User Responses: ${JSON.stringify(context.responses, null, 2)}

AVAILABLE SECTIONS:
${context.entityMap.sections.map(s => `- ${s.id}: ${s.label}`).join('\n')}

TASK:
Analyze the user's responses and determine the best next action.
Consider:
1. Is the next section necessary for this loan type?
2. Can we skip any sections based on previous answers?
3. Are there any critical documents needed?
4. Can we optimize the order for better UX?

Respond with a JSON decision.
      `.trim();

      const response = await aiClient.chat(
        [{ role: 'user', content: prompt }],
        FORM_PLANNER_PROMPT
      );

      // Extract JSON from markdown code blocks if present
      let jsonContent = response.content.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }

      const decision: AgenticDecision = JSON.parse(jsonContent);
      
      // console.log('AI Decision:', decision);
      
      return decision;
    } catch (error) {
      console.error('Form planning error:', error);
      
      // Fallback: proceed to next section normally
      return {
        action: 'show_section',
        reasoning: 'AI planning failed, proceeding with default flow',
        data: { sectionId: 'next' },
      };
    }
  }

  /**
   * Suggest value for a field based on context
   */
  async suggestFieldValue(context: {
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    loanType: string;
    responses: Record<string, any>;
  }): Promise<FieldSuggestion> {
    try {
      const prompt = `
FIELD INFORMATION:
- Field ID: ${context.fieldId}
- Label: ${context.fieldLabel}
- Type: ${context.fieldType}
- Loan Type: ${context.loanType}

USER CONTEXT:
${JSON.stringify(context.responses, null, 2)}

TASK:
Provide an intelligent suggestion for this field based on the user's context.
Consider industry standards, typical values, and the user's previous responses.

Respond with JSON containing suggestion, explanation, and confidence (0-1).
      `.trim();

      const response = await aiClient.chat(
        [{ role: 'user', content: prompt }],
        FIELD_ASSISTANT_PROMPT
      );

      // Extract JSON from markdown code blocks
      let jsonContent = response.content.trim();
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }

      const suggestion: FieldSuggestion = JSON.parse(jsonContent);
      
      return suggestion;
    } catch (error) {
      console.error('Field suggestion error:', error);
      
      return {
        suggestion: '',
        explanation: 'Unable to generate suggestion',
        confidence: 0,
      };
    }
  }

  /**
   * Analyze if a section should be skipped
   */
  async shouldSkipSection(context: {
    sectionId: string;
    sectionLabel: string;
    loanType: string;
    responses: Record<string, any>;
  }): Promise<{ skip: boolean; reasoning: string }> {
    try {
      const prompt = `
SECTION: ${context.sectionLabel} (${context.sectionId})
LOAN TYPE: ${context.loanType}
USER RESPONSES: ${JSON.stringify(context.responses, null, 2)}

TASK:
Determine if this section should be skipped based on:
1. Loan type requirements
2. Previous user responses
3. Regulatory requirements
4. Business logic

Respond with JSON: { "skip": boolean, "reasoning": string }
      `.trim();

      const response = await aiClient.chat(
        [{ role: 'user', content: prompt }],
        FORM_PLANNER_PROMPT
      );

      // Extract JSON from markdown code blocks
      let jsonContent = response.content.trim();
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Section skip analysis error:', error);
      
      return {
        skip: false,
        reasoning: 'Unable to determine, showing section by default',
      };
    }
  }

  /**
   * Optimize section order for better completion rate
   */
  async optimizeSectionOrder(context: {
    sections: FormSection[];
    loanType: string;
    responses: Record<string, any>;
  }): Promise<FormSection[]> {
    try {
      const prompt = `
CURRENT SECTION ORDER:
${context.sections.map((s, i) => `${i + 1}. ${s.label} (${s.fields.length} fields)`).join('\n')}

LOAN TYPE: ${context.loanType}
USER RESPONSES: ${JSON.stringify(context.responses, null, 2)}

TASK:
Optimize the section order to:
1. Maximize completion rate
2. Reduce friction
3. Group related information
4. Put easier sections first

Respond with JSON array of section IDs in optimal order.
      `.trim();

      const response = await aiClient.chat(
        [{ role: 'user', content: prompt }],
        FORM_PLANNER_PROMPT
      );

      // Extract JSON from markdown code blocks
      let jsonContent = response.content.trim();
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }

      const optimizedOrder: string[] = JSON.parse(jsonContent);
      
      // Reorder sections based on AI recommendation
      const reorderedSections = optimizedOrder
        .map(id => context.sections.find(s => s.id === id))
        .filter(Boolean) as FormSection[];
      
      return reorderedSections;
    } catch (error) {
      console.error('Section optimization error:', error);
      
      // Return original order on error
      return context.sections;
    }
  }
}

// Singleton instance
export const formAgent = new FormAgent();
