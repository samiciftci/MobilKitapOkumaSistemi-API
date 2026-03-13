namespace MobilKitapOkumaSistemiBackend.Models
{
    public class KitapOzet
    {

        public int Id { get; set; }
        public string OzetMetni { get; set; }
        public int KitapId { get; set; }
        public DateTime EklenmeTarihi { get; set; }
        public DateTime? GuncellenmeTarihi { get; set; }

        public Kitap Kitap { get; set; }





    }
}
