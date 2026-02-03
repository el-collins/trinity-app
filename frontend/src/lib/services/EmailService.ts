import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config';
import { firestore } from '../firebase/admin';

/**
 * Email Service using Nodemailer with SMTP
 * Sends application confirmation emails to applicants
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Fetch admin emails from Firestore adminUsers collection
   */
  private async getAdminEmails(): Promise<string[]> {
    try {
      const snapshot = await firestore.collection('adminUsers').get();
      const emails = snapshot.docs
        .map(doc => doc.data().email as string)
        .filter(email => !!email);

      if (emails.length === 0) {
        console.warn('No admin emails found in Firestore, falling back to config');
        return config.notifications.teamEmails;
      }

      return emails;
    } catch (error) {
      console.error('Failed to fetch admin emails from Firestore, falling back to config:', error);
      return config.notifications.teamEmails;
    }
  }

  /**
   * Get logo URL for email templates
   */
  private getLogoUrl(): string {
    return 'https://firebasestorage.googleapis.com/v0/b/trinityiq.firebasestorage.app/o/Logo%2Ftrinityiq-half.png?alt=media&token=3a5ebff1-2e6b-4315-bb73-7f86c2d05b7b';
  }

  /**
   * Initialize nodemailer transporter with SMTP config
   */
  private initializeTransporter() {
    try {
      const {
        EMAIL_HOST,
        EMAIL_PORT,
        EMAIL_SECURE,
        EMAIL_USER,
        EMAIL_PASSWORD,
        EMAIL_FROM_NAME,
      } = process.env;

      // Validate required environment variables
      if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
        console.error('Email configuration missing. Email service disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT || '465'),
        secure: EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  /**
   * Send application confirmation email to applicant
   */
  async sendApplicationConfirmation(
    recipientEmail: string,
    applicationData: {
      applicationId: string;
      loanType: string;
      applicantName: string;
      submittedAt: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const { applicationId, loanType, applicantName, submittedAt } = applicationData;

      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: `Application Submitted - ${loanType} - Trinity Finance`,
        html: this.getApplicationConfirmationHTML(applicationData),
        text: this.getApplicationConfirmationText(applicationData),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Confirmation email sent successfully:', {
        messageId: info.messageId,
        recipient: recipientEmail,
        applicationId,
      });

      return true;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
  }

  /**
   * Send notification to team when new application is submitted
   * Uses configurable team emails from config
   */
  async sendAdminNotification(
    applicationData: {
      applicationId: string;
      loanType: string;
      applicantName: string;
      applicantEmail: string;
      applicantPhone?: string;
      submittedAt: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    // Check if notifications are enabled
    if (!config.notifications.onApplicationSubmitted) {
      console.log('Application submission notifications are disabled');
      return true;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';
      const teamEmails = await this.getAdminEmails();

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: teamEmails.join(', '),
        subject: `New Application Received - ${applicationData.loanType}`,
        html: this.getAdminNotificationHTML(applicationData),
        text: this.getAdminNotificationText(applicationData),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Team notification email sent successfully:', {
        messageId: info.messageId,
        applicationId: applicationData.applicationId,
        recipients: teamEmails,
      });

      return true;
    } catch (error) {
      console.error('Failed to send team notification email:', error);
      return false;
    }
  }

  /**
   * Send notification to team when documents are uploaded
   */
  async sendDocumentUploadNotification(
    data: {
      applicationId: string;
      applicantEmail: string;
      applicantName?: string;
      documentName: string;
      documentUrl: string;
      uploadedAt: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    // Check if notifications are enabled
    if (!config.notifications.onDocumentsUploaded) {
      console.log('Document upload notifications are disabled');
      return true;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';
      const teamEmails = await this.getAdminEmails();

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: teamEmails.join(', '),
        subject: `Document Uploaded - ${data.documentName}`,
        html: this.getDocumentUploadNotificationHTML(data),
        text: this.getDocumentUploadNotificationText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Document upload notification sent:', {
        messageId: info.messageId,
        applicationId: data.applicationId,
        document: data.documentName,
        recipients: teamEmails,
      });

      return true;
    } catch (error) {
      console.error('Failed to send document upload notification:', error);
      return false;
    }
  }

  /**
   * Generate HTML email for document upload notification
   */
  private getDocumentUploadNotificationHTML(data: {
    applicationId: string;
    applicantEmail: string;
    applicantName?: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Uploaded</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-bottom: 2px solid #2563eb; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 60px; height: auto; margin-bottom: 10px;" />
          <h1 style="color: #2563eb; margin: 10px 0 0; font-size: 24px; font-weight: bold;">Document Uploaded</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">A new document has been uploaded:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><strong>Document:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">${data.documentName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><strong>Application ID:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">${data.applicationId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><strong>Applicant:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">${data.applicantName || data.applicantEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;"><strong>Uploaded At:</strong></td>
                <td style="padding: 10px 0;">${new Date(data.uploadedAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="${data.documentUrl}" style="display: inline-block; background: #2563eb; color: #2563eb; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Document</a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from Trinity Finance SmartForm</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for document upload notification
   */
  private getDocumentUploadNotificationText(data: {
    applicationId: string;
    applicantEmail: string;
    applicantName?: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: string;
  }): string {
    return `
Document Uploaded - Trinity Finance

A new document has been uploaded:

Document: ${data.documentName}
Application ID: ${data.applicationId}
Applicant: ${data.applicantName || data.applicantEmail}
Uploaded At: ${new Date(data.uploadedAt).toLocaleString()}

View Document: ${data.documentUrl}

---
This is an automated notification from Trinity Finance SmartForm
    `.trim();
  }

  /**
   * Generate HTML email template for application confirmation
   */
  private getApplicationConfirmationHTML(data: {
    applicationId: string;
    loanType: string;
    applicantName: string;
    submittedAt: string;
  }): string {
    const formattedDate = new Date(data.submittedAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; position: relative;">
                <span style="color: #ffffff; font-size: 48px; line-height: 80px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Application Submitted Successfully!</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName || 'Applicant'},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for submitting your application with Trinity Finance. We have received your information and our team will review it shortly.
              </p>

              <!-- Application Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Application Details</h3>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Application ID:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.applicationId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Loan Type:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.loanType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Submitted:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <h3 style="margin: 30px 0 15px; color: #1f2937; font-size: 18px;">What's Next?</h3>

              <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li style="margin: 0 0 10px;">Our team will review your application within 24-48 hours</li>
                <li style="margin: 0 0 10px;">We may contact you if additional information is needed</li>
                <li style="margin: 0 0 10px;">A loan specialist will reach out to discuss the next steps</li>
              </ul>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Contact us at <a href="mailto:iq@financetrinity.com" style="color: #2563eb; text-decoration: none;">iq@financetrinity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Trinity Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for application confirmation
   */
  private getApplicationConfirmationText(data: {
    applicationId: string;
    loanType: string;
    applicantName: string;
    submittedAt: string;
  }): string {
    const formattedDate = new Date(data.submittedAt).toLocaleString();

    return `
TRINITY FINANCE - Application Confirmation

Dear ${data.applicantName || 'Applicant'},

Thank you for submitting your application with Trinity Finance. We have received your information and our team will review it shortly.

APPLICATION DETAILS
-------------------
Application ID: ${data.applicationId}
Loan Type: ${data.loanType}
Submitted: ${formattedDate}

WHAT'S NEXT?
------------
- Our team will review your application within 24-48 hours
- We may contact you if additional information is needed
- A loan specialist will reach out to discuss the next steps

Questions? Contact us at iq@financetrinity.com

© ${new Date().getFullYear()} Trinity Finance. All rights reserved.
    `.trim();
  }

  /**
   * Generate HTML email template for admin notification
   */
  private getAdminNotificationHTML(data: {
    applicationId: string;
    loanType: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    submittedAt: string;
  }): string {
    const formattedDate = new Date(data.submittedAt).toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Application Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 60px; height: auto;" />
    </div>
    <h2 style="color: #2563eb;">New Application Received</h2>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin-top: 20px;">
      <h3>Application Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Application ID:</td>
          <td style="padding: 8px;">${data.applicationId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Loan Type:</td>
          <td style="padding: 8px;">${data.loanType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Applicant Name:</td>
          <td style="padding: 8px;">${data.applicantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;"><a href="mailto:${data.applicantEmail}">${data.applicantEmail}</a></td>
        </tr>
        ${data.applicantPhone ? `
        <tr>
          <td style="padding: 8px; font-weight: bold;">Phone:</td>
          <td style="padding: 8px;">${data.applicantPhone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; font-weight: bold;">Submitted:</td>
          <td style="padding: 8px;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top: 20px; color: #666;">
      Please review this application in the admin dashboard.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for admin notification
   */
  private getAdminNotificationText(data: {
    applicationId: string;
    loanType: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    submittedAt: string;
  }): string {
    const formattedDate = new Date(data.submittedAt).toLocaleString();

    return `
NEW APPLICATION RECEIVED

Application ID: ${data.applicationId}
Loan Type: ${data.loanType}
Applicant Name: ${data.applicantName}
Email: ${data.applicantEmail}
${data.applicantPhone ? `Phone: ${data.applicantPhone}\n` : ''}Submitted: ${formattedDate}

Please review this application in the admin dashboard.
    `.trim();
  }

  /**
   * Send application invitation with pre-filled form link
   * Used when GHL creates a new contact
   */
  async sendApplicationInvitation(
    recipientEmail: string,
    invitationData: {
      applicantName: string;
      loanType: string;
      applicationUrl: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const { applicantName, loanType, applicationUrl } = invitationData;

      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: `Complete Your ${loanType} Application - Trinity Finance`,
        html: this.getApplicationInvitationHTML(invitationData),
        text: this.getApplicationInvitationText(invitationData),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Application invitation email sent successfully:', {
        messageId: info.messageId,
        recipient: recipientEmail,
      });

      return true;
    } catch (error) {
      console.error('Failed to send application invitation email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template for application invitation
   */
  private getApplicationInvitationHTML(data: {
    applicantName: string;
    loanType: string;
    applicationUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Complete Your Loan Application</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.applicantName},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in Trinity Finance! We've prepared a personalized application form for your <strong>${data.loanType}</strong> request.
              </p>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your application has been pre-filled with your contact information to make the process quick and easy. Simply click the button below to get started.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.applicationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Start My Application
                </a>
              </div>

              <!-- Features -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Why Choose Trinity Finance?</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li style="margin: 0 0 10px;">Fast approval process - get a decision in 24-48 hours</li>
                  <li style="margin: 0 0 10px;">Competitive rates tailored to your business</li>
                  <li style="margin: 0 0 10px;">Simple application - takes only 10-20 minutes</li>
                  <li style="margin: 0 0 10px;">Dedicated loan specialist assigned to you</li>
                </ul>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> Your progress is automatically saved. You can complete the application at your own pace and return to it anytime using the link above.
              </p>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Contact us at <a href="mailto:iq@financetrinity.com" style="color: #667eea; text-decoration: none;">iq@financetrinity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Trinity Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for application invitation
   */
  private getApplicationInvitationText(data: {
    applicantName: string;
    loanType: string;
    applicationUrl: string;
  }): string {
    return `
TRINITY FINANCE - Complete Your Loan Application

Dear ${data.applicantName},

Thank you for your interest in Trinity Finance! We've prepared a personalized application form for your ${data.loanType} request.

Your application has been pre-filled with your contact information to make the process quick and easy.

COMPLETE YOUR APPLICATION:
${data.applicationUrl}

WHY CHOOSE TRINITY FINANCE?
- Fast approval process - get a decision in 24-48 hours
- Competitive rates tailored to your business
- Simple application - takes only 10-20 minutes
- Dedicated loan specialist assigned to you

Note: Your progress is automatically saved. You can complete the application at your own pace and return to it anytime using the link above.

Questions? Contact us at iq@financetrinity.com

© ${new Date().getFullYear()} Trinity Finance. All rights reserved.
    `.trim();
  }

  /**
   * Send document request email with upload link
   * Used after application submission to request required documents
   */
  async sendDocumentRequestEmail(data: {
    to: string;
    firstName: string;
    loanType: string;
    uploadLink: string;
    requiredDocuments?: string[];
  }): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: data.to,
        subject: `Document Upload Required - ${data.loanType} Application`,
        html: this.getDocumentRequestHTML(data),
        text: this.getDocumentRequestText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Document request email sent successfully:', {
        messageId: info.messageId,
        recipient: data.to,
      });

      return true;
    } catch (error) {
      console.error('Failed to send document request email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template for document request
   */
  private getDocumentRequestHTML(data: {
    firstName: string;
    loanType: string;
    uploadLink: string;
    requiredDocuments?: string[];
  }): string {
    const documentsList = data.requiredDocuments && data.requiredDocuments.length > 0
      ? data.requiredDocuments.map(doc => `<li style="margin: 0 0 8px;">${doc}</li>`).join('')
      : '<li style="margin: 0 0 8px;">Driver\'s License (front and back)</li><li style="margin: 0 0 8px;">Bank Statements</li><li style="margin: 0 0 8px;">Tax Returns</li>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Upload Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Document Upload Required</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.firstName},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for submitting your ${data.loanType} application! To continue processing your application, we need you to upload the following documents:
              </p>

              <!-- Documents List -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Required Documents</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  ${documentsList}
                </ul>
              </div>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please use the secure upload link below to submit your documents. This link will expire in 7 days.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.uploadLink}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Upload Documents
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> All uploads are secure and encrypted. You can upload documents one at a time or all at once.
              </p>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Contact us at <a href="mailto:iq@financetrinity.com" style="color: #667eea; text-decoration: none;">iq@financetrinity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Trinity Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for document request
   */
  private getDocumentRequestText(data: {
    firstName: string;
    loanType: string;
    uploadLink: string;
    requiredDocuments?: string[];
  }): string {
    const documentsList = data.requiredDocuments && data.requiredDocuments.length > 0
      ? data.requiredDocuments.map(doc => `- ${doc}`).join('\n')
      : '- Driver\'s License (front and back)\n- Bank Statements\n- Tax Returns';

    return `
TRINITY FINANCE - Document Upload Required

Dear ${data.firstName},

Thank you for submitting your ${data.loanType} application! To continue processing your application, we need you to upload the following documents:

REQUIRED DOCUMENTS
------------------
${documentsList}

UPLOAD YOUR DOCUMENTS
---------------------
${data.uploadLink}

This secure upload link will expire in 7 days.

Note: All uploads are secure and encrypted. You can upload documents one at a time or all at once.

Questions? Contact us at iq@financetrinity.com

© ${new Date().getFullYear()} Trinity Finance. All rights reserved.
    `.trim();
  }

  /**
   * Send resume link email
   */
  async sendResumeLink(
    recipientEmail: string,
    data: {
      firstName: string;
      loanType: string;
      resumeLink: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: `Resume Your Application - ${data.loanType} - Trinity Finance`,
        html: this.getResumeLinkHTML(data),
        text: this.getResumeLinkText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Resume link email sent successfully:', {
        messageId: info.messageId,
        recipient: recipientEmail,
      });

      return true;
    } catch (error) {
      console.error('Failed to send resume link email:', error);
      return false;
    }
  }

  private getResumeLinkHTML(data: { firstName: string; loanType: string; resumeLink: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume Your Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Resume Your Application</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.firstName},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We saved your progress for the <strong>${data.loanType}</strong> application. You can pick up exactly where you left off by clicking the button below.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.resumeLink}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Resume Application
                </a>
              </div>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 14px;">
                Alternatively, copy and paste this link into your browser:<br>
                <a href="${data.resumeLink}" style="color: #2563eb; word-break: break-all;">${data.resumeLink}</a>
              </p>
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                This link will expire in 30 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Trinity Finance</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getResumeLinkText(data: { firstName: string; loanType: string; resumeLink: string }): string {
    return `
TRINITY FINANCE - Resume Your Application

Dear ${data.firstName},

We saved your progress for the ${data.loanType} application. You can pick up exactly where you left off by using the link below:

${data.resumeLink}

This link will expire in 30 days.

© ${new Date().getFullYear()} Trinity Finance
`.trim();
  }

  /**
   * Send admin invite email with password setup link
   */
  async sendAdminInvite(
    recipientEmail: string,
    data: {
      name: string;
      setupUrl: string;
      invitedBy?: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: 'You\'ve Been Invited to Trinity Finance Admin Portal',
        html: this.getAdminInviteHTML(data),
        text: this.getAdminInviteText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Admin invite email sent successfully:', {
        messageId: info.messageId,
        recipient: recipientEmail,
      });

      return true;
    } catch (error) {
      console.error('Failed to send admin invite email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email for admin invite
   */
  private getAdminInviteHTML(data: { name: string; setupUrl: string; invitedBy?: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #2563eb; border-radius: 50%; position: relative;">
                <span style="color: #ffffff; font-size: 48px; line-height: 80px;">&#128274;</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">You're Invited to Admin Portal</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.name},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You've been invited to join the Trinity Finance Admin Portal${data.invitedBy ? ` by ${data.invitedBy}` : ''}. This portal allows you to manage loan applications, view customer data, and more.
              </p>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to set up your password and activate your account.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.setupUrl}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Set Up My Password
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                <strong>This link will expire in 48 hours.</strong><br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Contact us at <a href="mailto:iq@financetrinity.com" style="color: #2563eb; text-decoration: none;">iq@financetrinity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Trinity Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for admin invite
   */
  private getAdminInviteText(data: { name: string; setupUrl: string; invitedBy?: string }): string {
    return `
TRINITY FINANCE - Admin Portal Invitation

Dear ${data.name},

You've been invited to join the Trinity Finance Admin Portal${data.invitedBy ? ` by ${data.invitedBy}` : ''}. This portal allows you to manage loan applications, view customer data, and more.

SET UP YOUR PASSWORD
--------------------
${data.setupUrl}

This link will expire in 48 hours.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Trinity Finance. All rights reserved.
    `.trim();
  }

  /**
   * Send password reset email to admin
   */
  async sendPasswordResetEmail(
    recipientEmail: string,
    data: {
      name: string;
      resetUrl: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send email.');
      return false;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Trinity Finance';
      const fromEmail = process.env.EMAIL_USER || 'noreply@financetrinity.com';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: 'Reset Your Password - Trinity Finance Admin',
        html: this.getPasswordResetHTML(data),
        text: this.getPasswordResetText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Password reset email sent successfully:', {
        messageId: info.messageId,
        recipient: recipientEmail,
      });

      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email for password reset
   */
  private getPasswordResetHTML(data: { name: string; resetUrl: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 2px solid #2563eb; border-radius: 8px 8px 0 0;">
              <img src="${this.getLogoUrl()}" alt="Trinity Finance Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">Trinity Finance</h1>
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #f59e0b; border-radius: 50%; position: relative;">
                <span style="color: #ffffff; font-size: 48px; line-height: 80px;">&#128273;</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Reset Your Password</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${data.name},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for the Trinity Finance Admin Portal. Click the button below to create a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.resetUrl}" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Reset My Password
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                <strong>This link will expire in 1 hour.</strong><br>
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px; background-color: #fef3c7; border-top: 1px solid #fbbf24;">
              <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                <strong>Security Tip:</strong> Never share this link with anyone. Trinity Finance will never ask for your password via email.
              </p>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Contact us at <a href="mailto:iq@financetrinity.com" style="color: #2563eb; text-decoration: none;">iq@financetrinity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #1f2937; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Trinity Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for password reset
   */
  private getPasswordResetText(data: { name: string; resetUrl: string }): string {
    return `
TRINITY FINANCE - Reset Your Password

Dear ${data.name},

We received a request to reset your password for the Trinity Finance Admin Portal.

RESET YOUR PASSWORD
-------------------
${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Security Tip: Never share this link with anyone. Trinity Finance will never ask for your password via email.

© ${new Date().getFullYear()} Trinity Finance. All rights reserved.
    `.trim();
  }

  /**
   * Verify email configuration is working
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
