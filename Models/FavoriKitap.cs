public class FavoriKitap
{
    public int Id { get; set; }
    public int KitapId { get; set; }
    public int KullaniciId { get; set; }
    public DateTime EklenmeTarihi { get; set; }

    public Kitap Kitap { get; set; } // Navigasyon özelliği
}
