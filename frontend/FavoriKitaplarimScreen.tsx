import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Button, Card, Title } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { RouteProp } from '@react-navigation/native';

const BASE_URL = 'http://192.168.228.51:5000';

type FavoriKitaplarimScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FavoriKitaplarim'
>;
type FavoriKitaplarimScreenRouteProp = RouteProp<RootStackParamList, 'FavoriKitaplarim'>;

interface FavoriKitaplarimProps {
  navigation: FavoriKitaplarimScreenNavigationProp;
  route: FavoriKitaplarimScreenRouteProp;
}

interface FavoriKitap {
  kitapId: number;
  kitapAdi: string;
  yazar: string;
  kategoriler: string[];
  eklenmeTarihi: string;
  // Eğer backend'de resimYolu varsa:
  // resimYolu?: string;
}

const FavoriKitaplarimScreen: React.FC<FavoriKitaplarimProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [favoriler, setFavoriler] = useState<FavoriKitap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    axios
      .get<FavoriKitap[]>(`${BASE_URL}/api/Kitap/FavorileriListele/${user.id}`)
      .then(res => {
        const gelenFavoriler = res.data || [];

        // 1. Tekilleştirme
        const uniqueMap = new Map<number, FavoriKitap>();
        gelenFavoriler.forEach(item => {
          uniqueMap.set(item.kitapId, item);
        });
        const tekilFavoriler = Array.from(uniqueMap.values());

        setFavoriler(tekilFavoriler);
        setLoading(false);
      })
      .catch(err => {
        console.error('Favori kitaplar getirilemedi:', err);
        Alert.alert('Hata', 'Favori kitaplar çekilirken bir sorun oluştu.');
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Lütfen giriş yapınız.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7B1FA2" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.mainTitle}>Favori Kitaplarım</Text>
      {favoriler.length === 0 ? (
        <Text style={styles.infoText}>Henüz favori kitabınız yok.</Text>
      ) : (
        favoriler.map((kitap, i) => (
          <Card
            key={i}
            style={styles.kitapCard}
            onPress={() => {
              // Kartın tamamına tıklayınca KitapDetay'a gidiyoruz
              navigation.navigate('KitapDetay', { kitapId: kitap.kitapId });
            }}
          >
            <View style={styles.kitapContainer}>
              {/* Resim Kutusu */}
              <View style={styles.imageContainer}>
                {/* Örnek: eğer resimYolu yoksa placeholder göster */}
                {/* Aşağıdaki 'kitap.resimYolu' alanını backend'e göre ayarlayın */}
                {false /*kitap.resimYolu*/ ? (
                  <Image
                    source={{ uri: BASE_URL + kitap.resimYolu }}
                    style={styles.kitapImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyImage}>
                    <Text style={styles.emptyImageText}>Resim Yok</Text>
                  </View>
                )}
              </View>

              {/* Sağ Taraf (Metin) */}
              <View style={styles.textContainer}>
                <Title style={styles.kitapAdi}>{kitap.kitapAdi}</Title>
                <Text style={styles.yazar}>{kitap.yazar}</Text>
                <Text style={styles.kategori}>
                  {kitap.kategoriler.join(', ')}
                </Text>
                <Text style={styles.date}>
                  {new Date(kitap.eklenmeTarihi).toLocaleString()}
                </Text>

                {/* Detay Butonu */}
                <Button
                  mode="contained"
                  style={styles.detayButton}
                  onPress={() =>
                    navigation.navigate('KitapDetay', { kitapId: kitap.kitapId })
                  }
                >
                  Detay
                </Button>
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
};

export default FavoriKitaplarimScreen;

/* ----- STYLES ----- */
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#EDE7F6', // Açık mor arka plan
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A148C',
    textAlign: 'center',
    marginVertical: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#6A1B9A',
    textAlign: 'center',
  },
  kitapCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: '#FFF',
  },
  kitapContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitapImage: {
    width: '100%',
    height: '100%',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1BEE7',
  },
  emptyImageText: {
    color: '#6A1B9A',
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  kitapAdi: {
    fontSize: 18,
    color: '#4A148C',
  },
  yazar: {
    fontSize: 14,
    color: '#6A1B9A',
    marginVertical: 2,
  },
  kategori: {
    fontSize: 12,
    color: '#8E24AA',
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginVertical: 4,
  },
  detayButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7E57C2',
    marginTop: 8,
  },
});

