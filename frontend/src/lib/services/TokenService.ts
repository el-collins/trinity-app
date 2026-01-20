import jwt from 'jsonwebtoken';
const SECRET = process.env.DOCUMENT_UPLOAD_TOKEN_SECRET!;
export class TokenService {
  static generateUploadToken(applicationId: string, email: string): string {
    return jwt.sign(
      { applicationId, email, type: 'document_upload' },
      SECRET,
      { expiresIn: '7d' }
    );
  }
  static validateToken(token: string): { applicationId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, SECRET) as any;
      if (decoded.type !== 'document_upload') return null;
      return { applicationId: decoded.applicationId, email: decoded.email };
    } catch {
      return null;
    }
  }
}