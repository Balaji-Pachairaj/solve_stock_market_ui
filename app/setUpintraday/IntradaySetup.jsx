import { useState, useEffect, useRef } from "react";

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

function ParticleCanvas({ status }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const color =
      status === STATUS.SUCCESS
        ? "34, 197, 94"
        : status === STATUS.ERROR
          ? "239, 68, 68"
          : "99, 102, 241";

    particles.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [status]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
}

export default function IntradaySetup() {
  const [form, setForm] = useState({ minute: "", hour: "", date: "" });
  const [status, setStatus] = useState(STATUS.IDLE);
  const [response, setResponse] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const e = {};
    const min = Number(form.minute);
    const hr = Number(form.hour);
    if (form.minute === "" || isNaN(min) || min < 0 || min > 59)
      e.minute = "0 – 59";
    if (form.hour === "" || isNaN(hr) || hr < 0 || hr > 23) e.hour = "0 – 23";
    if (!/^\d{2}-\d{2}-\d{4}$/.test(form.date)) e.date = "MM-DD-YYYY";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (touched[field]) setErrors(validate());
  };

  const handleBlur = (field) => () => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async () => {
    setTouched({ minute: true, hour: true, date: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus(STATUS.LOADING);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3000/api/set-up-intraday/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minute: Number(form.minute),
          hour: Number(form.hour),
          date: form.date,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setResponse(data);
      setStatus(res.ok ? STATUS.SUCCESS : STATUS.ERROR);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setResponse({ message: err.message || "Network error" });
    }
  };

  const handleReset = () => {
    setStatus(STATUS.IDLE);
    setResponse(null);
    setErrors({});
    setTouched({});
  };

  const isSuccess = status === STATUS.SUCCESS;
  const isError = status === STATUS.ERROR;
  const isLoading = status === STATUS.LOADING;

  const fields = [
    {
      key: "hour",
      label: "Hour",
      placeholder: "9",
      hint: "0–23",
      icon: "⏰",
      type: "number",
    },
    {
      key: "minute",
      label: "Minute",
      placeholder: "31",
      hint: "0–59",
      icon: "⏱",
      type: "number",
    },
    {
      key: "date",
      label: "Date",
      placeholder: "04-09-2026",
      hint: "MM-DD-YYYY",
      icon: "📅",
      type: "text",
    },
  ];

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans"
      style={{
        fontFamily: "'Syne', sans-serif",
        background: isSuccess
          ? "radial-gradient(ellipse at 30% 20%, #052e16 0%, #14532d 40%, #052e16 100%)"
          : isError
            ? "radial-gradient(ellipse at 70% 20%, #2d0a0a 0%, #7f1d1d 40%, #2d0a0a 100%)"
            : "radial-gradient(ellipse at 50% 10%, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
        transition: "background 1.2s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ---------- field input ---------- */
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px 14px 44px;
          color: #f1f5f9;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          outline: none;
          transition: all 0.25s ease;
          -moz-appearance: textfield;
        }
        .field-input::-webkit-outer-spin-button,
        .field-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .field-input:focus {
          border-color: #818cf8;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(129,140,248,0.15);
        }
        .field-input.input-error {
          border-color: #f87171 !important;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.15) !important;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ---------- keyframes ---------- */
        @keyframes pulseRing {
          0%,100% { opacity:.4; transform:scale(1); }
          50%      { opacity:.8; transform:scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(30px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cardEnter {
          from { opacity:0; transform:scale(0.94) translateY(20px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin     { to { transform:rotate(360deg); } }
        @keyframes popIn    {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        @keyframes scan {
          from { top:0; }
          to   { top:100%; }
        }
        @keyframes fieldIn {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ---------- animation helpers ---------- */
        .anim-pulse-ring { animation: pulseRing 2s ease-in-out infinite; }
        .anim-slide-up   { animation: slideUp   0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-card-enter { animation: cardEnter 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-spin       { animation: spin      0.7s linear infinite; }
        .anim-pop-in     { animation: popIn     0.5s cubic-bezier(0.34,1.56,0.64,1); }
        .anim-scan       { animation: scan      3s linear infinite; }
        .field-row-1 { animation: fieldIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.10s both; }
        .field-row-2 { animation: fieldIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .field-row-3 { animation: fieldIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.30s both; }

        /* ---------- buttons ---------- */
        .submit-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
        }
        .submit-btn:not(:disabled):hover  { transform: translateY(-2px); }
        .submit-btn:not(:disabled):active { transform: translateY(0); }
        .submit-btn:disabled { cursor: not-allowed; opacity: 0.7; }

        .retry-btn {
          border-radius: 12px;
          padding: 12px 28px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          border: 1.5px solid;
          transition: all 0.25s ease;
        }
        .retry-btn:hover { transform: translateY(-2px); }
      `}</style>

      <ParticleCanvas status={status} />

      {/* Glow orb */}
      <div
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-[1] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: isSuccess
            ? "radial-gradient(circle, rgba(74,222,128,0.10) 0%, transparent 70%)"
            : isError
              ? "radial-gradient(circle, rgba(248,113,113,0.10) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)",
          transition: "background 1.2s ease",
        }}
      />

      {/* ── Main wrapper ── */}
      <div className="relative z-10 w-full max-w-[480px] px-5 anim-card-enter">
        {/* Header */}
        <div className="text-center mb-9">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: isSuccess
                ? "rgba(74,222,128,0.12)"
                : isError
                  ? "rgba(248,113,113,0.12)"
                  : "rgba(129,140,248,0.12)",
              border: `1px solid ${isSuccess ? "rgba(74,222,128,0.25)" : isError ? "rgba(248,113,113,0.25)" : "rgba(129,140,248,0.25)"}`,
              transition: "all 0.8s ease",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full anim-pulse-ring"
              style={{
                background: isSuccess
                  ? "#4ade80"
                  : isError
                    ? "#f87171"
                    : "#818cf8",
                boxShadow: `0 0 8px ${isSuccess ? "#4ade80" : isError ? "#f87171" : "#818cf8"}`,
                display: "inline-block",
                transition: "all 0.8s ease",
              }}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isSuccess ? "#4ade80" : isError ? "#f87171" : "#818cf8",
                transition: "color 0.8s ease",
              }}
            >
              {isSuccess ? "SCHEDULED" : isError ? "FAILED" : "INTRADAY API"}
            </span>
          </div>

          <h1 className="text-[32px] font-extrabold text-slate-100 tracking-tight leading-tight">
            Set Up{" "}
            <span
              style={{
                color: isSuccess ? "#4ade80" : isError ? "#f87171" : "#818cf8",
                transition: "color 0.8s ease",
              }}
            >
              Intraday
            </span>{" "}
            Schedule
          </h1>
          <p
            className="mt-2.5 text-sm text-white/40"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            POST /api/set-up-intraday/set
          </p>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-2xl"
          style={{
            background: "rgba(255,255,255,0.035)",
            border: `1px solid ${isSuccess ? "rgba(74,222,128,0.3)" : isError ? "rgba(248,113,113,0.3)" : "rgba(129,140,248,0.2)"}`,
            boxShadow: isSuccess
              ? "0 0 40px rgba(74,222,128,0.35), 0 24px 64px rgba(0,0,0,0.5)"
              : isError
                ? "0 0 40px rgba(248,113,113,0.35), 0 24px 64px rgba(0,0,0,0.5)"
                : "0 0 40px rgba(129,140,248,0.25), 0 24px 64px rgba(0,0,0,0.5)",
            transition: "border-color 0.8s ease, box-shadow 0.8s ease",
          }}
        >
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-px anim-scan pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />

          {/* ── SUCCESS ── */}
          {isSuccess && (
            <div className="anim-slide-up text-center py-4">
              <div
                className="anim-pop-in w-20 h-20 rounded-full border-2 border-green-400 flex items-center justify-center mx-auto mb-6 text-4xl"
                style={{
                  background:
                    "radial-gradient(circle, #166534 0%, #052e16 100%)",
                  boxShadow: "0 0 40px rgba(74,222,128,0.5)",
                }}
              >
                ✓
              </div>
              <h2 className="text-green-400 text-xl font-extrabold mb-2">
                Schedule Set!
              </h2>
              <p className="text-white/50 text-sm">
                Intraday trigger configured successfully
              </p>

              {response && (
                <div
                  className="mt-5 rounded-xl p-3 text-left"
                  style={{
                    background: "rgba(74,222,128,0.06)",
                    border: "1px solid rgba(74,222,128,0.2)",
                  }}
                >
                  <pre
                    className="text-green-300 text-xs whitespace-pre-wrap break-all"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}

              <button
                className="retry-btn mt-6"
                style={{
                  background: "rgba(74,222,128,0.1)",
                  borderColor: "rgba(74,222,128,0.3)",
                  color: "#86efac",
                }}
                onClick={handleReset}
              >
                ← New Request
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {isError && (
            <div className="anim-slide-up text-center py-4">
              <div
                className="anim-pop-in w-20 h-20 rounded-full border-2 border-red-400 flex items-center justify-center mx-auto mb-6 text-4xl"
                style={{
                  background:
                    "radial-gradient(circle, #7f1d1d 0%, #2d0a0a 100%)",
                  boxShadow: "0 0 40px rgba(248,113,113,0.5)",
                }}
              >
                ✕
              </div>
              <h2 className="text-red-400 text-xl font-extrabold mb-2">
                Request Failed
              </h2>
              <p className="text-white/50 text-sm">
                The server returned an error response
              </p>

              {response && (
                <div
                  className="mt-5 rounded-xl p-3 text-left"
                  style={{
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  <pre
                    className="text-red-300 text-xs whitespace-pre-wrap break-all"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <button
                  className="retry-btn"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    borderColor: "rgba(248,113,113,0.3)",
                    color: "#fca5a5",
                  }}
                  onClick={handleReset}
                >
                  ← Edit Fields
                </button>
                <button
                  className="retry-btn"
                  style={{
                    background: "rgba(248,113,113,0.2)",
                    borderColor: "rgba(248,113,113,0.5)",
                    color: "#fca5a5",
                  }}
                  onClick={handleSubmit}
                >
                  ↻ Try Again
                </button>
              </div>
            </div>
          )}

          {/* ── FORM (IDLE / LOADING) ── */}
          {(status === STATUS.IDLE || isLoading) && (
            <>
              <div className="flex flex-col gap-5">
                {fields.map(
                  ({ key, label, placeholder, hint, icon, type }, idx) => (
                    <div key={key} className={`field-row-${idx + 1}`}>
                      <label className="flex justify-between items-center mb-2">
                        <span
                          className="text-white/70 text-xs font-semibold tracking-widest uppercase"
                          style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                          {label}
                        </span>
                        {errors[key] && touched[key] && (
                          <span
                            className="text-red-400 text-[11px]"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            Expected: {errors[key]}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none z-10">
                          {icon}
                        </span>
                        <input
                          type={type}
                          className={`field-input${errors[key] && touched[key] ? " input-error" : ""}`}
                          placeholder={placeholder}
                          value={form[key]}
                          onChange={handleChange(key)}
                          onBlur={handleBlur(key)}
                          disabled={isLoading}
                        />
                      </div>
                      <p
                        className="mt-1.5 text-white/25 text-[11px]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {hint}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-7">
                <button
                  className="submit-btn"
                  disabled={isLoading}
                  onClick={handleSubmit}
                  style={{
                    background: isLoading
                      ? "rgba(129,140,248,0.3)"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: isLoading
                      ? "none"
                      : "0 8px 32px rgba(99,102,241,0.4)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white anim-spin" />
                      Sending Request...
                    </span>
                  ) : (
                    "→ Execute Request"
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center mt-5 text-white/20 text-[11px] tracking-wider"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          localhost:3000 · application/json
        </p>
      </div>
    </div>
  );
}
