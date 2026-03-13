public class KitapUpdateDTO
{
    public int Id { get; set; }
    public string Ad { get; set; }
    public string Yazar { get; set; }
    public List<int> KategoriIds { get; set; }
    public int Puan { get; set; }
    public string PdfYolu { get; set; }
}
