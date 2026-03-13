import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import {
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  TextInput,
  Button,
  Text,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // ← ikonlar
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuth } from './AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'KitapListesi'>;
interface Kitap {
  id: number; ad: string; yazar: string; puan: number;
  kategoriler?: string[]; resimUrl?: string;
}
interface Props { navigation: Nav }

const BASE = 'http://192.168.228.51:5000';

const KitapListesi: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();

  /* ---------------- state ---------------- */
  const [kitaplar,setKitaplar] = useState<Kitap[]>([]);
  const [loading,setLoading]  = useState(true);

  const [filterYazar,setFilterYazar]     = useState('');
  const [filterKategori,setFilterKategori] = useState('');
  const [onlyStarted,setOnlyStarted]     = useState(false);
  const [info,setInfo]                   = useState('');

  /* öneri veri tabanı */
  const [allAuthors,setAllAuthors]       = useState<string[]>([]);
  const [allCats,setAllCats]             = useState<string[]>([]);
  const [auSug,setAuSug]                 = useState<string[]>([]);
  const [catSug,setCatSug]               = useState<string[]>([]);
  const [showAu, setShowAu]              = useState(false);
  const [showCat,setShowCat]             = useState(false);

  /* ---------- yardımcı --------- */
  const buildLookups = (list:Kitap[])=>{
    const a=new Set<string>(), c=new Set<string>();
    list.forEach(k=>{
      if(k.yazar) a.add(k.yazar);
      k.kategoriler?.forEach(t=>c.add(t));
    });
    setAllAuthors(Array.from(a));
    setAllCats(prev=>Array.from(new Set([...prev,...c])));
  };

  const handleSet = (data:any[])=>{
    if(!data?.length){ setKitaplar([]); setInfo('Kitap bulunamadı.'); return;}
    const mapped:Kitap[]=data.map((x:any)=>({
      id:x.id??x.kitapId, ad:x.ad??x.kitapAdi,
      yazar:x.yazar, puan:x.puan??0,
      kategoriler:x.kategoriler, resimUrl:x.resimYolu
    }));
    setKitaplar(mapped);
    setInfo(`${mapped.length} adet kitap bulundu.`);
    buildLookups(mapped);
  };

  /* ---------- api --------- */
  const fetchAll=()=>{ setLoading(true);
    axios.get(`${BASE}/api/Kitap`)
      .then(r=>{handleSet(r.data);setLoading(false);})
      .catch(()=>{setKitaplar([]);setInfo('Kitap bulunamadı.');setLoading(false);});
  };
  const fetchStarted=()=>{
    if(!user){fetchAll();return;}
    setLoading(true);
    axios.get(`${BASE}/api/Kitap/OkumayaBaslananKitaplar/${user.id}`)
      .then(r=>{handleSet(r.data);setLoading(false);})
      .catch(()=>{setKitaplar([]);setInfo('Kitap bulunamadı.');setLoading(false);});
  };
  const filter=()=>{
    setLoading(true);
    axios.get(`${BASE}/api/Kitap/FiltreliKitaplar?yazar=${encodeURIComponent(filterYazar)}&kategori=${encodeURIComponent(filterKategori)}`)
      .then(r=>{handleSet(r.data);setLoading(false);})
      .catch(()=>{setKitaplar([]);setInfo('Kitap bulunamadı.');setLoading(false);});
  };
  const fetchCats=()=>{ // yalnızca isim listesi
    axios.get(`${BASE}/api/Kategori`)
      .then(r=>{
        const names=r.data.map((k:any)=>k.ad??k.name);
        setAllCats(Array.from(new Set([...names])));
      }).catch(()=>{});
  };

  /* ---------- effects ---------- */
  useEffect(fetchCats,[]);
  useEffect(()=>{ onlyStarted ? fetchStarted() : fetchAll(); },[onlyStarted]);

  /* ---------- öneri mantığı ---------- */
  const onYazar=(txt:string)=>{
    setFilterYazar(txt);
    const list=txt?allAuthors.filter(a=>a.toLowerCase().startsWith(txt.toLowerCase())):[];
    setAuSug(list.slice(0,10)); setShowAu(!!list.length);
  };
  const onCat=(txt:string)=>{
    setFilterKategori(txt);
    const list=txt?allCats.filter(c=>c.toLowerCase().startsWith(txt.toLowerCase())):[];
    setCatSug(list.slice(0,10)); setShowCat(!!list.length);
  };

  /* ---------- render item ---------- */
  const renderItem=({item}:{item:Kitap})=>(
    <Card style={styles.itemCard} onPress={()=>navigation.navigate('KitapDetay',{kitapId:item.id})}>
      <Card.Content>
        <View style={styles.itemRow}>
          {item.resimUrl
            ? <Card.Cover source={{uri:`${BASE}${item.resimUrl}`}} style={styles.cover}/>
            : <View style={[styles.cover,styles.missing]}><Text style={styles.missTxt}>Resim Yüklenmedi</Text></View>}
          <View style={styles.itemText}>
            <Title style={styles.title}>{item.ad}</Title>
            <Paragraph style={styles.sub}>{item.yazar}</Paragraph>
            <Paragraph style={styles.rate}>⭐ {item.puan}</Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if(loading){
    return <View style={styles.load}><ActivityIndicator size="large"/></View>;
  }

  return (
    <ImageBackground source={require('../assets/bookshelf.jpg')} style={styles.bg} imageStyle={{opacity:0.3}}>
      <View style={styles.overlay}>

        {/* tik kutusu */}
        <TouchableOpacity style={styles.chkRow} onPress={()=>setOnlyStarted(!onlyStarted)}>
          <Icon name={onlyStarted?'checkbox-marked':'checkbox-blank-outline'} size={26} color="#0D47A1"/>
          <Text style={styles.chkLabel}>Okumaya başladığım kitaplar</Text>
        </TouchableOpacity>

        {/* filtre alanı */}
        <View style={styles.filterBox}>
          {/* yazar */}
          <TextInput mode="outlined" label="Yazar" value={filterYazar}
            onChangeText={onYazar} style={styles.input} theme={{colors:{primary:'#0D47A1'}}}
            disabled={onlyStarted}/>
          {showAu && !onlyStarted && (
            <ScrollView style={styles.sugBox}>
              {auSug.map(s=>(
                <TouchableOpacity key={s} onPress={()=>{setFilterYazar(s);setShowAu(false);}}>
                  <Text style={styles.sugTxt}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* kategori */}
          <TextInput mode="outlined" label="Kategori" value={filterKategori}
            onChangeText={onCat} style={styles.input} theme={{colors:{primary:'#0D47A1'}}}
            disabled={onlyStarted}/>
          {showCat && !onlyStarted && (
            <ScrollView style={styles.sugBox}>
              {catSug.map(s=>(
                <TouchableOpacity key={s} onPress={()=>{setFilterKategori(s);setShowCat(false);}}>
                  <Text style={styles.sugTxt}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Button mode="contained" onPress={filter} disabled={onlyStarted} style={styles.btn}>Filtrele</Button>
        </View>

        {!!info && <Text style={styles.info}>{info}</Text>}

        <FlatList
          data={kitaplar}
          keyExtractor={k=>k.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom:30}}
        />
      </View>
    </ImageBackground>
  );
};

export default KitapListesi;

/* ---------------- style ---------------- */
const styles = StyleSheet.create({
  bg:{flex:1},
  overlay:{flex:1,padding:20},
  load:{flex:1,justifyContent:'center',alignItems:'center'},

  /* checkbox */
  chkRow:{flexDirection:'row',alignItems:'center',marginBottom:10},
  chkLabel:{marginLeft:8,fontSize:16,color:'#0D47A1'},

  /* filtre */
  filterBox:{marginBottom:20},
  input:{backgroundColor:'#fff',marginBottom:10},
  btn:{marginBottom:10},

  sugBox:{maxHeight:150,backgroundColor:'#fff',borderColor:'#0D47A1',
          borderWidth:1,borderTopWidth:0,marginTop:-10,marginBottom:10,
          borderBottomLeftRadius:4,borderBottomRightRadius:4},
  sugTxt:{padding:8,fontSize:15,color:'#0D47A1'},

  info:{fontSize:16,fontWeight:'600',color:'#0D47A1',marginBottom:10,textAlign:'center'},

  /* list item */
  itemCard:{marginBottom:15,backgroundColor:'rgba(255,255,255,0.95)',elevation:4,borderRadius:8},
  itemRow:{flexDirection:'row',alignItems:'center'},
  cover:{width:80,height:120,borderRadius:4},
  missing:{justifyContent:'center',alignItems:'center',backgroundColor:'#eee'},
  missTxt:{color:'#888',fontSize:12},
  itemText:{marginLeft:15,flex:1},
  title:{fontSize:20,fontWeight:'bold',color:'#0D47A1',marginBottom:5},
  sub:{fontSize:16,color:'#1565C0'},
  rate:{fontSize:16,color:'#1565C0',marginTop:5},
});
