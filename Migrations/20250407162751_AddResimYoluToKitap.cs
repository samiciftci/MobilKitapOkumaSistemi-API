using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MobilKitapOkumaSistemiBackend.Migrations
{
    public partial class AddResimYoluToKitap : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResimYolu",
                table: "Kitaplar",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "KitapOzetler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OzetMetni = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KitapId = table.Column<int>(type: "int", nullable: false),
                    EklenmeTarihi = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GuncellenmeTarihi = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KitapOzetler", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KitapOzetler_Kitaplar_KitapId",
                        column: x => x.KitapId,
                        principalTable: "Kitaplar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KitapOzetler_KitapId",
                table: "KitapOzetler",
                column: "KitapId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KitapOzetler");

            migrationBuilder.DropColumn(
                name: "ResimYolu",
                table: "Kitaplar");
        }
    }
}
