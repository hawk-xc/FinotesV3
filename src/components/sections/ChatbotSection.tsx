import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// get user auth data
import { useAuth } from "@/contexts/AuthContext";

// Firebase imports
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// Geini-AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import FinotesLogo from "../particles/FinotesLogo";

// message format
interface Message {
  id: string;
  user_id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// financial record format
interface FinancialRecord {
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  timestamp: Date;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_PUBLIC_GEMINI_API_KEY);

const ChatbotSection = (): React.JSX.Element => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hallo bray, mau catat pengeluaran atau pemasukan nih...?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleResize = () => {
      // Scroll ke bawah ketika keyboard muncul (viewport height berkurang)
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const queryGeminiAI = async (prompt: string): Promise<string> => {
    const categories = [
        'Makanan', 'Elektronik', 'Transportasi', 'Hiburan', 'Belanja', 'Lainnya'
    ];
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100
            }
        });

        const fullPrompt = `Anda adalah asisten keuangan pribadi yang sangat teliti. Tugas Anda adalah:
        1. Menganalisis input pengguna untuk transaksi keuangan
        2. Mengidentifikasi jenis transaksi (pemasukan/pengeluaran)
        3. Mengekstrak jumlah uang dan mengonversi semua format ke angka (contoh: "10rb" → 10000, "1jt" → 1000000)
        4. Menentukan kategori yang sesuai dari daftar berikut: ${categories.join(', ')}
        5. Format respons dengan pola yang konsisten

        **Aturan Konversi Nominal:**
        - "rb" atau "ribu" = 000
        - "jt" atau "juta" = 000000
        - "perak" = (abaikan, anggap sebagai Rp)
        - "ratus ribu" = 00000
        - "k" = 000 (contoh: 10k = 10000)

        **Format Respons Wajib:**
        💸 Pengeluaran [Deskripsi] [Nominal dalam angka] [Kategori]
        ✅ Pemasukan [Deskripsi] [Nominal dalam angka] [Kategori]

        **Contoh:**
        Input: "Beli kopi vanila 10rb"
        Output: "💸 Beli kopi vanila 10000 Makanan"

        Input: "Dapat bonus 1.5jt"
        Output: "✅ Dapat bonus 1500000 Lainnya"

        Input: "Bayar listrik 500 ribu"
        Output: "💸 Bayar listrik 500000 Lainnya"

        **Kategori Default:** "Lainnya" jika tidak jelas

        Sekarang proses input berikut: "${prompt}"`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text().trim();
      
        // Validasi format output
        if (!text.match(/^(💸|✅) .+ \d+ (Makanan|Elektronik|Transportasi|Hiburan|Belanja|Lainnya)$/)) {
            return "Maaf, format respons tidak valid. Silakan coba lagi dengan deskripsi yang lebih jelas.";
        }
              
        return text;
    } catch (error) {
        console.error("Error querying Gemini AI:", error);
        return "Maaf, terjadi kesalahan saat memproses transaksi Anda.";
    }
  };

  const extractFinancialData = (aiResponse: string): FinancialRecord | null => {
    const amount = extractAmountFromText(aiResponse);
    if (amount <= 0) return null;

    // Detect transaction type
    const isIncome = aiResponse.includes('✅');
    const isExpense = aiResponse.includes('💸');
    
    // Save entire text as description
    const fullDescription = aiResponse.trim();
    
    // Extract category with format "Kategori: [category_name]"
    let category = 'lainnya';
    const categoryRegex = /Kategori:\s*([^\n]+)/i;
    const categoryMatch = aiResponse.match(categoryRegex);
    
    if (categoryMatch && categoryMatch[1]) {
      category = categoryMatch[1].trim();
    } else {
      // Fallback: look for category keywords in text
      const commonCategories = ['makanan', 'elektronik', 'transportasi', 'hiburan', 'belanja'];
      for (const cat of commonCategories) {
        if (aiResponse.toLowerCase().includes(cat)) {
          category = cat;
          break;
        }
      }
    }

    return {
      user_id: user.uid,
      description: fullDescription,
      amount: amount,
      type: isIncome ? 'income' : 'expense',
      category: category,
      timestamp: new Date()
    };
  };

  const storeCategories = async (category: string) => {
    try {
      const normalizedCategory = category.toLowerCase().trim();
      
      const response = await fetch(import.meta.env.VITE_RAILWAY_API_URL + '/finance-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          category: normalizedCategory,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Gagal simpan ke backend:", err.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('err: ', error);
      return false;
    }
  }

  const saveFinancialRecord = async (record: FinancialRecord) => {
    console.log(record);
    try {
      // Clean description by removing category part
      let cleanDescription = record.description
        .replace(new RegExp(`Kategori:\\s*${record.category}`, 'i'), '')
        .trim();
    
      const response = await fetch(import.meta.env.VITE_RAILWAY_API_URL + '/finance-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          description: cleanDescription,
          amount: record.amount,
          type: record.type,
          category: record.category || 'uncategorized',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Gagal simpan ke backend:", err.message);
        return false;
      }

      if (record.category) {
        await storeCategories(record.category);
      }

      console.log('berhasil');

      return true;
    } catch (error) {
      console.error("Hmm ada error nih, maaf ya:", error);
      return false;
    }
  };

  const saveChatMessage = async (message: string, sender: 'user' | 'bot') => {
    try {
      const amount = extractAmountFromText(message);

      const response = await fetch(import.meta.env.VITE_RAILWAY_API_URL + '/user-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          description: message,
          amount: amount,
          sender,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Gagal simpan ke backend:", err.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  };

  const extractAmountFromText = (text: string): number => {
    // Enhanced regex to capture more number formats and suffixes
    const amountRegex = /(\d+([.,]\d+)?)\s*(rb|ribu|k|jt|juta|ratus\s+ribu|perak)?/i;
    const match = text.match(amountRegex);
    
    if (!match) return 0;

    let amountStr = match[1];
    
    // Normalize number format
    amountStr = amountStr
        .replace(/\./g, '') // Remove thousand separators (format 70.000)
        .replace(',', '.');  // Handle decimal comma (format 70,5 rb → 70.5)
    
    const baseAmount = parseFloat(amountStr);
    
    // Handle suffixes
    if (match[3]) {
        const suffix = match[3].toLowerCase();
        switch (true) {
            case suffix.includes('jt') || suffix.includes('juta'):
                return baseAmount * 1000000;
            case suffix.includes('ratus ribu'):
                return baseAmount * 100000;
            case suffix.includes('rb') || suffix.includes('ribu') || suffix.includes('k'):
                return baseAmount * 1000;
            case suffix.includes('perak'):
                return baseAmount; // "perak" doesn't change the value
            default:
                return baseAmount;
        }
    }
    
    return baseAmount;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      user_id: user.uid,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Save user message to user_chat
      await saveChatMessage(inputText, 'user');

      const aiResponse = await queryGeminiAI(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        user_id: user.uid,
        text: aiResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      // Extract and save financial data
      const financialRecord = extractFinancialData(aiResponse);
      if (financialRecord) {
        await saveFinancialRecord(financialRecord);
      } else {
        // If not a transaction, just save to user_chat
        await saveChatMessage(aiResponse, 'bot');
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        user_id: user.uid,
        text: "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div ref={chatContainerRef} className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 aspect-square bg-indigo-100 rounded-full flex items-center justify-center p-1">
            <FinotesLogo alt="finotes-logo" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Finotes</h2>
            <p className="text-sm text-gray-500">Catat dulu biar enga lupa</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}
              >
                {message.sender === "bot" && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <motion.div
                  className={`px-4 py-3 rounded-xl shadow-sm max-w-64 ${
                    message.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm overflow-hidden break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-indigo-200"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </motion.div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sticky bottom-0">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }}
            placeholder="ig. makan siang 14rb..."
            className="flex-1 rounded-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSection;
