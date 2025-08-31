// my-monorepo/subprojects/ai-tools/src/App.js
import React from 'react';
import './App.css';
import AIToolsTable from './components/AIToolsTable'; // Ensure this path is correct

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Tools Dashboard</h1>
      </header>
      <main>
        <AIToolsTable />
      </main>
    </div>
  );
}

export default App;
