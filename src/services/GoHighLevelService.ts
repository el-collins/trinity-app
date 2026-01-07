import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface GHLContact {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  companyName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface GHLMessage {
  contactId: string;
  message: string;
  type: 'SMS' | 'EMAIL';
  subject?: string;
}

export class GoHighLevelService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.goHighLevel.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.goHighLevel.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  /**
   * Create or update a contact in GoHighLevel
   */
  async upsertContact(contact: GHLContact): Promise<string> {
    try {
      const payload = {
        locationId: config.goHighLevel.locationId,
        ...contact,
      };
      
      if (contact.id) {
        // Update existing contact
        await this.client.put(`/contacts/${contact.id}`, payload);
        return contact.id;
      } else {
        // Create new contact
        const response = await this.client.post('/contacts/', payload);
        return response.data.contact.id;
      }
    } catch (error: any) {
      console.error('Error upserting contact in GoHighLevel:', error.message);
      throw new Error(`Failed to upsert contact: ${error.message}`);
    }
  }
  
  /**
   * Send a message (SMS or Email) to a contact
   */
  async sendMessage(message: GHLMessage): Promise<void> {
    try {
      if (message.type === 'EMAIL') {
        await this.client.post('/conversations/messages/email', {
          locationId: config.goHighLevel.locationId,
          contactId: message.contactId,
          subject: message.subject || 'Loan Application Update',
          message: message.message,
        });
      } else {
        await this.client.post('/conversations/messages', {
          locationId: config.goHighLevel.locationId,
          contactId: message.contactId,
          type: 'SMS',
          message: message.message,
        });
      }
    } catch (error: any) {
      console.error('Error sending message via GoHighLevel:', error.message);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
  
  /**
   * Add tags to a contact
   */
  async addTags(contactId: string, tags: string[]): Promise<void> {
    try {
      await this.client.post(`/contacts/${contactId}/tags`, {
        tags,
      });
    } catch (error: any) {
      console.error('Error adding tags in GoHighLevel:', error.message);
      throw new Error(`Failed to add tags: ${error.message}`);
    }
  }
  
  /**
   * Create a task/opportunity for follow-up
   */
  async createOpportunity(data: {
    contactId: string;
    pipelineId: string;
    stageId: string;
    name: string;
    monetaryValue?: number;
  }): Promise<string> {
    try {
      const response = await this.client.post('/opportunities/', {
        locationId: config.goHighLevel.locationId,
        ...data,
      });
      return response.data.opportunity.id;
    } catch (error: any) {
      console.error('Error creating opportunity in GoHighLevel:', error.message);
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
  }
  
  /**
   * Send application status notification
   */
  async notifyApplicationStatus(params: {
    email: string;
    businessName: string;
    status: string;
    nextSteps?: string;
  }): Promise<void> {
    try {
      // Find or create contact
      const contactResponse = await this.client.get('/contacts/lookup', {
        params: {
          email: params.email,
          locationId: config.goHighLevel.locationId,
        },
      });
      
      let contactId: string;
      
      if (contactResponse.data.contacts && contactResponse.data.contacts.length > 0) {
        contactId = contactResponse.data.contacts[0].id;
      } else {
        contactId = await this.upsertContact({
          firstName: params.businessName,
          email: params.email,
          companyName: params.businessName,
        });
      }
      
      // Send notification
      const message = this.formatStatusMessage(params);
      await this.sendMessage({
        contactId,
        message,
        type: 'EMAIL',
        subject: `Loan Application Update - ${params.status}`,
      });
      
      // Add status tag
      await this.addTags(contactId, [`application_${params.status.toLowerCase()}`]);
    } catch (error: any) {
      console.error('Error notifying application status:', error.message);
      // Don't throw - engagement notification failures shouldn't break the flow
    }
  }
  
  private formatStatusMessage(params: {
    businessName: string;
    status: string;
    nextSteps?: string;
  }): string {
    let message = `Dear ${params.businessName},\n\n`;
    message += `Your loan application status has been updated to: ${params.status}\n\n`;
    
    if (params.nextSteps) {
      message += `Next Steps:\n${params.nextSteps}\n\n`;
    }
    
    message += `If you have any questions, please don't hesitate to reach out.\n\n`;
    message += `Best regards,\nTrinityIQ Lending Team`;
    
    return message;
  }
}

export const goHighLevelService = new GoHighLevelService();
