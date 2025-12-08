"use client";

import { X, Flag, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ChatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReportDialogOpen: () => void;
}

export function ChatMenu({
  isOpen,
  onClose,
  onReportDialogOpen,
}: ChatMenuProps) {
  if (!isOpen) return null;

  const handleReport = () => {
    onClose(); // Close the main menu first
    onReportDialogOpen(); // Open report dialog from parent
  };

  const handleEndChat = () => {
    // Implementation for ending chat
    alert("سيتم إنهاء المحادثة");
  };

  const handleExtendChat = () => {
    // Implementation for extending chat duration
    alert("سيتم تمديد مدة المحادثة");
  };

  return (
    <>
      {/* Main Chat Menu - Only render when isOpen is true */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Mobile: Bottom sheet, Desktop: Center modal */}
        <Card
          className="w-full sm:w-full sm:max-w-md rounded-t-xl sm:rounded-xl mx-0 sm:mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-base sm:text-lg font-semibold">
              خيارات المحادثة
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 pb-6">
            <Button
              variant="outline"
              className="w-full justify-start text-sm sm:text-base py-3 sm:py-2"
              onClick={handleExtendChat}
            >
              <Clock className="h-4 w-4 ml-2" />
              تمديد مدة المحادثة
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-sm sm:text-base py-3 sm:py-2"
              onClick={handleReport}
            >
              <Flag className="h-4 w-4 ml-2" />
              إبلاغ عن مشكلة
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm sm:text-base py-3 sm:py-2"
              onClick={handleEndChat}
            >
              <Shield className="h-4 w-4 ml-2" />
              إنهاء المحادثة
            </Button>

            {/* Mobile: Add cancel button */}
            <Button
              variant="ghost"
              className="w-full sm:hidden mt-4 py-3"
              onClick={onClose}
            >
              إلغاء
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
