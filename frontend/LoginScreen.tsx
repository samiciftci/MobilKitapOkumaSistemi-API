import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

import { useAuth } from './AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const BASE_URL = 'http://192.168.228.51:5000';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginAsAdmin, loginAsUser } = useAuth();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !sifre) {
      Alert.alert('Hata', 'Lütfen email ve şifre giriniz.');
      return;
    }
    setLoading(true);

    axios.get('http://192.168.228.51:5000/api/Kullanici')
      .then(response => {
        const kullanicilar = response.data;
        const kullanici = kullanicilar.find((u: any) => u.email === email && u.sifre === sifre);

        if (kullanici) {
          Alert.alert('Başarılı', 'Giriş yapıldı.');
          if (kullanici.isAdmin) {
            loginAsAdmin();
            navigation.replace('AdminKitapScreen');
          } else {
            loginAsUser();
            navigation.replace('KitapListesi');
          }
        } else {
          Alert.alert('Hata', 'Geçersiz email veya şifre.');
        }
      })
      .catch(error => {
        console.error('Giriş hatası:', error);
        Alert.alert('Hata', 'Giriş yapılırken hata oluştu.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.root}>
      {/* Üst tarafta mor şekil */}
      <View style={styles.shapeTop} />
      {/* Alt tarafta mor şekil */}
      <View style={styles.shapeBottom} />

      <View style={styles.container}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Devam etmek için lütfen giriş yapınız.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-POSTA</Text>
          <TextInput
            style={styles.input}
            placeholder="user123@email.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ŞİFRE</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={sifre}
            onChangeText={setSifre}
            secureTextEntry
          />
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>ŞİFREMİ UNUTTUM</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>
            {loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Hesabınız yok mu?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    position: 'relative',
  },
  shapeTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 200,
    height: 200,
    backgroundColor: '#9c27b0',
    borderRadius: 100,
    transform: [{ scaleX: 1.5 }],
  },
  shapeBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    backgroundColor: '#9c27b0',
    borderRadius: 125,
    transform: [{ scaleX: 1.2 }],
  },
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  forgotButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 5,
  },
  forgotText: {
    fontSize: 12,
    color: '#999',
  },
  loginButton: {
    backgroundColor: '#9c27b0',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#9c27b0',
    fontWeight: 'bold',
  },
});
