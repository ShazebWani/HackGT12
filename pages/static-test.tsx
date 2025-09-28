export default function StaticTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Static API Test</h1>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre>This is a static test page. The API call should work from the browser console.</pre>
        <p className="mt-2">Open browser console and run:</p>
        <code className="block mt-2 p-2 bg-gray-200 rounded">
          {`fetch('http://localhost:8000/api/patients').then(r => r.json()).then(console.log)`}
        </code>
      </div>
    </div>
  );
}
