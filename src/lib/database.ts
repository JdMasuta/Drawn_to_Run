// Database connection utilities using Netlify Neon integration
import { neon } from '@netlify/neon';

// Get the database URL from environment variables
const getDatabaseUrl = (): string => {
  // In Netlify Functions, use NETLIFY_DATABASE_URL
  if (typeof process !== 'undefined' && process.env?.NETLIFY_DATABASE_URL) {
    return process.env.NETLIFY_DATABASE_URL;
  }
  
  // In development, use DATABASE_URL
  if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error('Database URL not found in environment variables');
};

// Create database connection
export const sql = neon(getDatabaseUrl());

// Database utility functions
export class Database {
  // Execute a query with parameters
  static async query<T = any>(
    text: string, 
    params: any[] = []
  ): Promise<T[]> {
    try {
      const result = await sql(text, params);
      return result as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Execute a single query and return first result
  static async queryOne<T = any>(
    text: string, 
    params: any[] = []
  ): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results[0] || null;
  }

  // Execute multiple queries in a transaction
  static async transaction<T>(
    queries: Array<{ text: string; params?: any[] }>
  ): Promise<T[]> {
    try {
      // Note: Neon doesn't support traditional transactions through the HTTP interface
      // For now, we'll execute queries sequentially
      // In production, consider using a connection pooler for true transactions
      const results: T[] = [];
      
      for (const query of queries) {
        const result = await this.query<T>(query.text, query.params || []);
        results.push(result as T);
      }
      
      return results;
    } catch (error) {
      console.error('Database transaction error:', error);
      throw error;
    }
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Get database version info
  static async getVersion(): Promise<string> {
    try {
      const result = await this.queryOne<{ version: string }>('SELECT version()');
      return result?.version || 'Unknown';
    } catch (error) {
      console.error('Failed to get database version:', error);
      throw error;
    }
  }
}

// Export connection for direct use if needed
export default Database;