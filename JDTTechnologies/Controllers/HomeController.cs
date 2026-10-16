using Microsoft.AspNetCore.Mvc;

namespace JDTTechnologies.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        // Puedes añadir más acciones aquí (About, Contact, etc.)
        public IActionResult Privacy()
        {
            return View();
        }

        // Panel de administración: https://tusitio.com/admin
        // La seguridad real la dan el login de Firebase Auth y las reglas de Firestore;
        // esta página solo es la interfaz.
        [Route("admin")]
        public IActionResult Admin()
        {
            Response.Headers["X-Robots-Tag"] = "noindex, nofollow";
            Response.Headers["Cache-Control"] = "no-store";
            return View();
        }
    }
}