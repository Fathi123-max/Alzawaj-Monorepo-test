"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 md:pt-14 md:pb-4 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-hero font-display text-text mb-10 flex flex-col gap-3 justify-center items-center text-balance">
            <span className="arabic-optimized">ابحث عن شريك حياتك</span>
            <span className="text-primary arabic-optimized">
              وفق الشريعة الإسلامية
            </span>
          </h1>

          <p className="text-body-large text-text-secondary mb-8 max-w-3xl mx-auto arabic-optimized text-pretty">
            منصة آمنة وموثوقة للزواج الإسلامي مع مراعاة الخصوصية والقيم
            الإسلامية. ابدأ رحلتك للعثور على شريك الحياة المناسب اليوم.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/register"
              className="bg-primary text-white px-8 py-3 rounded-lg text-button-primary font-medium hover:bg-primary-hover hover:text-white transition-colors w-full sm:w-auto arabic-optimized"
            >
              ابدأ رحلتك الآن
            </Link>
            <Link
              href="#features"
              className="border border-primary text-primary px-8 py-3 rounded-lg text-button-primary font-medium hover:bg-primary hover:text-white transition-colors w-full sm:w-auto arabic-optimized"
            >
              تعرف على المميزات
            </Link>
          </div>

          {/* <div className="max-w-xl mx-auto mt-12 grid grid-cols-3 gap-8 text-center justify-items-center align-items-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 font-display">
                2200+
              </div>
              <div className="text-sm sm:text-base text-text-secondary arabic-optimized">
                عضو مسجل
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-secondary mb-2 font-display">
                88+
              </div>
              <div className="text-sm sm:text-base text-text-secondary arabic-optimized">
                زواج ناجح
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-secondary mb-2 font-display">
                200+
              </div>
              <div className="text-sm sm:text-base text-text-secondary arabic-optimized">
                دولة مشاركة
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-2 font-display">
                88+
              </div>
              <div className="text-sm sm:text-base text-text-secondary arabic-optimized">
                تقييمات إيجابية
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-secondary mb-2 font-display">
                4.6
              </div>
              <div className="text-sm sm:text-base text-text-secondary arabic-optimized">
              متوسط التقييم
              </div>
            </div>
          </div> */}
        </div>
        {/* Arrow Down Button - now flex, not absolute */}
        <div className="flex flex-col items-center mt-10">
          <button
            onClick={() => {
              const nextSection = document.querySelector(
                'section[id]:not([id="hero"])',
              );
              if (nextSection) {
                nextSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
            aria-label="Scroll Down"
            className="cursor-pointer border border-primary bg-primary rounded-full p-3 transition-all duration-300 flex items-center justify-center hover:scale-110"
            style={{
              animation: "slowBounce 2s ease-in-out infinite",
            }}
          >
            <ChevronDown size={32} className="text-white" />
            <style>
              {`
                @keyframes slowBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(0.5rem); }
                }
              `}
            </style>
          </button>
        </div>
      </div>
    </section>
  );
}
