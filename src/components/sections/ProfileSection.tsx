'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, LogOut, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GoogleLogo from "../particles/GoogleLogo";

const ProfileSection = (): React.JSX.Element => {
  const { user, logout } = useAuth();
  const [loveCounter, setLoveCounter] = useState<number>(0);
  const [transaction, setTransaction] = useState<number>(0);
  const [amountTotal, setAmountTotal] = useState<number>(0);

  const navigate = useNavigate();

  // handle transaction && total asset
  const handleGeneralInformation = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_API_SERVICE}/${user.uid}/finance-records`);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
      }

      const { data } = await response.json();

      let total = 0;
      let amount = 0;

      data.forEach((record: any) => {
        amount += record?.amount ?? 0;
        total += 1;
      });

      setTransaction(total);
      setAmountTotal(amount);

    } catch (error) {
      console.error(error);
      return false;
    }
  };


  // love counter
  const handleLoveCounter = async () => {
    try {
      setLoveCounter((prev) => prev + 1);
      return true;
    }
    catch (error) {
      return false;
    }
  }

  // route to about
  const routeToAbout = () => {
    navigate('about-developer');
  }

  // rupiah format
  const formatFriendlyRupiah = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} M`;
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`;
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1).replace(/\.0$/, '')} Ribu`;
    } else {
      return `${amount}`;
    }
  };

  const formatFirebaseDate = (dateString: string | undefined, prefix: string = 'Bergabung sejak') => {
    if (!dateString) return `${prefix} -`;
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return `${prefix} -`;

    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${prefix} ${month} ${year}`;
  };

  useEffect(() => {
    handleGeneralInformation();
  }, []);

  const menuItems = [
    {
      icon: Heart,
      label: "Suka aplikasi ini",
      handler: handleLoveCounter
    },
    {
      icon: Brain,
      label: "Kenalan dengan Programmer",
      handler: routeToAbout
    }
  ];

  return (
    <div className="flex flex-col overflow-y-auto h-full bg-gray-50 ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800">Profil</h2>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold"
            >
              {/* user photo */}
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  referrerPolicy="no-referrer" 
                  alt="Profile"
                  className="aspect-square rounded-full"
                />
              ) : user?.name?.charAt(0) || "A"}
            </motion.div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {user?.name || "Admin User"}
              </h3>
              <p className="text-gray-600">
                {user?.email || "admin.exa@gmail.com"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatFirebaseDate(user?.metadata?.creationTime)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3 mb-4">
          <motion.button
            key='account-login-info'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gray-100 p-2 rounded-full flex items-center justify-center">
              <GoogleLogo alt="google-logo.profile" className="w-6 aspect-square" />
            </div>
            <span className="flex-1 font-medium text-gray-800">
              Bergabung menggunakan Google
            </span>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{transaction}</p>
              <p className="text-sm text-gray-600">Transaksi</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatFriendlyRupiah(amountTotal)}</p>
              <p className="text-sm text-gray-600">Total Asset</p>
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
                onClick={item.handler}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center space-x-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {item.icon === Heart && loveCounter > 0 ? (
                    <Icon className="w-5 h-5 text-red-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <span className="flex-1 font-medium text-gray-800">
                  {item.label}
                </span>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                {item.icon === Heart && loveCounter > 0 && (
                  <span className="font-bold text-sm text-slate-500">
                    {loveCounter}x
                  </span>)}
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
