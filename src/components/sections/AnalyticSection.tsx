'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ParentSize } from "@visx/responsive";
import AreaClosedChart from "@/components/particles/AreaClosedChart";

import ChartLoading from "@/components/particles/ChartLoading";

// get user auth data
import { useAuth } from "@/contexts/AuthContext";

interface FinanceData {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

interface categoryData {
  id: string;
  user_id: string;
  category: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

const AnalyticSection = (): React.JSX.Element => {
  const [financeData, setFinanceData] = useState<FinanceData[]>([]); 
  const [filteredData, setFilteredData] = useState<FinanceData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  /**
   * Fetches financial records from the Firestore database, updates the financeData state
   * with the retrieved records, and manages the loading state while data is being fetched.
   * Sets isLoading to true when starting the data fetch and false when data fetching completes.
   */
  const fetchFinanceData = async (): Promise<void> => {
    const resp = await fetch(`https://finoteapiservice-production.up.railway.app/${user.uid}/finance-records`);
    const { data } = await resp.json();

    setFinanceData(data);
    setFilteredData(data); // Initialize filteredData with all data
    setIsLoading(false);

    calculateCategoryData(data);
  }

  const calculateCategoryData = (transactions: any[]) => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Gunakan initial value yang sama dengan state awal
    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category.toLowerCase();
      const amount = Math.abs(transaction.amount);

      // Pastikan kategori yang valid, default ke 'lainnya' jika tidak ada
      const validCategories = ['makanan', 'transportasi', 'sewa', 'belanja', 'kesehatan', 'hiburan'];
      const key = validCategories.includes(category) ? category : 'lainnya';

      return {
        ...acc,
        [key]: acc[key] + amount
      };
    }, {
      'makanan': 0,
      'transportasi': 0,
      'sewa': 0,
      'belanja': 0,
      'kesehatan': 0,
      'hiburan': 0,
      'lainnya': 0
    });

    // Hitung persentase
    const categoryPercentages = Object.fromEntries(
      Object.entries(categoryTotals).map(([category, amount]) => [
        category,
        totalExpense > 0 ? Math.round((amount as number / totalExpense) * 100) : 0
      ])
    );

    setCategoryData(categoryPercentages);
  }

  // Utility functions (put these outside your component)
  const calculateDailyAverage = (transactions: any[], type: 'expense' | 'income') => {
    const filtered = transactions.filter(t => t.type === type && t.timestamp?.seconds);
    if (filtered.length === 0) return 0;

    const groupedByDate = new Map<string, number>();

    filtered.forEach(t => {
      const dateKey = new Date(t.timestamp.seconds * 1000).toISOString().split('T')[0];
      groupedByDate.set(dateKey, (groupedByDate.get(dateKey) || 0) + Math.abs(t.amount || 0));
    });

    const totalAmount = [...groupedByDate.values()].reduce((sum, val) => sum + val, 0);
    const totalDays = groupedByDate.size;

    return totalAmount / totalDays;
  };

  const calculateMonthlyAverage = (transactions: any[], type: 'expense' | 'income') => {
    const filtered = transactions.filter(t => t.type === type && t.timestamp?.seconds);
    if (filtered.length === 0) return 0;

    const groupedByMonth = new Map<string, number>();

    filtered.forEach(t => {
      const date = new Date(t.timestamp.seconds * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      groupedByMonth.set(monthKey, (groupedByMonth.get(monthKey) || 0) + Math.abs(t.amount || 0));
    });

    const totalAmount = [...groupedByMonth.values()].reduce((sum, val) => sum + val, 0);
    const totalMonths = groupedByMonth.size;

    return totalAmount / totalMonths;
  };

  const calculateExpensePercentage = (transactions: any[]) => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalIncome === 0) return 0;
    return (totalExpense / totalIncome) * 100;
  };

  useEffect(() => { 
    setIsLoading(true); // start loading
    fetchFinanceData();
  }, []);

  useEffect(() => {
    let result = [...financeData];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(item => item.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    
    // Apply search term
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
          return b.timestamp.seconds - a.timestamp.seconds;
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
  } 

  const totalIncome = incomeTransactions.length
    ? incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  const totalExpenses = expenseTransactions.length
    ? expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    : 0;

  const balance = totalIncome - totalExpenses;

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
      <div className="w-full h-[250px] bg-white rounded-lg shadow-sm p-4">
        <span>Diagram pengeluaran</span>
        {!isLoading ? (
          <ParentSize>
            {({ width, height }) => {
              if (width > 0 && height > 0 && isLoading) {
                setIsLoading(false);
              }
              return <AreaClosedChart 
                width={width} 
                height={height} 
                data={financeData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              />;
            }}
          </ParentSize>
        ) : (
          <ChartLoading />
        )}
      </div>
    </div>
  );
};

export default AnalyticSection;
