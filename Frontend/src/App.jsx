import './index.css'
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-green-600">
          Tailwind CSS Working!
        </h1>

        <p className="text-gray-600 mt-4">
          React + Vite + Tailwind CSS
        </p>

        <button className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default App