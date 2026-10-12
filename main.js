/* ============================================
   JDT TECHNOLOGICS - Lógica de animaciones
   ============================================ */

/* Configuración global */
const CONFIG = {
  whatsapp: '34600000000',
  email: 'info@jdttechnologics.com',
  phone: '+34 600 000 000',
  location: 'Madrid, España',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

/* ============================================
   INICIALIZACIÓN PRINCIPAL
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initProgressBar();
  initDotsNav();
  initParallax();
  initHeader();
  initHero();
  initQueHacemos();
  initDesarrolloWeb();
  initDesarrolloMovil();
  initAutomatizaciones();
  initComoTrabajamos();
  initNumeros();
  initContacto();
  initFooter();
  initWhatsApp();
  initContactForm();
});

/* ============================================
   LENIS - SCROLL SUAVE
   ============================================ */
let lenis;

function initLenis() {
  if (CONFIG.reducedMotion) return;
  
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  
  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  gsap.ticker.lagSmoothing(0);
  
  // Enlaces del menú con scroll suave
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        lenis.scrollTo(target, { offset: -80 });
        // Cerrar menú móvil si está abierto
        const mobileMenu = document.getElementById('mobileMenu');
        const menuToggle = document.getElementById('menuToggle');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });
}

/* ============================================
   BARRA DE PROGRESO
   ============================================ */
function initProgressBar() {
  const bar = document.querySelector('.progress-bar');
  
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
    }
  });
}

/* ============================================
   INDICADOR LATERAL DE ESCENAS
   ============================================ */
function initDotsNav() {
  const dots = document.querySelectorAll('.dots-nav .dot');
  const scenes = document.querySelectorAll('.scene');
  
  scenes.forEach((scene, i) => {
    ScrollTrigger.create({
      trigger: scene,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) {
          dots.forEach(dot => dot.classList.remove('active'));
          if (dots[i]) dots[i].classList.add('active');
        }
      }
    });
  });
}

/* ============================================
   PARALLAX DEL FONDO
   ============================================ */
function initParallax() {
  if (CONFIG.reducedMotion) return;
  
  gsap.to('.bg-glow-1', {
    y: -200,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    }
  });
  
  gsap.to('.bg-glow-2', {
    y: 200,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    }
  });
  
  gsap.to('.bg-grid', {
    y: 100,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
    }
  });
}

/* ============================================
   HEADER - MENÚ HAMBURGUESA
   ============================================ */
function initHeader() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });
  }
}

/* ============================================
   ESCENA 1: HERO - APERTURA
   ============================================ */
function initHero() {
  if (CONFIG.reducedMotion) return;
  
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  
  // Logo se dibuja trazo a trazo
  tl.fromTo('.hero-logo .loro-path', 
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 2, stagger: 0.1 }
  )
  // Título palabra por palabra
  .fromTo('.hero-title .word',
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.2 },
    '-=1'
  )
  // Subtítulo
  .fromTo('.hero-subtitle',
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8 },
    '-=0.4'
  )
  // Indicador de scroll
  .fromTo('.scroll-indicator',
    { opacity: 0 },
    { opacity: 1, duration: 0.8 },
    '-=0.4'
  );
}

/* ============================================
   ESCENA 2: QUÉ HACEMOS - TARJETAS
   ============================================ */
