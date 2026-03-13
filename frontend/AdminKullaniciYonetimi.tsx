import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

const BASE_URL = 'http://192.168.228.51:5000';

type Panel = 'ekle' | 'guncelle' | 'listele' | 'yorum' | 'slider' | '';

const AdminKullaniciYonetimi = () => {
  /* ─────────────── Kullanıcı State’leri ─────────────── */
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [yeniKullanici, setYeniKullanici] = useState({
    kullaniciAdi: '',
    email: '',
    sifre: '',
    isAdmin: false,
    kitapId: '',
    yorumId: '',
  });
  const [seciliId, setSeciliId] = useState('');
  const [guncelleKullanici, setGuncelleKullanici] = useState({
    kullaniciAdi: '',
    email: '',
    sifre: '',
    isAdmin: false,
  });

  /* ─────────────── SliderAd State’leri ─────────────── */
  const [sliderAds, setSliderAds] = useState<any[]>([]);
  const [yeniAd, setYeniAd] = useState({
    targetUrl: '',
    sira: '',
    aktifMi: true,
    image: null as any, // RN FormData öğesi
    previewUri: '',
  });

  const [aktifPanel, setAktifPanel] = useState<Panel>('');

  /* ─────────────── Kullanıcı  API ─────────────── */
  const kullanicilariGetir = () => {
    axios
      .get(`${BASE_URL}/api/Kullanici`)
      .then(res => setKullanicilar(res.data))
      .catch(() => Alert.alert('Hata', 'Kullanıcılar alınamadı'));
  };

  const kullaniciOlustur = () => {
    axios
      .post(`${BASE_URL}/api/Kullanici`, yeniKullanici)
      .then(() => {
        Alert.alert('Başarılı', 'Yeni kullanıcı eklendi');
        kullanicilariGetir();
      })
      .catch(() => Alert.alert('Hata', 'Kullanıcı eklenemedi'));
  };

  const kullaniciGuncelle = () => {
    axios
      .put(`${BASE_URL}/api/Kullanici/${seciliId}`, guncelleKullanici)
      .then(() => {
        Alert.alert('Başarılı', 'Kullanıcı güncellendi');
        kullanicilariGetir();
      })
      .catch(() => Alert.alert('Hata', 'Kullanıcı güncellenemedi'));
  };

  const kullaniciSil = (id: number) => {
    axios
      .delete(`${BASE_URL}/api/Kullanici/${id}`)
      .then(() => {
        Alert.alert('Başarılı', 'Kullanıcı silindi');
        kullanicilariGetir();
      })
      .catch(() => Alert.alert('Hata', 'Kullanıcı silinemedi'));
  };

  const adminlikGuncelle = (id: number, isAdmin: boolean) => {
    axios
      .put(`${BASE_URL}/api/Kullanici/${id}/SetAdmin`, { isAdmin })
      .then(() => {
        Alert.alert('Başarılı', `Kullanıcı admin durumu ${isAdmin ? '✔' : '❌'}`);
        kullanicilariGetir();
      })
      .catch(() => Alert.alert('Hata', 'Admin durumu güncellenemedi'));
  };

  const yorumSil = (kitapId: string, yorumId: string) => {
    axios
      .delete(`${BASE_URL}/api/Kitap/${kitapId}/YorumSil/${yorumId}`)
      .then(() => Alert.alert('Başarılı', 'Yorum silindi'))
      .catch(() => Alert.alert('Hata', 'Yorum silinemedi'));
  };

  /* ─────────────── SliderAd  API ─────────────── */
  const sliderlariGetir = () => {
    axios
      .get(`${BASE_URL}/api/Kitap/SliderAds`)
      .then(res => setSliderAds(res.data))
      .catch(() => Alert.alert('Hata', 'Slider reklamları alınamadı'));
  };

 const sliderEkle = () => {
   if (!yeniAd.image) {
     Alert.alert('Uyarı', 'Lütfen bir resim seçin');
     return;
   }

   const fd = new FormData();
   fd.append('Baslik', yeniAd.targetUrl.trim());   // <-- ALAN ADI!
   fd.append('Resim', yeniAd.image);               // <-- Büyük-R

   // İsteği gönder
   axios
     .post(`${BASE_URL}/api/Kitap/SliderAds`, fd, {
       headers: { 'Content-Type': 'multipart/form-data' },
     })
     .then(() => {
       Alert.alert('Başarılı', 'Slider reklam eklendi');
       setYeniAd({ targetUrl: '', sira: '', aktifMi: true, image: null, previewUri: '' });
       sliderlariGetir();
     })
     .catch(err => {
       console.log('Slider POST error -> ', err.response?.data || err.message);
       Alert.alert('Hata', 'Slider eklenemedi');
     });
 };


  const sliderSil = (id: number) => {
    axios
      .delete(`${BASE_URL}/api/Kitap/SliderAds/${id}`)
      .then(() => {
        Alert.alert('Başarılı', 'Slider silindi');
        sliderlariGetir();
      })
      .catch(() => Alert.alert('Hata', 'Slider silinemedi'));
  };

  /* ─────────────── Image Picker ─────────────── */
  const resimSec = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Hata', response.errorMessage || 'Resim seçilemedi');
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setYeniAd(prev => ({
          ...prev,
          previewUri: asset.uri,
          image: {
            uri: asset.uri,
            name: asset.fileName || `slider_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        }));
      }
    });
  };

  /* ─────────────── useEffect’ler ─────────────── */
  useEffect(() => {
    if (aktifPanel === 'listele') kullanicilariGetir();
    if (aktifPanel === 'slider') sliderlariGetir();
  }, [aktifPanel]);

  /* ───────────────── UI ───────────────── */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Kullanıcı Yönetimi</Text>

      <View style={styles.panelButtons}>
        <Button title="➕ Kullanıcı Ekle" onPress={() => setAktifPanel('ekle')} />
        <Button title="✏️ Kullanıcı Güncelle" onPress={() => setAktifPanel('guncelle')} />
        <Button title="👥 Kullanıcıları Listele" onPress={() => setAktifPanel('listele')} />
        <Button title="🗑️ Yorum Sil" onPress={() => setAktifPanel('yorum')} />
        <Button title="🖼️ Slider Reklam" onPress={() => setAktifPanel('slider')} />
      </View>

      {/* ---------------- Kullanıcı Ekle ---------------- */}
      {aktifPanel === 'ekle' && (
        <View>
          <Text style={styles.subtitle}>Yeni Kullanıcı Oluştur</Text>
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Adı"
            placeholderTextColor="#999"
            onChangeText={val => setYeniKullanici(prev => ({ ...prev, kullaniciAdi: val }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            onChangeText={val => setYeniKullanici(prev => ({ ...prev, email: val }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={val => setYeniKullanici(prev => ({ ...prev, sifre: val }))}
          />
          <Button title="Kullanıcı Ekle" onPress={kullaniciOlustur} />
        </View>
      )}

      {/* ---------------- Kullanıcı Güncelle ---------------- */}
      {aktifPanel === 'guncelle' && (
        <View>
          <Text style={styles.subtitle}>Kullanıcı Güncelle</Text>
          <TextInput
            style={styles.input}
            placeholder="Güncellenecek Kullanıcı ID"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={setSeciliId}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Kullanıcı Adı"
            placeholderTextColor="#999"
            onChangeText={val => setGuncelleKullanici(prev => ({ ...prev, kullaniciAdi: val }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Email"
            placeholderTextColor="#999"
            onChangeText={val => setGuncelleKullanici(prev => ({ ...prev, email: val }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Şifre"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={val => setGuncelleKullanici(prev => ({ ...prev, sifre: val }))}
          />
          <Button title="Kullanıcı Güncelle" color="orange" onPress={kullaniciGuncelle} />
        </View>
      )}

      {/* ---------------- Kullanıcı Listele ---------------- */}
      {aktifPanel === 'listele' && (
        <View>
          <Text style={styles.subtitle}>Tüm Kullanıcılar</Text>
          {kullanicilar.map(k => (
            <View key={k.id} style={styles.userBox}>
              <Text style={styles.userText}>
                {k.kullaniciAdi} | {k.email} | Admin: {k.isAdmin ? '✔' : '❌'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                <Button title="Sil" color="red" onPress={() => kullaniciSil(k.id)} />
                <Button title="Admin Yap" onPress={() => adminlikGuncelle(k.id, true)} />
                <Button title="Adminliği Kaldır" onPress={() => adminlikGuncelle(k.id, false)} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ---------------- Yorum Sil ---------------- */}
      {aktifPanel === 'yorum' && (
        <View>
          <Text style={styles.subtitle}>Yorum Sil</Text>
          <TextInput
            style={styles.input}
            placeholder="Kitap ID (örn: 1)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={val => setYeniKullanici(prev => ({ ...prev, kitapId: val }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Yorum ID (örn: 3)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={val => setYeniKullanici(prev => ({ ...prev, yorumId: val }))}
          />
          <Button
            title="Yorumu Sil"
            color="red"
            onPress={() => yorumSil(yeniKullanici.kitapId, yeniKullanici.yorumId)}
          />
        </View>
      )}

      {/* ---------------- Slider Reklam Paneli ---------------- */}
      {aktifPanel === 'slider' && (
        <View>
          <Text style={styles.subtitle}>Slider Reklam Yönetimi</Text>

          {/* --- Yeni Slider --- */}
          <TextInput
            style={styles.input}
            placeholder="Hedef URL (https://...)"
            placeholderTextColor="#999"
            onChangeText={val => setYeniAd(prev => ({ ...prev, targetUrl: val }))}
            value={yeniAd.targetUrl}
          />
          <TextInput
            style={styles.input}
            placeholder="Sıra (örn: 1)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={val => setYeniAd(prev => ({ ...prev, sira: val }))}
            value={yeniAd.sira}
          />

          <Button title="Resim Seç" onPress={resimSec} />
          {yeniAd.previewUri ? (
            <Image
              source={{ uri: yeniAd.previewUri }}
              style={{ width: '100%', height: 180, marginTop: 10, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : null}
          <Button title="Slider Ekle" onPress={sliderEkle} />

          {/* --- Mevcut Slider’lar --- */}
          <Text style={[styles.subtitle, { marginTop: 25 }]}>Mevcut Sliderlar</Text>
          {sliderAds.length === 0 && <Text>Henüz slider eklenmemiş.</Text>}

          {sliderAds.map(ad => (
            <View key={ad.id} style={styles.userBox}>
              <Image
                source={{ uri: `${BASE_URL}${ad.resimUrl}` }}
                style={{ width: '100%', height: 120, borderRadius: 6 }}
                resizeMode="cover"
              />
              <Text style={styles.userText}>
                #{ad.id} – {ad.targetUrl}
              </Text>
              <Button title="Sil" color="red" onPress={() => sliderSil(ad.id)} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

/* ─────────────── STYLES ─────────────── */

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F3E5F5' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#4A148C',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#6A1B9A',
  },
  panelButtons: { marginBottom: 20, gap: 10 },
  input: {
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  userBox: {
    borderWidth: 1,
    borderColor: '#7E57C2',
    backgroundColor: '#EDE7F6',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  userText: { color: '#000' },
});

export default AdminKullaniciYonetimi;
