// Models/SliderAd.cs
public class SliderAd
{
    public int Id { get; set; }          // PK
    public string ResimYolu { get; set; } = null!; // /ads/xxxx.png
    public string TargetUrl { get; set; } = null!; // https://...
    public int Sira { get; set; } = 0;     // Slide sırası
    public bool AktifMi { get; set; } = true;  // Pasif ise gösterme

    public string ImageUrl { get; set; } = string.Empty;
}
