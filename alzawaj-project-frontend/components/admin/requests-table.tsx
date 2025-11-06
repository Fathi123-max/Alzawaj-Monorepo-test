"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  adminApiService,
  MarriageRequest,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { adminRequestsService } from "@/lib/services/admin-requests-service";
import { showToast } from "@/components/ui/toaster";
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Heart,
  Search,
  Filter,
  Calendar,
  User,
  ArrowRight,
  MoreVertical,
  AlertCircle,
} from "lucide-react";

export function RequestsTable() {
  const [requests, setRequests] = useState<MarriageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<MarriageRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getMarriageRequests();

      if (response.success && response.data) {
        setRequests(response.data.requests);
      } else {
        throw new Error("Failed to load marriage requests");
      }
    } catch (error: any) {
      console.error("Error loading marriage requests:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Set empty array instead of mock data
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await adminApiService.approveMarriageRequest(requestId);
      showToast.success("تم اعتماد طلب الزواج بنجاح");
      loadRequests(); // Refresh the list
    } catch (error: any) {
      console.error("Error approving request:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      await adminApiService.rejectMarriageRequest(requestId, reason);
      showToast.success("تم رفض طلب الزواج بنجاح");
      loadRequests(); // Refresh the list
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: MarriageRequest["status"]) => {
    const statusConfig = {
      pending: {
        label: "في الانتظار",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      accepted: {
        label: "مقبول",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rejected: {
        label: "مرفوض",
        className: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      cancelled: {
        label: "ملغي",
        className: "bg-gray-100 text-gray-800",
        icon: XCircle,
      },
      expired: {
        label: "منتهي الصلاحية",
        className: "bg-orange-100 text-orange-800",
        icon: Clock,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
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

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "منتهي الصلاحية";
    if (diffDays === 0) return "ينتهي اليوم";
    if (diffDays === 1) return "ينتهي غداً";
    return `ينتهي خلال ${diffDays} يوم`;
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      selectedStatus === "all" || request.status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      request.sender.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.receiver.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  طلبات الزواج
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  إجمالي الطلبات: {requests.length}
                </p>
              </div>
            </div>
            <Button
              onClick={loadRequests}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="البحث في الطلبات (الأسماء أو الرسائل)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="lg:hidden">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
            >
              الكل ({requests.length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "pending" ? "default" : "outline"}
              onClick={() => setSelectedStatus("pending")}
            >
              في الانتظار (
              {requests.filter((r) => r.status === "pending").length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "accepted" ? "default" : "outline"}
              onClick={() => setSelectedStatus("accepted")}
            >
              مقبول ({requests.filter((r) => r.status === "accepted").length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === "rejected" ? "default" : "outline"}
              onClick={() => setSelectedStatus("rejected")}
            >
              مرفوض ({requests.filter((r) => r.status === "rejected").length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Marriage Requests */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg text-gray-600">
                جاري تحميل طلبات الزواج...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد طلبات
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `لم يتم العثور على طلبات تطابق "${searchTerm}"`
                    : selectedStatus === "all"
                      ? "لا توجد طلبات زواج حالياً"
                      : `لا توجد طلبات بحالة "${selectedStatus}"`}
                </p>
              </div>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  مسح البحث
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-pink-50 to-red-50">
                    <TableHead className="text-right font-semibold">
                      الطلب
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الرسالة
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الحالة
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      تاريخ الإرسال
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      انتهاء الصلاحية
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request._id || request.id}
                      className="group hover:bg-pink-50/30"
                    >
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {request.sender.firstname
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                            <span className="font-medium">
                              {request.sender.fullName}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {request.receiver.firstname
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                            <span className="font-medium">
                              {request.receiver.fullName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {request.message || "لا توجد رسالة"}
                        </p>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getTimeAgo(request.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={`${
                            request.isExpired
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {getDaysUntilExpiry(request.expiresAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-800"
                                onClick={() => handleApprove(request._id || request.id)}
                                title="قبول الطلب"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleReject(request._id || request.id)}
                                title="رفض الطلب"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request._id || request.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {request.isExpired && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-red-100 text-red-700"
                        >
                          <AlertCircle className="w-3 h-3 ml-1" />
                          منتهي
                        </Badge>
                      )}
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80">
                        <SheetHeader>
                          <SheetTitle>تفاصيل طلب الزواج</SheetTitle>
                        </SheetHeader>
                        {selectedRequest && (
                          <div className="mt-6 space-y-4">
                            {/* Request Details */}
                            <div className="space-y-4">
                              <div className="text-center">
                                <h3 className="font-semibold text-lg mb-2">
                                  طلب زواج
                                </h3>
                                {getStatusBadge(selectedRequest.status)}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    المرسل:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {selectedRequest.sender.fullName}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    المستقبل:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {selectedRequest.receiver.fullName}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    الرسالة:
                                  </label>
                                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                    {selectedRequest.message || "لا توجد رسالة"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    تاريخ الإرسال:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {getTimeAgo(selectedRequest.createdAt)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    انتهاء الصلاحية:
                                  </label>
                                  <p
                                    className={`text-sm ${selectedRequest.isExpired ? "text-red-600" : "text-orange-600"}`}
                                  >
                                    {getDaysUntilExpiry(
                                      selectedRequest.expiresAt,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {selectedRequest.status === "pending" && (
                              <div className="pt-4 space-y-2">
                                <Button
                                  variant="default"
                                  className="w-full"
                                  onClick={() => {
                                    handleApprove(selectedRequest._id || selectedRequest.id);
                                    setShowRequestDetails(false);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 ml-2" />
                                  قبول الطلب
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => {
                                    handleReject(selectedRequest._id || selectedRequest.id);
                                    setShowRequestDetails(false);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 ml-2" />
                                  رفض الطلب
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">من:</span>
                      <span className="font-medium">
                        {request.sender.fullName}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">إلى:</span>
                      <span className="font-medium">
                        {request.receiver.fullName}
                      </span>
                    </div>

                    {request.message && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <p className="text-gray-600 line-clamp-2">
                          {request.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{getTimeAgo(request.createdAt)}</span>
                      <span
                        className={
                          request.isExpired ? "text-red-600" : "text-orange-600"
                        }
                      >
                        {getDaysUntilExpiry(request.expiresAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
