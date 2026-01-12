import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast/toast.tsx"
import "./index.css";
import App from "./App.tsx";

// Initialize React Query client for data fetching
const queryClient = new QueryClient();

// Render the app with providers for data fetching
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
