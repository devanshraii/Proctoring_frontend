import React, { useState, useRef } from 'react';
import Proctoring from './components/Proctoring';
import Report from './components/Report';

function App() {
  const [candidateName, setCandidateName] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [viewReport, setViewReport] = useState(false);
  const interviewTime = useRef({ start: null, end: null });

  const startInterview = () => {
    if (candidateName.trim()) {
      interviewTime.current.start = new Date();
      setInterviewStarted(true);
    }
  };

  const handleShowReport = () => {
    interviewTime.current.end = new Date();
    setInterviewStarted(false);
    setViewReport(true);
  };

  if (viewReport) {
    return <Report candidateName={candidateName} interviewTime={interviewTime.current} />;
  }

  if (interviewStarted) {
    return <Proctoring candidateName={candidateName} onShowReport={handleShowReport} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-6">Online Proctoring System</h1>
        <p className="mb-6 text-gray-400">Enter your full name to begin the interview.</p>
        <input
          type="text"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          placeholder="Enter Your Full Name"
          className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={startInterview}
          disabled={!candidateName.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}

export default App;