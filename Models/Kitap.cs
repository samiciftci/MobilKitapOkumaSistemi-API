public class Kitap
{
    public int Id { get; set; }
    public string Ad { get; set; }
    public string Yazar { get; set; }

    // Çoktan çoğa ilişki için nullable hale getirildi.
    public ICollection<KitapKategori>? KitapKategoriler { get; set; }

    public int Puan { get; set; }

    public string? PdfYolu { get; set; } // Optional olarak bırakıldı.

    public string? Ozet { get; set; } // Nullable string
    public string? ResimYolu { get; set; }

}
