import { google, sheets_v4 } from 'googleapis';

interface SpreadsheetData {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private drive: ReturnType<typeof google.drive> | null = null;
  private jwtClient: InstanceType<typeof google.auth.JWT> | null = null;

  private getJwtClient() {
    if (!this.jwtClient) {
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)?.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

      if (!clientEmail || !privateKey) {
        throw new Error('Google Service Account credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables.');
      }

      console.log('[GoogleSheets] Using service account:', clientEmail);

      this.jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
    }
    return this.jwtClient;
  }

  private async getSheetsClient(): Promise<sheets_v4.Sheets> {
    if (!this.sheets) {
      const auth = this.getJwtClient();
      try {
        const tokens = await auth.authorize();
        console.log('[GoogleSheets] JWT authorized successfully, token type:', tokens.token_type);
      } catch (authError) {
        console.error('[GoogleSheets] JWT authorize failed:', authError);
        throw authError;
      }
      this.sheets = google.sheets({ version: 'v4', auth });
    }
    return this.sheets;
  }

  private async getDriveClient() {
    if (!this.drive) {
      const auth = this.getJwtClient();
      await auth.authorize();
      this.drive = google.drive({ version: 'v3', auth });
    }
    return this.drive;
  }

  /**
   * Create a new Google Spreadsheet and populate it with data
   */
  /**
   * Create a new Google Spreadsheet and populate it with data
   */
  async createSpreadsheet(data: SpreadsheetData): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const sheets = await this.getSheetsClient();
    const drive = await this.getDriveClient();

    // Verify Drive API access first
    try {
      await drive.files.list({ pageSize: 1 });
    } catch (error: any) {
      console.error('[GoogleSheets] Drive API check failed:', error);
      if (error.code === 403) {
        throw new Error('Google Drive API is not enabled. Please enable "Google Drive API" in the Google Cloud Console for project: trinityiq');
      }
      throw error;
    }

    // Create the spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: data.title,
        },
        sheets: [
          {
            properties: {
              title: 'Applications',
              gridProperties: {
                frozenRowCount: 1, // Freeze header row
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;

    if (!spreadsheetId || !spreadsheetUrl) {
      throw new Error('Failed to create spreadsheet');
    }

    // Prepare values (headers + data rows)
    const values = [data.headers, ...data.rows];

    // Update the spreadsheet with data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Applications!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    // Apply formatting
    await this.applyFormatting(spreadsheetId, data.headers.length, data.rows.length);

    // Make the spreadsheet publicly accessible (anyone with link can view)
    await this.makePublic(spreadsheetId);

    return { spreadsheetId, spreadsheetUrl };
  }

  /**
   * Apply formatting to the spreadsheet (header styling, column widths, etc.)
   */
  private async applyFormatting(spreadsheetId: string, columnCount: number, rowCount: number) {
    const sheets = await this.getSheetsClient();

    const requests: sheets_v4.Schema$Request[] = [
      // Format header row with bold text and background color
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: columnCount,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.145, green: 0.388, blue: 0.922 }, // Blue-600
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
              },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      },
      // Auto-resize columns to fit content
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: columnCount,
          },
        },
      },
      // Set minimum column width
      {
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: columnCount,
          },
          properties: {
            pixelSize: 120,
          },
          fields: 'pixelSize',
        },
      },
      // Add alternating row colors for better readability
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [
              {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: rowCount + 1,
                startColumnIndex: 0,
                endColumnIndex: columnCount,
              },
            ],
            booleanRule: {
              condition: {
                type: 'CUSTOM_FORMULA',
                values: [{ userEnteredValue: '=MOD(ROW(),2)=0' }],
              },
              format: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
              },
            },
          },
          index: 0,
        },
      },
      // Add borders to all cells
      {
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: rowCount + 1,
            startColumnIndex: 0,
            endColumnIndex: columnCount,
          },
          top: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
          bottom: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
          left: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
          right: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
          innerHorizontal: { style: 'SOLID', color: { red: 0.9, green: 0.9, blue: 0.9 } },
          innerVertical: { style: 'SOLID', color: { red: 0.9, green: 0.9, blue: 0.9 } },
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  /**
   * Make the spreadsheet publicly accessible (anyone with the link can view)
   */
  private async makePublic(spreadsheetId: string) {
    const drive = await this.getDriveClient();

    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  /**
   * Check if Google Sheets integration is configured
   * Uses Google-specific credentials or falls back to Firebase credentials
   */
  isConfigured(): boolean {
    const hasGoogleCreds = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    );
    return hasGoogleCreds;
  }
}

export const googleSheetsService = new GoogleSheetsService();
