import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";


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
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/">
            <Route index element={<HomePage />} />
            <Route index path='/HomePage' element={<HomePage />} />
            <Route index path='/DataSet' element={<Dataset />} />
            <Route index path='/Cleaning' element={<Cleaning />} />
            <Route index path='/SignIn' element={<SignIn />} />
            <Route index path='/SignUp' element={<Signup />} />
            <Route index path='/FAQ' element={<FAQDemo />} />
            <Route index path='/Lamp' element={<LampDemo />} />
            <Route index path='/About' element={<AboutPage />} />
            <Route index path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
