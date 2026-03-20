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
const MLDashboard = lazy(() => import("./Pages/Models/MLDashboard"));

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
                <Route index element={<HomePage />} />
<<<<<<< Updated upstream
                <Route index path='/HomePage' element={<HomePage />} />
                <Route index path='/DataSet' element={<ProtectedRoute><Dataset /></ProtectedRoute>} />
                <Route index path='/Cleaning' element={<ProtectedRoute><Cleaning /></ProtectedRoute>} />
                <Route index path='/SignIn' element={<SignIn />} />
                <Route index path='/SignUp' element={<Signup />} />
                <Route index path='/FAQ' element={<FAQDemo />} />
                <Route index path='/Lamp' element={<LampDemo />} />
                <Route index path='/About' element={<AboutPage />} />
                <Route index path='*' element={<NotFound />} />
=======
                <Route path='/HomePage' element={<HomePage />} />
                <Route path='/SignIn' element={<SignIn />} />
                <Route path='/SignUp' element={<Signup />} />

                {/* Protected routes - require authentication */}
                <Route path='/DataSet' element={<ProtectedRoute><Dataset /></ProtectedRoute>} />
                <Route path='/Cleaning' element={<ProtectedRoute><Cleaning /></ProtectedRoute>} />
                <Route path='/Models' element={<ProtectedRoute><MLDashboard /></ProtectedRoute>} />
                <Route path='/FAQ' element={<ProtectedRoute><FAQDemo /></ProtectedRoute>} />
                <Route path='/About' element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />

                {/* 404 - Not Found */}
                <Route path='*' element={<NotFound />} />
>>>>>>> Stashed changes
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  );
}

export default App;