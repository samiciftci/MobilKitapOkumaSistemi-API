public class KitapDTO
{
    public int Id { get; set; }
    public string Ad { get; set; }
    public string Yazar { get; set; }
    public List<string> Kategoriler { get; set; } // Kategori isimlerini içerecek.
    public int Puan { get; set; }
    public string PdfYolu { get; set; }
}
