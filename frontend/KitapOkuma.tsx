import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useAuth } from './AuthContext';
import ImageZoom from 'react-native-image-pan-zoom';

const BASE_URL = 'http://192.168.228.51:5000';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ────────────────────────────────────────────
   KAPSAMLI YASAKLI-KELİMELER SÖZLÜĞÜ
   (Türkçe + yaygın İngilizce küfür & hakaretler)
   ──────────────────────────────────────────── */
const BANLI_KELIMELER = [
  // Türkçe
  'amk','amına','amını','amına koy','amcık','amcuk','ammık','amq','yarak','yarrak',
  'göt','götü','götün','götüne','götünü','götveren','götlek','sik','sikerim','siktir',
  'siktir git','sikik','sikecem','sikeyim','sikyim','oç','orospu','orospu çocuğu',
  'piç','piç kurusu','puşt','pezevenk','kahpe','kahpekarı','iblis','dallama','mal',
  'salak','gerizekalı','aptal','dangalak','eşşek','şerefsiz','şerefsizler',
  'beyinsiz','hıyar','hain','hainlik','it','it oğlu it','yarram','bok','boktan',
  'boklu','bokçuk','şeytan','anki','ebeni','ebenin','eben','ebeni sikim','fuck your mom',

  // İngilizce
  'fuck','fucking','motherfucker','mf','bitch','bitches','bastard','son of a bitch',
  'cunt','dick','dicks','cock','asshole','ass','arse','bullshit','shit','shitty',
  'slut','whore','hoe','pussy','cum','spunk','spaz','retard','fag','faggot','nigger',
  'wanker','twat','jerkoff','dipshit','shithead','douche','douchebag','goddamn'
];

/* ─────────────────────────────────────────── */

type KitapOkumaNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'KitapOkuma'
>;
type KitapOkumaRouteProp = RouteProp<RootStackParamList, 'KitapOkuma'>;

interface KitapOkumaProps {
  navigation: KitapOkumaNavigationProp;
  route: KitapOkumaRouteProp;
}

interface Yorum {
  yorumId: number;
  kullaniciId: number;
  kitapId: number;
  yorum: string;
  yorumTarihi: string;
}

interface Puan {
  id: number;
  kullaniciId: number;
  kitapId: number;
  puan: number;
  puanlamaTarihi: string;
}
interface PuanResponse {
  ortalamaPuan: number;
  puanlamalar: Puan[];
}

