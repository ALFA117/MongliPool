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
      className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-md bg-pool-card border border-pool-border text-pool-text hover:border-pool-text/40 transition-colors flex items-center justify-center cursor-pointer shadow-hard-sm animate-fade-in"
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}
