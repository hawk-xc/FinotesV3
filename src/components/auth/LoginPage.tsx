import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth, provider } from "@/lib/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import GoogleLogo from '../particles/GoogleLogo';

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { user, login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      login(firebaseUser);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err, error);
      setError("Gagal login. Silakan coba lagi.");
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl bg-white/80 backdrop-blur-sm border-0">
         <div className="text-center mb-8">
            <motion.h1
              className="text-3xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hallo, Finoters
            </motion.h1>
            <p className="text-gray-600">Sign in untuk melanjutkan ke aplikasi</p>
          </div>

          <div>
            {user && (
              <div className="mt-4 text-center">
                <p>Welcome, {user.displayName}</p>
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="rounded-full w-16 h-16 mx-auto"
                />
              </div>
            )}
          </div>
          
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                onClick={handleLogin}
                className="w-full text-slate-800 bg-white hover:bg-slate-100 outline-1 outline-slate-600 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 p-7"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex flex-row gap-2 align-middle items-center">
                    <div className="w-10 h-10 bg-gray-100 p-2 rounded-full flex items-center justify-center">
                      <GoogleLogo alt="" className="w-3 aspect-square" />
                    </div>
                      Sign In dengan akun Google
                    </div>
                )}
              </Button>
            </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
