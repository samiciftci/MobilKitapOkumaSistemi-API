using System.ComponentModel.DataAnnotations;

public class KitapYorum
{
    [Key]
    public int YorumId { get; set; } // Primary key tanımı

    public int KullaniciId { get; set; }
    public int KitapId { get; set; }
    public string Yorum { get; set; }
    public DateTime YorumTarihi { get; set; }
}
