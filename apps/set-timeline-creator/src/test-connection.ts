import axios from 'axios';
import { config } from './config';

async function testMondayConnection() {
  try {
    const response = await axios.post(
      'https://api.monday.com/v2',
      {
        query: `query { me { name email } }`
      },
      {
        headers: {
          'Authorization': `${config.mondayApiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Connection successful!');
    console.log('Your user info:', response.data.data.me);
    return true;
  } catch (error: any) {
    console.error('Connection failed:', error.response?.data || error.message);
    return false;
  }
}

// Execute the test
testMondayConnection(); 