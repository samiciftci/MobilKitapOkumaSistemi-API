import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import DocumentPicker, { types } from 'react-native-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

// -------------------------------------------------------------------
// AdminKitapScreen: Tüm admin endpointleri TEK DOSYADA ama
// menü/select mantığı ile ekrana yansıyan formu değiştiriyoruz.
// -------------------------------------------------------------------

type AdminKitapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminKitapScreen'
>;

interface AdminKitapScreenProps {
  navigation: AdminKitapScreenNavigationProp;
}

const BASE_URL = 'http://192.168.228.51:5000';

const AdminKitapScreen: React.FC<AdminKitapScreenProps> = ({ navigation }) => {

  // Ana menüde hangi işlemi seçtiğimizi tutar:
  // '' => henüz bir şey seçilmedi (ana menü)
  // 'ekle','guncelle','pdf','ozet','kategori','populer'
  // +++ YENİ: 'resim' => Kitap Resmi Yükleme
  // +++ YENİ: 'sil'   => Kitap Silme
  const [mode, setMode] = useState<string>('');

  // ---------------------------------------------------------------------
  // -------------------- ORTAK Fonksiyonlar / State ----------------------
  // ---------------------------------------------------------------------
  // PDF dosyası seçme (Mevcut):
  const pickPdfFile = async (): Promise<string> => {
    try {
      const res = await DocumentPicker.pick({
        type: [types.pdf],
      });
      if (res && res[0]) {
        return res[0].uri;
      }
      return '';
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Kullanıcı PDF seçimini iptal etti.');
      } else {
        console.error('DocumentPicker (PDF) Hatası:', err);
      }
      return '';
    }
  };

  // +++ YENİ: Resim dosyası seçme (PNG, JPG, vs.)
  const pickImageFile = async (): Promise<string> => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      if (res && res[0]) {
        return res[0].uri;
      }
      return '';
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Kullanıcı resim seçiminden çıktı.');
      } else {
        console.error('DocumentPicker (resim) Hatası:', err);
      }
      return '';
    }
  };

  // ---------------------------------------------------------------------
  // ---------- KITAP EKLE State & Fonksiyon -----------------------------
  // ---------------------------------------------------------------------
  const [ad, setAd] = useState('');
  const [yazar, setYazar] = useState('');
  const [puan, setPuan] = useState('');
  const [kategoriler, setKategoriler] = useState('');
  const [pdfYolu, setPdfYolu] = useState('');

  const handleCreateKitap = () => {
    if (!ad || !yazar) {
      Alert.alert('Hata', 'Lütfen kitap adı ve yazar bilgisini giriniz.');
      return;
    }
    const kitap = {
      ad: ad.trim(),
      yazar: yazar.trim(),
      puan: parseInt(puan, 10) || 0,
      pdfYolu: pdfYolu.trim() || '',
      kategoriler: kategoriler ? kategoriler.split(',').map(k => k.trim()) : [],
    };

    axios
      .post(`${BASE_URL}/api/Kitap`, kitap, { headers: { 'Content-Type': 'application/json' } })
      .then(() => {
        Alert.alert('Başarılı', 'Kitap başarıyla eklendi!');
        navigation.navigate('KitapListesi');
      })
      .catch(error => {
        console.error('❌ Kitap ekleme hatası:', error.response?.data || error.message);
        Alert.alert('Hata', 'Kitap eklenirken bir hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // ---------- KITAP GÜNCELLE State & Fonksiyon -------------------------
  // ---------------------------------------------------------------------
  const [updateBookName, setUpdateBookName] = useState('');
  const [guncelleAd, setGuncelleAd] = useState('');
  const [guncelleYazar, setGuncelleYazar] = useState('');
  const [guncellePuan, setGuncellePuan] = useState('');
  const [guncelleKategoriler, setGuncelleKategoriler] = useState('');
  const [guncellePdfYolu, setGuncellePdfYolu] = useState('');

  const handleUpdateKitap = async () => {
    if (!updateBookName) {
      Alert.alert('Hata', 'Lütfen güncellenecek kitabın adını giriniz.');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/Kitap`);
      const kitapList = response.data;
      const bulunanKitap = kitapList.find(
        (k: any) => k.ad.toLowerCase() === updateBookName.trim().toLowerCase()
      );
      if (!bulunanKitap) {
        Alert.alert('Hata', 'Belirtilen isimde bir kitap bulunamadı.');
        return;
      }
      const kitap = {
        id: bulunanKitap.id,
        ad: guncelleAd.trim(),
        yazar: guncelleYazar.trim(),
        puan: parseInt(guncellePuan, 10) || 0,
        pdfYolu: guncellePdfYolu.trim() || '',
        kategoriIds: guncelleKategoriler
          ? guncelleKategoriler.split(',').map((x: string) => parseInt(x.trim(), 10))
          : [],
      };

      axios
        .put(`${BASE_URL}/api/Kitap/${kitap.id}`, kitap, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then(() => {
          Alert.alert('Başarılı', 'Kitap başarıyla güncellendi!');
          navigation.navigate('KitapListesi');
        })
        .catch(error => {
          console.error('❌ Kitap güncelleme hatası:', error.response?.data || error.message);
          Alert.alert('Hata', 'Kitap güncellenirken bir hata oluştu.');
        });
    } catch (error) {
      console.error('Kitap güncelleme sırasında kitap arama hatası:', error);
      Alert.alert('Hata', 'Güncellenecek kitap bulunamadı.');
    }
  };

  // ---------------------------------------------------------------------
  // ---------- PDF YÜKLE State & Fonksiyon ------------------------------
  // ---------------------------------------------------------------------
  const [uploadBookName, setUploadBookName] = useState('');
  const [uploadPdfUri, setUploadPdfUri] = useState('');

  const handleUploadPdf = async () => {
    if (!uploadBookName) {
      Alert.alert('Hata', 'Lütfen PDF yüklenecek kitabın adını giriniz.');
      return;
    }
    const uri = await pickPdfFile();
    if (!uri) {
      Alert.alert('Hata', 'PDF dosyası seçilemedi.');
      return;
    }
    setUploadPdfUri(uri);

    try {
      const response = await axios.get(`${BASE_URL}/api/Kitap`);
      const kitapList = response.data;
      const bulunanKitap = kitapList.find(
        (k: any) => k.ad.toLowerCase() === uploadBookName.trim().toLowerCase()
      );
      if (!bulunanKitap) {
        Alert.alert('Hata', 'Belirtilen isimde bir kitap bulunamadı.');
        return;
      }
      const kitapIdForUpload = bulunanKitap.id;

      // PDF için dosya adı ve uzantı kontrolü:
      const fileNameFromUri = uri.split('/').pop() || 'dosya';
      let finalPdfName = fileNameFromUri;
      if (!finalPdfName.includes('.')) {
        finalPdfName += '.pdf';
      }

      const formData = new FormData();
      formData.append('pdf', {
        uri: uri,
        name: finalPdfName,
        type: 'application/pdf',
      } as any);

      axios
        .post(`${BASE_URL}/api/Kitap/${kitapIdForUpload}/UploadPdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((response) => {
          // PDF yüklendikten sonra backend tarafından dönen dosya yolunu alıp state'e set ediyoruz.
          const pdfPath = response.data.Path;
          setPdfYolu(pdfPath);
          Alert.alert('Başarılı', `PDF dosyası başarıyla yüklendi!\nPDF yolu: ${pdfPath}`);
        })
        .catch(error => {
          console.error('❌ PDF yükleme hatası:', error.response?.data || error.message);
          Alert.alert('Hata', 'PDF dosyası yüklenirken bir hata oluştu.');
        });
    } catch (error) {
      console.error('PDF yükleme sırasında kitap arama hatası:', error);
      Alert.alert('Hata', 'Yüklenecek kitap bulunamadı.');
    }
  };

  // ---------------------------------------------------------------------
  // ---------- ÖZET EKle/GÜNCELLE/SİL  State & Fonksiyon ---------------
  // ---------------------------------------------------------------------
  // Ozet Ekle => PUT /api/Kitap/{kitapId}/OzetEkle
  const [ozetKitapId, setOzetKitapId] = useState('');
  const [ozetMetni, setOzetMetni] = useState('');
  const handleOzetEkle = () => {
    if (!ozetKitapId || !ozetMetni.trim()) {
      Alert.alert('Hata', 'Lütfen kitap ID ve özet metni giriniz.');
      return;
    }
    axios
      .put(`${BASE_URL}/api/Kitap/${ozetKitapId}/OzetEkle`, JSON.stringify(ozetMetni), {
        headers: { 'Content-Type': 'application/json-patch+json' },
      })
      .then(() => {
        Alert.alert('Başarılı', 'Kitap özeti başarıyla eklendi.');
      })
      .catch(err => {
        console.error('Ozet Ekle hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Özet eklenirken bir hata oluştu.');
      });
  };

  // Ozet Guncelle => PUT /api/Kitap/OzetGuncelle/{id}
  const [guncelOzetId, setGuncelOzetId] = useState('');
  const [guncelOzetMetni, setGuncelOzetMetni] = useState('');
  const handleOzetGuncelle = () => {
    if (!guncelOzetId || !guncelOzetMetni.trim()) {
      Alert.alert('Hata', 'Lütfen ozet ID ve yeni özet metnini giriniz.');
      return;
    }
    const body = {
      id: parseInt(guncelOzetId, 10),
      ozetMetni: guncelOzetMetni,
    };
    axios
      .put(`${BASE_URL}/api/Kitap/OzetGuncelle/${guncelOzetId}`, body, {
        headers: { 'Content-Type': 'application/json-patch+json' },
      })
      .then(() => {
        Alert.alert('Başarılı', 'Özet başarıyla güncellendi.');
      })
      .catch(err => {
        console.error('Ozet Guncelle hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Özet güncellenirken bir hata oluştu.');
      });
  };

  // Ozet Sil => DELETE /api/Kitap/OzetSil/{id}
  const [silinecekOzetId, setSilinecekOzetId] = useState('');
  const handleOzetSil = () => {
    if (!silinecekOzetId) {
      Alert.alert('Hata', 'Silinecek özetin IDsini giriniz.');
      return;
    }
    axios
      .delete(`${BASE_URL}/api/Kitap/OzetSil/${silinecekOzetId}`)
      .then(() => {
        Alert.alert('Başarılı', 'Özet başarıyla silindi.');
      })
      .catch(err => {
        console.error('Ozet sil hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Özet silinirken bir hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // ---------- PUANLARI GETİR  (GET /api/Kitap/{kitapId}/PuanlariGetir) --
  // ---------------------------------------------------------------------
  const [puanlariGetirKitapId, setPuanlariGetirKitapId] = useState('');
  const [kitapPuanlari, setKitapPuanlari] = useState<any>(null);

  const handlePuanlariGetir = () => {
    if (!puanlariGetirKitapId) {
      Alert.alert('Hata', 'Puanları çekmek için kitap ID giriniz.');
      return;
    }
    axios
      .get(`${BASE_URL}/api/Kitap/${puanlariGetirKitapId}/PuanlariGetir`)
      .then(res => {
        setKitapPuanlari(res.data);
      })
      .catch(err => {
        console.error('PuanlariGetir hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Kitap puanları alınırken hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // ---------- KATEGORİ EKLE/SİL/LİSTELE   ------------------------------
  // ---------------------------------------------------------------------
  const [kategoriAdi, setKategoriAdi] = useState('');
  const handleKategoriEkle = () => {
    if (!kategoriAdi.trim()) {
      Alert.alert('Hata', 'Kategori adı giriniz.');
      return;
    }
    const body = { id: 0, ad: kategoriAdi, kitapKategoriler: [] };
    axios
      .post(`${BASE_URL}/api/Kitap/KategoriEkle`, body, {
        headers: { 'Content-Type': 'application/json-patch+json' },
      })
      .then(() => {
        Alert.alert('Başarılı', 'Kategori başarıyla eklendi.');
      })
      .catch(err => {
        console.error('Kategori ekleme hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Kategori eklenirken bir hata oluştu.');
      });
  };

  const [kategoriSilId, setKategoriSilId] = useState('');
  const handleKategoriSil = () => {
    if (!kategoriSilId) {
      Alert.alert('Hata', 'Silinecek kategori IDsi giriniz.');
      return;
    }
    axios
      .delete(`${BASE_URL}/api/Kitap/KategoriSil/${kategoriSilId}`)
      .then(() => {
        Alert.alert('Başarılı', 'Kategori başarıyla silindi.');
      })
      .catch(err => {
        console.error('Kategori sil hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Kategori silinirken bir hata oluştu.');
      });
  };

  const [kategorilerList, setKategorilerList] = useState<any[]>([]);
  const handleKategorilerGetir = () => {
    axios
      .get(`${BASE_URL}/api/Kitap/Kategoriler`)
      .then(res => {
        setKategorilerList(res.data);
        Alert.alert('Başarılı', 'Kategoriler listesi çekildi.');
      })
      .catch(err => {
        console.error('Kategoriler çekme hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Kategoriler çekilirken hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // ---------- POPÜLER KİTAPLAR  (GET /api/Kitap/PopulerKitaplar) -------
  // ---------------------------------------------------------------------
  const [populerKitaplar, setPopulerKitaplar] = useState<any[]>([]);
  const handlePopulerKitaplar = () => {
    axios
      .get(`${BASE_URL}/api/Kitap/PopulerKitaplar`)
      .then(res => {
        setPopulerKitaplar(res.data);
        Alert.alert('Başarılı', 'Popüler kitaplar listesi alındı.');
      })
      .catch(err => {
        console.error('PopulerKitaplar hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Popüler kitaplar alınırken hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // +++ YENİ: KITAP RESMİ YÜKLE (PNG, JPEG)
  // POST /api/Kitap/{kitapId}/AdminKitapResmiYukle?adminUserId=...
  // ---------------------------------------------------------------------
  const [resimKitapAdi, setResimKitapAdi] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [resimUri, setResimUri] = useState('');

  const handleUploadResim = async () => {
    if (!resimKitapAdi.trim()) {
      Alert.alert('Hata', 'Resim yüklenecek kitabın adını giriniz.');
      return;
    }
    if (!adminUserId) {
      Alert.alert('Hata', 'Admin kullanıcı ID giriniz.');
      return;
    }
    try {
      const uri = await pickImageFile();
      if (!uri) {
        Alert.alert('Hata', '(PNG, JPEG) resim dosyası seçilemedi.');
        return;
      }
      setResimUri(uri);

      // 1) Tüm kitapları çek, isme göre ID bul
      const response = await axios.get(`${BASE_URL}/api/Kitap`);
      const kitapList = response.data;
      const bulunanKitap = kitapList.find(
        (k: any) => k.ad.toLowerCase() === resimKitapAdi.trim().toLowerCase()
      );
      if (!bulunanKitap) {
        Alert.alert('Hata', 'Belirtilen isimde kitap bulunamadı.');
        return;
      }

      const kitapId = bulunanKitap.id;

      // Basit bir mime type tespiti ve dosya adında uzantı kontrolü
      const fileNameFromUri = uri.split('/').pop() || 'resim';
      let mimeType = 'image/png';
      const lowerFileName = fileNameFromUri.toLowerCase();
      if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      }
      // Eğer dosya adında uzantı yoksa, mimeType'a göre ekleyelim
      let finalFileName = fileNameFromUri;
      if (!finalFileName.includes('.')) {
        finalFileName += (mimeType === 'image/png' ? '.png' : '.jpg');
      }

      const formData = new FormData();
      formData.append('image', {
        uri,
        name: finalFileName,
        type: mimeType,
      } as any);

      await axios.post(
        `${BASE_URL}/api/Kitap/${kitapId}/AdminKitapResmiYukle?adminUserId=${adminUserId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      Alert.alert('Başarılı', 'Kitap resmi (PNG, JPEG) başarıyla yüklendi.');
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        Alert.alert('İptal', 'Resim seçimi iptal edildi.');
      } else {
        console.error('Kitap Resmi Yükleme hatası:', error);
        Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu.');
      }
    }
  };

  // ---------------------------------------------------------------------
  // +++ YENİ: KITAP SİLME (DELETE /api/Kitap/{id})
  // ---------------------------------------------------------------------
  const [silinecekKitapId, setSilinecekKitapId] = useState('');

  const handleKitapSil = () => {
    if (!silinecekKitapId.trim()) {
      Alert.alert('Hata', 'Silinecek kitap ID giriniz.');
      return;
    }
    axios
      .delete(`${BASE_URL}/api/Kitap/${silinecekKitapId}`)
      .then(() => {
        Alert.alert('Başarılı', 'Kitap başarıyla silindi.');
      })
      .catch(err => {
        console.error('Kitap sil hata:', err.response?.data || err.message);
        Alert.alert('Hata', 'Kitap silinirken bir hata oluştu.');
      });
  };

  // ---------------------------------------------------------------------
  // ----------------- RENDER: Ana Menü veya Alt Formlar -----------------
  // ---------------------------------------------------------------------

  // Eğer mode = '' => henüz hiçbir işlem seçilmedi => Ana Menü'yü göster
  if (mode === '') {
    return (
      <View style={[styles.container, styles.bgPurple]}>
        <Text style={styles.mainTitle}>Admin Kitap Yönetimi - Ana Menü</Text>

        <Button title="Kitap Ekle" onPress={() => setMode('ekle')} />
        <View style={{ height: 10 }} />
        <Button title="Kitap Güncelle" onPress={() => setMode('guncelle')} />
        <View style={{ height: 10 }} />
        <Button title="PDF Yükle" onPress={() => setMode('pdf')} />
        <View style={{ height: 10 }} />
        <Button title="Özet İşlemleri" onPress={() => setMode('ozet')} />
        <View style={{ height: 10 }} />
        <Button title="Kategori İşlemleri" onPress={() => setMode('kategori')} />
        <View style={{ height: 10 }} />
        <Button title="Popüler Kitaplar & Puanlar" onPress={() => setMode('populer')} />
        <View style={{ height: 10 }} />
        {/* YENİ: Resim Yükle */}
        <Button title="Kitap Resmi Yükle" onPress={() => setMode('resim')} color="#6A1B9A" />
        <View style={{ height: 10 }} />
        {/* YENİ: Kitap Sil */}
        <Button title="Kitap Sil" onPress={() => setMode('sil')} color="#D32F2F" />
      </View>
    );
  }

  // Eğer mode <> '' => Seçilen formu göster.
  // ScrollView kullanalım ki uzun formlar kaydırılabilsin.
  return (
    <ScrollView contentContainerStyle={[styles.container, styles.bgPurple]}>
      {/* Geri butonu => Ana Menü */}
      <Button title="← Geri (Ana Menü)" onPress={() => setMode('')} color="#999" />
      <Text style={styles.mainTitle}>Admin Panel / {mode.toUpperCase()}</Text>

      {/* ---------------------- KITAP EKLE ------------------------- */}
      {mode === 'ekle' && (
        <>
          <Text style={styles.subtitle}>📗 Kitap Ekle</Text>
          <TextInput
            style={styles.input}
            placeholder="Kitap Adı"
            value={ad}
            placeholderTextColor="#555"
            onChangeText={setAd}
          />
          <TextInput
            style={styles.input}
            placeholder="Yazar"
            value={yazar}
            placeholderTextColor="#555"
            onChangeText={setYazar}
          />
          <TextInput
            style={styles.input}
            placeholder="Puan (ör. 8)"
            value={puan}
            placeholderTextColor="#555"
            onChangeText={setPuan}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Kategoriler (virgülle ayrılmış, ör. Roman,Tarih)"
            placeholderTextColor="#555"
            value={kategoriler}
            onChangeText={setKategoriler}
          />
          <TextInput
            style={styles.input}
            placeholder="PDF Yolu (ör. /pdfs/Dune.pdf)"
            placeholderTextColor="#555"
            value={pdfYolu}
            onChangeText={setPdfYolu}
          />
          <Button title="Kitap Ekle" onPress={handleCreateKitap} />
        </>
      )}

      {/* ---------------------- KITAP GÜNCELLE --------------------- */}
      {mode === 'guncelle' && (
        <>
          <Text style={styles.subtitle}>✏️ Kitap Güncelle</Text>
          <TextInput
            style={styles.input}
            placeholder="Güncellenecek Kitap Adı"
            value={updateBookName}
            placeholderTextColor="#555"
            onChangeText={setUpdateBookName}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Kitap Adı"
            value={guncelleAd}
            placeholderTextColor="#555"
            onChangeText={setGuncelleAd}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Yazar"
            value={guncelleYazar}
            placeholderTextColor="#555"
            onChangeText={setGuncelleYazar}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Puan (ör. 8)"
            value={guncellePuan}
            placeholderTextColor="#555"
            onChangeText={setGuncellePuan}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Kategoriler (ID olarak, virgülle ayrılmış, ör. 1,4)"
            value={guncelleKategoriler}
            placeholderTextColor="#555"
            onChangeText={setGuncelleKategoriler}
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni PDF Yolu (ör. /pdfs/Dune.pdf)"
            value={guncellePdfYolu}
            placeholderTextColor="#555"
            onChangeText={setGuncellePdfYolu}
          />
          <Button title="Kitap Güncelle" onPress={handleUpdateKitap} color="orange" />
        </>
      )}

      {/* ---------------------- PDF YÜKLE -------------------------- */}
      {mode === 'pdf' && (
        <>
          <Text style={styles.subtitle}>📂 PDF Yükleme</Text>
          <TextInput
            style={styles.input}
            placeholder="PDF Yüklenecek Kitap Adı"
            value={uploadBookName}
            placeholderTextColor="#555"
            onChangeText={setUploadBookName}
          />
          <Button
            title="PDF Dosyası Seç"
            onPress={async () => {
              const uri = await pickPdfFile();
              if (uri) {
                setUploadPdfUri(uri);
                Alert.alert('Dosya Seçildi', uri);
              }
            }}
          />
          <View style={{ height: 10 }} />
          <Button title="PDF Yükle" onPress={handleUploadPdf} color="green" />
        </>
      )}

      {/* ---------------------- ÖZET İŞLEMLERİ ---------------------- */}
      {mode === 'ozet' && (
        <>
          <Text style={styles.subtitle}>📚 Özet Ekle</Text>
          <TextInput
            style={styles.input}
            placeholder="Kitap ID"
            value={ozetKitapId}
            placeholderTextColor="#555"
            onChangeText={setOzetKitapId}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder='"Kitap özeti buraya..."'
            value={ozetMetni}
            placeholderTextColor="#555"
            onChangeText={setOzetMetni}
          />
          <Button title="Özet Ekle" onPress={handleOzetEkle} />

          <View style={styles.subtitleGap} />

          <Text style={styles.subtitle}>✏️ Özet Güncelle</Text>
          <TextInput
            style={styles.input}
            placeholder="Özet ID"
            value={guncelOzetId}
            placeholderTextColor="#555"
            onChangeText={setGuncelOzetId}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Yeni Özet Metni"
            value={guncelOzetMetni}
            placeholderTextColor="#555"
            onChangeText={setGuncelOzetMetni}
          />
          <Button title="Özet Güncelle" onPress={handleOzetGuncelle} color="orange" />

          <View style={styles.subtitleGap} />

          <Text style={styles.subtitle}>❌ Özet Sil</Text>
          <TextInput
            style={styles.input}
            placeholder="Silinecek Özet ID"
            value={silinecekOzetId}
            placeholderTextColor="#555"
            onChangeText={setSilinecekOzetId}
            keyboardType="numeric"
          />
          <Button title="Özeti Sil" onPress={handleOzetSil} color="red" />
        </>
      )}

      {/* ---------------------- KATEGORİ İŞLEMLERİ ----------------- */}
      {mode === 'kategori' && (
        <>
          <Text style={styles.subtitle}>➕ Kategori Ekle</Text>
          <TextInput
            style={styles.input}
            placeholder="Kategori Adı"
            value={kategoriAdi}
            placeholderTextColor="#555"
            onChangeText={setKategoriAdi}
          />
          <Button title="Kategori Ekle" onPress={handleKategoriEkle} />

          <View style={styles.subtitleGap} />

          <Text style={styles.subtitle}>❌ Kategori Sil</Text>
          <TextInput
            style={styles.input}
            placeholder="Silinecek Kategori ID"
            value={kategoriSilId}
            placeholderTextColor="#555"
            onChangeText={setKategoriSilId}
            keyboardType="numeric"
          />
          <Button title="Kategori Sil" onPress={handleKategoriSil} color="red" />

          <View style={styles.subtitleGap} />

          <Text style={styles.subtitle}>📋 Kategorileri Listele</Text>
          <Button title="Kategorileri Getir" onPress={handleKategorilerGetir} />
          {kategorilerList.length > 0 && (
            <View style={{ marginVertical: 10 }}>
              {kategorilerList.map((kat: any) => (
                <Text key={kat.id} style={{ fontSize: 14, color: '#000' }}>
                  - {kat.ad} (ID: {kat.id})
                </Text>
              ))}
            </View>
          )}
        </>
      )}

      {/* ---------------------- POPÜLER KİTAPLAR & PUANLAR -------- */}
      {mode === 'populer' && (
        <>
          <Text style={styles.subtitle}>🔥 Popüler Kitaplar</Text>
          <Button title="Popüler Kitapları Getir" onPress={handlePopulerKitaplar} />
          {populerKitaplar.length > 0 && (
            <View style={{ marginVertical: 10 }}>
              {populerKitaplar.map((pop: any) => (
                <Text key={pop.id} style={{ fontSize: 14, color: '#000' }}>
                  - {pop.ad} by {pop.yazar} (Puan: {pop.puan})
                </Text>
              ))}
            </View>
          )}

          <View style={styles.subtitleGap} />

          <Text style={styles.subtitle}>🔎 Puanları Getir</Text>
          <TextInput
            style={styles.input}
            placeholder="Kitap ID"
            value={puanlariGetirKitapId}
            placeholderTextColor="#555"
            onChangeText={setPuanlariGetirKitapId}
            keyboardType="numeric"
          />
          <Button title="Puanları Getir" onPress={handlePuanlariGetir} />

          {kitapPuanlari && (
            <View style={{ marginVertical: 10 }}>
              <Text style={{ fontWeight: 'bold', color: '#000' }}>
                Ortalama Puan: {kitapPuanlari.ortalamaPuan}
              </Text>
              {kitapPuanlari.puanlamalar && kitapPuanlari.puanlamalar.length > 0 ? (
                <View style={{ marginTop: 5 }}>
                  {kitapPuanlari.puanlamalar.map((item: any) => (
                    <Text key={item.id} style={{ fontSize: 13, color: '#000' }}>
                      - Kullanıcı:{item.kullaniciId}, Puan:{item.puan}, Tarih:{' '}
                      {new Date(item.puanlamaTarihi).toLocaleString()}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={{ fontStyle: 'italic', color: '#000' }}>Henüz puanlama yok.</Text>
              )}
            </View>
          )}
        </>
      )}

      {/* +++ YENİ: Resim Yükle (PNG, JPEG) -------------- */}
      {mode === 'resim' && (
        <>
          <Text style={styles.subtitle}>🖼 Kitap Resmi Yükle (PNG, JPEG)</Text>
          <Text style={{ fontSize: 13, marginBottom: 10, color: '#666', textAlign: 'center' }}>
            Endpoint: POST /api/Kitap/&#123;kitapId&#125;/AdminKitapResmiYukle?adminUserId=...
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Resim Yüklenecek Kitap Adı"
            placeholderTextColor="#555"
            value={resimKitapAdi}
            onChangeText={setResimKitapAdi}
          />
          <TextInput
            style={styles.input}
            placeholder="Admin Kullanıcı ID"
            placeholderTextColor="#555"
            keyboardType="numeric"
            value={adminUserId}
            onChangeText={setAdminUserId}
          />

          <Button
            title="Dosya Seç (PNG/JPG)"
            onPress={handleUploadResim}
            color="#6A1B9A"
          />
        </>
      )}

      {/* +++ YENİ: Kitap Sil */}
      {mode === 'sil' && (
        <>
          <Text style={styles.subtitle}>❌ Kitap Sil</Text>
          <TextInput
            style={styles.input}
            placeholder="Silinecek Kitap ID"
            placeholderTextColor="#555"
            keyboardType="numeric"
            value={silinecekKitapId}
            onChangeText={setSilinecekKitapId}
          />
          <Button title="Sil" onPress={handleKitapSil} color="#D32F2F" />
        </>
      )}
    </ScrollView>
  );
};

// ---------------------------------------------------------------------
// STYLES (mor-beyaz-siyah tema)
// ---------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  bgPurple: {
    backgroundColor: '#F3E5F5', // Açık mor
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
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
  subtitleGap: {
    marginTop: 25,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
});

export default AdminKitapScreen;
