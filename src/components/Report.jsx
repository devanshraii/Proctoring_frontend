import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/logs';

// --- Scoring Configuration ---
const DEDUCTION_POINTS = {
  'User Looking Away': 5,
  'No Face Detected': 10,
  'Multiple Faces Detected': 15,
  'Suspicious Item Detected': 20,
  'Drowsiness Detected': 10,
};

const MAX_DEDUCTIONS_PER_EVENT_TYPE = {
  'User Looking Away': 1,       
  'No Face Detected': 1,        
  'Multiple Faces Detected': 1, 
  'Suspicious Item Detected': 2,
  'Drowsiness Detected': 1     
};
// ----------------------------

function Report({ candidateName, interviewTime }) {
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState(100);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = (end.getTime() - start.getTime()) / 1000;
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    return `${minutes}m ${seconds}s`;
  };

  const downloadCSV = () => {
    const header = 'Timestamp,Event\n';
    const csvContent = logs
      .map(log => `${new Date(log.timestamp).toLocaleString()},"${log.event}"`)
      .join('\n');
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-s-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${candidateName.replace(/\s+/g, '_')}_Proctoring_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  useEffect(() => {
    const fetchLogsAndCalculate = async () => {
      try {
        const response = await axios.get(`${API_URL}/${candidateName}`);
        const fetchedLogs = response.data;
        setLogs(fetchedLogs);

        let totalDeductions = 0;
        const eventCounts = {};
        const deductionCounts = {};

        fetchedLogs.forEach(log => {
          let eventType = null;
          if (log.event.startsWith('Suspicious Item Detected')) {
            eventType = 'Suspicious Item Detected';
          } else {
            eventType = log.event;
          }

          // Update summary count for all events
          eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;

          // Update deduction count only if within the cap
          const currentDeductionCount = deductionCounts[eventType] || 0;
          if (DEDUCTION_POINTS[eventType] && currentDeductionCount < MAX_DEDUCTIONS_PER_EVENT_TYPE[eventType]) {
            totalDeductions += DEDUCTION_POINTS[eventType];
            deductionCounts[eventType] = currentDeductionCount + 1;
          }
        });

        setScore(Math.max(0, 100 - totalDeductions));
        setSummary(eventCounts);

      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (candidateName) fetchLogsAndCalculate();
  }, [candidateName]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Generating Report...</div>;
  
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center p-8">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl p-8">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-4xl font-bold">Proctoring Report</h1>
                <p className="text-xl text-gray-400">Candidate: {candidateName}</p>
            </div>
            <button onClick={downloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                Download CSV
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-700 p-6 rounded-lg text-center">
                <h2 className="text-lg font-semibold text-blue-400 mb-2">Integrity Score</h2>
                <p className={`text-6xl font-bold ${scoreColor}`}>{score}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center">
                <h2 className="text-lg font-semibold text-blue-400 mb-2">Interview Duration</h2>
                <p className="text-4xl font-bold">{calculateDuration(interviewTime.start, interviewTime.end)}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-400 mb-2">Total Events Logged</h2>
                <ul className="space-y-1 text-sm">
                    {Object.entries(summary).map(([event, count]) => (
                        <li key={event} className="flex justify-between">
                            <span>{event.replace(' Detected', '')}:</span>
                            <span className="font-bold">{count}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">Detailed Event Log</h2>
          <div className="max-h-64 overflow-y-auto bg-gray-900 p-4 rounded-md">
            {logs.length > 0 ? (
              <table className="w-full text-left">
                <thead><tr className="border-b border-gray-600"><th className="p-2">Timestamp</th><th className="p-2">Event</th></tr></thead>
                <tbody>
                  {logs.map((log) => (<tr key={log._id} className="border-b border-gray-700"><td className="p-2 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td><td className="p-2">{log.event}</td></tr>))}
                </tbody>
              </table>
            ) : <p>No suspicious events were logged.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;