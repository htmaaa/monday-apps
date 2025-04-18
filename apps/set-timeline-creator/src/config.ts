import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration object
export const config = {
  mondayApiToken: process.env.MONDAY_API_TOKEN,
};

// Validate required environment variables
if (!config.mondayApiToken) {
  throw new Error('MONDAY_API_TOKEN is required in environment variables');
}

// Use the token in your API calls
const token = config.mondayApiToken; 