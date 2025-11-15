import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/*",
    element: &lt;App /&gt;,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  &lt;React.StrictMode&gt;
    &lt;RouterProvider router={router} /&gt;
  &lt;/React.StrictMode&gt;
);
