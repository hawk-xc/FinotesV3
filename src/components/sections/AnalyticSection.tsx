'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ParentSize } from "@visx/responsive";
import AreaClosedChart from "@/components/particles/AreaClosedChart";
import ChartLoading from "@/components/particles/ChartLoading";
import { useAuth } from "@/contexts/AuthContext";

interface FinanceData {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface categoryData {
  id: string;
  user_id: string;
  category: string;
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
}

const AnalyticSection = (): React.JSX.Element => {
  const [financeData, setFinanceData] = useState<FinanceData[]>([]); 
  const [filteredData, setFilteredData] = useState<FinanceData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");
  const [categoryData, setCategoryData] = useState<{ [key: string]: number }>({
    'makanan': 0,
    'transportasi': 0,
    'sewa': 0,
    'belanja': 0,
    'kesehatan': 0,
    'hiburan': 0,
    'lainnya': 0
  });

  const { user } = useAuth();

  const fetchFinanceData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const resp = await fetch(`https://finoteapiservice-production.up.railway.app/${user.uid}/finance-records`);
      const { data } = await resp.json();
      
      setFinanceData(data);
      setFilteredData(data);
      calculateCategoryData(data);
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCategoryData = (transactions: FinanceData[]) => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category.toLowerCase();
      const amount = Math.abs(transaction.amount);

      const validCategories = ['makanan', 'transportasi', 'sewa', 'belanja', 'kesehatan', 'hiburan'];
      const key = validCategories.includes(category) ? category : 'lainnya';

      return {
        ...acc,
        [key]: (acc[key] || 0) + amount
      };
    }, {} as Record<string, number>);

    const categoryPercentages = Object.fromEntries(
      Object.entries(categoryTotals).map(([category, amount]) => [
        category,
        totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      ])
    );

    setCategoryData(prev => ({
      ...{
        'makanan': 0,
        'transportasi': 0,
        'sewa': 0,
        'belanja': 0,
        'kesehatan': 0,
        'hiburan': 0,
        'lainnya': 0
      },
      ...categoryPercentages
    }));
  };

  const calculateDailyAverage = (transactions: FinanceData[], type: 'expense' | 'income') => {
    const filtered = transactions.filter(t => t.type === type && t.timestamp?._seconds);
    if (filtered.length === 0) return 0;

    const groupedByDate = new Map<string, number>();

    filtered.forEach(t => {
      const dateKey = new Date(t.timestamp._seconds * 1000).toISOString().split('T')[0];
      groupedByDate.set(dateKey, (groupedByDate.get(dateKey) || 0) + Math.abs(t.amount || 0));
    });

    const totalAmount = [...groupedByDate.values()].reduce((sum, val) => sum + val, 0);
    const totalDays = groupedByDate.size;

    return totalDays > 0 ? totalAmount / totalDays : 0;
  };

  const calculateMonthlyAverage = (transactions: FinanceData[], type: 'expense' | 'income') => {
    const filtered = transactions.filter(t => t.type === type && t.timestamp?._seconds);
    if (filtered.length === 0) return 0;

    const groupedByMonth = new Map<string, number>();

    filtered.forEach(t => {
      const date = new Date(t.timestamp._seconds * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      groupedByMonth.set(monthKey, (groupedByMonth.get(monthKey) || 0) + Math.abs(t.amount || 0));
    });

    const totalAmount = [...groupedByMonth.values()].reduce((sum, val) => sum + val, 0);
    const totalMonths = groupedByMonth.size;

    return totalMonths > 0 ? totalAmount / totalMonths : 0;
  };

  const calculateExpensePercentage = (transactions: FinanceData[]) => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpense = Math.abs(transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0));

    if (totalIncome === 0) return 0;
    return (totalExpense / totalIncome) * 100;
  };

  useEffect(() => { 
    if (user?.uid) {
      fetchFinanceData();
    }
  }, [user?.uid]);

  useEffect(() => {
    let result = [...financeData];
    
    if (categoryFilter !== "all") {
      result = result.filter(item => item.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.description.toLowerCase().includes(term) || 
        item.category.toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "description":
          return a.description.localeCompare(b.description);
        case "date":
        default:
          return b.timestamp._seconds - a.timestamp._seconds;
      }
    });
    
    setFilteredData(result);
  }, [financeData, categoryFilter, searchTerm, sortBy]);

  const incomeTransactions = filteredData.filter((t) => t.type === "income");
  const expenseTransactions = filteredData.filter((t) => t.type === "expense");

  const formatIntoRupiah = (amount: number) => {
    return Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalIncome = incomeTransactions.length
    ? incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  const totalExpenses = expenseTransactions.length
    ? expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    : 0;

  const balance = totalIncome - totalExpenses;

  // Format data untuk chart
  const prepareChartData = (data: FinanceData[]) => {
    const expenseData = data.filter(t => t.type === 'expense' && t.timestamp?._seconds);
    
    return expenseData.map(t => ({
      date: new Date(t.timestamp._seconds * 1000),
      amount: Math.abs(t.amount),
      category: t.category
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-scroll">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Analitik Keuangan
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-50 p-3 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium flex flex-row gap-2">Pemasukan <TrendingUp className="w-4 h-4 text-green-600" /></p>
                <p className="text-xs font-bold text-green-700 flex flex-row gap-1">
                  <span>{formatIntoRupiah(totalIncome)}</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-50 p-3 rounded-xl border border-red-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium flex flex-row gap-1">Pengeluaran <TrendingDown className="w-4 h-4 text-red-600" /></p>
                <p className="text-xs font-bold text-red-700 flex flex-row gap-1">
                  <span>{formatIntoRupiah(totalExpenses)}</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-3 rounded-xl border ${
              balance >= 0
                ? "bg-blue-50 border-blue-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-medium ${
                    balance >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  Selisih
                </p>
                <p
                  className={`text-xs font-bold ${
                    balance >= 0 ? "text-blue-700" : "text-orange-700"
                  }`}
                >
                  {formatIntoRupiah(balance)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Updated Analytics Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-50 p-3 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Rata-rata pengeluaran / hari</p>
                <p className="text-xs font-bold text-green-700">
                  {formatIntoRupiah(calculateDailyAverage(financeData, 'expense'))}
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-50 p-3 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Rata-rata pengeluaran / Bulan</p>
                <p className="text-xs font-bold text-green-700">
                  {formatIntoRupiah(calculateMonthlyAverage(financeData, 'expense'))}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.006 }}
            className="bg-orange-50 p-3 rounded-xl border border-orange-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium">Persentase pengeluaran dari pemasukan</p>
                <p className="text-lg font-bold text-orange-700">
                  {Math.round(calculateExpensePercentage(financeData))}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.006 }}
            className="bg-green-50 p-3 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium">Persentase Pengeluaran berdasarkan Kategori</p>
                <p className="text-sm mt-3 text-orange-700 flex flex-col gap-1">
                  <span>🍕 Makanan: {categoryData.makanan}%</span>
                  <span>🚗 Transportasi: {categoryData.transportasi}%</span>
                  <span>🏠 Sewa: {categoryData.sewa}%</span>
                  <span>🛒 Belanja: {categoryData.belanja}%</span>
                  <span>🏥 Kesehatan: {categoryData.kesehatan}%</span>
                  <span>🎮 Hiburan: {categoryData.hiburan}%</span>
                  <span>📦 Lainnya: {categoryData.lainnya}%</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="w-full h-[230px] bg-white rounded-lg shadow-sm p-4 mb-3">
        <span className="text-sm font-medium text-gray-700">Diagram Pengeluaran</span>
        {!isLoading ? (
          <ParentSize>
            {({ width, height }) => (
              <AreaClosedChart 
                width={width} 
                height={height - 30} // Adjust for title space
                data={prepareChartData(financeData)}
                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
              />
            )}
          </ParentSize>
        ) : (
          <ChartLoading />
        )}
      </div>
    </div>
  );
};

export default AnalyticSection;