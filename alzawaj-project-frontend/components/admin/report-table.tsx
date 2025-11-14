"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminApiService,
  AdminReport,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import {
  FileText,
  Eye,
  RefreshCw,
  UserCheck,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

export function ReportTable() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getReports();

      if (response.success && response.data) {
        setReports(response.data.reports);
      } else {
        throw new Error("Failed to load reports");
      }
    } catch (error: any) {
      console.error("Error loading reports:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Set empty array instead of mock data
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (
    reportId: string,
    action: "assign" | "resolve" | "dismiss",
    notes?: string,
  ) => {
    setActionLoading(reportId);
    try {
      const response = await adminApiService.performReportAction(
        reportId,
        action,
        notes,
      );

      if (response.success) {
        showToast.success(
          response.message ||
            `تم ${action === "assign" ? "تعيين" : action === "resolve" ? "حل" : "رفض"} البلاغ بنجاح`,
        );
        await loadReports(); // Reload data
      } else {
        throw new Error(response.message || "فشل في تنفيذ العملية");
      }
    } catch (error: any) {
      console.error("Error performing report action:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      pending: {
        label: "في الانتظار",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      under_review: {
        label: "قيد المراجعة",
        className: "bg-blue-100 text-blue-800",
        icon: Eye,
      },
      resolved: {
        label: "تم الحل",
        className: "bg-green-100 text-green-800",
        icon: UserCheck,
      },
      dismissed: {
        label: "مرفوض",
        className: "bg-gray-100 text-gray-800",
        icon: XCircle,
      },
      escalated: {
        label: "متصاعد",
        className: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || statusConfig["pending"]!;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      "inappropriate-content": "محتوى غير مناسب",
      "fake-profile": "ملف شخصي مزيف",
      harassment: "تحرش",
      spam: "رسائل مزعجة",
      scam: "احتيال",
      "abusive-language": "لغة مسيئة",
      "religious-violations": "انتهاكات دينية",
      other: "أخرى",
    };
    return typeLabels[type] || type;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `منذ ${diffDays} يوم`;
    if (diffHours > 0) return `منذ ${diffHours} ساعة`;
    if (diffMinutes > 0) return `منذ ${diffMinutes} دقيقة`;
    return "الآن";
  };

  const getPriorityColor = (type: string) => {
    const highPriority = [
      "harassment",
      "abusive-language",
      "religious-violations",
    ];
    const mediumPriority = ["inappropriate-content", "scam", "fake-profile"];

    if (highPriority.includes(type)) return "text-red-600";
    if (mediumPriority.includes(type)) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تقارير المستخدمين ({reports.length})
            </h2>
            <Button
              onClick={loadReports}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {reports.filter((r) => r.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">في الانتظار</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {reports.filter((r) => r.status === "under_review").length}
              </p>
              <p className="text-sm text-gray-600">قيد المراجعة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {reports.filter((r) => r.status === "resolved").length}
              </p>
              <p className="text-sm text-gray-600">تم الحل</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {
                  reports.filter((r) =>
                    [
                      "harassment",
                      "abusive-language",
                      "religious-violations",
                    ].includes(r.reason),
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600">أولوية عالية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>لا توجد تقارير</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البلاغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ID: {report.id}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            المبلغ: {report.reporterId} | ضد:{" "}
                            {report.reportedUserId}
                          </div>
                          <div className="text-sm text-gray-700">
                            <strong>السبب:</strong> {report.reason}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                            {report.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`${getPriorityColor(report.reason)} bg-gray-100`}
                        >
                          {getTypeLabel(report.reason)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(report.createdAt).toLocaleDateString(
                            "ar-SA",
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getTimeAgo(report.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            عرض
                          </Button>
                          {report.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleReportAction(
                                  report.id,
                                  "assign",
                                  "تم تعيين المراجع",
                                )
                              }
                              disabled={actionLoading === report.id}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <UserCheck className="w-3 h-3 ml-1" />
                              تعيين
                            </Button>
                          )}
                          {(report.status === "pending" ||
                            report.status === "under_review") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleReportAction(
                                  report.id,
                                  "resolve",
                                  "تم حل البلاغ",
                                )
                              }
                              disabled={actionLoading === report.id}
                              className="text-green-600 hover:text-green-800"
                            >
                              <UserCheck className="w-3 h-3 ml-1" />
                              حل
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">تفاصيل البلاغ</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    معرف البلاغ
                  </label>
                  <p className="text-sm text-gray-900">{selectedReport.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    نوع البلاغ
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={`${getPriorityColor(selectedReport.reason)} bg-gray-100`}
                    >
                      {getTypeLabel(selectedReport.reason)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المبلغ
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedReport.reporterId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المبلغ ضده
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedReport.reportedUserId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الحالة
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    تاريخ البلاغ
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedReport.createdAt).toLocaleString("ar-SA")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  السبب
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {selectedReport.reason}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  التفاصيل
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {(selectedReport.status === "pending" ||
                    selectedReport.status === "under_review") && (
                    <>
                      <Button
                        onClick={() => {
                          handleReportAction(
                            selectedReport.id,
                            "resolve",
                            "تم حل البلاغ بواسطة المشرف",
                          );
                          setSelectedReport(null);
                        }}
                        disabled={actionLoading === selectedReport.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="w-4 h-4 ml-1" />
                        حل البلاغ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleReportAction(
                            selectedReport.id,
                            "dismiss",
                            "بلاغ غير مؤكد",
                          );
                          setSelectedReport(null);
                        }}
                        disabled={actionLoading === selectedReport.id}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض البلاغ
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                >
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
