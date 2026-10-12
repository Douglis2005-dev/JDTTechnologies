# JDT TECHNOLOGICS - Sitio Web

Sitio web de scrolltelling para JDT TECHNOLOGICS, empresa de tecnología que ofrece desarrollo a medida, desarrollo web, desarrollo móvil y automatizaciones.

## Archivos del proyecto

- `index.html` - Estructura HTML con todas las escenas
- `styles.css` - Estilos CSS con variables, animaciones y responsive
- `main.js` - Lógica de animaciones con GSAP, ScrollTrigger y Lenis
- `logo.svg` - Logo completo (loro + texto)
- `loro-favicon.svg` - Favicon solo con el loro

## Cómo usar

Simplemente abre `index.html` en tu navegador. No necesita servidor ni build.

## Personalización

### Cambiar textos

Edita directamente el contenido en `index.html`. Cada sección tiene sus textos en español.

### Cambiar colores

Las variables CSS están al inicio de `styles.css`:

```css
:root {
  --bg: #050805;        /* Fondo principal */
  --bg-2: #0d130d;      /* Fondo secundario */
  --green: #22ff6a;     /* Verde principal */
  --green-dark: #0f9d3f; /* Verde oscuro */
  --text: #e9f5ec;      /* Color de texto */
  --muted: #8aa08f;     /* Texto secundario */
}
```

### Cambiar datos de contacto

En `main.js`, modifica el objeto `CONFIG`:

```js
const CONFIG = {
  whatsapp: '34600000000',        // Número de WhatsApp (con código de país)
  email: 'info@jdttechnologics.com',
  phone: '+34 600 000 000',
  location: 'Madrid, España',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};
```

También actualiza los datos en las tarjetas de contacto en `index.html` (sección `contacto`).

### Cambiar número de WhatsApp

El número de WhatsApp se usa en:
1. El botón flotante (se actualiza automáticamente desde `CONFIG`)
2. La tarjeta de contacto en la sección de contacto
3. El enlace `wa.me` en el HTML

Para cambiarlo, modifica `CONFIG.whatsapp` en `main.js` y actualiza los enlaces `https://wa.me/...` en `index.html`.

## Conectar formulario de contacto

### Opción 1: Formspree (más fácil)

1. Crea una cuenta en [formspree.io](https://formspree.io)
2. Crea un formulario y obtén tu ID
3. En `main.js`, busca la sección `initContactForm` y descomenta el código de Formspree
4. Reemplaza `TU_FORM_ID` con tu ID

### Opción 2: EmailJS

1. Crea una cuenta en [emailjs.com](https://www.emailjs.com)
2. Configura un servicio de email y una plantilla
3. En `main.js`, busca la sección `initContactForm` y descomenta el código de EmailJS
4. Reemplaza las credenciales con las tuyas

## Tecnologías utilizadas

- HTML5 semántico
- CSS3 con variables, Grid, Flexbox
- JavaScript (ES6+)
- GSAP 3 + ScrollTrigger (animaciones)
- Lenis (scroll suave)
- Google Fonts (Space Grotesk + Inter)

## Características

- Scrolltelling con 9 escenas
- Animaciones ligadas al scroll (scrub)
- Scroll suave con Lenis
- Responsive design
- Accesibilidad (foco visible, prefers-reduced-motion)
- SEO básico con metaetiquetas y Open Graph
