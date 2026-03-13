using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MobilKitapOkumaSistemiBackend.Migrations
{
    public partial class AddIsAdminToKullanicilar : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "Kullanicilar",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "Kullanicilar");
        }
    }
}
