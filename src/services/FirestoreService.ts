import { Firestore } from '@google-cloud/firestore';
import { config } from '../config';
import { ApplicationState, AuditEntry, AuditAction } from '../models/Application';
import { v4 as uuidv4 } from 'uuid';

export class FirestoreService {
  private db: Firestore;
  private applicationsCollection = 'applications';
  private auditCollection = 'audit_log';
  
  constructor() {
    const firestoreConfig: any = {
      projectId: config.firestore.projectId,
    };
    
    if (config.firestore.emulatorHost) {
      firestoreConfig.host = config.firestore.emulatorHost;
      firestoreConfig.ssl = false;
    }
    
    this.db = new Firestore(firestoreConfig);
  }
  
  async createApplication(data: Partial<ApplicationState>): Promise<ApplicationState> {
    const id = uuidv4();
    const now = new Date();
    
    const application: ApplicationState = {
      id,
      businessName: data.businessName || '',
      applicantEmail: data.applicantEmail || '',
      status: data.status || 'DRAFT' as any,
      currentStage: data.currentStage || 'BASIC_INFO' as any,
      owners: data.owners || [],
      responses: data.responses || {},
      underwritingReadiness: 0,
      nextQuestions: [],
      completedQuestions: [],
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.collection(this.applicationsCollection).doc(id).set(this.toFirestore(application));
    
    await this.logAudit({
      applicationId: id,
      action: AuditAction.APPLICATION_CREATED,
      userId: data.applicantEmail || 'system',
      details: { businessName: application.businessName },
    });
    
    return application;
  }
  
  async getApplication(id: string): Promise<ApplicationState | null> {
    const doc = await this.db.collection(this.applicationsCollection).doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return this.fromFirestore(doc.data() as any);
  }
  
  async updateApplication(id: string, updates: Partial<ApplicationState>): Promise<void> {
    const updateData = this.toFirestore({
      ...updates,
      updatedAt: new Date(),
    });
    
    await this.db.collection(this.applicationsCollection).doc(id).update(updateData);
  }
  
  async listApplications(filters?: {
    status?: string;
    email?: string;
    limit?: number;
  }): Promise<ApplicationState[]> {
    let query: any = this.db.collection(this.applicationsCollection);
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters?.email) {
      query = query.where('applicantEmail', '==', filters.email);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => this.fromFirestore(doc.data()));
  }
  
  async logAudit(entry: {
    applicationId: string;
    action: AuditAction;
    userId: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const auditEntry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      action: entry.action,
      userId: entry.userId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    };
    
    await this.db.collection(this.auditCollection).add({
      ...this.toFirestore(auditEntry),
      applicationId: entry.applicationId,
    });
  }
  
  async getAuditLog(applicationId: string): Promise<AuditEntry[]> {
    const snapshot = await this.db
      .collection(this.auditCollection)
      .where('applicationId', '==', applicationId)
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map((doc: any) => this.fromFirestore(doc.data()));
  }
  
  private toFirestore(data: any): any {
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = value;
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  private fromFirestore(data: any): any {
    const result: any = { ...data };
    
    // Convert Firestore timestamps to Date objects
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object' && '_seconds' in value) {
        result[key] = new Date(value._seconds * 1000);
      }
    }
    
    return result;
  }
}

export const firestoreService = new FirestoreService();
