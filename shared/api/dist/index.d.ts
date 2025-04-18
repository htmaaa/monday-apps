import mondaySdk from 'monday-sdk-js';
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
}
export interface ApiOptions {
    cacheResults?: boolean;
    cacheDuration?: number;
}
/**
 * Monday.com API client with caching support
 */
export declare class MondayApi {
    private monday;
    private token?;
    constructor(token?: string);
    /**
     * Set the API token
     */
    setToken(token: string): void;
    /**
     * Execute a GraphQL query with caching support
     */
    query<T = any>(query: string, options?: ApiOptions): Promise<ApiResponse<T>>;
    /**
     * Clear the API cache
     */
    clearCache(): void;
}
export declare const mondayApi: MondayApi;
export { mondaySdk };
