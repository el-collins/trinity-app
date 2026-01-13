import axios, { AxiosInstance } from 'axios';

export interface GHLContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: {
    id: string; // The specific GHL Custom Field ID
    key?: string; // Optional key for reference
    field_value: any;
  }[];
  dateOfBirth?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
}

interface GHLContactResponse {
  contact: {
    id: string;
    email: string;
    phone: string;
    // ... other fields as needed
  };
}

export class GHLService {
  private client: AxiosInstance;
  private locationId: string;

  constructor() {
    const accessToken = process.env.GHL_ACCESS_TOKEN;
    this.locationId = process.env.GHL_LOCATION_ID || '';

    if (!accessToken) {
      console.warn('GHL_ACCESS_TOKEN is not set');
    }

    this.client = axios.create({
      baseURL: 'https://services.leadconnectorhq.com',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Search for an existing contact by email or phone
   */
  async searchContact(query: string): Promise<string | null> {
    if (!query) return null;
    
    try {
      const response = await this.client.get('/contacts/search', {
        params: {
          locationId: this.locationId,
          query: query,
        },
      });

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0].id;
      }
      return null;
    } catch (error: any) {
      console.error('Error searching GHL contact:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Create or Update a contact in GHL
   * Note: GHL API's POST /contacts/ upserts based on email/phone matching.
   */
  async createOrUpdateContact(data: GHLContactData): Promise<string | null> {
    try {
      if (!this.locationId) {
        throw new Error('GHL_LOCATION_ID is not configured');
      }

      // Convert customFields object to GHL array format if it's not already
      // This is a helper if we pass a simpler object structure later, 
      // but for now we'll assume the caller formats it correctly or we do it here.
      // (The defined interface expects the array format directly to match the API)

      const payload = {
        ...data,
        locationId: this.locationId,
      };

      // GHL's POST /contacts/ usually handles upsert (check by email/phone)
      const response = await this.client.post<GHLContactResponse>('/contacts/', payload);

      return response.data.contact.id;
    } catch (error: any) {
      console.error('Error syncing contact to GHL:', error.response?.data || error.message);
      // Fallback: If creation fails, maybe we need to try finding and updating explicitly?
      // Usually POST is sufficient for upsart.
      throw error;
    }
  }

  /**
   * Update a specific contact by ID
   */
  async updateContact(contactId: string, data: Partial<GHLContactData>): Promise<void> {
    try {
       await this.client.put(`/contacts/${contactId}`, data);
    } catch (error: any) {
      console.error(`Error updating GHL contact ${contactId}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

export const ghlService = new GHLService();
