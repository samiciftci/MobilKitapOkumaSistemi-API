namespace MobilKitapOkumaSistemiBackend.Models
{
    public class KitapOkuma
    {
        public int Id { get; set; }
        public int KitapId { get; set; }
        public int KullaniciId { get; set; }
        public int SonOkunanSayfa { get; set; }
        public DateTime OkumaTarihi { get; set; }

        public Kitap Kitap { get; set; }
        public Kullanici Kullanici { get; set; }
    }
}
