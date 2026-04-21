import { default as ReactECharts } from "echarts-for-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router";

const BASE_API = "https://solve-stock-market.vercel.app";

export default function TradeOneSightChart() {
  const { date } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const start = parseInt(searchParams.get("start") ?? "0", 10);
  const end = parseInt(searchParams.get("end") ?? "10", 10);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candle, setCandle] = useState([]);
  const [yAxis, setYAxis] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [sliceStart, setSliceStart] = useState(start);
  const [sliceEnd, setSliceEnd] = useState(end);
  const [inputStart, setInputStart] = useState(String(start));
  const [inputEnd, setInputEnd] = useState(String(end));

  const updateCandle = useCallback((rawData, s, e) => {
    const sliced = rawData.slice(s, e);
    const arr = sliced.map((stock) => ({
      name: stock.stockName || stock.stockSymbol,
      type: "line",
      smooth: true,
      data: stock.stock_list?.map((item) => item.percentage),
      lineStyle: { width: 2 },
      symbol: "circle",
      symbolSize: 4,
    }));
    setCandle(arr);
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`${BASE_API}/api/trade-one-sight/initialDraft-chart-v1/${date}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        setTotalCount(json.candleBar?.length ?? 0);
        updateCandle(json.candleBar, sliceStart, sliceEnd);
        setYAxis(json.yAxis ?? []);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [date]);

  // Re-slice when sliceStart / sliceEnd changes after initial load
  useEffect(() => {
    if (!data) return;
    updateCandle(data.candleBar, sliceStart, sliceEnd);
  }, [sliceStart, sliceEnd, data, updateCandle]);

  const applySlice = () => {
    const s = Math.max(0, parseInt(inputStart, 10) || 0);
    const e = Math.max(s + 1, parseInt(inputEnd, 10) || 10);
    setSliceStart(s);
    setSliceEnd(e);
    setSearchParams({ start: String(s), end: String(e) });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") applySlice();
  };

  const option = {
    backgroundColor: "transparent",
    title: {
      text: "Stock Performance",
      subtext: date ? `Date: ${date}` : "",
      left: "2%",
      top: "2%",
      textStyle: {
        color: "#e2e8f0",
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "'DM Mono', monospace",
      },
      subtextStyle: {
        color: "#64748b",
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0f172a",
      borderColor: "#1e293b",
      borderWidth: 1,
      textStyle: {
        color: "#e2e8f0",
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
      },
    },
    legend: {
      top: "8%",
      left: "2%",
      textStyle: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
      },
      icon: "roundRect",
      itemWidth: 14,
      itemHeight: 4,
    },
    toolbox: {
      show: true,
      right: "2%",
      top: "2%",
      iconStyle: { borderColor: "#475569" },
      emphasis: { iconStyle: { borderColor: "#38bdf8" } },
      feature: {
        dataZoom: {
          yAxisIndex: "none",
          title: { zoom: "Zoom", back: "Reset" },
        },
        dataView: { readOnly: false, title: "Data View" },
        magicType: {
          type: ["line", "bar"],
          title: { line: "Line", bar: "Bar" },
        },
        restore: { title: "Restore" },
        saveAsImage: { title: "Save" },
      },
    },
    grid: {
      left: "3%",
      right: "3%",
      bottom: "12%",
      top: "22%",
      containLabel: true,
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        bottom: "3%",
        height: 20,
        borderColor: "#1e293b",
        backgroundColor: "#0f172a",
        fillerColor: "rgba(56,189,248,0.08)",
        handleStyle: { color: "#38bdf8" },
        textStyle: { color: "#64748b" },
      },
    ],
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: yAxis,
      axisLine: { lineStyle: { color: "#1e293b" } },
      axisLabel: {
        color: "#475569",
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        rotate: 30,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}%",
        color: "#475569",
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
      },
      axisLine: { lineStyle: { color: "#1e293b" } },
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
    },
    series: candle,
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "linear-gradient(135deg, #020817 0%, #0a1628 50%, #020817 100%)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');`}</style>

      {/* Header */}
      <div
        className="border-b px-8 py-5 flex items-center justify-between"
        style={{ borderColor: "#1e293b" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-2 h-8 rounded-full"
            style={{ background: "linear-gradient(180deg, #38bdf8, #0ea5e9)" }}
          />
          <div>
            <h1
              className="text-lg font-medium tracking-widest uppercase"
              style={{ color: "#e2e8f0", letterSpacing: "0.2em" }}
            >
              Trade One Sight
            </h1>
            <p className="text-xs tracking-widest" style={{ color: "#475569" }}>
              {date ? `CHART · ${date}` : "MARKET ANALYSIS"}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-widest"
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            color: "#64748b",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#22d3ee" }}
          />
          {loading
            ? "FETCHING"
            : error
              ? "ERROR"
              : `${candle.length} SERIES LOADED`}
        </div>
      </div>

      {/* Controls Bar */}
      <div
        className="px-8 py-4 flex flex-wrap items-center gap-6"
        style={{
          borderBottom: "1px solid #1e293b",
          background: "rgba(15,23,42,0.5)",
        }}
      >
        <span className="text-xs tracking-widest" style={{ color: "#475569" }}>
          SLICE RANGE
        </span>

        <div className="flex items-center gap-3">
          <label className="text-xs" style={{ color: "#64748b" }}>
            FROM
          </label>
          <input
            type="number"
            min={0}
            value={inputStart}
            onChange={(e) => setInputStart(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-20 px-3 py-1.5 rounded text-xs text-center outline-none"
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              color: "#e2e8f0",
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <label className="text-xs" style={{ color: "#64748b" }}>
            TO
          </label>
          <input
            type="number"
            min={1}
            value={inputEnd}
            onChange={(e) => setInputEnd(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-20 px-3 py-1.5 rounded text-xs text-center outline-none"
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              color: "#e2e8f0",
              fontFamily: "'DM Mono', monospace",
            }}
          />
          <button
            onClick={applySlice}
            className="px-5 py-1.5 rounded text-xs tracking-widest uppercase transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              color: "#020817",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Apply
          </button>
        </div>

        {totalCount > 0 && (
          <span className="text-xs ml-auto" style={{ color: "#334155" }}>
            {sliceStart}–{Math.min(sliceEnd, totalCount)} of {totalCount} stocks
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-12 h-12">
              <div
                className="absolute inset-0 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "transparent",
                  borderTopColor: "#38bdf8",
                }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "transparent",
                  borderTopColor: "#0ea5e9",
                  animationDirection: "reverse",
                  animationDuration: "0.6s",
                }}
              />
            </div>
            <p className="text-xs tracking-widest" style={{ color: "#334155" }}>
              LOADING MARKET DATA
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="flex items-center gap-4 px-6 py-5 rounded-lg max-w-lg mx-auto mt-20"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              ✕
            </div>
            <div>
              <p
                className="text-xs font-medium tracking-widest uppercase mb-1"
                style={{ color: "#ef4444" }}
              >
                Request Failed
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {data && !loading && !error && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid #1e293b",
              background: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Chart stats row */}
            <div
              className="px-6 py-3 flex items-center gap-8 border-b"
              style={{ borderColor: "#1e293b" }}
            >
              {[
                { label: "SERIES", value: candle.length },
                { label: "X POINTS", value: yAxis.length },
                { label: "RANGE", value: `${sliceStart} – ${sliceEnd}` },
                { label: "DATE", value: date ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p
                    className="text-xs mb-0.5"
                    style={{ color: "#334155", letterSpacing: "0.15em" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: "#94a3b8",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <ReactECharts
              option={option}
              style={{ height: 600, width: "100%" }}
              theme="dark"
              opts={{ renderer: "canvas" }}
            />
          </div>
        )}

        {/* Empty — no date */}
        {!date && !loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="text-3xl" style={{ opacity: 0.15 }}>
              ◈
            </div>
            <p className="text-xs tracking-widest" style={{ color: "#334155" }}>
              NO DATE PARAM IN URL
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
