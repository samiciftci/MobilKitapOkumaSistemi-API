using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MobilKitapOkumaSistemiBackend.Migrations
{
    public partial class AddEmailToKullanici : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Kullanicilar",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Kullanicilar");
        }
    }
}
