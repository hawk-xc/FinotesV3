import React from "react";
import { motion } from "framer-motion";
import { Edit, LogOut, Settings, Bell, Shield, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ProfileSection = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: Edit,
      label: "Edit Profile",
      action: () => console.log("Edit profile"),
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => console.log("Settings"),
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => console.log("Notifications"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      action: () => console.log("Privacy"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      action: () => console.log("Help"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold"
            >
              {user?.name?.charAt(0) || "A"}
            </motion.div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {user?.name || "Admin User"}
              </h3>
              <p className="text-gray-600">
                {user?.email || "admin@gmail.com"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Member since January 2024
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">156</p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">$2,450</p>
              <p className="text-sm text-gray-600">Saved This Month</p>
            </div>
          </motion.div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="flex-1 font-medium text-gray-800">
                  {item.label}
                </span>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-auto p-4 bg-white border-t border-gray-200">
        <Button
          onClick={logout}
          variant="destructive"
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;
