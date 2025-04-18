"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mondaySdk = exports.mondayApi = exports.MondayApi = void 0;
const monday_sdk_js_1 = __importDefault(require("monday-sdk-js"));
exports.mondaySdk = monday_sdk_js_1.default;
// Cache for API responses
const apiCache = {};
/**
 * Monday.com API client with caching support
 */
class MondayApi {
    constructor(token) {
        this.monday = (0, monday_sdk_js_1.default)();
        if (token) {
            this.setToken(token);
        }
    }
    /**
     * Set the API token
     */
    setToken(token) {
        this.token = token;
        this.monday.setToken(token);
    }
    /**
     * Execute a GraphQL query with caching support
     */
    query(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, options = {}) {
            try {
                const cacheKey = query.replace(/\s+/g, '');
                const now = Date.now();
                // Check cache if enabled
                if (options.cacheResults && apiCache[cacheKey] &&
                    now - apiCache[cacheKey].timestamp < (options.cacheDuration || 10000)) {
                    return { data: apiCache[cacheKey].data };
                }
                // Make the API call
                const response = yield this.monday.api(query);
                // Cache the response if enabled
                if (options.cacheResults) {
                    apiCache[cacheKey] = {
                        data: response,
                        timestamp: now
                    };
                }
                return { data: response };
            }
            catch (error) {
                return {
                    error: error.message || 'Unknown error occurred'
                };
            }
        });
    }
    /**
     * Clear the API cache
     */
    clearCache() {
        Object.keys(apiCache).forEach(key => delete apiCache[key]);
    }
}
exports.MondayApi = MondayApi;
// Create a default instance
exports.mondayApi = new MondayApi();
