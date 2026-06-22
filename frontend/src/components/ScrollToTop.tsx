import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-pool-green/20 border border-pool-green/30 text-pool-green hover:bg-pool-green/30 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-green animate-fade-in"
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}
