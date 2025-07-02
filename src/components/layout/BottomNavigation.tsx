import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Table, User, ChartArea } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: "chatbot", label: "Chatbot", icon: MessageCircle },
    { id: "finance", label: "Catatan", icon: Table },
    { id: "analytic", label: "Analitik", icon: ChartArea },
    { id: "profile", label: "Profil", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center px-4 rounded-xl transition-all duration-200 ${
                isActive ? "text-indigo-600" : "text-gray-500"
              }`}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className={`p-2 rounded-full ${
                  isActive ? "bg-indigo-100" : "bg-transparent"
                }`}
                animate={{
                  backgroundColor: isActive ? "#e0e7ff" : "transparent",
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={20} />
              </motion.div>
              <span className="text-xs font-medium mt-1">{tab.label}</span>
              {isActive && (
                <motion.div
                  className="w-1 h-1 bg-indigo-600 rounded-full mt-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
