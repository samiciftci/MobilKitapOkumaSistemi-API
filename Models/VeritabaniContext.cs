namespace MobilKitapOkumaSistemiBackend.Models;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class VeritabaniContext : IdentityDbContext<IdentityUser>
{
    public VeritabaniContext(DbContextOptions<VeritabaniContext> options) : base(options) { }

    public DbSet<Kitap> Kitaplar { get; set; }
    public DbSet<Kullanici> Kullanicilar { get; set; }
    public DbSet<KitapPuanlamaModel> KitapPuanlari { get; set; }
    public DbSet<KitapOkuma> KitapOkumalari { get; set; }
    public DbSet<FavoriKitap> FavoriKitaplar { get; set; }
    public DbSet<KitapYorum> KitapYorumlari { get; set; }
    public DbSet<Kategori> Kategoriler { get; set; }
    public DbSet<KitapKategori> KitapKategoriler { get; set; }

    public DbSet<KitapOzet> KitapOzetler { get; set; }

    
    public DbSet<SliderAd> SliderAds { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Kitap ve Kategori arasındaki çoktan çoğa ilişkiyi tanımla
        modelBuilder.Entity<KitapKategori>()
            .HasKey(kk => new { kk.KitapId, kk.KategoriId });

        modelBuilder.Entity<KitapKategori>()
            .HasOne(kk => kk.Kitap)
            .WithMany(k => k.KitapKategoriler)
            .HasForeignKey(kk => kk.KitapId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<KitapKategori>()
            .HasOne(kk => kk.Kategori)
            .WithMany(c => c.KitapKategoriler)
            .HasForeignKey(kk => kk.KategoriId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
