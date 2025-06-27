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

// Groq-AI SDK
import Groq from "groq-sdk";

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

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const ChatbotSection = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const queryGroqAI = async (prompt: string): Promise<string> => {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten keuangan pribadi yang membantu mencatat pemasukan dan pengeluaran. 
            Tanggapi dengan singkat dan jelas. Jika pengguna menyebutkan nominal uang, ekstrak informasi berikut:
            - Jenis (pemasukan/pengeluaran)
            - Jumlah (dalam angka)
            - Kategori (jika ada)
            - Deskripsi
            
            Format respons untuk transaksi keuangan:
            "✅ [Pemasukan] [Deskripsi] [Nominal] [Kategori (jika ada)]"
            atau
            "💸 [Pengeluaran] [Deskripsi] [Nominal] [Kategori (jika ada)]"
            
            Untuk pertanyaan umum, berikan jawaban yang membantu.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 256
      });
      
      return chatCompletion.choices[0]?.message?.content || "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";
    } catch (error) {
      console.error("Error querying Groq AI:", error);
      return "Maaf, terjadi kesalahan saat memproses permintaan Anda.";
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
      
      // firebase check handler
      const q = query(
        collection(db, 'user_categories'),
        where('user_id', '==', user.uid),
        where('category', '==', normalizedCategory)
      );

      const snapshot = await getDocs(q);

      if (snapshot.size > 0) {
        console.log(`Kategori "${normalizedCategory}" sudah ada, diabaikan`);
        return;
      }

      await addDoc(collection(db, 'user_categories'), {
        category: normalizedCategory,
        timestamp: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('err: ', error);
      return false;
    }
  }

  const saveFinancialRecord = async (record: FinancialRecord) => {
    try {
      // Clean description by removing category part
      let cleanDescription = record.description
        .replace(new RegExp(`Kategori:\\s*${record.category}`, 'i'), '')
        .trim();
    
      await addDoc(collection(db, 'financial_records'), {
        user_id: user.uid,
        description: cleanDescription,
        amount: record.amount,
        type: record.type,
        category: record.category || 'uncategorized',
        timestamp: serverTimestamp()
      });

      record.category && await storeCategories(record?.category);

      return true;
    } catch (error) {
      console.error("Hmm ada error nih, maaf ya:", error);
      return false;
    }
  };

  const saveChatMessage = async (message: string, sender: 'user' | 'bot') => {
    try {
      const amount = extractAmountFromText(message);
      
      await addDoc(collection(db, 'user_chat'), {
        user_id: user.uid,
        description: message,
        amount: amount,
        sender,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  };

  const extractAmountFromText = (text: string): number => {
    // Match formats like "70.000", "70rb", "70000", etc.
    const amountRegex = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+)\s*(?:rb|ribu|jt|juta)?/i;
    const match = text.match(amountRegex);
    
    if (match) {
      let amountStr = match[1];
      
      // Normalize number format
      amountStr = amountStr
        .replace(/\./g, '') // Remove dots (format 70.000)
        .replace(',', '.');  // Replace comma with dot (format 70,000)
      
      const amount = parseFloat(amountStr);
      
      // Handle suffixes like 'rb' or 'juta'
      if (match[2]) {
        const suffix = match[2].toLowerCase();
        if (suffix.includes('jt') || suffix.includes('juta')) return amount * 1000000;
        if (suffix.includes('rb') || suffix.includes('ribu')) return amount * 1000;
      }
      
      return amount;
    }
    
    return 0; // Default if not found
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

      const aiResponse = await queryGroqAI(inputText);
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Finotes</h2>
            <p className="text-sm text-gray-500">Powered by Wahyu Tri</p>
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
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
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
