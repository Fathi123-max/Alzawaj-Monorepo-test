"use client";
import { ReactNode, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// Custom pagination styles for Swiper
const customPaginationStyles = `
.swiper-pagination-custom .swiper-pagination-bullet {
  background: var(--primary-300);
  opacity: 0.6;
  width: 12px;
  height: 12px;
  margin: 0 12px !important;
  border-radius: 50%;
  transition: background 0.3s, opacity 0.3s, transform 0.3s;
  border: 1px solid var(--primary-500);
}
.swiper-pagination-custom .swiper-pagination-bullet-active {
  background: var(--primary-color);
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 0 0 8px var(--primary-subtle);
}
`;

interface SwiperComponentProps {
  items: ReactNode[];
  slidesPerView?: number;
  spaceBetween?: number;
  breakpoints?: { [key: number]: { slidesPerView: number } };
  className?: string;
}

export default function SwiperComponent({
  items,
  slidesPerView = 1,
  spaceBetween = 30,
  breakpoints = {
    640: { slidesPerView: 2 },
    1024: { slidesPerView: 3 },
  },
  className = "md:px-8 px-4",
}: SwiperComponentProps) {
  // Generate a unique class for each Swiper instance on the client only
  const [uniquePaginationClass, setUniquePaginationClass] =
    useState<string>("");
  useEffect(() => {
    setUniquePaginationClass(
      `swiper-pagination-custom-${Math.random().toString(36).substr(2, 9)}`,
    );
  }, []);

  // Don't render Swiper until uniquePaginationClass is set (client only)
  if (!uniquePaginationClass) return null;
  return (
    <div className="relative group cursor-default">
      {/* Inject custom pagination styles */}
      <style>{customPaginationStyles}</style>
      <Swiper
        modules={[Pagination]}
        pagination={{
          clickable: true,
          el: `.${uniquePaginationClass}`,
        }}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        breakpoints={breakpoints}
        className={`${className} group-hover:cursor-grab`}
      >
        {items.map((item, index) => (
          <SwiperSlide key={index}>{item}</SwiperSlide>
        ))}
      </Swiper>
      {/* The pagination element must have a unique class for Swiper to target it dynamically */}
      <div
        className={`swiper-pagination-custom ${uniquePaginationClass} flex justify-center my-8 select-none`}
      />
    </div>
  );
}
