// src/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  Linking,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuth } from './AuthContext';
import axios from 'axios';

const BASE_URL = 'http://192.168.228.51:5000';

// 💫  Altın logo dosyanızı  src/assets/logo-gold.png  konumuna koymayı unutmayın
import LogoGold from './assets/logo-gold2.png';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

/* ───────────── Slider bileşeni ───────────── */
const AdSlider: React.FC<{ ads: any[] }> = ({ ads }) => {
  const screenWidth = Dimensions.get('window').width;
  if (ads.length === 0) return null;

  /*  --->  BAĞLANTI AÇ  <---  */
  const openUrl = (raw: string) => {
    const cleaned = raw.trim(); // baş / son boşlukları kaldır
    const url = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    Linking.openURL(url).catch(() => Alert.alert('Uyarı', 'Bağlantı açılamadı.'));
  };

  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.adSliderContainer}>
      {ads.map(ad => (
        <TouchableOpacity key={ad.id} onPress={() => openUrl(ad.targetUrl)}>
          <Image
            source={{ uri: `${BASE_URL}${ad.resimUrl}` }}
            style={[styles.adImage, { width: screenWidth - 50 }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [kitaplar, setKitaplar] = useState<any[]>([]);
  const [sliderAds, setSliderAds] = useState<any[]>([]);
  // 👉 PAGINATION
  const [page, setPage] = useState(1);
  const perPage = 5;

  /* Kitaplar + slider reklamları */
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/Kitap`)
      .then(res => setKitaplar(res.data))
      .catch(err => console.error('Kitaplar yüklenemedi:', err));

    axios
      .get(`${BASE_URL}/api/Kitap/SliderAds`)
      .then(res => setSliderAds(res.data))
      .catch(err => console.error('Slider reklamları alınamadı:', err));
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleKitapDetay = (id: number) => navigation.navigate('KitapDetay', { kitapId: id });

  // 👉 PAGINATION yardımcıları
  const totalPages = Math.ceil(kitaplar.length / perPage) || 1;
  const pagedData = kitaplar.slice((page - 1) * perPage, page * perPage);
  const changePage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <View style={styles.rootContainer}>
      {/* Üst Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        {/* Logo görüntüsü */}
        <Image source={LogoGold} style={styles.logoImg} />
      </View>

      {/* Yan Menü */}
      {menuOpen && (
        <View style={styles.sideMenu}>
          <ScrollView style={{ marginTop: 20 }}>
            {user ? (
              <>
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('Search')}>
                  Arama
                </Button>
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('KitapListesi')}>
                  Kitap Listesi
                </Button>
                {user.isAdmin && (
                  <>
                    <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('AdminKitapScreen')}>
                      Admin Paneli
                    </Button>
                    <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('AdminKullaniciYonetimi')}>
                      Admin Kullanıcı Yönetimi
                    </Button>
                  </>
                )}
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('FavoriKitaplarim')}>
                  Favori Kitaplarım
                </Button>
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => Alert.alert('İletişim', 'Email: ciftcisami4@gmail.com\nAd: Mevlüt Sami Çiftci')}>
                  İletişim
                </Button>
                <Button mode="contained" style={[styles.sideMenuButton, { backgroundColor: 'red' }]} onPress={logout}>
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => navigation.navigate('Login')}>
                  Giriş Yap
                </Button>
                <Button mode="contained" style={styles.sideMenuButton} onPress={() => Alert.alert('İletişim', 'Email: ciftcisami4@gmail.com\nAd: Mevlüt Sami Çiftci')}>
                  İletişim
                </Button>
              </>
            )}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* SLIDER */}
        <Card style={styles.adCard}>
          <AdSlider ads={sliderAds} />
        </Card>

        {/* Karşılama kartı */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>Hoşgeldiniz, {user ? user.kullaniciAdi : 'Misafir'}!</Title>
            <Paragraph style={styles.welcomeSubtitle}>
              "Her kitap, yeni bir dünya keşfetmektir."
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Kitap listesi */}
        <Text style={styles.kitapListTitle}>📚 Tüm Kitaplar</Text>
        <FlatList
          data={pagedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleKitapDetay(item.id)}>
              <Card style={styles.bookCard}>
                <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.resimYolu ? (
                    <Image source={{ uri: BASE_URL + item.resimYolu }} style={styles.bookImage} />
                  ) : (
                    <View style={styles.emptyImage}>
                      <Text style={{ color: '#888' }}>Resim Yok</Text>
                    </View>
                  )}
                  <View style={{ marginLeft: 12 }}>
                    <Title style={{ color: '#4A148C' }}>{item.ad}</Title>
                    <Paragraph style={{ color: '#6A1B9A' }}>{item.yazar}</Paragraph>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>Liste boş.</Text>}
        />

        {/* 👉 PAGINATION KONTROLLERİ */}
        <View style={styles.paginationWrapper}>
          {/* Önceki */}
          <TouchableOpacity disabled={page === 1} onPress={() => changePage(page - 1)} style={[styles.pageBtn, page === 1 && styles.pageDisabled]}>
            <Text style={styles.pageTxt}>{'<'}</Text>
          </TouchableOpacity>

          {/* Sayı düğmeleri */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <TouchableOpacity key={p} onPress={() => changePage(p)} style={[styles.pageBtn, page === p && styles.pageActive]}>
              <Text style={styles.pageTxt}>{p}</Text>
            </TouchableOpacity>
          ))}

          {/* Sonraki */}
          <TouchableOpacity disabled={page === totalPages} onPress={() => changePage(page + 1)} style={[styles.pageBtn, page === totalPages && styles.pageDisabled]}>
            <Text style={styles.pageTxt}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* 👉 Bilgilendirme / Footer Metni */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerTitle}>SayfaSayfa Nedir?</Text>
          <Text style={styles.footerPara}>
            SayfaSayfa; kitap okuma, inceleme ve yönetimi için geliştirilmiş mobil bir platformdur. Kitaplarınızı PDF
            formatında yükleyebilir, sayfa sayfa okuyabilir ve favori listenizi oluşturabilirsiniz. Kişiselleştirilebilir
            okuma deneyimi, kategori filtreleme, puanlama ve yorum sistemiyle zenginleştirilmiştir. Hedefimiz, kitap
            tutkunlarının mobil cihazlarında keyifli ve erişilebilir bir kütüphane deneyimi yaşamasını sağlamaktır.
          </Text>
          <Text style={styles.footerPara}>
            Uygulama boyunca gezinirken; tam ekran okuma, zoom, kaldığın yerden devam etme gibi özelliklerden
            yararlanabilir; topluluk ile fikirlerini paylaşmak için yorum yapabilir ve eserleri puanlayabilirsin. Yeni
            kitapları keşfet, okuma alışkanlığını takip et ve kişisel kütüphaneni büyüt.
          </Text>
          <Text style={styles.footerCopy}>© 2025 SayfaSayfa • Tüm hakları saklıdır</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

/* ─────────────── STYLES ─────────────── */
const styles = StyleSheet.create({
  /* Root */
  rootContainer: { flex: 1, backgroundColor: '#F3E5F5' },

  /* Top bar */
topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#071123',   // ← burası
  paddingHorizontal: 15,
  height: 60,
},

  menuButton: { marginRight: 15 },
  menuIcon: { fontSize: 24, color: '#FFFFFF' },
  logoImg: {
    height: 120,
    width: 120,       //  ✅ net genişlik
    resizeMode: 'contain',
  },

  /* Side menu */
  sideMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    bottom: 0,
    width: 240,
    zIndex: 9999,
    backgroundColor: '#B39DDB',
    padding: 10,
    elevation: 5,
  },
  sideMenuButton: { backgroundColor: '#7E57C2', marginBottom: 8 },

  /* Main content */
  mainContent: {
    padding: 15,
    paddingBottom: 50,
  },

  /* Slider */
  adCard: { marginBottom: 15, backgroundColor: '#D1C4E9', elevation: 3, padding: 5 },
  adSliderContainer: { marginLeft: 5 },
  adImage: { height: 160, marginRight: 15, borderRadius: 8 },

  /* Welcome */
  welcomeCard: { backgroundColor: '#EDE7F6', elevation: 3, marginBottom: 15 },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A148C',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: { textAlign: 'center', color: '#6A1B9A' },

  /* Book list */
  kitapListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A148C',
    marginBottom: 12,
    marginTop: 20,
  },
  bookCard: {
    marginBottom: 12,
    backgroundColor: '#FFF',
    elevation: 2,
    borderRadius: 8,
  },
  bookImage: { width: 60, height: 90, borderRadius: 4, backgroundColor: '#ccc' },
  emptyImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Pagination */
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 20,
  },
  pageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 2,
    borderRadius: 4,
    backgroundColor: '#B3B3B3',
  },
  pageActive: { backgroundColor: '#7B1FA2' },
  pageDisabled: { opacity: 0.4 },
  pageTxt: { color: '#fff', fontWeight: '600' },

  /* Footer */
  footerInfo: {
    backgroundColor: '#D1C4E9',
    padding: 20,
    borderRadius: 8,
    marginTop: 30,
  },
  footerTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A148C', marginBottom: 10 },
  footerPara: { fontSize: 14, color: '#4A148C', marginBottom: 8 },
  footerCopy: { fontSize: 12, color: '#4A148C', textAlign: 'center', marginTop: 12 },
});