function initQueHacemos() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-services');
  const container = section.querySelector('.pin-container');
  const cards = section.querySelectorAll('.card');
  
  // Pin el contenedor
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=300%',
    pin: container,
    scrub: 1,
  });
  
  // Cada tarjeta entra desde un lado distinto
  const sides = [-120, 120, -120, 120];
  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { x: sides[i], opacity: 0, rotateY: sides[i] > 0 ? 15 : -15 },
      {
        x: 0, opacity: 1, rotateY: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${10 + i * 20}% top`,
          end: `top+=${25 + i * 20}% top`,
          scrub: 1,
        }
      }
    );
  });
}

/* ============================================
   ESCENA 3: DESARROLLO WEB - MOCKUP
   ============================================ */
function initDesarrolloWeb() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-web');
  const blocks = section.querySelectorAll('.mockup-block');
  const text = section.querySelector('.web-text');
  
  // Pin la sección
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=250%',
    pin: true,
    scrub: 1,
  });
  
  // Texto lateral
  gsap.fromTo(text,
    { x: -50, opacity: 0 },
    {
      x: 0, opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'top+=30% top',
        scrub: 1,
      }
    }
  );
  
  // Bloques del mockup se construyen
  blocks.forEach((block, i) => {
    gsap.fromTo(block,
      { y: 30, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${15 + i * 18}% top`,
          end: `top+=${30 + i * 18}% top`,
          scrub: 1,
        }
      }
    );
  });
}

/* ============================================
   ESCENA 4: DESARROLLO MÓVIL - PANTALLAS
   ============================================ */
function initDesarrolloMovil() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-mobile');
  const screens = section.querySelectorAll('.phone-screen-content');
  const texts = section.querySelectorAll('.mobile-text-item');
  
  // Pin la sección
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=250%',
    pin: true,
    scrub: 1,
  });
  
  // Pantallas cambian con el scroll
  screens.forEach((screen, i) => {
    if (i === 0) return; // La primera pantalla ya es visible
    
    gsap.fromTo(screen,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${15 + i * 25}% top`,
          end: `top+=${30 + i * 25}% top`,
          scrub: 1,
        }
      }
    );
  });
  
  // Textos laterales
  texts.forEach((text, i) => {
    gsap.fromTo(text,
      { x: i % 2 === 0 ? -50 : 50, opacity: 0 },
      {
        x: 0, opacity: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${15 + i * 25}% top`,
          end: `top+=${30 + i * 25}% top`,
          scrub: 1,
        }
      }
    );
  });
}

/* ============================================
   ESCENA 5: AUTOMATIZACIONES - DIAGRAMA
   ============================================ */
