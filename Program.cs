using Microsoft.EntityFrameworkCore;
using MobilKitapOkumaSistemiBackend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);

// **Loglama Ayarlarý**
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// **Veritabaný Yapýlandýrmasý**
builder.Services.AddDbContext<VeritabaniContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MobilKitapVeritabani")));

// **Identity Yapýlandýrmasý**
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<VeritabaniContext>()
    .AddDefaultTokenProviders();

// **JSON Döngü Hatalarýný Engellemek Ýçin Newtonsoft.Json**
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });

// **Geniþletilmiþ CORS Politikasý (Tüm Kaynaklara Açýk)**
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// **Swagger Yapýlandýrmasý**
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ? Tüm IP'lerden eriþimi etkinleþtirme
app.Urls.Add("http://0.0.0.0:5000");  // Tüm að arayüzleri
app.Urls.Add($"http://{GetLocalIPAddress()}:5000"); // Dinamik IP ekle
app.Urls.Add("https://0.0.0.0:7121");

// **Geliþtirme Ortamýnda Swagger'ý Etkinleþtir**
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MobilKitapOkuma API V1");
    });

    app.UseDeveloperExceptionPage(); // HTTPS yönlendirme kapalý
}
else
{
    app.UseHttpsRedirection(); // Prod ortamýnda HTTPS yönlendirme açýk
}

app.UseStaticFiles();
app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ? Dinamik IP adresini bulmak için yardýmcý metot
string GetLocalIPAddress()
{
    var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
    foreach (var ip in host.AddressList)
    {
        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            return ip.ToString();
        }
    }
    throw new Exception("Yerel IP adresi bulunamadý.");
}
