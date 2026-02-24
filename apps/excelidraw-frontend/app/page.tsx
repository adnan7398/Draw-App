"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/component/landing/Navbar";
import { Hero } from "@/component/landing/Hero";
import { ProductPreview } from "@/component/landing/ProductPreview";
import { Features } from "@/component/landing/Features";
import { UseCases } from "@/component/landing/UseCases";
import { Testimonials } from "@/component/landing/Testimonials";
import { Integrations } from "@/component/landing/Integrations";
import { Pricing } from "@/component/landing/Pricing";
import { Footer } from "@/component/landing/Footer";
import { Dashboard } from "@/component/Dashboard";

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Hero />
        <ProductPreview />
        <Features />
        <UseCases />
        <Testimonials />
        <Integrations />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for auth token in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Render Dashboard if logged in, otherwise render Landing Page
  return isLoggedIn ? <Dashboard /> : <LandingPage />;
}