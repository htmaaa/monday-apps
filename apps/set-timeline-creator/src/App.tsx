import React from 'react';
import './App.css';
import MondayApp from './components/MondayApp';
import ApiTest from './components/ApiTest';
import { useState } from 'react';

function App() {
  const [showApiTest, setShowApiTest] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>S-E-T!</h1>
        <button 
          className="toggle-button" 
          onClick={() => setShowApiTest(!showApiTest)}
        >
          {showApiTest ? 'Show Timeline Creator' : 'Show API Test'}
        </button>
      </header>
      <main>
        {showApiTest ? <ApiTest /> : <MondayApp />}
      </main>
    </div>
  );
}

export default App;
