import TradingChart from './components/TradingChart';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Market Data Visualization
        </h1>
        <p className="text-gray-400 mb-6">
          Price with SMA 5 and SMA 10 -
          <span className="text-green-500"> Green</span> when SMA5 &gt; SMA10,
          <span className="text-red-500"> Red</span> otherwise
        </p>
        <div className="bg-gray-800 rounded-lg p-4">
          <TradingChart />
        </div>
      </div>
    </main>
  );
}