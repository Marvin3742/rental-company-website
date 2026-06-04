import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import RentalsPage from "./pages/RentalsPage";
import AboutFaqPage from "./pages/AboutFaqPage";
import GalleryPage from "./pages/GalleryPage";
import { features } from "./data/content";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rentals" element={<RentalsPage />} />
            <Route path="/about" element={<AboutFaqPage />} />
            <Route path="/gallery" element={features.showGallery ? <GalleryPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
