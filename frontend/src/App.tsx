import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedBg from "./components/AnimatedBg";
import WalletGate from "./components/WalletGate";
import DemoTour from "./components/DemoTour";
import Onboarding from "./components/Onboarding";
import Home from "./pages/Home";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Auditor from "./pages/Auditor";
import Status from "./pages/Status";
import Stats from "./pages/Stats";
import Business from "./pages/Business";
import Explorer from "./pages/Explorer";
import Verify from "./pages/Verify";
import History from "./pages/History";

export default function App() {
  const [showTour, setShowTour] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("monglipool-onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-pool-bg text-pool-text flex flex-col">
      <AnimatedBg />
      <Navbar onStartTour={() => setShowTour(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onStartTour={() => setShowTour(true)} />} />
          <Route path="/deposit" element={<WalletGate><Deposit /></WalletGate>} />
          <Route path="/withdraw" element={<WalletGate><Withdraw /></WalletGate>} />
          <Route path="/history" element={<WalletGate><History /></WalletGate>} />
          <Route path="/auditor" element={<Auditor />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/status" element={<Status />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/business" element={<Business />} />
        </Routes>
      </main>
      <Footer />
      {showTour && <DemoTour onClose={() => setShowTour(false)} />}
      {showOnboarding && (
        <Onboarding
          onClose={() => setShowOnboarding(false)}
          onStartTour={() => { setShowOnboarding(false); setShowTour(true); }}
        />
      )}
    </div>
  );
}
