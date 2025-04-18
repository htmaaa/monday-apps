import React, { useState } from 'react';
import mondaySdk from 'monday-sdk-js';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('No test run yet');
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string>(process.env.REACT_APP_MONDAY_API_TOKEN || '');

  const runMeQuery = async () => {
    try {
      setLoading(true);
      setResult('Testing...');
      
      // Initialize Monday SDK with the token
      const monday = mondaySdk();
      monday.setToken(token);
      
      // Run simple 'me' query to test authentication
      const response = await monday.api(`query { me { name email } }`);
      
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || 'Unknown error'}`);
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const listBoards = async () => {
    try {
      setLoading(true);
      setResult('Fetching boards...');
      
      // Initialize Monday SDK with the token
      const monday = mondaySdk();
      monday.setToken(token);
      
      // Run query to list boards
      const response = await monday.api(`query { boards { id name } }`);
      
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || 'Unknown error'}`);
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-test">
      <h2>Monday.com API Test</h2>
      
      <div className="test-controls">
        <div className="token-input">
          <label>API Token:</label>
          <input 
            type="text" 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Enter your Monday.com API token" 
          />
        </div>
        
        <div className="test-buttons">
          <button 
            onClick={runMeQuery} 
            disabled={loading || !token}
          >
            Test Authentication
          </button>
          
          <button 
            onClick={listBoards} 
            disabled={loading || !token}
          >
            List Boards
          </button>
        </div>
      </div>
      
      <div className="test-result">
        <h3>Result:</h3>
        <pre>{result}</pre>
      </div>
      
      <div className="test-help">
        <h3>Troubleshooting:</h3>
        <ul>
          <li>If you get a 401 or 403 error, your token is invalid or has insufficient permissions</li>
          <li>If you get a success response, copy one of the board IDs to use in your app</li>
          <li>Make sure your token has read and write permissions</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest; 