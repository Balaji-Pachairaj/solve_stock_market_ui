import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";

const BASE_API = "https://solve-stock-market.vercel.app";

const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : "–");
const sign = (n) => (Number(n) >= 0 ? `+${fmt(n)}` : fmt(n));
const pad = (v) => String(v).padStart(2, "0");

function TimeCircle({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 transition-all duration-200 cursor-pointer flex-shrink-0
        ${
          active
            ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-300 scale-105"
            : "bg-white border-gray-200 text-violet-600 hover:border-violet-400 hover:shadow-md hover:-translate-y-1"
        }`}
    >
      <span className="font-mono font-bold text-sm sm:text-base leading-tight">
        {pad(item.hour)}:{pad(item.minute)}
      </span>
      <span
        className={`text-[10px] sm:text-xs mt-1 ${active ? "text-violet-200" : "text-gray-400"}`}
      >
        {item.date}
      </span>
    </button>
  );
}

function GapBadge({ type }) {
  if (!type) return null;
  const up = type === "GAP_UP";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold tracking-wide text-white ${up ? "bg-green-500" : "bg-red-500"}`}
    >
      {up ? "Gap Up" : "Gap Down"}
    </span>
  );
}

function StockRow({ stock, index }) {
  const pos = Number(stock.movement) >= 0;
  const gapPos = Number(stock.gapPercent) >= 0;
  const rankColors = [
    "text-violet-600",
    "text-fuchsia-500",
    "text-indigo-500",
    "text-purple-500",
    "text-blue-500",
  ];
  const rankColor = rankColors[index] ?? "text-violet-400";

  return (
    <tr
      className={`border-b border-gray-100 transition-colors hover:bg-violet-50 ${index % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
    >
      <td className="px-4 py-3 w-16">
        <span className={`font-mono font-bold text-sm ${rankColor}`}>
          {stock.rank ?? index + 1}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[200px]">
        <div className="leading-tight">{stock.name ?? stock.symbol}</div>
        <div className="text-xs text-gray-400 font-normal mt-0.5">
          {stock.symbol}
        </div>
      </td>
      <td
        className={`px-4 py-3 font-mono text-sm font-semibold ${pos ? "text-green-600" : "text-red-500"}`}
      >
        {sign(stock.movement)}
      </td>
      <td
        className={`px-4 py-3 font-mono text-sm font-semibold ${pos ? "text-green-600" : "text-red-500"}`}
      >
        {sign(stock.percentage)}%
      </td>
      <td className="px-4 py-3">
        <GapBadge type={stock.gapType} />
      </td>
      <td
        className={`px-4 py-3 font-mono text-sm font-semibold ${gapPos ? "text-green-600" : "text-red-500"}`}
      >
        {sign(stock.gapPercent)}%
      </td>
      <td
        className={`px-4 py-3 font-mono text-sm font-semibold flex flex-row  text-black gap-2`}
      >
        {stock?.previous_rank}

        <p
          className={`p-2 border-2 rounded-[50%] w-8 h-8  ${stock?.previous_rank > stock?.rank ? "text-green-600" : "text-red-500"}  flex flex-row justify-center items-align`}
        >
          {Math.abs(stock?.rank - stock?.previous_rank)}
        </p>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { date } = useParams();
  const [snapshots, setSnapshots] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_API}/api/get-intraday/get/${date}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : [json];
      setSnapshots(arr);
      setActiveIdx(0);
    } catch (e) {
      console.log(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSnapshot = snapshots[activeIdx] ?? null;
  const stocks = activeSnapshot?.data ?? [];
  const displayDate = date ? date.split("-").join(" - ") : "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6 h-14 shadow-sm">
        <span className="font-bold text-gray-900 text-base flex-1 tracking-tight">
          Solve Stock Market
        </span>
        <button
          onClick={() => {
            navigate("/set-up-intraday");
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-pink-400 text-pink-500 text-sm font-semibold hover:bg-pink-400 hover:text-white transition-colors"
        >
          <span className="text-base leading-none">＋</span>
          <span className="hidden sm:inline">Set up Intraday</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm border border-gray-200">
            👤
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs font-semibold text-gray-800">
              Admin User Name
            </span>
            <span className="text-xs text-red-500 cursor-pointer hover:underline">
              Logout
            </span>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-12 sm:w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 flex-shrink-0">
          <button className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-lg hover:bg-violet-200 transition-colors">
            ⊞
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-5 sm:p-7 overflow-x-hidden">
          {/* Page header */}
          <div className="flex items-center gap-2.5 mb-7">
            <span className="text-xl">📄</span>
            <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
              Date — {displayDate}
            </h1>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
              <div className="w-9 h-9 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-sm">Loading intraday data…</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center gap-3 py-20 text-red-400">
              <p className="text-sm">⚠ {error}</p>
              <button
                onClick={fetchData}
                className="px-5 py-2 rounded-lg border border-red-400 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Time circles */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-8">
                {snapshots.map((snap, i) => (
                  <TimeCircle
                    key={i}
                    item={snap}
                    active={i === activeIdx}
                    onClick={() => setActiveIdx(i)}
                    index={i}
                  />
                ))}
              </div>

              {/* Stock table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {stocks.length === 0 ? (
                  <p className="text-center text-gray-400 py-12 text-sm">
                    No stocks in this snapshot.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-violet-50 border-b border-violet-100">
                          {[
                            "Rank",
                            "Stock Name",
                            "Movement",
                            "Percentage",
                            "Gap",
                            "Gap %",
                            "Previous Intraday Rank",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((s, i) => (
                          <StockRow key={s.symbol ?? i} stock={s} index={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
