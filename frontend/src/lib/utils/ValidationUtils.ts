/**
 * Validation utilities for form data
 */

export class ValidationUtils {
  /**
   * Validate EIN format (XX-XXXXXXX)
   */
  static validateEIN(ein: string): boolean {
    const pattern = /^\d{2}-\d{7}$/;
    return pattern.test(ein);
  }
  
  /**
   * Validate SSN format (XXX-XX-XXXX)
   */
  static validateSSN(ssn: string): boolean {
    const pattern = /^\d{3}-\d{2}-\d{4}$/;
    return pattern.test(ssn);
  }
  
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }
  
  /**
   * Validate phone format
   */
  static validatePhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Must be 10 digits
    return digits.length === 10;
  }
  
  /**
   * Validate currency value
   */
  static validateCurrency(value: any): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }
  
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
  
  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
  /**
   * Format date for display
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  
  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
  
  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
