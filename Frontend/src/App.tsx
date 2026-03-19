import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Spinner } from "@/components/ui/spinner";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatasetProvider } from "@/contexts/DatasetContext";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

// Lazy load all page components for better code splitting
const HomePage = lazy(() => import("./Pages/HomePage/HomePage"));
const Dataset = lazy(() => import("./Pages/DataSet/DataSet"));
const SignIn = lazy(() => import("./Pages/SignIn/SignIn"));
const Signup = lazy(() => import("./Pages/SignUp/SignUp"));
const NotFound = lazy(() => import("./Pages/NotFound/not-found"));
const AboutPage = lazy(() => import("./Pages/About/About"));
const FAQDemo = lazy(() => import("./Pages/FAQ/demo"));
const Cleaning = lazy(() => import("./Pages/Cleaning/Cleaning"));
const LampDemo = lazy(() => import("./components/layouts/BgLamp").then(module => ({ default: module.LampDemo })));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Spinner variant="bars" size={40} className="text-white" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/">
                {/* Public routes - accessible without login */}
                <Route index element={<HomePage />} />
                <Route path='/HomePage' element={<HomePage />} />
                <Route path='/SignIn' element={<SignIn />} />
                <Route path='/SignUp' element={<Signup />} />

                {/* Protected routes - require authentication */}
                <Route path='/DataSet' element={<ProtectedRoute><Dataset /></ProtectedRoute>} />
                <Route path='/Cleaning' element={<ProtectedRoute><Cleaning /></ProtectedRoute>} />
                <Route path='/FAQ' element={<ProtectedRoute><FAQDemo /></ProtectedRoute>} />
                <Route path='/Lamp' element={<ProtectedRoute><LampDemo /></ProtectedRoute>} />
                <Route path='/About' element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />

                {/* 404 - Not Found */}
                <Route path='*' element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  );
}

export default App;