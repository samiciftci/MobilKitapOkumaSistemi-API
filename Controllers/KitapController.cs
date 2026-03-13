using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobilKitapOkumaSistemiBackend.Models;
using Microsoft.Extensions.Logging;
using PdfSharpCore.Pdf;
using PdfSharpCore.Pdf.IO;
using System.IO;
using ImageMagick;
using Tesseract;
using System.Text.RegularExpressions;
using System.IO;                  // <‐ IFormFile kaydetmek için
using Microsoft.AspNetCore.Http;  // <‐ IFormFile

[Route("api/[controller]")]
[ApiController]
public class KitapController : ControllerBase
{
    private readonly VeritabaniContext _context;
    private readonly ILogger<KitapController> _logger;

    // Constructor
    public KitapController(VeritabaniContext context, ILogger<KitapController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/Kitap
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Kitap>>> GetKitaplar()
    {
        return await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori) // Kategoriyi de dahil eder.
            .ToListAsync();
    }


    // GET: api/Kitap/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Kitap>> GetKitap(int id)
    {
        var kitap = await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .FirstOrDefaultAsync(k => k.Id == id);

        if (kitap == null)
        {
            return NotFound();
        }

        return kitap;
    }

    // POST: api/Kitap
    [HttpPost]
    public async Task<IActionResult> PostKitap(KitapDTO kitapDTO)
    {
        // Yeni kitap nesnesini DTO'dan oluşturuyoruz
        var yeniKitap = new Kitap
        {
            Ad = kitapDTO.Ad,
            Yazar = kitapDTO.Yazar,
            Puan = kitapDTO.Puan,
            PdfYolu = kitapDTO.PdfYolu,
            KitapKategoriler = kitapDTO.Kategoriler.Select(kategoriAdi => new KitapKategori
            {
                Kategori = _context.Kategoriler.FirstOrDefault(k => k.Ad == kategoriAdi)
                            ?? throw new Exception($"Kategori bulunamadı: {kategoriAdi}")
            }).ToList()
        };

        _context.Kitaplar.Add(yeniKitap);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetKitap), new { id = yeniKitap.Id }, yeniKitap);
    }





    // PUT: api/Kitap/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutKitap(int id, KitapUpdateDTO kitapUpdateDTO)
    {
        if (id != kitapUpdateDTO.Id)
        {
            return BadRequest();
        }

        var kitap = await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .FirstOrDefaultAsync(k => k.Id == id);

        if (kitap == null)
        {
            return NotFound();
        }

        kitap.Ad = kitapUpdateDTO.Ad;
        kitap.Yazar = kitapUpdateDTO.Yazar;
        kitap.Puan = kitapUpdateDTO.Puan;
        kitap.PdfYolu = kitapUpdateDTO.PdfYolu;

        // Kitap kategorilerini güncelle
        kitap.KitapKategoriler.Clear();
        foreach (var kategoriId in kitapUpdateDTO.KategoriIds)
        {
            var kategori = await _context.Kategoriler.FindAsync(kategoriId);
            if (kategori != null)
            {
                kitap.KitapKategoriler.Add(new KitapKategori
                {
                    KitapId = kitap.Id,
                    KategoriId = kategoriId
                });
            }
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Kitaplar.Any(k => k.Id == id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }


    // DELETE: api/Kitap/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteKitap(int id)
    {
        var kitap = await _context.Kitaplar.FindAsync(id);
        if (kitap == null)
        {
            return NotFound();
        }

        _context.Kitaplar.Remove(kitap);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool KitapExists(int id)
    {
        return _context.Kitaplar.Any(e => e.Id == id);
    }

    [HttpPost("{id}/UploadPdf")]
    public async Task<IActionResult> UploadPdf(int id, IFormFile pdf)
    {
        var kitap = await _context.Kitaplar.FindAsync(id);
        if (kitap == null) return NotFound();

        if (pdf == null || pdf.Length == 0)
            return BadRequest("PDF dosyası yüklenmedi.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/pdfs");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, pdf.FileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await pdf.CopyToAsync(stream);
        }

        kitap.PdfYolu = $"/pdfs/{pdf.FileName}";
        await _context.SaveChangesAsync();

        return Ok(new { Path = kitap.PdfYolu });
    }

    [HttpGet("{id}/DownloadPdf")]
    public IActionResult DownloadPdf(int id)
    {
        var kitap = _context.Kitaplar.Find(id);
        if (kitap == null || string.IsNullOrEmpty(kitap.PdfYolu)) return NotFound();

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", kitap.PdfYolu.TrimStart('/'));
        if (!System.IO.File.Exists(filePath)) return NotFound("PDF dosyası bulunamadı.");

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, "application/pdf", Path.GetFileName(filePath));
    }

    [HttpGet("{id}/Sayfa/{numara}")]
    public IActionResult GetPdfSayfa(int id, int numara)
    {
        var kitap = _context.Kitaplar.Find(id);
        if (kitap == null || string.IsNullOrEmpty(kitap.PdfYolu))
        {
            _logger.LogWarning("Kitap bulunamadı veya PDF yolu belirtilmemiş. KitapId: {id}", id);
            return NotFound("Kitap bulunamadı veya PDF yolu belirtilmemiş.");
        }

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", kitap.PdfYolu.TrimStart('/'));
        if (!System.IO.File.Exists(filePath))
        {
            _logger.LogWarning("PDF dosyası bulunamadı. Yol: {filePath}", filePath);
            return NotFound("PDF dosyası bulunamadı.");
        }

        try
        {
            using (var document = PdfReader.Open(filePath, PdfDocumentOpenMode.Import))
            {
                // Geçerli sayfa numarasının geçerli olup olmadığını kontrol et
                if (numara < 1 || numara > document.PageCount)
                {
                    _logger.LogWarning("Geçersiz sayfa numarası. İstenen: {numara}, Mevcut: {totalPages}", numara, document.PageCount);
                    return BadRequest($"Geçersiz sayfa numarası. Sayfa numarası 1 ile {document.PageCount} arasında olmalıdır.");
                }

                using (var outputDocument = new PdfDocument())
                {
                    // Belirtilen sayfayı ekleyin
                    outputDocument.AddPage(document.Pages[numara - 1]);

                    using (var memoryStream = new MemoryStream())
                    {
                        // Çıktı PDF dosyasını hafızaya kaydedin
                        outputDocument.Save(memoryStream, false);
                        _logger.LogInformation("Sayfa başarıyla işlendi: SayfaNumarası: {numara}", numara);
                        return File(memoryStream.ToArray(), "application/pdf", $"Sayfa-{numara}.pdf");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF işlemi sırasında bir hata oluştu.");
            return StatusCode(500, $"PDF işlemi sırasında bir hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("{kitapId}/OkumaBaslat")]
    public async Task<IActionResult> OkumaBaslat(int kitapId, [FromBody] OkumaBaslatModel model)
    {
        if (kitapId <= 0 || model.KullaniciId <= 0)
        {
            return BadRequest("Geçersiz kitap veya kullanıcı ID.");
        }

        var kitap = await _context.Kitaplar.FindAsync(kitapId);
        var kullanici = await _context.Kullanicilar.FindAsync(model.KullaniciId);

        if (kitap == null)
        {
            return NotFound("Kitap bulunamadı.");
        }

        if (kullanici == null)
        {
            return NotFound("Kullanıcı bulunamadı.");
        }

        var yeniOkuma = new KitapOkuma
        {
            KullaniciId = model.KullaniciId,
            KitapId = kitapId,
            SonOkunanSayfa = 1,
            OkumaTarihi = DateTime.UtcNow
        };

        _context.KitapOkumalari.Add(yeniOkuma);
        await _context.SaveChangesAsync();

        return Ok("Kitap okuma başlatıldı.");
    }

    public class OkumaBaslatModel
    {
        public int KullaniciId { get; set; }
    }

    [HttpPut("{kitapId}/OkumaGuncelle")]
    public async Task<IActionResult> OkumaGuncelle(int kitapId, [FromBody] OkumaGuncelleModel model)
    {
        var kitapOkuma = await _context.KitapOkumalari
            .FirstOrDefaultAsync(ko => ko.KitapId == kitapId && ko.KullaniciId == model.KullaniciId);

        if (kitapOkuma == null)
        {
            return NotFound("Okuma kaydı bulunamadı.");
        }

        kitapOkuma.SonOkunanSayfa = model.SonOkunanSayfa;
        kitapOkuma.OkumaTarihi = DateTime.UtcNow;

        _context.Entry(kitapOkuma).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok("Kitap okuma bilgisi güncellendi.");
    }


    [HttpPost("{kitapId}/PuanVer")]
    public async Task<IActionResult> PuanVer(int kitapId, [FromBody] KitapPuanlamaModel model)
    {
        if (kitapId != model.KitapId)
        {
            return BadRequest("Kitap ID uyuşmuyor.");
        }

        var kitap = await _context.Kitaplar.FindAsync(kitapId);
        if (kitap == null)
        {
            return NotFound("Kitap bulunamadı.");
        }

        _context.KitapPuanlari.Add(model);
        await _context.SaveChangesAsync();

        return Ok("Kitap başarıyla puanlandı.");
    }


    [HttpGet("{kitapId}/PuanlariGetir")]
    public async Task<IActionResult> PuanlariGetir(int kitapId)
    {
        var puanlamalar = await _context.KitapPuanlari
            .Where(kp => kp.KitapId == kitapId)
            .ToListAsync();

        if (!puanlamalar.Any())
        {
            return NotFound("Bu kitap için henüz puanlama yapılmamış.");
        }

        var ortalamaPuan = puanlamalar.Average(p => p.Puan);

        return Ok(new
        {
            OrtalamaPuan = ortalamaPuan,
            Puanlamalar = puanlamalar
        });
    }
    [HttpPost("{kitapId}/FavorilereEkle")]
    public async Task<IActionResult> FavorilereEkle(int kitapId, [FromBody] FavoriEkleModel model)
    {
        // Gelen modeldeki kullanıcı bilgilerini kullanarak favori kitap kaydı oluştur
        var favoriKitap = new FavoriKitap
        {
            KitapId = kitapId,
            KullaniciId = model.KullaniciId,
            EklenmeTarihi = DateTime.UtcNow
        };

        // Favori kitaplar tablosuna yeni kaydı ekle
        _context.FavoriKitaplar.Add(favoriKitap);
        await _context.SaveChangesAsync();

        // Başarı mesajı dön
        return Ok("Kitap favorilere eklendi.");
    }

    public class FavoriEkleModel
    {
        public int KullaniciId { get; set; }
    }
    [HttpGet("FavorileriListele/{kullaniciId}")]
    public async Task<IActionResult> FavorileriListele(int kullaniciId)
    {
        // FavoriKitaplar tablosundan ilgili kullanıcının favorilerini al
        var favoriKitaplar = await _context.FavoriKitaplar
            .Where(f => f.KullaniciId == kullaniciId)
            .Include(f => f.Kitap)  // Kitap bilgilerini çek
            .ThenInclude(k => k.KitapKategoriler)  // Kitap kategorilerini çek
            .ThenInclude(kk => kk.Kategori)  // Kategorinin detaylarını çek
            .ToListAsync();

        // Favori kitaplar listesi boşsa NotFound döndür
        if (!favoriKitaplar.Any())
        {
            return NotFound("Henüz favorilere eklenmiş kitap bulunmamaktadır.");
        }

        // Favori kitapları dönüştürerek sonuç oluştur
        var result = favoriKitaplar.Select(f => new
        {
            KitapId = f.Kitap.Id,
            KitapAdi = f.Kitap.Ad,
            Yazar = f.Kitap.Yazar,
            Kategoriler = f.Kitap.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            EklenmeTarihi = f.EklenmeTarihi
        });

        return Ok(result);
    }

    [HttpGet("Kullanici/{kullaniciId}/FavoriKitaplari")]
    public async Task<IActionResult> KullaniciFavoriKitaplariniGetir(int kullaniciId)
    {
        // Kullanıcının favori kitaplarını getir
        var favoriKitaplar = await _context.FavoriKitaplar
            .Where(f => f.KullaniciId == kullaniciId)
            .Include(f => f.Kitap) // Kitap bilgilerini çek
            .ThenInclude(k => k.KitapKategoriler) // Kitap-kategori ilişkisini çek
            .ThenInclude(kk => kk.Kategori) // Kategori bilgilerini çek
            .ToListAsync();

        // Favori kitaplar yoksa NotFound döndür
        if (!favoriKitaplar.Any())
        {
            return NotFound("Kullanıcının favori kitapları bulunamadı.");
        }

        // Favori kitapları dönüştür
        var sonuc = favoriKitaplar.Select(f => new
        {
            KitapId = f.Kitap.Id,
            KitapAdi = f.Kitap.Ad,
            Yazar = f.Kitap.Yazar,
            Kategoriler = f.Kitap.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            PdfYolu = f.Kitap.PdfYolu,
            EklenmeTarihi = f.EklenmeTarihi
        });

        return Ok(sonuc);
    }
    [HttpGet("Kullanici/{kullaniciId}/KitapOnerileri")]
    public async Task<IActionResult> KullaniciKitapOnerileriniGetir(int kullaniciId)
    {
        // Kullanıcının favori kitaplarını ve kategorilerini al
        var favoriKitaplar = await _context.FavoriKitaplar
            .Where(f => f.KullaniciId == kullaniciId)
            .Include(f => f.Kitap)
            .ThenInclude(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .AsNoTracking()
            .ToListAsync();

        if (!favoriKitaplar.Any())
        {
            return NotFound("Kullanıcının favori kitapları bulunamadı. Öneri yapılamıyor.");
        }

        // Favori kategorileri elde et
        var favoriKategoriIds = favoriKitaplar
            .SelectMany(f => f.Kitap.KitapKategoriler)
            .Select(kk => kk.KategoriId)
            .Distinct()
            .ToList();

        // Öneri için aynı kategorideki fakat favorilere eklenmemiş kitapları al
        var kitapOnerileri = await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .Where(k => k.KitapKategoriler.Any(kk => favoriKategoriIds.Contains(kk.KategoriId)) &&
                        !favoriKitaplar.Any(f => f.KitapId == k.Id))
            .ToListAsync();

        if (!kitapOnerileri.Any())
        {
            return NotFound("Önerilecek başka kitap bulunamadı.");
        }

        // Önerilen kitapları formatla
        var sonuc = kitapOnerileri.Select(k => new
        {
            KitapId = k.Id,
            KitapAdi = k.Ad,
            Yazar = k.Yazar,
            Kategoriler = k.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            Puan = k.Puan
        });

        return Ok(sonuc);
    }

    [HttpPost("{kitapId}/YorumEkle")]
    public async Task<IActionResult> YorumEkle(int kitapId, [FromBody] KitapYorum model)
    {
        model.KitapId = kitapId;
        model.YorumTarihi = DateTime.UtcNow;

        _context.KitapYorumlari.Add(model);
        await _context.SaveChangesAsync();

        return Ok("Yorum başarıyla eklendi.");
    }
    [HttpGet("{kitapId}/YorumlariGetir")]
    public async Task<IActionResult> YorumlariGetir(int kitapId)
    {
        var yorumlar = await _context.KitapYorumlari
            .Where(y => y.KitapId == kitapId)
            .ToListAsync();

        if (!yorumlar.Any())
        {
            return NotFound("Bu kitaba henüz yorum yapılmamış.");
        }

        return Ok(yorumlar);
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return BadRequest("Arama terimi boş olamaz.");
        }

        var kitaplar = await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .Where(k => k.Ad.Contains(keyword) ||
                        k.Yazar.Contains(keyword) ||
                        k.KitapKategoriler.Any(kk => kk.Kategori.Ad.Contains(keyword)))
            .ToListAsync();

        if (!kitaplar.Any())
        {
            return NotFound("Aranan kriterlere uygun kitap bulunamadı.");
        }

        var sonuc = kitaplar.Select(k => new
        {
            KitapId = k.Id,
            KitapAdi = k.Ad,
            Yazar = k.Yazar,
            Kategoriler = k.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            Puan = k.Puan
        });

        return Ok(sonuc);
    }

    [HttpGet("{kullaniciId}/OkumaGecmisi")]
    public async Task<IActionResult> OkumaGecmisi(int kullaniciId)
    {
        var okumaGecmisi = await _context.KitapOkumalari
            .Include(k => k.Kitap)
            .Where(ko => ko.KullaniciId == kullaniciId)
            .OrderByDescending(ko => ko.OkumaTarihi)
            .Select(ko => new
            {
                KitapId = ko.KitapId, // ✅ Bunu ekledik!
                KitapAdi = ko.Kitap.Ad,
                Yazar = ko.Kitap.Yazar,
                SonOkunanSayfa = ko.SonOkunanSayfa,
                OkumaTarihi = ko.OkumaTarihi
            })
            .ToListAsync();

        if (!okumaGecmisi.Any())
        {
            return NotFound("Okuma geçmişi bulunamadı.");
        }

        return Ok(okumaGecmisi);
    }


    [HttpPost("KategoriEkle")]
    public async Task<IActionResult> KategoriEkle([FromBody] Kategori yeniKategori)
    {
        if (yeniKategori == null || string.IsNullOrWhiteSpace(yeniKategori.Ad))
            return BadRequest("Geçerli bir kategori adı giriniz.");

        // Aynı isimli kategori kontrolü
        var mevcutKategori = await _context.Kategoriler
            .FirstOrDefaultAsync(k => k.Ad.ToLower() == yeniKategori.Ad.ToLower());
        if (mevcutKategori != null)
            return BadRequest("Bu isimde bir kategori zaten mevcut.");

        _context.Kategoriler.Add(yeniKategori);
        await _context.SaveChangesAsync();
        return Ok("Kategori başarıyla eklendi.");
    }
    [HttpDelete("KategoriSil/{id}")]
    public async Task<IActionResult> KategoriSil(int id)
    {
        var kategori = await _context.Kategoriler.FindAsync(id);
        if (kategori == null)
            return NotFound("Kategori bulunamadı.");

        // İlişkili kitap kontrolü
        var kitaplarlaIlişkili = await _context.KitapKategoriler.AnyAsync(kk => kk.KategoriId == id);
        if (kitaplarlaIlişkili)
            return BadRequest("Bu kategori kitaplarla ilişkili olduğu için silinemez.");

        _context.Kategoriler.Remove(kategori);
        await _context.SaveChangesAsync();
        return Ok("Kategori başarıyla silindi.");
    }

    [HttpGet("Kategoriler")]
    public async Task<IActionResult> KategorileriGetir()
    {
        var kategoriler = await _context.Kategoriler.ToListAsync();
        return Ok(kategoriler);
    }


    [HttpDelete("{kitapId}/DeletePdf")]
    public async Task<IActionResult> PdfSil(int kitapId)
    {
        var kitap = await _context.Kitaplar.FindAsync(kitapId);
        if (kitap == null)
            return NotFound("Kitap bulunamadı.");

        kitap.PdfYolu = null; // PDF dosyasını siler.
        await _context.SaveChangesAsync();
        return Ok("PDF dosyası başarıyla silindi.");
    }
    [HttpGet("PopulerKitaplar")]
    public async Task<IActionResult> PopulerKitaplariGetir()
    {
        var kitaplar = await _context.Kitaplar
            .OrderByDescending(k => k.Puan)
            .Take(10)
            .ToListAsync();

        if (!kitaplar.Any())
            return NotFound("Popüler kitap bulunamadı.");

        return Ok(kitaplar);
    }
    [HttpGet("Kullanici/{kullaniciId}/OkumaGecmisi")]
    public async Task<IActionResult> OkumaGecmisiGetir(int kullaniciId)
    {
        var okumaGecmisi = await _context.KitapOkumalari
            .Where(o => o.KullaniciId == kullaniciId)
            .Include(o => o.Kitap)
            .ToListAsync();

        if (!okumaGecmisi.Any())
            return NotFound("Okuma geçmişi bulunamadı.");

        return Ok(okumaGecmisi);
    }
    [HttpGet("Kategori/{kategoriId}")]
    public async Task<IActionResult> KategoridekiKitaplariGetir(int kategoriId)
    {
        var kitaplar = await _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .Where(k => k.KitapKategoriler.Any(kk => kk.KategoriId == kategoriId))
            .ToListAsync();

        if (!kitaplar.Any())
            return NotFound("Bu kategoriye ait kitap bulunamadı.");

        var sonuc = kitaplar.Select(k => new
        {
            k.Id,
            k.Ad,
            k.Yazar,
            Kategoriler = k.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            k.Puan
        });

        return Ok(sonuc);
    }
    [HttpPut("{kitapId}/OkumaDurumu")]
    public async Task<IActionResult> OkumaDurumuGuncelle(int kitapId, [FromBody] OkumaDurumuModel model)
    {
        var kitapOkuma = await _context.KitapOkumalari
            .FirstOrDefaultAsync(ko => ko.KitapId == kitapId && ko.KullaniciId == model.KullaniciId);

        if (kitapOkuma == null)
            return NotFound("Okuma kaydı bulunamadı.");

        kitapOkuma.SonOkunanSayfa = model.SonOkunanSayfa;
        kitapOkuma.OkumaTarihi = DateTime.UtcNow;

        _context.Entry(kitapOkuma).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok("Okuma durumu başarıyla güncellendi.");
    }

    public class OkumaDurumuModel
    {
        public int KullaniciId { get; set; }
        public int SonOkunanSayfa { get; set; }
    }

    [HttpGet("Kategori/{kategoriId}/Kitaplar")]
    public async Task<IActionResult> KategoriyeGoreKitaplariGetir(int kategoriId)
    {
        var kitaplar = await _context.KitapKategoriler
            .Where(kk => kk.KategoriId == kategoriId)
            .Include(kk => kk.Kitap)
            .Select(kk => kk.Kitap)
            .ToListAsync();

        if (!kitaplar.Any())
            return NotFound("Bu kategoriye ait kitap bulunamadı.");

        var sonuc = kitaplar.Select(k => new
        {
            k.Id,
            k.Ad,
            k.Yazar,
            k.Puan
        });

        return Ok(sonuc);
    }
    [HttpPut("{kitapId}/YorumGuncelle/{yorumId}")]
    public async Task<IActionResult> YorumGuncelle(int kitapId, int yorumId, [FromBody] string yeniYorum)
    {
        if (string.IsNullOrWhiteSpace(yeniYorum))
            return BadRequest("Yorum boş olamaz.");

        var yorum = await _context.KitapYorumlari
            .FirstOrDefaultAsync(y => y.KitapId == kitapId && y.YorumId == yorumId);

        if (yorum == null)
            return NotFound("Yorum bulunamadı.");

        yorum.Yorum = yeniYorum;
        yorum.YorumTarihi = DateTime.UtcNow;

        _context.Entry(yorum).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok("Yorum başarıyla güncellendi.");
    }
    [HttpDelete("{kitapId}/YorumSil/{yorumId}")]
    public async Task<IActionResult> YorumSil(int kitapId, int yorumId)
    {
        var yorum = await _context.KitapYorumlari
            .FirstOrDefaultAsync(y => y.KitapId == kitapId && y.YorumId == yorumId);

        if (yorum == null)
            return NotFound("Yorum bulunamadı.");

        _context.KitapYorumlari.Remove(yorum);
        await _context.SaveChangesAsync();

        return Ok("Yorum başarıyla silindi.");
    }

    [HttpGet("{id}/SayfaGorsel/{numara}")]
    public IActionResult GetPdfSayfaGorsel(int id, int numara)
    {
        if (numara <= 0)
            return BadRequest("Sayfa numarası 1 veya daha büyük olmalıdır.");

        var kitap = _context.Kitaplar.Find(id);
        if (kitap == null || string.IsNullOrEmpty(kitap.PdfYolu))
            return NotFound("Kitap ya da PDF bulunamadı.");

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", kitap.PdfYolu.TrimStart('/'));

        var settings = new MagickReadSettings
        {
            Density = new Density(150),
            FrameIndex = (uint)(numara - 1), // ✅ güvenli dönüşüm
            FrameCount = 1
        };

        using (var images = new MagickImageCollection())
        {
            images.Read(filePath, settings);

            if (images.Count == 0)
                return NotFound("İstenen sayfa bulunamadı.");

            using (var image = images[0])
            {
                image.Format = MagickFormat.Jpeg;
                using var memoryStream = new MemoryStream();
                image.Write(memoryStream);
                return File(memoryStream.ToArray(), "image/jpeg");
            }
        }
    }

    [HttpGet("{id}/SayfaMetin/{numara}")]
    public IActionResult GetPdfSayfaMetin(int id, int numara)
    {
        if (numara <= 0)
            return BadRequest("Sayfa numarası 1 veya daha büyük olmalıdır.");

        var kitap = _context.Kitaplar.Find(id);
        if (kitap == null || string.IsNullOrEmpty(kitap.PdfYolu))
            return NotFound("Kitap ya da PDF bulunamadı.");

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", kitap.PdfYolu.TrimStart('/'));

        var settings = new MagickReadSettings
        {
            Density = new Density(150),
            FrameIndex = (uint)(numara - 1), // ✅ güvenli dönüşüm
            FrameCount = 1
        };

        using (var images = new MagickImageCollection())
        {
            images.Read(filePath, settings);

            if (images.Count == 0)
                return NotFound("İstenen sayfa bulunamadı.");

            using (var image = images[0])
            {
                image.Format = MagickFormat.Png;
                using var memStream = new MemoryStream();
                image.Write(memStream);
                memStream.Position = 0;

                using var engine = new TesseractEngine(@"./tessdata", "tur", EngineMode.Default);
                using var img = Pix.LoadFromMemory(memStream.ToArray());
                using var page = engine.Process(img);
                var text = page.GetText();

                // ✅ OCR sonrası metni temizle
                text = Regex.Replace(text, @"[^\w\s.,!?ğüşöçİĞÜŞÖÇ]", "");

                return Ok(new { Sayfa = numara, Metin = text });
            }
        }
    }
    [HttpPut("{kitapId}/OzetEkle")]
    public async Task<IActionResult> KitapOzetEkle(int kitapId, [FromBody] string ozet)
    {
        if (string.IsNullOrWhiteSpace(ozet))
            return BadRequest("Özet boş olamaz.");

        var kitap = await _context.Kitaplar.FindAsync(kitapId);
        if (kitap == null)
            return NotFound("Kitap bulunamadı.");

        kitap.Ozet = ozet;
        _context.Entry(kitap).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok("Kitap özeti başarıyla eklendi.");
    }
    [HttpPut("OzetGuncelle/{id}")]
    public async Task<IActionResult> OzetGuncelle(int id, [FromBody] KitapOzet guncellenenOzet)

    {
        var mevcutOzet = await _context.KitapOzetler.FindAsync(id);
        if (mevcutOzet == null)
            return NotFound(new { mesaj = "Özet bulunamadı." });

        mevcutOzet.OzetMetni = guncellenenOzet.OzetMetni;
        mevcutOzet.GuncellenmeTarihi = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new { mesaj = "Özet güncellendi.", ozet = mevcutOzet });
    }
    [HttpDelete("OzetSil/{id}")]
    public async Task<IActionResult> OzetSil(int id)

    {
        var silinecekOzet = await _context.KitapOzetler.FindAsync(id);
        if (silinecekOzet == null)
            return NotFound(new { mesaj = "Silinecek özet bulunamadı." });

        _context.KitapOzetler.Remove(silinecekOzet);
        await _context.SaveChangesAsync();

        return Ok(new { mesaj = "Özet başarıyla silindi." });
    }

    // GET: api/Kitap/FiltreliKitaplar?yazar=Ahmet&kategori=Roman
    [HttpGet("FiltreliKitaplar")]
    public async Task<IActionResult> GetFilteredBooks([FromQuery] string? yazar, [FromQuery] string? kategori)
    {
        var query = _context.Kitaplar
            .Include(k => k.KitapKategoriler)
            .ThenInclude(kk => kk.Kategori)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(yazar))
        {
            query = query.Where(k => k.Yazar.Contains(yazar));
        }

        if (!string.IsNullOrWhiteSpace(kategori))
        {
            query = query.Where(k => k.KitapKategoriler.Any(kk => kk.Kategori.Ad.Contains(kategori)));
        }

        var books = await query.ToListAsync();

        if (!books.Any())
        {
            return NotFound("Belirtilen filtrelere uygun kitap bulunamadı.");
        }

        var sonuc = books.Select(k => new
        {
            KitapId = k.Id,
            KitapAdi = k.Ad,
            Yazar = k.Yazar,
            Kategoriler = k.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList(),
            Puan = k.Puan
        });

        return Ok(sonuc);
    }
    [HttpGet("OkumayaBaslananKitaplar/{kullaniciId}")]
    public async Task<IActionResult> GetOkumayaBaslananKitaplar(int kullaniciId)
    {
        var startedBooks = await _context.KitapOkumalari
            .Where(ko => ko.KullaniciId == kullaniciId)
            .Include(ko => ko.Kitap)
                .ThenInclude(k => k.KitapKategoriler)
                    .ThenInclude(kk => kk.Kategori)
            .GroupBy(ko => ko.KitapId)
            .Select(g => g.FirstOrDefault().Kitap)
            .ToListAsync();

        if (startedBooks == null || !startedBooks.Any())
        {
            return NotFound("Okumaya başlanmış kitap bulunamadı.");
        }

        var result = startedBooks.Select(k => new {
            KitapId = k.Id,
            KitapAdi = k.Ad,
            Yazar = k.Yazar,
            Puan = k.Puan,
            Kategoriler = k.KitapKategoriler.Select(kk => kk.Kategori.Ad).ToList()
        });

        return Ok(result);
    }
    [HttpGet("KaldigimSayfa")]
    public async Task<IActionResult> KaldigimSayfa([FromQuery] int kullaniciId, [FromQuery] int kitapId)
    {
        var kayit = await _context.KitapOkumalari
            .FirstOrDefaultAsync(k => k.KullaniciId == kullaniciId && k.KitapId == kitapId);

        if (kayit == null)
            return NotFound("Kayıt bulunamadı.");

        return Ok(new { SonOkunanSayfa = kayit.SonOkunanSayfa });
    }
    [HttpDelete("{kitapId}/FavorilerdenCikar")]
    public async Task<IActionResult> FavorilerdenCikar(int kitapId, [FromQuery] int kullaniciId)
    {
        // FavoriKitap tablosunda, ilgili kullanıcı ve kitap eşleşmesini bul
        var favoriKayit = await _context.FavoriKitaplar
            .FirstOrDefaultAsync(f => f.KitapId == kitapId && f.KullaniciId == kullaniciId);

        if (favoriKayit == null)
        {
            return NotFound("Favorilerde böyle bir kitap yok ya da kullanıcı bilgisi geçersiz.");
        }

        // Kaydı sil
        _context.FavoriKitaplar.Remove(favoriKayit);
        await _context.SaveChangesAsync();

        return Ok("Kitap favorilerden çıkarıldı.");
    }
    [HttpPost("{kitapId}/AdminKitapResmiYukle")]
    public async Task<IActionResult> AdminKitapResmiYukle(
    int kitapId,
    [FromQuery] int adminUserId,
    IFormFile image)
    {
        // Eğer veritabanınızda "Kullanicilar" tablosunda "IsAdmin" alanı yoksa,
        // bu kontrolü güncelleyebilir ya da tamamen kaldırabilirsiniz.
        var admin = await _context.Kullanicilar.FindAsync(adminUserId);
        if (admin == null /*|| !admin.IsAdmin*/) // admin.IsAdmin varsa kullanabilirsiniz
        {
            return Unauthorized("Bu işlemi yapmak için admin olmalısınız veya adminUserId geçersiz.");
        }

        var kitap = await _context.Kitaplar.FindAsync(kitapId);
        if (kitap == null)
        {
            return NotFound("Kitap bulunamadı.");
        }

        if (image == null || image.Length == 0)
        {
            return BadRequest("Resim dosyası yüklenmedi veya dosya boş.");
        }

        // Resimleri kaydetmek için klasör oluşturma
        var imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images");
        if (!Directory.Exists(imagesFolder))
        {
            Directory.CreateDirectory(imagesFolder);
        }

        // Dosya adı için GUID oluşturma
        var fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(image.FileName);
        var filePath = Path.Combine(imagesFolder, fileName);

        // Dosyayı fiziki klasöre kaydetme
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        // Artık Kitap modelinde "ResimYolu" sütunu olduğu için set edebiliriz
        kitap.ResimYolu = $"/images/{fileName}";

        // Veritabanına kaydet
        await _context.SaveChangesAsync();

        return Ok($"Kitap resmi başarıyla yüklendi. Dosya Yolu: /images/{fileName}");
    }

    // DTO ve Form class'larını da unutma (SliderAdDto, SliderAdForm)

    // GET: api/Kitap/SliderAds → Sadece aktif olanları getir
    [HttpGet("SliderAds")]
    public async Task<ActionResult<IEnumerable<SliderAdDto>>> GetSliderAds()
    {
        var list = await _context.SliderAds
            .Where(a => a.AktifMi)
            .OrderBy(a => a.Sira)
            .Select(a => new SliderAdDto(a.Id, a.ResimYolu, a.TargetUrl))
            .ToListAsync();

        return list.Count == 0
            ? NotFound("Gösterilecek slider reklamı yok.")
            : list;
    }

    // POST: api/Kitap/SliderAds (multipart/form-data ile dosya yükleme)
    [HttpPost("SliderAds")]
    public async Task<IActionResult> CreateSliderAd([FromForm] SliderAdForm form)
    {
        if (form.Resim == null || form.Resim.Length == 0)
            return BadRequest("Resim dosyası yüklenmedi.");

        var adsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/ads");
        if (!Directory.Exists(adsDir))
            Directory.CreateDirectory(adsDir);

        var fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(form.Resim.FileName);
        var filePath = Path.Combine(adsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await form.Resim.CopyToAsync(stream);
        }

        var slider = new SliderAd
        {
            ResimYolu = $"/ads/{fileName}",
            TargetUrl = form.Baslik, // İstersen ayrı property tanımlayabilirsin
            Sira = 0,
            AktifMi = true
        };

        _context.SliderAds.Add(slider);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSliderAds), new { id = slider.Id },
            new SliderAdDto(slider.Id, slider.ResimYolu, slider.TargetUrl));
    }

    // PUT: api/Kitap/SliderAds/{id} – sadece metin alanlarını günceller
    [HttpPut("SliderAds/{id}")]
    public async Task<IActionResult> UpdateSliderAd(int id, [FromBody] SliderAdDto dto)
    {
        var ad = await _context.SliderAds.FindAsync(id);
        if (ad is null) return NotFound();

        ad.ResimYolu = dto.ResimUrl;
        ad.TargetUrl = dto.TargetUrl;

        _context.Entry(ad).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Kitap/SliderAds/{id}
    [HttpDelete("SliderAds/{id}")]
    public async Task<IActionResult> DeleteSliderAd(int id)
    {
        var ad = await _context.SliderAds.FindAsync(id);
        if (ad is null) return NotFound();

        _context.SliderAds.Remove(ad);
        await _context.SaveChangesAsync();

        return Ok("Slider silindi.");
    }


}



