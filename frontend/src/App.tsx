import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MvpBanner from "./components/MvpBanner";
import Footer from "./components/Footer";
import AnimatedBg from "./components/AnimatedBg";
import WalletGate from "./components/WalletGate";
import Home from "./pages/Home";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Auditor from "./pages/Auditor";
import Status from "./pages/Status";
import Stats from "./pages/Stats";
import Business from "./pages/Business";

export default function App() {
  return (
    <div className="min-h-screen bg-pool-bg text-pool-text flex flex-col">
      <AnimatedBg />
      <MvpBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/deposit" element={<WalletGate><Deposit /></WalletGate>} />
          <Route path="/withdraw" element={<WalletGate><Withdraw /></WalletGate>} />
          <Route path="/auditor" element={<Auditor />} />
          <Route path="/status" element={<Status />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/business" element={<Business />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}