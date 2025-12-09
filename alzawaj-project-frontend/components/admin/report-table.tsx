"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toaster";
import { AdminReport, adminApiService } from "@/lib/services/admin-api-service";
import { getStoredToken } from "@/lib/utils/auth.utils";
import {
  FileText,
  Eye,
  RefreshCw,
  UserCheck,
  XCircle,
  AlertTriangle,
  Clock,
  UserX,
} from "lucide-react";

export function ReportTable() {
  console.log("ReportTable component mounted!");

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendedUsers, setSuspendedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      console.log("Loading reports...");
      const token = getStoredToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/reports", {
        headers,
      });
      const data = await response.json();

      console.log("API response:", data);

      if (response.ok && data.success) {
        console.log("Reports loaded:", data.data.reports);
        setReports(data.data.reports || []);
      } else {
        throw new Error(data.message || "Failed to load reports");
      }
    } catch (error: unknown) {
      console.error("Error loading reports:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load reports";
      showToast.error(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    reportId: string,
    action: "suspend_user" | "delete_profile",
    notes?: string,
  ) => {
    // Find the report to get the reported user ID
    const report = reports.find((r) => (r._id || r.id) === reportId);
    if (!report) {
      showToast.error("لم يتم العثور على التقرير");
      return;
    }

    // Extract the reported user ID
    const reportedUserId =
      typeof report.reportedUserId === "object"
        ? report.reportedUserId._id || report.reportedUserId.id
        : report.reportedUserId;

    if (!reportedUserId) {
      showToast.error("لم يتم العثور على معرف المستخدم المبلغ عنه");
      return;
    }

    setActionLoading(reportId);
    try {
      // Map report actions to user actions
      let userAction: "suspend" | "delete";
      let actionMessage: string;

      switch (action) {
        case "suspend_user":
          userAction = "suspend";
          actionMessage = "إيقاف المستخدم";
          break;
        case "delete_profile":
          userAction = "delete";
          actionMessage = "حذف الملف الشخصي";
          break;
        default:
          throw new Error("إجراء غير صالح");
      }

      const response = await adminApiService.performUserAction(
        reportedUserId,
        userAction,
        notes,
      );

      if (response.success) {
        showToast.success(response.message || `تم ${actionMessage} بنجاح`);

        // Track suspended users for UI feedback
        if (action === "suspend_user") {
          setSuspendedUsers((prev) => new Set([...prev, reportedUserId]));
        }

        // Show success animation then reload
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await loadReports();
      } else {
        throw new Error(response.message || "فشل في تنفيذ العملية");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to perform action";
      showToast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        className: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      pending: {
        label: "في الانتظار",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock as React.ComponentType<{ className?: string }>,
      },
      under_review: {
        label: "قيد المراجعة",
        className: "bg-blue-100 text-blue-800",
        icon: Eye as React.ComponentType<{ className?: string }>,
      },
      resolved: {
        label: "تم الحل",
        className: "bg-green-100 text-green-800",
        icon: UserCheck as React.ComponentType<{ className?: string }>,
      },
      dismissed: {
        label: "مرفوض",
        className: "bg-gray-100 text-gray-800",
        icon: XCircle as React.ComponentType<{ className?: string }>,
      },
      escalated: {
        label: "متصاعد",
        className: "bg-red-100 text-red-800",
        icon: AlertTriangle as React.ComponentType<{ className?: string }>,
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

  const isUserSuspended = (
    reportedUserId: string | { _id?: string; id: string },
  ) => {
    const userId =
      typeof reportedUserId === "object"
        ? reportedUserId._id || reportedUserId.id
        : reportedUserId;
    return suspendedUsers.has(userId);
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
                    <tr
                      key={report._id || report.id}
                      className={`hover:bg-gray-50 ${
                        isUserSuspended(report.reportedUserId)
                          ? "bg-red-50 border-l-4 border-red-500"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ID: {report._id || report.id}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            المبلغ:{" "}
                            {typeof report.reporterId === "object"
                              ? report.reporterId.fullName ||
                                report.reporterId.id ||
                                report.reporterId._id ||
                                "غير معروف"
                              : `مستخدم_${report.reporterId?.slice(-8) || report.reporterId}`}{" "}
                            | ضد:{" "}
                            {typeof report.reportedUserId === "object"
                              ? report.reportedUserId.fullName ||
                                report.reportedUserId.id ||
                                report.reportedUserId._id ||
                                "غير معروف"
                              : `مستخدم_${report.reportedUserId?.slice(-8) || report.reportedUserId}`}
                            {isUserSuspended(report.reportedUserId) && (
                              <Badge className="mr-2 bg-red-100 text-red-800 text-xs">
                                <UserX className="w-3 h-3 ml-1" />
                                تم إيقافه
                              </Badge>
                            )}
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
                          {(report.status === "pending" ||
                            report.status === "under_review") &&
                            !isUserSuspended(report.reportedUserId) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAction(
                                    report._id || report.id,
                                    "suspend_user",
                                    "تم إيقاف المستخدم بسبب مخالفة",
                                  )
                                }
                                disabled={
                                  actionLoading === (report._id || report.id)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="w-3 h-3 ml-1" />
                                إيقاف المستخدم المبلغ عنه
                              </Button>
                            )}
                          {report.status === "resolved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAction(
                                  report._id || report.id,
                                  "delete_profile",
                                  "تم حذف الملف الشخصي للمخالفات المتكررة",
                                )
                              }
                              disabled={
                                actionLoading === (report._id || report.id)
                              }
                              className="text-red-700 hover:text-red-900"
                            >
                              <XCircle className="w-3 h-3 ml-1" />
                              حذف الملف الشخصي
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
                  <p className="text-sm text-gray-900">
                    {selectedReport._id || selectedReport.id}
                  </p>
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
                    {typeof selectedReport.reporterId === "object"
                      ? selectedReport.reporterId.fullName ||
                        selectedReport.reporterId.id ||
                        selectedReport.reporterId._id ||
                        "غير معروف"
                      : `مستخدم_${selectedReport.reporterId?.slice(-8) || selectedReport.reporterId}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المبلغ ضده
                  </label>
                  <p className="text-sm text-gray-900">
                    {typeof selectedReport.reportedUserId === "object"
                      ? selectedReport.reportedUserId.fullName ||
                        selectedReport.reportedUserId.id ||
                        selectedReport.reportedUserId._id ||
                        "غير معروف"
                      : `مستخدم_${selectedReport.reportedUserId?.slice(-8) || selectedReport.reportedUserId}`}
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
                    selectedReport.status === "under_review") &&
                    !isUserSuspended(selectedReport.reportedUserId) && (
                      <>
                        <Button
                          onClick={() => {
                            handleAction(
                              selectedReport._id || selectedReport.id,
                              "suspend_user",
                              "تم إيقاف المستخدم بسبب مخالفة القوانين",
                            );
                            setSelectedReport(null);
                          }}
                          disabled={
                            actionLoading ===
                            (selectedReport._id || selectedReport.id)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle className="w-4 h-4 ml-1" />
                          إيقاف المستخدم المبلغ عنه
                        </Button>
                      </>
                    )}
                  {selectedReport.status === "resolved" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleAction(
                          selectedReport._id || selectedReport.id,
                          "delete_profile",
                          "تم حذف الملف الشخصي للمخالفات المتكررة",
                        );
                        setSelectedReport(null);
                      }}
                      disabled={
                        actionLoading ===
                        (selectedReport._id || selectedReport.id)
                      }
                      className="text-red-700 hover:text-red-900"
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      حذف الملف الشخصي
                    </Button>
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
