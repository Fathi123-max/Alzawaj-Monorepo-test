import { Metadata } from "next";
import { ReportTable } from "@/components/admin/report-table";

export const metadata: Metadata = {
  title: "تقارير المستخدمين | لوحة التحكم",
  description: "عرض وإدارة تقارير المستخدمين",
};

export default function AdminReportsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            تقارير المستخدمين
          </h1>
          <p className="text-gray-600">
            عرض وإدارة البلاغات المرسلة من المستخدمين
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ReportTable />
      </div>
    </div>
  );
}
