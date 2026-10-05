import { useState } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Loader from "./components/Loader";

const queryClient = new QueryClient();

const App = () => {
  // The hero's entrance starts as the loader's curtain lifts.
  const [introDone, setIntroDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MotionConfig reducedMotion="user">
          <Toaster />
          <Sonner />
          <Loader onDone={() => setIntroDone(true)} />
          <Index ready={introDone} />
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
