public class Kategori
{
    public int Id { get; set; }
    public string Ad { get; set; }
    public ICollection<KitapKategori> KitapKategoriler { get; set; } // Çoktan çoğa ilişki
}
