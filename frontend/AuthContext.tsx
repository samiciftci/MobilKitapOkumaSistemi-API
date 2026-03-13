import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 📌 Async Storage ile kullanıcı verisini kaydetme

interface User {
  id: number;
  kullaniciAdi: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  loginAsAdmin: () => void;
  loginAsUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // **📌 Uygulama açıldığında kullanıcıyı AsyncStorage'dan al**
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Kullanıcı verisi yüklenirken hata oluştu:', error);
      }
    };
    loadUser();
  }, []);

  const loginAsAdmin = async () => {
    const adminUser = { id: 1, kullaniciAdi: 'adminUser', isAdmin: true };
    setUser(adminUser);
    await AsyncStorage.setItem('user', JSON.stringify(adminUser)); // 📌 Kullanıcı verisini kaydet
  };

  const loginAsUser = async () => {
    const normalUser = { id: 2, kullaniciAdi: 'normalUser', isAdmin: false };
    setUser(normalUser);
    await AsyncStorage.setItem('user', JSON.stringify(normalUser)); // 📌 Kullanıcı verisini kaydet
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user'); // 📌 Çıkış yapınca veriyi sil
  };

  return (
    <AuthContext.Provider value={{ user, loginAsAdmin, loginAsUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// **📌 useAuth Fonksiyonunun Doğru Export Edildiğinden Emin Ol**
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
