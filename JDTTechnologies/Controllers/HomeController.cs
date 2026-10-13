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
    }
}