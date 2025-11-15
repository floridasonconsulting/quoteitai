import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  &lt;React.StrictMode&gt;
    &lt;BrowserRouter&gt;
      &lt;App /&gt;
    &lt;/BrowserRouter&gt;
  &lt;/React.StrictMode&gt;
);
