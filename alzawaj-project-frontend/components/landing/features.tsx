"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Shield,
  Book,
  Gift,
  Globe,
  Target,
  Handshake,
  Zap,
  Lock,
  Star,
} from "lucide-react";
import SwiperComponent from "@/components/common/SwiperComponent";

export function LandingFeatures() {
  const features = [
    {
      icon: Shield,
      title: "التوافق مع الشريعة",
      description: "خدمة تتوافق مع تعاليم الإسلام، مع بيئة آمنة ومحترمة.",
    },
    {
      icon: Users,
      title: "دعم التقاليد",
      description: "نؤمن بأهمية العائلة ودورها في بناء زواج ناجح وربط الأسر.",
    },
    {
      icon: Lock,
      title: "حفظ الكرامة",
      description: "معلومات المتقدمين متاحة للأعضاء المسجلين والمعتمدين فقط.",
    },
    {
      icon: Book,
      title: "الالتزام بالدين",
      description: "بيئة مثالية للعثور على شركاء يشاركونك نفس القيم الإسلامية.",
    },
    {
      icon: Gift,
      title: "المجانية",
      description: "خدماتنا مجانية 100% بدون أي رسوم أو مبالغ مالية.",
    },
    {
      icon: Globe,
      title: "الشمول",
      description:
        "متاح لجميع المسلمين بغض النظر عن الخلفية أو الموقع الجغرافي.",
    },
    {
      icon: Target,
      title: "الجدية",
      description: "بيئة للبحث الجاد عن الشريك المناسب بدون مراسلات عاطفية.",
    },
    {
      icon: Handshake,
      title: "التوافق",
      description: "أسئلة متخصصة لزيادة فرص العثور على الشريك المناسب.",
    },
    {
      icon: Zap,
      title: "السرعة",
      description: "تسهيل الانتقال من العالم الافتراضي إلى الواقع بسرعة.",
    },
  ];

  return (
    <section id="features" className="md:pt-28 pt-20 pb-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-start justify-center mb-4">
            <Star className="w-10 h-10 ml-3 text-amber-500" />
            <h2 className="text-page-title font-heading text-text arabic-optimized sm:mt-[3px] mt-2">
              الميزات
            </h2>
          </div>
        </div>
        <div className="mt-8">
          <SwiperComponent
            items={features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={index}
                  className="h-full hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="flex justify-center mb-3">
                        <IconComponent className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-card-title font-heading text-text mb-3 arabic-optimized">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-body text-text-secondary leading-relaxed text-right arabic-optimized text-pretty">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className=""
          />
        </div>
      </div>
    </section>
  );
}

export default LandingFeatures;
