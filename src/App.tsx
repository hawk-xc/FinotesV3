import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./components/home";
import LoginPage from "./components/auth/LoginPage";
import AboutPage from "./components/sections/AboutSection";
import routes from "tempo-routes";
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <AuthProvider>
      <Analytics />
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about-developer" element={<AboutPage />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
