'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

interface FinanceData {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: "expense" | "income";
}

const FinanceSection = () => {
  const [financeData, setFinanceData] = useState<FinanceData[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  /**
   * Fetches financial records from the Firestore database, updates the financeData state
   * with the retrieved records, and manages the loading state while data is being fetched.
   * Sets isLoading to true when starting the data fetch and false when data fetching completes.
   */
  const fetchFinanceData = async () => {
    const q = query(collection(db, 'financial_records'));
    const querySnapshot = await getDocs(q);

    const data = [];

    querySnapshot.forEach((doc) => {
      data.push({id: doc.id, ...doc.data()});

      setFinanceData(data);
    })
    setIsLoading(false); // end loading
  }

  useEffect(() => { 
    setIsLoading(true); // start loading
    fetchFinanceData();
  }, []);

  const transactions: Transaction[] = [
    {
      id: "1",
      date: "2024-01-15",
      description: "Grocery Shopping",
      category: "Food",
      amount: -85.5,
      type: "expense",
    },
    {
      id: "2",
      date: "2024-01-14",
      description: "Salary Deposit",
      category: "Income",
      amount: 3500.0,
      type: "income",
    },
    {
      id: "3",
      date: "2024-01-13",
      description: "Gas Station",
      category: "Transportation",
      amount: -45.2,
      type: "expense",
    },
    {
      id: "4",
      date: "2024-01-12",
      description: "Coffee Shop",
      category: "Food",
      amount: -12.75,
      type: "expense",
    },
    {
      id: "5",
      date: "2024-01-11",
      description: "Netflix Subscription",
      category: "Entertainment",
      amount: -15.99,
      type: "expense",
    },
    {
      id: "6",
      date: "2024-01-10",
      description: "Freelance Payment",
      category: "Income",
      amount: 750.0,
      type: "income",
    },
    {
      id: "7",
      date: "2024-01-09",
      description: "Electricity Bill",
      category: "Utilities",
      amount: -120.0,
      type: "expense",
    },
    {
      id: "8",
      date: "2024-01-08",
      description: "Restaurant Dinner",
      category: "Food",
      amount: -68.9,
      type: "expense",
    },
  ];

  const formatIntoRupiah = (amount: number) => {
    return Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  } 

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        transaction.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "amount") return Math.abs(b.amount) - Math.abs(a.amount);
      return a.description.localeCompare(b.description);
    });

  const incomeTransactions = financeData?.filter((t) => t.type === "income") || [];
  const expenseTransactions = financeData?.filter((t) => t.type === "expense") || [];

  const totalIncome = incomeTransactions.length
    ? incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  const totalExpenses = expenseTransactions.length
    ? expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    : 0;

  const balance = totalIncome - totalExpenses;


  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Catatan Keuangan
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-50 p-3 rounded-xl border border-green-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Pemasukan</p>
                <p className="text-xs font-bold text-green-700 flex flex-row gap-1">
                  <span>{formatIntoRupiah(totalIncome)}</span> <TrendingUp className="w-4 h-4 text-green-600" />
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
                <p className="text-xs text-red-600 font-medium">Pengeluaran</p>
                <p className="text-xs font-bold text-red-700 flex flex-row gap-1">
                  <span>{formatIntoRupiah(totalExpenses)}</span> <TrendingDown className="w-4 h-4 text-red-600" />
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
                  Neraca
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

        {/* Filters */}
        <div className="flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-300"
            />
          </div>

          <div className="flex space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col gap-2">
              <div className="skeleton h-20 w-full"></div>
              <div className="skeleton h-20 w-full"></div>
              <div className="skeleton h-20 w-full"></div>
            </motion.div>
          ) : financeData?.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-row gap-2 justify-between mb-1">
                    <h3 className="font-medium text-gray-800 text-xs">
                      {transaction.description}
                    </h3>
                    <div
                      className={`font-bold text-sm flex flex-row gap-1 ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <span>
                      {transaction.type === "income" ? "+" : "-"}
                      </span>
                      <span>
                      {formatIntoRupiah(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {transaction.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceSection;
