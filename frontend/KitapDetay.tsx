import { useAuth } from './AuthContext';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
  Image
} from 'react-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

const BASE_URL = 'http://192.168.228.51:5000';

interface Kategori {
  kategori: { id: number; ad: string };
}

interface Kitap {
  id: number;
  ad: string;
  yazar: string;
  puan: number;
  pdfYolu?: string;
  kitapKategoriler?: Kategori[];
  ozet?: string;
  resimYolu?: string; // Eğer backend'de resmi tutuyorsanız
}

type KitapDetayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'KitapDetay'>;
type KitapDetayRouteProp = RouteProp<RootStackParamList, 'KitapDetay'>;

interface KitapDetayProps {
  navigation: KitapDetayNavigationProp;
  route: KitapDetayRouteProp;
}

const KitapDetay: React.FC<KitapDetayProps> = ({ route, navigation }) => {
  const { kitapId } = route.params;
  const [kitap, setKitap] = useState<Kitap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    axios
      .get<Kitap>(`${BASE_URL}/api/Kitap/${kitapId}`)
      .then(res => {
        setKitap(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Kitap detay alınamadı:', err);
        Alert.alert('Hata', 'Kitap detayı getirilemedi');
        setLoading(false);
      });
  }, [kitapId]);

  const handleKitapOkuma = () => {
    if (!user) {
      Alert.alert('Hata', 'Kitap okumak için giriş yapmalısınız!');
      return;
    }
    axios
      .post(`${BASE_URL}/api/Kitap/${kitapId}/OkumaBaslat`, {
        kullaniciId: user.id,
      })
      .then(() => {
        navigation.navigate('KitapOkuma', { kitapId, kullaniciId: user.id });
      })
      .catch(err => {
        console.error('Okumaya geçiş hatası:', err);
        Alert.alert('Hata', 'Kitap okunamadı.');
      });
  };

  // ✅ Favorilere ekleme fonksiyonu
  const handleFavorilereEkle = () => {
    if (!user) {
      Alert.alert('Hata', 'Favorilere eklemek için giriş yapmalısınız!');
      return;
    }

    axios
      .post(`${BASE_URL}/api/Kitap/${kitapId}/FavorilereEkle`, {
        kullaniciId: user.id,
      })
      .then(() => {
        Alert.alert('Başarılı', 'Kitap favorilere eklendi.');
      })
      .catch(err => {
        console.error('Favorilere ekleme hatası:', err);
        Alert.alert('Hata', 'Kitap favorilere eklenirken bir hata oluştu.');
      });
  };

  // ✅ Favorilerden çıkarma fonksiyonu
  const handleFavorilerdenCikar = () => {
    if (!user) {
      Alert.alert('Hata', 'Favorilerden çıkarmak için giriş yapmalısınız!');
      return;
    }

    axios
      .delete(`${BASE_URL}/api/Kitap/${kitapId}/FavorilerdenCikar`, {
        params: {
          kullaniciId: user.id,
        },
      })
      .then(() => {
        Alert.alert('Başarılı', 'Kitap favorilerden çıkarıldı.');
      })
      .catch(err => {
        console.error('Favorilerden çıkarma hatası:', err);
        Alert.alert('Hata', 'Kitap favorilerden çıkarılırken bir hata oluştu.');
      });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8E24AA" />
      </View>
    );
  }

  if (!kitap) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Kitap bilgisi bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.cardContainer}>
        {/* Kitap Adı / Yazar / Puan */}
        <Text style={styles.bookTitle}>{kitap.ad}</Text>
        <Text style={styles.bookAuthor}>Yazar: {kitap.yazar}</Text>
        <Text style={styles.bookPuan}>
          Ortalama Puan: {kitap.puan ?? 'Henüz yok'}
        </Text>

        {/* Resim Kutucuğu (Varsa kitap.resimYolu) */}
        {kitap.resimYolu ? (
          <Image
            source={{ uri: `${BASE_URL}${kitap.resimYolu}` }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyImage}>
            <Text style={styles.emptyImageText}>Resim Yok</Text>
          </View>
        )}

        {/* Kategoriler */}
        {kitap.kitapKategoriler && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoriler:</Text>
            {kitap.kitapKategoriler.map(k => (
              <Text key={k.kategori.id} style={styles.categoryItem}>
                • {k.kategori.ad}
              </Text>
            ))}
          </View>
        )}

        {/* Kitap Özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Kitap Özeti</Text>
          <Text style={styles.ozetText}>
            {kitap.ozet ? kitap.ozet : 'Özet henüz eklenmemiş.'}
          </Text>
        </View>

        {/* PDF İndir/Okumaya Başla */}
        <View style={styles.buttonMargin}>
          <Button
            title="PDF İndir/Okumaya Başla"
            onPress={() => {
              if (kitap.pdfYolu) {
                const pdfUrl = `${BASE_URL}${kitap.pdfYolu}`;
                navigation.navigate('KitapPdf', { pdfUrl });
              } else {
                Alert.alert('Bilgi', 'PDF dosyası bulunamadı.');
              }
            }}
            color="#424242"
          />
        </View>

        {/* Kitabı Oku */}
        <View style={styles.buttonMargin}>
          <Button
            title="📖 Kitabı Oku"
            onPress={handleKitapOkuma}
            color="#1B5E20"
          />
        </View>

        {/* Favorilere Ekle */}
        <View style={styles.buttonMargin}>
          <Button
            title="⭐ Favorilere Ekle"
            onPress={handleFavorilereEkle}
            color="#6A1B9A"
          />
        </View>

        {/* Favorilerden Çıkar */}
        <View style={styles.buttonMargin}>
          <Button
            title="❌ Favorilerden Çıkar"
            onPress={handleFavorilerdenCikar}
            color="#B71C1C"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default KitapDetay;

/* ----- STYLES ----- */
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#424242',
  },
  scrollContent: {
    backgroundColor: '#F3E5F5', // Açık mor arka plan
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A148C', // koyu mor
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#6A1B9A',
    marginBottom: 2,
  },
  bookPuan: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  bookImage: {
    width: 150,        // Daha dar, dikey bir görünüm
    height: 250,       // Daha uzun bir yükseklik
    backgroundColor: '#E1BEE7',
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'center', // Ortalamak için
  },
  emptyImage: {
    width: 150,
    height: 250,
    backgroundColor: '#E1BEE7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  emptyImageText: {
    color: '#757575',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A148C',
    marginBottom: 4,
  },
  categoryItem: {
    fontSize: 14,
    color: '#5E35B1',
    marginLeft: 8,
    marginVertical: 2,
  },
  ozetText: {
    fontSize: 14,
    color: '#212121',
    marginTop: 2,
  },
  buttonMargin: {
    marginTop: 10,
  },
});