function initAutomatizaciones() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-automation');
  const nodes = section.querySelectorAll('.flow-node');
  const lines = section.querySelectorAll('.flow-line');
  const pulses = section.querySelectorAll('.flow-pulse');
  
  // Pin la sección
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=250%',
    pin: true,
    scrub: 1,
  });
  
  // Nodos aparecen
  nodes.forEach((node, i) => {
    gsap.fromTo(node,
      { scale: 0, opacity: 0 },
      {
        scale: 1, opacity: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${10 + i * 15}% top`,
          end: `top+=${20 + i * 15}% top`,
          scrub: 1,
        }
      }
    );
  });
  
  // Líneas se dibujan
  lines.forEach((line, i) => {
    gsap.fromTo(line,
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: `top+=${20 + i * 15}% top`,
          end: `top+=${30 + i * 15}% top`,
          scrub: 1,
        }
      }
    );
  });
  
  // Pulsos viajan por las líneas
  pulses.forEach((pulse, i) => {
    gsap.fromTo(pulse,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: `top+=${30 + i * 10}% top`,
          end: `top+=${50 + i * 10}% top`,
          scrub: 1,
        }
      }
    );
  });
}

/* ============================================
   ESCENA 6: CÓMO TRABAJAMOS - TIMELINE
   ============================================ */
function initComoTrabajamos() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-process');
  const line = section.querySelector('.timeline-line');
  const steps = section.querySelectorAll('.timeline-step');
  
  // La línea crece con el scroll
  gsap.fromTo(line,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
      }
    }
  );
  
  // Pasos se iluminan al llegar
  steps.forEach((step, i) => {
    gsap.fromTo(step,
      { opacity: 0.3, x: i % 2 === 0 ? -30 : 30 },
      {
        opacity: 1, x: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        }
      }
    );
  });
}

/* ============================================
   ESCENA 7: NÚMEROS - CONTADORES
   ============================================ */
function initNumeros() {
  if (CONFIG.reducedMotion) return;
  
  const counters = document.querySelectorAll('.counter');
  
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const obj = { value: 0 };
    
    gsap.to(obj, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: counter,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      onUpdate: () => {
        counter.textContent = Math.round(obj.value);
      }
    });
  });
}

/* ============================================
   ESCENA 8: CONTACTO
   ============================================ */
function initContacto() {
  if (CONFIG.reducedMotion) return;
  
  const section = document.querySelector('.scene-contact');
  
  // Título
  gsap.fromTo('.contact-title',
    { y: 50, opacity: 0 },
    {
      y: 0, opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    }
  );
  
  // Formulario
  gsap.fromTo('.contact-form-wrapper',
    { y: 50, opacity: 0 },
    {
      y: 0, opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.contact-form-wrapper',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    }
  );
  
  // Tarjetas de contacto escalonadas
  gsap.fromTo('.contact-card',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1,
      ease: 'power2.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.contact-cards',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}

/* ============================================
   ESCENA 9: FOOTER - CIERRE
   ============================================ */
function initFooter() {
  if (CONFIG.reducedMotion) return;
  
  // El loro se dibuja de nuevo
  gsap.fromTo('.footer-logo .loro-path',
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.scene-footer',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    }
  );
  
  // Enlaces del footer
  gsap.fromTo('.footer-links a',
    { y: 20, opacity: 0 },
    {
      y: 0, opacity: 1,
      ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.footer-links',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}

/* ============================================
   BOTÓN FLOTANTE DE WHATSAPP
   ============================================ */
function initWhatsApp() {
  const btn = document.querySelector('.whatsapp-float');
  
  // Actualizar el enlace con el número de configuración
  if (btn) {
    btn.href = `https://wa.me/${CONFIG.whatsapp}`;
  }
}

/* ============================================
   FORMULARIO DE CONTACTO - VALIDACIÓN
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const messageEl = document.getElementById('formMessage');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener valores
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const telefono = form.telefono.value.trim();
    const servicio = form.servicio.value;
    const mensaje = form.mensaje.value.trim();
    
    // Validación
    if (!nombre || !email || !mensaje) {
      showFormMessage('Por favor, completa los campos obligatorios.', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showFormMessage('Por favor, introduce un correo válido.', 'error');
      return;
    }
    
    // ============================================
    // AQUÍ CONECTAR FORMSPREE O EMAILJS
    // ============================================
    
    // Opción 1: Formspree
    // Reemplaza 'TU_FORM_ID' con tu ID de Formspree
    /*
    fetch('https://formspree.io/f/TU_FORM_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, servicio, mensaje })
    })
    .then(response => {
      if (response.ok) {
        showFormMessage('¡Gracias! Te contactaremos pronto.', 'success');
        form.reset();
      } else {
        showFormMessage('Hubo un error. Inténtalo de nuevo.', 'error');
      }
    })
    .catch(() => {
      showFormMessage('Hubo un error. Inténtalo de nuevo.', 'error');
    });
    */
    
    // Opción 2: EmailJS
    // Reemplaza las credenciales con las tuyas
    /*
    emailjs.init('TU_PUBLIC_KEY');
    emailjs.send('TU_SERVICE_ID', 'TU_TEMPLATE_ID', {
      nombre, email, telefono, servicio, mensaje
    })
    .then(() => {
      showFormMessage('¡Gracias! Te contactaremos pronto.', 'success');
      form.reset();
    })
    .catch(() => {
      showFormMessage('Hubo un error. Inténtalo de nuevo.', 'error');
    });
    */
    
    // Por ahora, solo mostrar mensaje de éxito
    showFormMessage('¡Gracias! Te contactaremos pronto.', 'success');
    form.reset();
  });
}

/* Validar email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* Mostrar mensaje del formulario */
function showFormMessage(msg, type) {
  const el = document.getElementById('formMessage');
  if (el) {
    el.textContent = msg;
    el.className = `form-message ${type}`;
  }
}
