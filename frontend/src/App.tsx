import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MvpBanner from "./components/MvpBanner";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Auditor from "./pages/Auditor";
import Status from "./pages/Status";
import Stats from "./pages/Stats";

export default function App() {
  return (
    <div className="min-h-screen bg-pool-bg text-pool-text flex flex-col">
      <MvpBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/auditor" element={<Auditor />} />
          <Route path="/status" element={<Status />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}