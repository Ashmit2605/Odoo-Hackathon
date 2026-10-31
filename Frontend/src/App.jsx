
function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Tailwind CSS Test
        </h1>

        <p className="text-gray-600 mb-6">
          If you see a styled card, Tailwind CSS is working!
        </p>

        <button
          className="bg-blue-600 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
          onClick={() => alert("Tailwind CSS is working!")}
        >
          Test Button
        </button>

        <div className="mt-6 bg-green-100 text-green-700 p-3 rounded-lg font-medium">
          Setup Successful!
        </div>
      </div>
    </div>
  );
}

export default App;
