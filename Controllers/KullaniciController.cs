using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobilKitapOkumaSistemiBackend.Models;

[Route("api/[controller]")]
[ApiController]
public class KullaniciController : ControllerBase
{
    private readonly VeritabaniContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public KullaniciController(VeritabaniContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Kullanici
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Kullanici>>> GetKullanicilar()
    {
        var kullanicilar = await _context.Kullanicilar.ToListAsync();
        return kullanicilar.Count > 0 ? Ok(kullanicilar) : NotFound("Kullanıcılar bulunamadı.");
    }

    // GET: api/Kullanici/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Kullanici>> GetKullanici(int id)
    {
        var kullanici = await _context.Kullanicilar.FindAsync(id);
        return kullanici != null ? Ok(kullanici) : NotFound($"ID'si {id} olan kullanıcı bulunamadı.");
    }

    // POST: api/Kullanici
    [HttpPost]
    public async Task<ActionResult<Kullanici>> PostKullanici(Kullanici kullanici)
    {
        if (_context.Kullanicilar.Any(u => u.KullaniciAdi == kullanici.KullaniciAdi))
        {
            return BadRequest("Bu kullanıcı adı zaten kullanılıyor.");
        }
        if (_context.Kullanicilar.Any(u => u.Email == kullanici.Email))
        {
            return BadRequest("Bu e-posta adresi zaten kullanılıyor.");
        }

        _context.Kullanicilar.Add(kullanici);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetKullanici), new { id = kullanici.Id }, kullanici);
    }

    // PUT: api/Kullanici/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutKullanici(int id, Kullanici kullanici)
    {
        if (id != kullanici.Id)
        {
            return BadRequest("Gönderilen ID ile kullanıcı ID'si uyuşmuyor.");
        }

        _context.Entry(kullanici).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!KullaniciExists(id))
            {
                return NotFound($"ID'si {id} olan kullanıcı bulunamadı.");
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/Kullanici/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteKullanici(int id)
    {
        var kullanici = await _context.Kullanicilar.FindAsync(id);
        if (kullanici == null)
        {
            return NotFound($"ID'si {id} olan kullanıcı bulunamadı.");
        }

        _context.Kullanicilar.Remove(kullanici);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool KullaniciExists(int id)
    {
        return _context.Kullanicilar.Any(e => e.Id == id);
    }

    [HttpPut("{id}/ProfilGuncelle")]
    public async Task<IActionResult> ProfilGuncelle(string id, [FromBody] KullaniciGuncelleModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Ad) || string.IsNullOrWhiteSpace(model.Email))
        {
            return BadRequest("Ad ve e-posta boş olamaz.");
        }

        var kullanici = await _userManager.FindByIdAsync(id);
        if (kullanici == null)
        {
            return NotFound("Kullanıcı bulunamadı.");
        }

        kullanici.UserName = model.Ad;
        kullanici.Email = model.Email;

        var sonuc = await _userManager.UpdateAsync(kullanici);
        if (!sonuc.Succeeded)
        {
            return BadRequest("Profil güncelleme başarısız.");
        }

        return Ok("Profil başarıyla güncellendi.");
    }

    public class KullaniciGuncelleModel
    {
        public string Ad { get; set; }
        public string Email { get; set; }
    }

    [HttpPut("{id}/SifreGuncelle")]
    public async Task<IActionResult> SifreGuncelle(string id, [FromBody] SifreGuncelleModel model)
    {
        if (string.IsNullOrWhiteSpace(model.YeniSifre))
        {
            return BadRequest("Yeni şifre boş olamaz.");
        }

        var kullanici = await _userManager.FindByIdAsync(id);
        if (kullanici == null)
        {
            return NotFound("Kullanıcı bulunamadı.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(kullanici);
        var sonuc = await _userManager.ResetPasswordAsync(kullanici, token, model.YeniSifre);

        if (!sonuc.Succeeded)
        {
            return BadRequest("Şifre güncelleme başarısız.");
        }

        return Ok("Şifre başarıyla güncellendi.");
    }

    public class SifreGuncelleModel
    {
        public string YeniSifre { get; set; }
    }
    [HttpPut("{id}/SetAdmin")]
    public async Task<IActionResult> SetAdminRole(int id, [FromBody] AdminRoleUpdateModel model)
    {
        var kullanici = await _context.Kullanicilar.FindAsync(id);
        if (kullanici == null)
        {
            return NotFound("Kullanıcı bulunamadı.");
        }
        kullanici.IsAdmin = model.IsAdmin;
        await _context.SaveChangesAsync();
        return Ok($"Kullanıcı {(model.IsAdmin ? "admin" : "normal kullanıcı")} olarak güncellendi.");
    }

    public class AdminRoleUpdateModel
    {
        public bool IsAdmin { get; set; }
    }



}