/* ---- basit, yeniden kullanılabilir tam-ekran gezinme düğmesi ---- */
const NavBtn: React.FC<{ onPress: () => void; disabled?: boolean }> = ({
  children,
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    style={[styles.navBtn, disabled && { opacity: 0.3 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.navBtnTxt}>{children}</Text>
  </TouchableOpacity>
);

const KitapOkuma: React.FC<KitapOkumaProps> = ({ route }) => {
  const { kitapId } = route.params;
  const { user } = useAuth();

  const [sayfaGorselUrl, setSayfaGorselUrl] = useState('');
  const [sayfaNumarasi, setSayfaNumarasi] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hedefSayfa, setHedefSayfa] = useState('');
  const [kaldigimSayfa, setKaldigimSayfa] = useState<number | null>(null);

  /* Yıldızlı puanlama */
  const [selectedStars, setSelectedStars] = useState(0);
  const [ortalamaPuan, setOrtalamaPuan] = useState(0);
  const [myRatingId, setMyRatingId] = useState<number | null>(null);

  const [yorumMetni, setYorumMetni] = useState('');
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);
  const [fullScreen, setFullScreen] = useState(false);

  /* ---------------- Veriyi çek ---------------- */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        await axios.post(`${BASE_URL}/api/Kitap/${kitapId}/OkumaBaslat`, {
          kullaniciId: user.id,
        });
        const r = await axios.get(
          `${BASE_URL}/api/Kitap/KaldigimSayfa?kullaniciId=${user.id}&kitapId=${kitapId}`
        );
        const s = r.data.sonOkunanSayfa ?? 1;
        setKaldigimSayfa(s);
        fetchSayfa(s);
        fetchYorumlar();
        fetchOrtPuan();
      } catch (e: any) {
        console.error('Başlatma:', e.response?.data || e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSayfa = (n: number) => {
    setLoading(true);
    setSayfaGorselUrl(`${BASE_URL}/api/Kitap/${kitapId}/SayfaGorsel/${n}`);
    setSayfaNumarasi(n);
    setLoading(false);
  };
  const updateSayfa = (n: number) =>
    axios
      .put(`${BASE_URL}/api/Kitap/${kitapId}/OkumaGuncelle`, {
        kullaniciId: user?.id,
        sonOkunanSayfa: n,
      })
      .then(() => fetchSayfa(n))
      .catch(e => console.error('Sayfa güncelle:', e));

  /* -------------- Ortalama + kendi puanını çek -------------- */
  const fetchOrtPuan = () => {
    axios
      .get<PuanResponse>(`${BASE_URL}/api/Kitap/${kitapId}/PuanlariGetir`)
      .then(res => {
        setOrtalamaPuan(res.data.ortalamaPuan);
        const myP = res.data.puanlamalar.find(p => p.kullaniciId === user?.id);
        if (myP) {
          setSelectedStars(Math.round(myP.puan / 2));
          setMyRatingId(myP.id);
        } else {
          setMyRatingId(null);
        }
      })
      .catch(() => {});
  };

  /* -------------- Yorum -------------- */
  const fetchYorumlar = () =>
    axios
      .get(`${BASE_URL}/api/Kitap/${kitapId}/YorumlariGetir`)
      .then(res => setYorumlar(res.data))
      .catch(() => {});

  const yorumEkle = () => {
    if (!user || !yorumMetni.trim()) {
      Alert.alert('Uyarı', 'Lütfen yorum giriniz.');
      return;
    }
    const lower = yorumMetni.toLowerCase();
    if (BANLI_KELIMELER.some(k => lower.includes(k))) {
      Alert.alert('Uyarı', 'Yorumunuzda uygunsuz kelime tespit edildi.');
      return;
    }
    axios
      .post(`${BASE_URL}/api/Kitap/${kitapId}/YorumEkle`, {
        yorumId: 0,
        kullaniciId: user.id,
        kitapId,
        yorum: yorumMetni,
        yorumTarihi: new Date().toISOString(),
      })
      .then(() => {
        setYorumMetni('');
        fetchYorumlar();
      })
      .catch(() => Alert.alert('Hata', 'Yorum eklenemedi.'));
  };

  const yorumSil = (id: number) =>
    Alert.alert('Yorumu Sil', 'Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        onPress: () =>
          axios
            .delete(`${BASE_URL}/api/Kitap/${kitapId}/YorumSil/${id}`)
            .then(fetchYorumlar)
            .catch(() => Alert.alert('Hata', 'Yorum silinemedi.')),
      },
    ]);

  /* -------------- Puan verme (tekil/upsert) -------------- */
  const puanVer = () => {
    if (!user || selectedStars < 1) {
      Alert.alert('Uyarı', 'Lütfen en az 1 yıldız seçin.');
      return;
    }
    const mappedPuan = selectedStars * 2; // 5★ → 10 puan
    axios
      .post(`${BASE_URL}/api/Kitap/${kitapId}/PuanVer`, {
        id: myRatingId ?? 0,       // önceki puanım varsa güncelle
        kullaniciId: user.id,
        kitapId,
        puan: mappedPuan,
        puanlamaTarihi: new Date().toISOString(),
      })
      .then(() => {
        Alert.alert('Teşekkürler', 'Puan kaydedildi.');
        fetchOrtPuan();
      })
      .catch(() => Alert.alert('Hata', 'Puan verilemedi.'));
  };

  /* -------------- Görsel -------------- */
  const renderImage = () => {
    const w = fullScreen ? SCREEN_W : SCREEN_W * 0.85;
    const h = fullScreen ? SCREEN_H : SCREEN_H * 0.6;
    return (
      <ImageZoom
        cropWidth={w}
        cropHeight={h}
        imageWidth={w}
        imageHeight={h}
        minScale={1}
        maxScale={4}
        panToMove
        pinchToZoom
        enableCenterFocus
      >
        <Image
          source={{ uri: sayfaGorselUrl }}
          style={{ width: w, height: h }}
          resizeMode="contain"
        />
      </ImageZoom>
    );
  };

  /* -------------- TAM EKRAN -------------- */
  if (fullScreen) {
    return (
      <SafeAreaView style={styles.fullScreenWrapper}>
        <TouchableOpacity
          style={styles.closeTop}
          onPress={() => setFullScreen(false)}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator size="large" color="#4A148C" />
        ) : (
          renderImage()
        )}
        <View style={styles.fullNav}>
          <NavBtn
            onPress={() =>
              sayfaNumarasi > 1 && updateSayfa(sayfaNumarasi - 1)
            }
            disabled={sayfaNumarasi === 1}
          >
            ◀
          </NavBtn>
          <Text style={styles.fullNavText}>{sayfaNumarasi}</Text>
          <NavBtn onPress={() => updateSayfa(sayfaNumarasi + 1)}>▶</NavBtn>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------- NORMAL -------------- */
  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Sayfa {sayfaNumarasi}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4A148C" />
        ) : (
          <>
            {renderImage()}
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={() => setFullScreen(true)}
            >
              <Text style={styles.fullBtnTxt}>🔍 Tam Ekran</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Sayfa navigasyonu */}
        <View style={styles.navRow}>
          <NavBtn
            onPress={() =>
              sayfaNumarasi > 1 && updateSayfa(sayfaNumarasi - 1)
            }
            disabled={sayfaNumarasi === 1}
          >
            ◀️ Önceki
          </NavBtn>
          <NavBtn onPress={() => updateSayfa(sayfaNumarasi + 1)}>
            Sonraki ▶️
          </NavBtn>
        </View>

        {/* Belirli sayfa */}
        <View style={styles.gotoRow}>
          <TextInput
            style={styles.gotoInput}
            keyboardType="number-pad"
            placeholder="Sayfa no"
            value={hedefSayfa}
            onChangeText={setHedefSayfa}
          />
          <NavBtn
            onPress={() => {
              const s = parseInt(hedefSayfa);
              !isNaN(s) && s > 0
                ? updateSayfa(s)
                : Alert.alert('Geçersiz', 'Sayfa numarası hatalı.');
            }}
          >
            Git
          </NavBtn>
        </View>

        {/* Kaldığım sayfa */}
        <View style={{ marginTop: 10 }}>
          <NavBtn
            onPress={() =>
              kaldigimSayfa
                ? updateSayfa(kaldigimSayfa)
                : Alert.alert('Uyarı', 'Kayıt bulunamadı.')
            }
          >
            📌 Kaldığım Sayfa
          </NavBtn>
        </View>

        {/* ─── YILDIZLI PUANLAMA ─── */}
        <View style={styles.rateBlock}>
          <Text style={styles.rateTitle}>
            🌟 Değerlendir ({selectedStars} / 5)
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setSelectedStars(n)}>
                <Text style={styles.star}>
                  {n <= selectedStars ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <NavBtn onPress={puanVer}>Puanı Kaydet</NavBtn>
          <Text style={styles.avgText}>
            Ortalama: {(ortalamaPuan / 2).toFixed(1)} / 5 ⭐
          </Text>
        </View>

        {/* YORUM ekle */}
        <View style={styles.commentBlock}>
          <Text style={styles.sectionTitle}>💬 Yorum Ekle</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Yorumunuzu yazın..."
            value={yorumMetni}
            onChangeText={setYorumMetni}
            multiline
          />
          <NavBtn onPress={yorumEkle}>Yorumu Gönder</NavBtn>
        </View>

        {/* YORUMLAR */}
        <View style={styles.commentBlock}>
          <Text style={styles.sectionTitle}>📃 Yorumlar</Text>
          {yorumlar.length === 0 ? (
            <Text>Henüz yorum yapılmamış.</Text>
          ) : (
            yorumlar.map(y => (
              <View key={y.yorumId} style={styles.commentCard}>
                <Text style={{ fontWeight: 'bold' }}>👤 Bir kullanıcı:</Text>
                <Text>{y.yorum}</Text>
                <Text style={styles.commentDate}>
                  {new Date(y.yorumTarihi).toLocaleString()}
                </Text>
                {user?.id === y.kullaniciId && (
                  <NavBtn onPress={() => yorumSil(y.yorumId)}>Sil</NavBtn>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, alignItems: 'center' },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 10,
  },

  /* ortak nav düğmesi */
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#4A148C',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  navBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  navRow: { flexDirection: 'row', marginVertical: 10 },
  gotoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  gotoInput: {
    borderColor: '#CCC',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    width: 100,
    marginRight: 10,
    textAlign: 'center',
  },

  /* tam ekran */
  fullScreenWrapper: { flex: 1, backgroundColor: '#000' },
  closeTop: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  closeTxt: { color: '#FFF', fontSize: 22, fontWeight: '600' },
  fullNav: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  fullNavText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  fullBtn: {
    marginVertical: 8,
    backgroundColor: '#4A148C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  fullBtnTxt: { color: '#FFF', fontWeight: '600' },

  /* Puansal */
  rateBlock: { marginTop: 20, alignItems: 'center' },
  rateTitle: { fontSize: 16, fontWeight: '600', color: '#4A148C' },
  starRow: { flexDirection: 'row', marginVertical: 8 },
  star: { fontSize: 32, marginHorizontal: 4, color: '#FFD700' },
  avgText: { marginTop: 6, fontSize: 14, color: '#4A148C' },

  /* Yorum */
  commentBlock: { width: '100%', marginTop: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A148C',
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#AAA',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 60,
  },
  commentCard: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  commentDate: { fontSize: 12, color: '#666' },
});

export default KitapOkuma;
