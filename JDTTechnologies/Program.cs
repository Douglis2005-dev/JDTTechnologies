var builder = WebApplication.CreateBuilder(args);

// 1. Cambiar AddRazorPages() por AddControllersWithViews()
builder.Services.AddControllersWithViews();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();   // Necesario para CSS/JS/imágenes

app.UseRouting();

app.UseAuthorization();

// 2. Cambiar MapRazorPages() por MapControllerRoute()
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();