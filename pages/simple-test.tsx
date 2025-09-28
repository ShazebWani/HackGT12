import { useState, useEffect } from 'react';

export default function SimpleTest() {
  const [result, setResult] = useState<string>('Not tested yet');

  const testAPI = async () => {
    try {
      setResult('Testing API...');
      console.log('Making API call...');
      const response = await fetch('http://localhost:8000/api/patients');
      console.log('Response received:', response);
      const data = await response.json();
      console.log('Data received:', data);
      setResult(`Success! Found ${data.length} patients: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('API call failed:', error);
      setResult(`Error: ${error}`);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (result === 'Not tested yet' || result === 'Testing API...') {
        setResult('Request timed out - API call may be hanging');
      }
    }, 5000);

    testAPI();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
      <button 
        onClick={testAPI}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test API
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre>{result}</pre>
      </div>
    </div>
  );
}
