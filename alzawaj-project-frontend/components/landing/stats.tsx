"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, Users, Heart, Globe, TrendingUp } from "lucide-react";
import SwiperComponent from "@/components/common/SwiperComponent";

export function LandingStats() {
  const stats = [
    {
      number: "1495",
      label: "عدد المتقدمين",
      icon: User,
      color: "from-primary to-primary-hover",
    },
    {
      number: "742",
      label: "عدد المتقدمات",
      icon: Users,
      color: "from-pink-500 to-pink-600",
    },
    {
      number: "88+",
      label: "زواج ناجح",
      icon: Heart,
      color: "from-green-500 to-green-600",
    },
    {
      number: "50+",
      label: "دولة مشاركة",
      icon: Globe,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <section className="pt-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-page-title font-bold text-gray-900 mb-4">
            {" "}
            📊 الإحصائيات
          </h2>
        </div>
        <SwiperComponent
          items={stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <CardContent className="p-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.color} text-white mb-4`}
                  >
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div
                    className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                  >
                    {stat.number}
                  </div>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
          className=""
        />
        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-primary-subtle rounded-full px-8 py-4 shadow-md">
            <TrendingUp className="w-6 h-6 ml-3 text-green-600" />
            <span className="text-gray-700 font-medium">
              الأرقام في نمو مستمر بفضل الله
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
