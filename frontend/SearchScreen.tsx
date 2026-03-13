import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ImageBackground } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, ActivityIndicator, Text } from 'react-native-paper';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

interface Book {
  id: number;
  ad: string;
  yazar: string;
  puan: number;
  kategoriler?: string[];
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = () => {
    if (!keyword.trim()) {
      Alert.alert('Uyarı', 'Arama terimi boş olamaz.');
      return;
    }
    setLoading(true);

    axios
      .get(`http://192.168.228.51:5000/api/Kitap/Search?keyword=${encodeURIComponent(keyword)}`)
      .then((response) => {
        const transformed = response.data.map((item: any) => ({
          id: item.kitapId,
          ad: item.kitapAdi,
          yazar: item.yazar,
          puan: item.puan,
          kategoriler: item.kategoriler,
        }));
        setResults(transformed);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error('Arama hatası:', error);
        if (error.response && error.response.status === 404) {
          Alert.alert('Bilgi', 'Aradığınız kriterlere uygun kitap bulunamadı.');
        } else {
          Alert.alert('Hata', 'Arama yapılırken bir sorun oluştu.');
        }
      });
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <Card style={styles.itemCard} onPress={() => navigation.navigate('KitapDetay', { kitapId: item.id })}>
      <Card.Content>
        <Title style={styles.itemTitle}>{item.ad}</Title>
        <Paragraph style={styles.itemSubtitle}>{item.yazar}</Paragraph>
        <Paragraph style={styles.itemRating}>⭐ {item.puan}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <ImageBackground
      source={require('../assets/bookshelf.jpg')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <Title style={styles.screenTitle}>Kitap Arama</Title>
        <TextInput
          mode="outlined"
          label="Arama"
          placeholder="Kitap adı, yazar veya kategori..."
          value={keyword}
          onChangeText={setKeyword}
          style={styles.input}
          theme={{ colors: { primary: '#0D47A1' } }}
        />
        <Button
          mode="contained"
          onPress={handleSearch}
          style={styles.searchButton}
          contentStyle={styles.searchButtonContent}
        >
          Ara
        </Button>
        {loading && (
          <ActivityIndicator animating={true} size="large" color="#3b5998" style={styles.loading} />
        )}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookItem}
          ListEmptyComponent={
            !loading && (
              <Text style={styles.emptyText}>Arama sonucu bulunamadı.</Text>
            )
          }
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </ImageBackground>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0D47A1',
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  searchButton: {
    marginBottom: 20,
  },
  searchButtonContent: {
    paddingVertical: 8,
  },
  loading: {
    marginVertical: 20,
  },
  listContainer: {
    paddingVertical: 10,
  },
  itemCard: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  itemSubtitle: {
    fontSize: 16,
    color: '#1565C0',
  },
  itemRating: {
    fontSize: 16,
    color: '#1565C0',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 18,
  },
});
