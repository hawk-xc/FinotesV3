import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./auth/LoginPage";
import BottomNavigation from "./layout/BottomNavigation";
import ChatbotSection from "./sections/ChatbotSection";
import FinanceSection from "./sections/FinanceSection";
import ProfileSection from "./sections/ProfileSection";

function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chatbot");
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;

    setIsLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, 200);
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case "chatbot":
        return <ChatbotSection />;
      case "finance":
        return <FinanceSection />;
      case "profile":
        return <ProfileSection />;
      default:
        return <ChatbotSection />;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden pb-20">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderActiveSection()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default Home;
