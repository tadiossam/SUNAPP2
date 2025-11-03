import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DataView from "./pages/DataView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/data" element={<DataView />} />
    </Routes>
  );
}
