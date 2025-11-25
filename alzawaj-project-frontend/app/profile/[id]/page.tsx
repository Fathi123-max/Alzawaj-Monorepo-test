import { PublicProfileView } from "@/components/profile/public-profile-view";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PublicProfileView userId={id} isDialog={false} hideMarriageRequest={true} />
      </div>
    </div>
  );
}
