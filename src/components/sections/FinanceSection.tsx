'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence} from "framer-motion";
import { Search, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Modal } from "@/components/particles/Modal"; 
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty } from 'antd';

import { db } from '@/lib/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

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

const FinanceSection = (): React.JSX.Element => {
  const [financeData, setFinanceData] = useState<FinanceData[]>([]); 
  const [categoryData, setCategoryData] = useState<categoryData[]>([]);
  const [filteredData, setFilteredData] = useState<FinanceData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  const [modalData, setModalData] = useState<FinanceData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { user } = useAuth();

  const handleClickCard = (id: string): void => {
    setSelectedId(id);
    setModalData(financeData.find((data) => data.id === id) || null);
  };

  /**
   * Handles the deletion of a financial record in the Firestore database.
   * Shows a confirmation alert before deleting the record.
   * After deletion, fetches the updated data and closes the modal.
   * @param id The ID of the record to be deleted.
   */
  const handleDelete = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "financial_records", id));
    fetchFinanceData();
    setSelectedId(null); // tutup modal
  };

  /**
   * Fetches categories from the Firestore database, updates the categoryData state
   * with the retrieved records.
   */
  const fetchCategoryData = async ():Promise<void> => {
    const resp = await fetch(`https://finoteapiservice-production.up.railway.app/${user.uid}/finance-categories`);
    const { data } = await resp.json();

    setCategoryData(data);
  };

  /**
   * Fetches financial records from the Firestore database, updates the financeData state
   * with the retrieved records, and manages the loading state while data is being fetched.
   * Sets isLoading to true when starting the data fetch and false when data fetching completes.
   */
  const fetchFinanceData = async (): Promise<void> => {
    const resp = await fetch(`https://finoteapiservice-production.up.railway.app/${user.uid}/finance-records`);
    const { data } = await resp.json();

    // get category data
    await fetchCategoryData();
    
    setFinanceData(data);
    setFilteredData(data); // Initialize filteredData with all data
    setIsLoading(false);
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

        {/* Filters */}
        <div className="flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari Transaksi..."
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
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categoryData?.map((category) => (
                  <SelectItem key={category.id} value={category.category}>
                    {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tanggal</SelectItem>
                <SelectItem value="amount">Nominal</SelectItem>
                <SelectItem value="description">Deskripsi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="col-span-1 flex flex-col gap-2">
              <div className="skeleton h-20 w-full"></div>
              <div className="skeleton h-20 w-full"></div>
              <div className="skeleton h-20 w-full"></div>
            </motion.div>
          ) : filteredData.length > 0 ? (
            filteredData.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                onClick={() => handleClickCard(transaction.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer select-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
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
                          {new Date(transaction.timestamp.seconds * 1000).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hmm transaksi masih kosong nih!" />
            </div>
          )}
          <AnimatePresence>
            {selectedId && (
              <Modal onClose={() => setSelectedId(null)}>
                <span className="text-xs text-slate-500 flex flex-row gap-2 align-middle items-center">
                  <Calendar className="w-3 text-slate-500"/>
                  {new Date(modalData?.timestamp.seconds * 1000).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                </span>
                <h2 className="text-lg font-bold mb-2">{modalData?.description ?? '-'}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="badge badge-sm badge-ghost px-2">kategori: {modalData?.category ?? '-'}</span>
                  <span className="badge badge-sm badge-ghost px-2">tipe: {modalData?.category ? modalData?.category === 'income' ? 'Pemasukan' : 'Pengeluaran' :  '-'}</span>
                </p>
                <div className={`flex flex-row gap-2 p-2 rounded-md bg-gradient-to-r to-white text-slate-600 ${modalData?.type === "income" ? "from-green-100" : "from-red-100"} font-bold`}>
                  {modalData.type === "income" ? "+" : "-"} {formatIntoRupiah(modalData?.amount ?? 0)}
                </div>
                <div className="flex justify-end gap-2 mt-7">
                  <button
                    onClick={() => handleDelete(selectedId)}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                  >
                    Hapus
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="px-4 py-2 bg-gray-100 text-sm rounded-lg hover:bg-gray-300"
                  >
                    Batal
                  </button>
                </div>
              </Modal>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FinanceSection;
