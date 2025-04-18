import mondaySdk from 'monday-sdk-js';

// Type definitions
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface ApiOptions {
  cacheResults?: boolean;
  cacheDuration?: number;
}

// Cache for API responses
const apiCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Monday.com API client with caching support
 */
export class MondayApi {
  private monday = mondaySdk();
  private token?: string;
  
  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }
  
  /**
   * Set the API token
   */
  setToken(token: string): void {
    this.token = token;
    this.monday.setToken(token);
  }
  
  /**
   * Execute a GraphQL query with caching support
   */
  async query<T = any>(
    query: string, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const cacheKey = query.replace(/\s+/g, '');
      const now = Date.now();
      
      // Check cache if enabled
      if (options.cacheResults && apiCache[cacheKey] && 
          now - apiCache[cacheKey].timestamp < (options.cacheDuration || 10000)) {
        return { data: apiCache[cacheKey].data };
      }
      
      // Make the API call
      const response = await this.monday.api(query);
      
      // Cache the response if enabled
      if (options.cacheResults) {
        apiCache[cacheKey] = {
          data: response,
          timestamp: now
        };
      }
      
      return { data: response };
    } catch (error: any) {
      return { 
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Clear the API cache
   */
  clearCache(): void {
    Object.keys(apiCache).forEach(key => delete apiCache[key]);
  }
}

// Create a default instance
export const mondayApi = new MondayApi();

// Export the Monday SDK for direct usage
export { mondaySdk }; 