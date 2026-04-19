import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router";

const BASE_API = "https://solve-stock-market.vercel.app";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSlotTime(slotKey) {
  const parts = slotKey.split("-");
  if (parts.length >= 5) return `${parts[3]}:${parts[4]}`;
  return slotKey;
}

function formatDate(dateParam) {
  const parts = dateParam.split("-");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return dateParam;
}

function pct(open, close) {
  if (!open) return 0;
  return (((close - open) / open) * 100).toFixed(2);
}

function fmt(n) {
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtVol(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) {
    return <span className="ml-1 text-slate-600 text-[10px]">⇅</span>;
  }
  return (
    <span
      className={`ml-1 text-[10px] ${sortDir === "asc" ? "text-sky-400" : "text-sky-400"}`}
    >
      {sortDir === "asc" ? "▲" : "▼"}
    </span>
  );
}

// ─── Stock Table ──────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "stockName", label: "Stock", align: "left" },
  { key: "open", label: "Open", align: "right" },
  { key: "high", label: "High", align: "right" },
  { key: "low", label: "Low", align: "right" },
  { key: "close", label: "Close", align: "right" },
  { key: "change", label: "Chg %", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
];

function StockTable({ stocks }) {
  const [sortCol, setSortCol] = useState("change");
  const [sortDir, setSortDir] = useState("desc");

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let av, bv;
      if (sortCol === "change") {
        av = parseFloat(pct(a.open, a.close));
        bv = parseFloat(pct(b.open, b.close));
      } else if (sortCol === "stockName") {
        av = a.stockName;
        bv = b.stockName;
      } else {
        av = a[sortCol] ?? 0;
        bv = b[sortCol] ?? 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [stocks, sortCol, sortDir]);

  if (stocks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        No stocks match your search.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      {/* Scrollable wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          {/* Head */}
          <thead>
            <tr className="bg-slate-800/80">
              <th className="px-3 py-2 text-left w-8">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  #
                </span>
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2 cursor-pointer select-none group
                    text-[11px] font-semibold uppercase tracking-widest text-slate-500
                    hover:text-slate-300 transition-colors
                    ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.label}
                  <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sorted.map((stock, i) => {
              const change = pct(stock.open, stock.close);
              const isUp = parseFloat(change) >= 0;

              return (
                <tr
                  key={`${stock.stockSymbol}-${i}`}
                  className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors duration-100"
                  style={{
                    animation: "fadeIn 0.2s ease both",
                    animationDelay: `${i * 15}ms`,
                  }}
                >
                  {/* Row number */}
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 tabular-nums">
                    {i + 1}
                  </td>

                  {/* Stock name + symbol */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Color bar */}
                      <div
                        className={`w-0.5 h-7 rounded-full shrink-0 ${isUp ? "bg-emerald-400" : "bg-red-400"}`}
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-none leading-tight">
                          {stock.stockName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {stock.stockSymbol}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Open */}
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-slate-400">
                    ₹{fmt(stock.open)}
                  </td>

                  {/* High */}
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-emerald-400/80">
                    ₹{fmt(stock.high)}
                  </td>

                  {/* Low */}
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-red-400/80">
                    ₹{fmt(stock.low)}
                  </td>

                  {/* Close */}
                  <td
                    className={`px-3 py-2.5 text-right text-[13px] font-bold tabular-nums ${isUp ? "text-emerald-300" : "text-red-300"}`}
                  >
                    ₹{fmt(stock.close)}
                  </td>

                  {/* Change % */}
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums
                      ${isUp ? "bg-emerald-500/12 text-emerald-400" : "bg-red-500/12 text-red-400"}`}
                    >
                      {isUp ? "▲" : "▼"} {Math.abs(change)}%
                    </span>
                  </td>

                  {/* Volume */}
                  <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-slate-400">
                    {fmtVol(stock.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Time Slot Tab ────────────────────────────────────────────────────────────

function TimeTab({ slotKey, stocks, isActive, onClick, tabRef }) {
  const time = formatSlotTime(slotKey);
  const gainers = stocks.filter(
    (s) => parseFloat(pct(s.open, s.close)) >= 0,
  ).length;
  const losers = stocks.length - gainers;
  const majority = gainers >= losers ? "up" : "down";

  return (
    <button
      ref={tabRef}
      onClick={onClick}
      className={`relative shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 border focus:outline-none
        ${
          isActive
            ? "bg-sky-500/15 border-sky-400/50 shadow-[0_0_14px_rgba(56,189,248,0.18)]"
            : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
        }`}
    >
      {isActive && (
        <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
      )}
      <span
        className={`text-sm font-black tabular-nums tracking-tight ${isActive ? "text-sky-200" : "text-slate-400"}`}
      >
        {time}
      </span>
      <div className="flex items-center gap-1">
        <span
          className={`text-[9px] font-bold ${majority === "up" ? "text-emerald-400" : "text-slate-600"}`}
        >
          ▲{gainers}
        </span>
        <span
          className={`text-[9px] font-bold ${majority === "down" ? "text-red-400" : "text-slate-600"}`}
        >
          ▼{losers}
        </span>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TradeOneSight() {
  const { date } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [search, setSearch] = useState("");
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    setData(null);
    setActiveSlot(null);

    fetch(`${BASE_API}/api/trade-one-sight/initialDraft-v1/${date}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        const first = Object.keys(json)[0];
        if (first) setActiveSlot(first);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSlot]);

  const slots = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([key, stocks]) => ({ key, stocks }));
  }, [data]);

  const activeStocks = useMemo(() => {
    if (!data || !activeSlot) return [];
    const raw = data[activeSlot] || [];
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      (s) =>
        s.stockName.toLowerCase().includes(q) ||
        s.stockSymbol.toLowerCase().includes(q),
    );
  }, [data, activeSlot, search]);

  const totalStocks = useMemo(
    () => slots.reduce((a, { stocks }) => a + stocks.length, 0),
    [slots],
  );
  const overallGainers = useMemo(
    () =>
      slots.reduce(
        (a, { stocks }) =>
          a +
          stocks.filter((s) => parseFloat(pct(s.open, s.close)) >= 0).length,
        0,
      ),
    [slots],
  );
  const activeGainers = activeStocks.filter(
    (s) => parseFloat(pct(s.open, s.close)) >= 0,
  ).length;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tabs-scroll::-webkit-scrollbar { height: 3px; }
        .tabs-scroll::-webkit-scrollbar-track { background: transparent; }
        .tabs-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .table-scroll::-webkit-scrollbar { height: 4px; }
        .table-scroll::-webkit-scrollbar-track { background: transparent; }
        .table-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      <div className="min-h-screen bg-[#0a0d14] text-slate-100">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0a0d14]/95 backdrop-blur-md">
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-400">
                  Intraday Feed
                </span>
              </div>
              <p className="text-lg font-black text-slate-100 truncate">
                {date ? formatDate(date) : "—"}
              </p>
            </div>

            {data && !loading && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {[
                  {
                    label: `${slots.length} slots`,
                    cls: "bg-slate-800 border-slate-700 text-slate-300",
                  },
                  {
                    label: `${totalStocks} signals`,
                    cls: "bg-slate-800 border-slate-700 text-slate-300",
                  },
                  {
                    label: `▲ ${overallGainers}`,
                    cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                  },
                  {
                    label: `▼ ${totalStocks - overallGainers}`,
                    cls: "bg-red-500/10 border-red-500/30 text-red-400",
                  },
                ].map(({ label, cls }) => (
                  <span
                    key={label}
                    className={`px-2 py-0.5 rounded-full border font-bold ${cls}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
              <p className="text-slate-500 text-sm">Fetching market data…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300 text-sm">
              <p className="font-bold mb-1">Failed to load data</p>
              <p className="font-mono text-xs text-red-400/70">{error}</p>
            </div>
          )}

          {/* Data */}
          {data && !loading && (
            <>
              {/* ── Time tabs ── */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-2">
                <div
                  ref={tabsRef}
                  className="tabs-scroll flex gap-2 overflow-x-auto pb-0.5"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {slots.map(({ key, stocks }) => (
                    <TimeTab
                      key={key}
                      slotKey={key}
                      stocks={stocks}
                      isActive={activeSlot === key}
                      tabRef={activeSlot === key ? activeTabRef : null}
                      onClick={() => {
                        setActiveSlot(key);
                        setSearch("");
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── Table panel ── */}
              {activeSlot && (
                <div
                  key={activeSlot}
                  style={{ animation: "fadeSlideUp 0.22s ease both" }}
                >
                  {/* Info + search row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 px-0.5">
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
                        <span className="text-base font-black text-slate-100">
                          {formatSlotTime(activeSlot)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {activeStocks.length} stocks
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        ▲ {activeGainers}
                      </span>
                      <span className="text-xs font-bold text-red-400">
                        ▼ {activeStocks.length - activeGainers}
                      </span>
                    </div>

                    <div className="relative w-full sm:w-52">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                        ⌕
                      </span>
                      <input
                        type="text"
                        placeholder="Search stocks…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <StockTable stocks={activeStocks} />

                  {/* Row count footer */}
                  {activeStocks.length > 0 && (
                    <p className="text-right text-[10px] text-slate-600 mt-2 pr-1">
                      {activeStocks.length} rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
