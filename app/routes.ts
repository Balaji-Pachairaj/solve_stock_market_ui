import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("/set-up-intraday", "routes/set-up-Intraday.jsx"),
  route("/dashboard/:date", "routes/get-intraday.jsx"),
] satisfies RouteConfig;
