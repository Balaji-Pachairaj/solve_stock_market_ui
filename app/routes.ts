import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("/set-up-intraday", "routes/set-up-Intraday.jsx"),
  route("/dashboard/:date", "routes/get-intraday.jsx"),
  route("/dashboard/trade-one-sight/:date", "routes/trade-one-sight.jsx"),
  route(
    "/dashboard/trade-one-sight-chart/:date",
    "routes/trade-one-sight-chart.jsx",
  ),
] satisfies RouteConfig;
