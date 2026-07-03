import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import RentalsPage from "./pages/RentalsPage";
import AboutFaqPage from "./pages/AboutFaqPage";
import GalleryPage from "./pages/GalleryPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingCancelledPage from "./pages/BookingCancelledPage";
import AdminApp from "./pages/admin/AdminApp";
import UnderConstructionPage from "./pages/UnderConstructionPage";
import { features } from "./data/content";

const UNDER_CONSTRUCTION = false;

export default function App() {
  if (UNDER_CONSTRUCTION) {
    return (
      <HelmetProvider>
        <UnderConstructionPage />
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rentals" element={<RentalsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/booking/cancelled" element={<BookingCancelledPage />} />
            <Route path="/about" element={<AboutFaqPage />} />
            <Route path="/gallery" element={features.showGallery ? <GalleryPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
