"use client";

import { useState, useEffect, useCallback } from "react";
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
  AdminUser,
  PaginatedResponse,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import { AdminChatModal } from "./admin-chat-modal";
import { PublicProfileView } from "@/components/profile/public-profile-view";
import {
  Search,
  RefreshCw,
  Users,
  Eye,
  Shield,
  Ban,
  Trash2,
  Filter,
  Download,
  MoreVertical,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
} from "lucide-react";

interface SearchParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export function UsersManagement() {
  const [usersData, setUsersData] =
    useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState(""); // Local search input state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatUser, setChatUser] = useState<{ id: string; name: string } | null>(
    null,
  );

  // Debounced search effect
  useEffect(() => {
    console.log("[UsersManagement] Search input changed:", searchInput);
    const timer = setTimeout(() => {
      console.log(
        "[UsersManagement] Applying search after debounce:",
        searchInput,
      );
      setSearchParams((prev) => ({
        ...prev,
        search: searchInput.trim() || undefined,
        page: 1,
      }));
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    console.log("[UsersManagement] Search params changed:", searchParams);
    loadUsers();
  }, [searchParams]);

  const loadUsers = async () => {
    console.log("[UsersManagement] Loading users with params:", searchParams);
    setLoading(true);
    try {
      const response = await adminApiService.getUsers(
        searchParams.page,
        searchParams.limit,
        searchParams.search && searchParams.search.trim()
          ? searchParams.search.trim()
          : undefined,
        searchParams.status && searchParams.status !== "all"
          ? searchParams.status
          : undefined,
      );
      console.log("[UsersManagement] API response:", response);

      if (response.success && response.data) {
        console.log(
          "[UsersManagement] Users loaded:",
          response.data.items?.length,
          "users",
        );
        console.log(
          "[UsersManagement] Pagination data:",
          response.data.pagination,
        );
        setUsersData(response);
      } else {
        throw new Error("Failed to load users");
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Set empty data instead of mock data
      setUsersData({
        success: true,
        data: {
          items: [],
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "suspend" | "activate" | "verify" | "delete",
  ) => {
    setActionLoading(userId);
    try {
      const reason = `إجراء إداري - ${
        action === "suspend"
          ? "تم إيقاف الحساب"
          : action === "activate"
            ? "تم تفعيل الحساب"
            : action === "verify"
              ? "تم توثيق الحساب"
              : "تم حذف الحساب"
      }`;

      const response = await adminApiService.performUserAction(
        userId,
        action,
        reason,
      );

      if (response.success) {
        showToast.success(response.message || "تم تنفيذ العملية بنجاح");
        await loadUsers(); // Reload data
      } else {
        throw new Error(response.message || "فشل في تنفيذ العملية");
      }
    } catch (error: any) {
      console.error("Error performing user action:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev: SearchParams) => ({
      ...prev,
      page,
    }));
  };

  const handleLimitChange = (limit: number) => {
    setSearchParams((prev: SearchParams) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
    }));
  };

  const handleStartChat = (user: AdminUser) => {
    setChatUser({
      id: user.id || user._id,
      name: user.fullName || `${user.firstname} ${user.lastname}`,
    });
    setShowChatModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">معلق</Badge>;
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800">مدير</Badge>;
      case "moderator":
        return <Badge className="bg-blue-100 text-blue-800">مشرف</Badge>;
      case "user":
        return <Badge className="bg-gray-100 text-gray-800">مستخدم</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>;
    }
  };

  // Use API-filtered data directly
  const displayedUsers = usersData?.data?.items || [];

  const handleStatusFilter = (status: string) => {
    setSearchParams((prev) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      page: 1,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  إدارة المستخدمين
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  إجمالي المستخدمين: {usersData?.data?.pagination?.total || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh and export buttons hidden */}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Users Table */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg text-gray-600">
                جاري تحميل بيانات المستخدمين...
              </p>
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
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableHead className="text-right font-semibold">
                      المستخدم
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الحالة
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الدور
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      التحقق
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      آخر نشاط
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers?.map((user) => (
                    <TableRow
                      key={user.id || user._id}
                      className="group hover:bg-blue-50/50"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(user.fullName || user.firstname)
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.fullName ||
                                `${user.firstname} ${user.lastname}`}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.isEmailVerified && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              <Mail className="w-3 h-3 ml-1" />
                              إيميل
                            </Badge>
                          )}
                          {user.isPhoneVerified && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              <Phone className="w-3 h-3 ml-1" />
                              هاتف
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(
                            user.lastActiveAt || user.createdAt,
                          ).toLocaleDateString("ar-SA")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedUser(user)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent
                              side="left"
                              className="w-full sm:max-w-2xl overflow-y-auto"
                            >
                              <SheetHeader>
                                <SheetTitle>تفاصيل المستخدم</SheetTitle>
                              </SheetHeader>
                              {selectedUser && selectedUser.profile && (
                                <div className="mt-6">
                                  <PublicProfileView
                                    userId={selectedUser.id || selectedUser._id}
                                    isDialog={true}
                                    showPhotos={true}
                                  />
                                  <div className="mt-6 pt-4 border-t space-y-2">
                                    {selectedUser.status === "active" ? (
                                      <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() =>
                                          handleUserAction(
                                            selectedUser.id || selectedUser._id,
                                            "suspend",
                                          )
                                        }
                                        disabled={
                                          actionLoading ===
                                          (selectedUser.id || selectedUser._id)
                                        }
                                      >
                                        <Ban className="w-4 h-4 ml-2" />
                                        إيقاف المستخدم
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="default"
                                        className="w-full"
                                        onClick={() =>
                                          handleUserAction(
                                            selectedUser.id || selectedUser._id,
                                            "activate",
                                          )
                                        }
                                        disabled={
                                          actionLoading ===
                                          (selectedUser.id || selectedUser._id)
                                        }
                                      >
                                        <UserCheck className="w-4 h-4 ml-2" />
                                        تفعيل المستخدم
                                      </Button>
                                    )}
                                    {!selectedUser.profile?.verification
                                      ?.isVerified && (
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                          handleUserAction(
                                            selectedUser.id || selectedUser._id,
                                            "verify",
                                          )
                                        }
                                        disabled={
                                          actionLoading ===
                                          (selectedUser.id || selectedUser._id)
                                        }
                                      >
                                        <Shield className="w-4 h-4 ml-2" />
                                        توثيق الحساب
                                      </Button>
                                    )}
                                    <Button
                                      variant="default"
                                      className="w-full bg-purple-600 hover:bg-purple-700"
                                      onClick={() =>
                                        handleStartChat(selectedUser)
                                      }
                                    >
                                      <MessageCircle className="w-4 h-4 ml-2" />
                                      مراسلة المستخدم
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                          {user.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUserAction(user.id || user._id, "suspend")
                              }
                              disabled={actionLoading === (user.id || user._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUserAction(
                                  user.id || user._id,
                                  "activate",
                                )
                              }
                              disabled={actionLoading === (user.id || user._id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          {!user.profile?.verification?.isVerified && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUserAction(user.id || user._id, "verify")
                              }
                              disabled={actionLoading === (user.id || user._id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartChat(user)}
                            className="text-purple-600 hover:text-purple-800"
                            title="مراسلة المستخدم"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
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
            {displayedUsers?.map((user) => (
              <Card key={user.id || user._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(user.fullName || user.firstname)
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.fullName ||
                            `${user.firstname} ${user.lastname}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80">
                        <SheetHeader>
                          <SheetTitle>تفاصيل المستخدم</SheetTitle>
                        </SheetHeader>
                        {selectedUser && (
                          <div className="mt-6 space-y-4">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                {(
                                  selectedUser.fullName ||
                                  selectedUser.firstname
                                )
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </div>
                              <h3 className="font-semibold text-lg">
                                {selectedUser.fullName ||
                                  `${selectedUser.firstname} ${selectedUser.lastname}`}
                              </h3>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  الاسم الكامل:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.fullName ||
                                    `${selectedUser.firstname} ${selectedUser.lastname}`}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  الاسم الأول:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.firstname}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  الاسم الأخير:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.lastname}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  البريد الإلكتروني:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.email}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  رقم الهاتف:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.phone}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  الحالة:
                                </label>
                                <div className="mt-1">
                                  {getStatusBadge(selectedUser.status)}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  الدور:
                                </label>
                                <div className="mt-1">
                                  {getRoleBadge(selectedUser.role)}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  حالة التحقق:
                                </label>
                                <div className="flex gap-1 mt-1">
                                  {selectedUser.isEmailVerified && (
                                    <Badge className="bg-green-100 text-green-800">
                                      إيميل موثق
                                    </Badge>
                                  )}
                                  {selectedUser.isPhoneVerified && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      هاتف موثق
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  نشط:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.isActive ? "نعم" : "لا"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  مقفل:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {selectedUser.isLocked ? "نعم" : "لا"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  آخر نشاط:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {new Date(
                                    selectedUser.lastActiveAt,
                                  ).toLocaleString("ar-SA")}
                                </p>
                              </div>
                              {selectedUser.lastLoginAt && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    آخر تسجيل دخول:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {new Date(
                                      selectedUser.lastLoginAt,
                                    ).toLocaleString("ar-SA")}
                                  </p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  تاريخ الإنشاء:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {new Date(
                                    selectedUser.createdAt,
                                  ).toLocaleString("ar-SA")}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  تاريخ التحديث:
                                </label>
                                <p className="text-sm text-gray-900">
                                  {new Date(
                                    selectedUser.updatedAt,
                                  ).toLocaleString("ar-SA")}
                                </p>
                              </div>
                              {selectedUser.suspendedAt && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    تاريخ الإيقاف:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {new Date(
                                      selectedUser.suspendedAt,
                                    ).toLocaleString("ar-SA")}
                                  </p>
                                </div>
                              )}
                              {selectedUser.suspendedBy && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    تم الإيقاف بواسطة:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {selectedUser.suspendedBy}
                                  </p>
                                </div>
                              )}
                              {selectedUser.suspensionReason && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    سبب الإيقاف:
                                  </label>
                                  <p className="text-sm text-gray-900">
                                    {selectedUser.suspensionReason}
                                  </p>
                                </div>
                              )}
                              {selectedUser.profile &&
                                typeof selectedUser.profile === "string" && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      معرف الملف الشخصي:
                                    </label>
                                    <p className="text-sm text-gray-900">
                                      {selectedUser.profile}
                                    </p>
                                  </div>
                                )}
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  معرف المستخدم:
                                </label>
                                <p className="text-sm text-gray-900 break-all">
                                  {selectedUser.id || selectedUser._id}
                                </p>
                              </div>

                              {/* Profile Details Section */}
                              {selectedUser.profile &&
                                typeof selectedUser.profile === "object" && (
                                  <>
                                    <div className="pt-4 border-t">
                                      <h4 className="font-semibold text-gray-900 mb-3">
                                        معلومات الملف الشخصي
                                      </h4>
                                    </div>
                                    {selectedUser.profile.age && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          العمر:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.age} سنة
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.gender && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الجنس:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.gender === "m"
                                            ? "ذكر"
                                            : "أنثى"}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.country && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          البلد:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.country}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.city && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          المدينة:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.city}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.nationality && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الجنسية:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.nationality}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.maritalStatus && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الحالة الاجتماعية:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.maritalStatus}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.education && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          التعليم:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.education}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.occupation && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          المهنة:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.occupation}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.height && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الطول:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.height} سم
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.weight && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الوزن:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.weight} كجم
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.religiousLevel && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          المستوى الديني:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.religiousLevel}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.financialStatus && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الحالة المالية:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.financialStatus}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.housingStatus && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          حالة السكن:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.housingStatus}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.hasChildren !==
                                      undefined && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          لديه أطفال:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.hasChildren ===
                                          "yes"
                                            ? "نعم"
                                            : "لا"}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.childrenCount && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          عدد الأطفال:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.childrenCount}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile
                                      .personalityDescription &&
                                      typeof selectedUser.profile
                                        .personalityDescription ===
                                        "string" && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">
                                            وصف الشخصية:
                                          </label>
                                          <p className="text-sm text-gray-900">
                                            {
                                              selectedUser.profile
                                                .personalityDescription
                                            }
                                          </p>
                                        </div>
                                      )}
                                    {selectedUser.profile.aboutMe &&
                                      typeof selectedUser.profile.aboutMe ===
                                        "string" && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">
                                            عني:
                                          </label>
                                          <p className="text-sm text-gray-900">
                                            {selectedUser.profile.aboutMe}
                                          </p>
                                        </div>
                                      )}
                                    {selectedUser.profile.interests &&
                                      Array.isArray(
                                        selectedUser.profile.interests,
                                      ) &&
                                      selectedUser.profile.interests.length >
                                        0 && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">
                                            الاهتمامات:
                                          </label>
                                          <p className="text-sm text-gray-900">
                                            {selectedUser.profile.interests.join(
                                              ", ",
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    {selectedUser.profile.smokingStatus && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          التدخين:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.smokingStatus}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.hasBeard !==
                                      undefined && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          لديه لحية:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.hasBeard
                                            ? "نعم"
                                            : "لا"}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.monthlyIncome && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الدخل الشهري:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.monthlyIncome}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile.isComplete !==
                                      undefined && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          الملف مكتمل:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {selectedUser.profile.isComplete
                                            ? "نعم"
                                            : "لا"}
                                        </p>
                                      </div>
                                    )}
                                    {selectedUser.profile
                                      .completionPercentage !== undefined && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          نسبة الاكتمال:
                                        </label>
                                        <p className="text-sm text-gray-900">
                                          {
                                            selectedUser.profile
                                              .completionPercentage
                                          }
                                          %
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                            </div>

                            <div className="pt-4 space-y-2">
                              {selectedUser.status === "active" ? (
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() =>
                                    handleUserAction(
                                      selectedUser.id || selectedUser._id,
                                      "suspend",
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    (selectedUser.id || selectedUser._id)
                                  }
                                >
                                  <Ban className="w-4 h-4 ml-2" />
                                  إيقاف المستخدم
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  className="w-full"
                                  onClick={() =>
                                    handleUserAction(
                                      selectedUser.id || selectedUser._id,
                                      "activate",
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    (selectedUser.id || selectedUser._id)
                                  }
                                >
                                  <UserCheck className="w-4 h-4 ml-2" />
                                  تفعيل المستخدم
                                </Button>
                              )}
                              {!selectedUser.profile?.verification
                                ?.isVerified && (
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() =>
                                    handleUserAction(
                                      selectedUser.id || selectedUser._id,
                                      "verify",
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    (selectedUser.id || selectedUser._id)
                                  }
                                >
                                  <Shield className="w-4 h-4 ml-2" />
                                  توثيق الحساب
                                </Button>
                              )}
                              <Button
                                variant="default"
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={() => {
                                  handleStartChat(selectedUser);
                                  setShowMobileDetails(false);
                                }}
                              >
                                <MessageCircle className="w-4 h-4 ml-2" />
                                مراسلة المستخدم
                              </Button>
                            </div>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {getStatusBadge(user.status)}
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex gap-1">
                      {user.isEmailVerified && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 text-xs"
                        >
                          <Mail className="w-3 h-3" />
                        </Badge>
                      )}
                      {user.isPhoneVerified && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 text-xs"
                        >
                          <Phone className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {usersData?.data?.pagination &&
        usersData.data.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              onClick={() => handlePageChange(1)}
              disabled={usersData.data.pagination.page === 1}
              variant="outline"
              size="sm"
            >
              الأولى
            </Button>
            <Button
              onClick={() =>
                handlePageChange(usersData.data.pagination.page - 1)
              }
              disabled={usersData.data.pagination.page === 1}
              variant="outline"
              size="sm"
            >
              السابق
            </Button>
            <span className="px-4 py-2 text-sm">
              صفحة {usersData.data.pagination.page} من{" "}
              {usersData.data.pagination.totalPages}
            </span>
            <Button
              onClick={() =>
                handlePageChange(usersData.data.pagination.page + 1)
              }
              disabled={
                usersData.data.pagination.page >=
                usersData.data.pagination.totalPages
              }
              variant="outline"
              size="sm"
            >
              التالي
            </Button>
            <Button
              onClick={() =>
                handlePageChange(usersData.data.pagination.totalPages)
              }
              disabled={
                usersData.data.pagination.page >=
                usersData.data.pagination.totalPages
              }
              variant="outline"
              size="sm"
            >
              الأخيرة
            </Button>
          </div>
        )}

      {/* Total Count */}
      {usersData?.data?.pagination && usersData.data.pagination.total > 0 && (
        <div className="text-center text-sm text-gray-600 mt-4">
          عرض {displayedUsers?.length || 0} من {usersData.data.pagination.total}{" "}
          مستخدم
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedUsers?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد نتائج
                </h3>
                <p className="text-gray-500">
                  {searchParams.search
                    ? `لم يتم العثور على مستخدمين يطابقون "${searchParams.search}"`
                    : "لا توجد مستخدمين مطابقين للفلتر المحدد"}
                </p>
              </div>
              {searchParams.search && (
                <Button variant="outline" onClick={() => setSearchInput("")}>
                  مسح البحث
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Chat Modal */}
      <AdminChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setChatUser(null);
        }}
        userId={chatUser?.id || null}
        userName={chatUser?.name || null}
      />
    </div>
  );
}
