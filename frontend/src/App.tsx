import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MvpBanner from "./components/MvpBanner";
import Home from "./pages/Home";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Auditor from "./pages/Auditor";
import Status from "./pages/Status";

export default function App() {
  return (
    <div className="min-h-screen bg-pool-bg text-pool-text">
      <MvpBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/auditor" element={<Auditor />} />
        <Route path="/status" element={<Status />} />
      </Routes>
    </div>
  );
}