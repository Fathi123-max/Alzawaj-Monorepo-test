"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UsersManagement } from "@/components/admin/users-management";
import { RequestsTable } from "@/components/admin/requests-table";
import { FlaggedList } from "@/components/admin/flagged-list";
import { ChatOverviewPanel } from "@/components/admin/chat-overview-panel";
import { ReportTable } from "@/components/admin/report-table";
import { SettingsForm } from "@/components/admin/settings-form";
import { NotificationsBox } from "@/components/admin/notifications-box";
import {
  adminApiService,
  AdminStats,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import { useAuth } from "@/providers/auth-provider";
import {
  Users,
  Heart,
  AlertTriangle,
  MessageCircle,
  FileText,
  Bell,
  Settings,
  RefreshCw,
  Shield,
  TrendingUp,
  Menu,
  ChevronRight,
  MoreVertical,
  Activity,
  BarChart3,
  Database,
  LogOut,
} from "lucide-react";

const adminTabs = [
  {
    id: "users",
    label: "المستخدمين",
    icon: <Users className="w-4 h-4" />,
    description: "إدارة حسابات المستخدمين والملفات الشخصية",
    count: "totalUsers",
  },
  // {
  //   id: "requests",
  //   label: "طلبات الزواج",
  //   icon: <Heart className="w-4 h-4" />,
  //   description: "مراجعة والموافقة على طلبات الزواج",
  //   count: "pendingRequests",
  // },
  {
    id: "messages",
    label: "الرسائل المبلغ عنها",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "مراجعة الرسائل والمحتوى المبلغ عنه",
    count: "flaggedMessages",
  },
  {
    id: "chats",
    label: "المحادثات النشطة",
    icon: <MessageCircle className="w-4 h-4" />,
    description: "مراقبة المحادثات والأنشطة الحالية",
    count: "activeChats",
  },
  // Hidden tabs
  // {
  //   id: "reports",
  //   label: "التقارير والإحصائيات",
  //   icon: <BarChart3 className="w-4 h-4" />,
  //   description: "عرض التقارير التفصيلية والتحليلات",
  //   count: "totalReports",
  // },
  // {
  //   id: "notifications",
  //   label: "الإشعارات",
  //   icon: <Bell className="w-4 h-4" />,
  //   description: "إدارة الإشعارات والتنبيهات",
  //   count: "notifications",
  // },
  // {
  //   id: "settings",
  //   label: "إعدادات النظام",
  //   icon: <Settings className="w-4 h-4" />,
  //   description: "تكوين إعدادات المنصة والنظام",
  //   count: null,
  // },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, isAuthenticated, isInitialized, user } = useAuth();

  const loadStats = async () => {
    // Wait for auth to be initialized before making API calls
    if (!isInitialized) {
      console.log(
        "🔍 AdminDashboard: Auth not initialized yet, skipping stats load",
      );
      return;
    }

    // Check if user is authenticated and has admin role
    if (!isAuthenticated || !user) {
      console.log("🔍 AdminDashboard: Not authenticated, skipping stats load");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Verify user has admin role
    if (user.role !== "admin" && user.role !== "moderator") {
      console.error("❌ AdminDashboard: User is not admin:", user.role);
      showToast.error("غير مصرح لك بالوصول إلى لوحة الإدارة");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log("🔍 AdminDashboard: User authenticated with role:", user.role);
    console.log("🔍 AdminDashboard: Attempting to load admin stats...");

    try {
      const response = await adminApiService.getAdminStats();
      if (response.success && response.data) {
        setStats(response);
      } else {
        throw new Error("Failed to load admin stats");
      }
    } catch (error: any) {
      console.error("Error loading admin stats:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Set empty stats instead of fake data
      setStats({
        success: true,
        data: {
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          totalRequests: 0,
          pendingRequests: 0,
          acceptedRequests: 0,
          activeChats: 0,
          pendingMessages: 0,
          flaggedMessages: 0,
          totalReports: 0,
          pendingReports: 0,
        },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Error signing out:", error);
      showToast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  // Load stats when auth is initialized and user is available
  useEffect(() => {
    if (isInitialized) {
      console.log("🔍 AdminDashboard: Auth initialized, loading stats...");
      loadStats();
    }
  }, [isInitialized]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>لوحة التحكم</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  {adminTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className="justify-start gap-3 h-auto p-4"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">{tab.icon}</div>
                        <div className="flex-1 text-right">
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {tab.description}
                          </div>
                          {tab.count && stats?.data && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {tab.count === "notifications"
                                ? stats.data.notifications?.unread || 0
                                : (stats.data[
                                    tab.count as keyof typeof stats.data
                                  ] as number) || 0}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Button>
                  ))}
                  <div className="border-t mt-4 pt-4">
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-3 h-auto p-4"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <div className="flex-1 text-right">
                        <div className="font-medium">تسجيل الخروج</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          إنهاء الجلسة الحالية
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold text-gray-900">لوحة المشرف</h1>
              <p className="text-sm text-muted-foreground">إدارة المنصة</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="icon"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={handleSignOut} variant="destructive" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              لوحة تحكم المشرف
            </h1>
            <p className="text-gray-600 text-lg">
              إدارة ومراقبة منصة الزواج الإسلامية
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {(!isInitialized || !isAuthenticated) && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">
              {!isInitialized
                ? "جارٍ التحقق من البيانات..."
                : !isAuthenticated
                  ? "جارٍ تسجيل الدخول..."
                  : "جارٍ التحميل..."}
            </p>
          </div>
        )}

        {/* Main Dashboard Content - Only show when auth is ready */}
        {isInitialized &&
          isAuthenticated &&
          user &&
          (user.role === "admin" || user.role === "moderator") && (
            <>
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {loading ? (
                  // Enhanced Loading skeleton
                  Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                          <div className="text-right space-y-2">
                            <div className="w-16 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-16 h-3 bg-gray-100 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-gradient-to-r from-blue-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                              {stats?.data?.totalUsers || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              إجمالي المستخدمين
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700"
                              >
                                نشط: {stats?.data?.activeUsers || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600 bg-gradient-to-r from-green-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                              {Math.round(
                                (stats?.data?.activeUsers || 0) * 0.8,
                              )}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              ملفات موثقة
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-700"
                              >
                                {Math.round(
                                  (((stats?.data?.activeUsers || 0) * 0.8) /
                                    (stats?.data?.totalUsers || 1)) *
                                    100,
                                )}
                                %
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-pink-500 hover:border-l-pink-600 bg-gradient-to-r from-pink-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Heart className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">
                              {stats?.data?.pendingRequests || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              طلبات زواج معلقة
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-2 text-xs">
                              <Badge variant="outline" className="bg-gray-50">
                                إجمالي: {stats?.data?.totalRequests || 0}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                              >
                                مقبولة: {stats?.data?.acceptedRequests || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    {/* Hidden sections: رسائل معلقة, تقارير معلقة */}
                    {/* <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:border-l-purple-600 bg-gradient-to-r from-purple-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <MessageCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                              {stats?.data?.pendingMessages || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              رسائل معلقة
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-2 text-xs">
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                              >
                                نشط: {stats?.data?.activeChats || 0}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="bg-red-100 text-red-700"
                              >
                                مبلغ: {stats?.data?.flaggedMessages || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 hover:border-l-red-600 bg-gradient-to-r from-red-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                              {stats?.data?.pendingReports || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              تقارير معلقة
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-100 text-red-700"
                              >
                                إجمالي: {stats?.data?.totalReports || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card> */}

                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:border-l-orange-600 bg-gradient-to-r from-orange-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                              {stats?.data?.newUsersToday || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              مستخدمون جدد اليوم
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 text-orange-700"
                              >
                                نمو:{" "}
                                {stats?.data?.totalUsers
                                  ? Math.round(
                                      (stats.data.newUsersToday /
                                        stats.data.totalUsers) *
                                        100 *
                                        100,
                                    ) / 100
                                  : 0}
                                %
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    {/* Hidden sections: إشعارات غير مقروءة, إجمالي البيانات */}
                    {/* <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500 hover:border-l-indigo-600 bg-gradient-to-r from-indigo-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Bell className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                              {stats?.data?.notifications?.unread || 0}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              إشعارات غير مقروءة
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-indigo-100 text-indigo-700"
                              >
                                إجمالي: {stats?.data?.notifications?.total || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-teal-500 hover:border-l-teal-600 bg-gradient-to-r from-teal-50/50 to-white overflow-hidden relative">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                              {Math.round(
                                (stats?.data?.pendingReports || 0) * 3.5,
                              )}
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              إجمالي البيانات
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-teal-100 text-teal-700"
                              >
                                معالجة:{" "}
                                {Math.round(
                                  (stats?.data?.pendingReports || 0) * 2.5,
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </CardContent>
                    </Card> */}
                  </>
                )}
              </div>

              {/* Enhanced Tabs Section */}
              <div className="mb-8">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="hidden lg:block">
                    <TabsList className="grid w-full grid-cols-7 h-auto p-1 bg-muted/30 rounded-xl">
                      {adminTabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            {tab.icon}
                            <span className="font-medium text-sm">
                              {tab.label}
                            </span>
                          </div>
                          {tab.count && stats?.data && (
                            <Badge variant="secondary" className="text-xs">
                              {tab.count === "notifications"
                                ? stats.data.notifications?.unread || 0
                                : (stats.data[
                                    tab.count as keyof typeof stats.data
                                  ] as number) || 0}
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Mobile Tab Navigation */}
                  <div className="lg:hidden">
                    <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-sm border">
                      <div className="flex items-center gap-3 flex-1">
                        {adminTabs.find((tab) => tab.id === activeTab)?.icon}
                        <div>
                          <h3 className="font-medium">
                            {
                              adminTabs.find((tab) => tab.id === activeTab)
                                ?.label
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {
                              adminTabs.find((tab) => tab.id === activeTab)
                                ?.description
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMobileMenuOpen(true)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-8">
                    <TabsContent value="users">
                      <UsersManagement />
                    </TabsContent>
                    <TabsContent value="requests">
                      <RequestsTable />
                    </TabsContent>
                    <TabsContent value="messages">
                      <ReportTable />
                    </TabsContent>
                    <TabsContent value="chats">
                      <ChatOverviewPanel />
                    </TabsContent>
                    <TabsContent value="reports">
                      <ReportTable />
                    </TabsContent>
                    <TabsContent value="notifications">
                      <NotificationsBox />
                    </TabsContent>
                    <TabsContent value="settings">
                      <SettingsForm />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
