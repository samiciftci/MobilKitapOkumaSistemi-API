using System;

namespace MobilKitapOkumaSistemiBackend.Models
{
    public class KitapPuanlamaModel
    {
        public int Id { get; set; } // Puanlamanın kendisinin ID'si (isteğe bağlı)
        public int KullaniciId { get; set; } // Puanı veren kullanıcının ID'si
        public int KitapId { get; set; } // Puanlanan kitabın ID'si
        public int Puan { get; set; } // Verilen puan (1-10 gibi)
        public DateTime PuanlamaTarihi { get; set; } = DateTime.UtcNow; // Puanlama tarihi, varsayılan olarak şimdiki tarih
    }
}
