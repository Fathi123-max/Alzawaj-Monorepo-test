"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { PublicProfileView } from "@/components/profile/public-profile-view";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const fromChat = searchParams.get("fromChat") === "true";
  const showPhotos = searchParams.get("showPhotos") === "true";

  console.log("Profile Page Debug:", {
    fromChat,
    showPhotos,
    searchParams: searchParams.toString(),
    hideMarriageRequest: fromChat,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PublicProfileView
          userId={id}
          isDialog={false}
          hideMarriageRequest={fromChat}
          showPhotos={showPhotos}
        />
      </div>
    </div>
  );
}
