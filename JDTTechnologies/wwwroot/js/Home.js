/* ============================================
   JDT TECHNOLOGICS - Interacciones
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initHeroParticles();
    initWordCarousel();
    initTiltCards();
    initMagnetButtons();
    initCursorGlow();
    initHeroParallax();
    initRevealOnScroll();
    initRippleButtons();
    initHeaderScroll();
    initMenuToggle();
    initAutomationFlow();
    initWaspFlight();
    initCounters();
});

/* ============================================
   CARRUSEL DE PALABRAS EN EL TÍTULO
   ============================================ */
function initWordCarousel() {
    const words = document.querySelectorAll('.carousel-word');
    if (words.length < 2) return;

    let current = 0;
    const DURATION = 2500;

    function next() {
        const prev = words[current];
        current = (current + 1) % words.length;
        const nextWord = words[current];

        prev.classList.remove('active');
        prev.classList.add('exit-up');

        nextWord.classList.remove('exit-up', 'enter-from-bottom');
        nextWord.classList.add('enter-from-bottom');

        // Forzar reflow para aplicar la transición
        void nextWord.offsetWidth;

        nextWord.classList.remove('enter-from-bottom');
        nextWord.classList.add('active');

        setTimeout(() => {
            prev.classList.remove('exit-up');
        }, 600);
    }

    setInterval(next, DURATION);
}

/* ============================================
   PARTÍCULAS EN EL HERO
   ============================================ */
function initHeroParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let canvas = document.getElementById('hero-particles');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hero-particles';
        hero.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    const particles = [];
    const mouse = { x: -1000, y: -1000 };
    const bursts = [];

    function resize() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = window.innerWidth < 768 ? 30 : 70;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 0.5,
            baseAlpha: Math.random() * 0.5 + 0.3,
        });
    }

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Click → explosión de partículas
    hero.addEventListener('click', (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 3 + Math.random() * 2;
            bursts.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                radius: 2 + Math.random() * 2,
            });
        }
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Partículas normales
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                p.x -= (dx / dist) * force * 2;
                p.y -= (dy / dist) * force * 2;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(250, 204, 21, ${p.baseAlpha})`;
            ctx.fill();
        });

        // Líneas entre partículas
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(250, 204, 21, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Explosiones
        for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.x += b.vx;
            b.y += b.vy;
            b.vx *= 0.96;
            b.vy *= 0.96;
            b.life -= 0.02;

            if (b.life <= 0) {
                bursts.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(250, 204, 21, ${b.life})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }
    draw();
}

/* ============================================
   TILT 3D
   ============================================ */
function initTiltCards() {
    const cards = document.querySelectorAll('.service-card, .process-step, .number-item');
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = ((y - cy) / cy) * -8;
            const ry = ((x - cx) / cx) * 8;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

/* ============================================
   BOTÓN MAGNÉTICO
   ============================================ */
function initMagnetButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach((btn) => {
        if (!btn.parentElement.classList.contains('magnet-wrap')) {
            const wrap = document.createElement('span');
            wrap.className = 'magnet-wrap';
            btn.parentNode.insertBefore(wrap, btn);
            wrap.appendChild(btn);
        }
    });

    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.magnet-wrap').forEach((wrap) => {
            const rect = wrap.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                wrap.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
            } else {
                wrap.style.transform = 'translate(0, 0)';
            }
        });
    });
}

/* ============================================
   CURSOR GLOW
   ============================================ */
function initCursorGlow() {
    const glow = document.querySelector('.cursor-glow');
    if (!glow) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    let mx = 0, my = 0, gx = 0, gy = 0;
    document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
    });
    function animate() {
        gx += (mx - gx) * 0.15;
        gy += (my - gy) * 0.15;
        glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
    }
    animate();
}

/* ============================================
   PARALLAX EN EL HERO
   ============================================ */
function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    const bee = hero.querySelector('.hero-bee');
    const title = hero.querySelector('.hero-title');
    const subtitle = hero.querySelector('.hero-subtitle');

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        if (bee) bee.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
        if (title) title.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
        if (subtitle) subtitle.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
    });

    hero.addEventListener('mouseleave', () => {
        if (bee) bee.style.transform = '';
        if (title) title.style.transform = '';
        if (subtitle) subtitle.style.transform = '';
    });
}

/* ============================================
   REVEAL AL HACER SCROLL
   ============================================ */
function initRevealOnScroll() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    els.forEach((el) => observer.observe(el));
}

/* ============================================
   RIPPLE EN BOTONES
   ============================================ */
function initRippleButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ============================================
   HEADER CON SCROLL
   ============================================ */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }, { passive: true });
}

/* ============================================
   MENÚ HAMBURGUESA
   ============================================ */
function initMenuToggle() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('active');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', open);
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ============================================
   FLUJO DE AUTOMATIZACIÓN INTERACTIVO
   ============================================ */
function initAutomationFlow() {
    const flow = document.getElementById('automationFlow');
    if (!flow) return;

    const nodes = flow.querySelectorAll('.flow-node');
    const lines = flow.querySelectorAll('.flow-line-active');
    const playBtn = document.getElementById('automation-play');
    const resetBtn = document.getElementById('automation-reset');
    const detail = document.getElementById('flowDetail');
    const detailTitle = document.getElementById('flowDetailTitle');
    const detailDesc = document.getElementById('flowDetailDesc');
    const closeBtn = detail.querySelector('.flow-detail-close');

    let running = false;
    let timeouts = [];

    // ============================================
    // Click en un nodo → mostrar detalle
    // ============================================
    nodes.forEach((node) => {
        node.addEventListener('click', (e) => {
            e.stopPropagation();

            // Marcar visualmente el nodo
            nodes.forEach((n) => n.classList.remove('active'));
            node.classList.add('active');

            // Mostrar tarjeta con detalles
            detailTitle.textContent = node.dataset.title;
            detailDesc.textContent = node.dataset.desc;
            detail.classList.add('visible');
        });
    });

    // Cerrar tarjeta de detalle
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        detail.classList.remove('visible');
        nodes.forEach((n) => n.classList.remove('active'));
    });

    // ============================================
    // Botón play → activar el flujo
    // ============================================
    playBtn.addEventListener('click', () => {
        if (running) return;
        runFlow();
    });

    resetBtn.addEventListener('click', () => {
        clearTimeouts();
        resetFlow();
        runFlow();
    });

    function clearTimeouts() {
        timeouts.forEach((t) => clearTimeout(t));
        timeouts = [];
    }

    function resetFlow() {
        running = false;
        nodes.forEach((n) => {
            n.classList.remove('active', 'completed');
        });
        lines.forEach((l) => l.classList.remove('flowing'));
        detail.classList.remove('visible');
    }

    function runFlow() {
        running = true;

        // Fase 1: activar nodo 1
        timeouts.push(setTimeout(() => {
            nodes[0].classList.add('active');
        }, 300));

        // Fase 2: activar línea 1
        timeouts.push(setTimeout(() => {
            lines[0].classList.add('flowing');
        }, 800));

        // Fase 3: completar nodo 1, activar nodo 2
        timeouts.push(setTimeout(() => {
            nodes[0].classList.remove('active');
            nodes[0].classList.add('completed');
            nodes[1].classList.add('active');
        }, 2000));

        // Fase 4: activar línea 2
        timeouts.push(setTimeout(() => {
            lines[1].classList.add('flowing');
        }, 2600));

        // Fase 5: completar nodo 2, activar nodo 3
        timeouts.push(setTimeout(() => {
            nodes[1].classList.remove('active');
            nodes[1].classList.add('completed');
            nodes[2].classList.add('active');
        }, 3800));

        // Fase 6: completar todo
        timeouts.push(setTimeout(() => {
            nodes[2].classList.remove('active');
            nodes[2].classList.add('completed');
            lines.forEach((l) => l.classList.remove('flowing'));
            running = false;
        }, 5000));
    }

    // ============================================
    // Auto-arrancar cuando entra en viewport
    // ============================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !running) {
                runFlow();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    observer.observe(flow);
}

/* ============================================
   AVISPA: VUELO CON RASTRO QUE DIBUJA EL LOGO "jdt"
   La avispa del hero despega de su sitio y, con su rastro dorado (que sale
   de su aguijón), dibuja las letras del logo: la j, su punto, la d, la t y
   el contorno exterior. Después pasea un rato con el logo ya dibujado, lo
   desvanece y vuelve a empezar.
   ============================================ */
function initWaspFlight() {
    const hero = document.querySelector('.hero');
    const wasp = hero ? hero.querySelector('.hero-bee .wasp') : null;
    if (!hero || !wasp) return;

    /* ---------- Configuración (ajústala a tu gusto) ---------- */
    const CFG = {
        writeSpeed: 520,    // px/s mientras dibuja
        hopSpeed: 900,      // px/s al saltar entre trazos
        travelSpeed: 480,   // px/s al ir al inicio y al pasear
        holdMs: 6000,       // tiempo que el logo permanece dibujado
        fadeMs: 1100,       // duración del desvanecido
        loop: true,         // false = lo dibuja una sola vez y lo deja
        logoSize: 0.8,      // TAMAÑO DEL LOGO: 1 = llena la fila de la avispa; 0.8 = 20% más pequeño; 0.6 = bastante más pequeño
        maxScale: 1.6,      // límite de seguridad (no hace falta tocarlo)
        sparks: true        // chispas doradas en la punta del rastro
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';

    /* ---------- Logo "jdt" ----------
       Contornos calcados del logo (coordenadas relativas a su caja de 477.2 x 476.6).
       Orden de dibujo: tallo de la j, punto de la j, d, t y contorno exterior. */
    const LOGO = {
        w: 477.2, h: 476.6,
        strokes: [
            "M97.9 158.6 L100.2 160.1 L103.2 166.1 L112.3 190.0 L119.7 216.6 L125.3 243.9 L128.2 269.1 L129.1 289.6 L128.5 309.6 L126.2 329.3 L122.4 347.4 L116.4 365.4 L108.7 381.6 L101.2 393.2 L90.7 405.6 L78.5 416.5 L61.9 426.9 L50.2 431.7 L48.6 430.6 L38.9 371.6 L38.7 366.8 L40.1 365.0 L52.5 358.5 L62.0 352.0 L69.2 345.1 L74.8 337.7 L79.2 329.2 L82.8 318.7 L84.7 308.6 L85.6 294.6 L85.2 280.9 L83.4 262.8 L77.0 229.4 L66.4 195.9 L53.3 166.7 L54.4 165.4 L97.9 158.6",
            "M57.4 85.4 L63.2 84.3 L70.0 84.5 L74.9 85.4 L80.6 87.8 L89.5 94.8 L93.1 100.2 L95.4 105.9 L96.6 111.7 L96.7 117.6 L95.5 123.5 L93.2 129.2 L89.5 134.5 L84.9 138.9 L75.0 144.0 L69.2 145.0 L62.4 144.8 L57.5 143.8 L52.0 141.4 L47.2 138.1 L42.7 133.6 L37.5 123.8 L36.2 117.3 L36.1 111.9 L37.2 106.1 L39.5 100.4 L42.6 95.6 L47.1 91.0 L57.4 85.4",
            "M238.6 33.7 L305.2 33.0 L309.5 33.8 L315.3 41.0 L323.5 54.9 L329.7 68.7 L334.2 83.1 L337.2 98.1 L338.4 112.6 L338.3 127.4 L336.2 145.2 L330.8 167.8 L321.7 191.7 L310.6 212.5 L297.1 231.9 L302.2 261.1 L302.5 268.6 L301.0 271.0 L255.2 272.1 L250.8 271.5 L249.8 269.6 L248.4 255.7 L245.9 243.5 L242.1 232.2 L236.7 220.6 L231.1 212.2 L223.5 203.8 L215.9 198.4 L208.8 195.6 L201.1 194.5 L193.2 195.2 L186.2 197.2 L180.6 200.5 L176.3 205.3 L174.0 210.8 L173.7 217.6 L175.2 223.1 L178.4 228.0 L183.4 231.9 L189.8 234.6 L196.3 235.8 L203.2 236.0 L211.0 234.9 L220.4 232.3 L229.5 228.4 L232.6 228.6 L237.4 238.9 L241.4 252.9 L242.6 262.5 L242.1 264.0 L240.3 265.3 L221.9 270.8 L202.2 273.5 L187.4 272.8 L171.5 268.8 L159.1 263.2 L145.7 252.6 L137.1 241.2 L131.8 228.5 L130.1 217.5 L130.8 206.7 L133.7 196.6 L138.5 187.5 L145.1 179.0 L153.6 171.6 L164.9 164.9 L175.7 160.7 L186.3 158.3 L199.2 157.2 L211.4 157.8 L225.0 160.4 L236.9 164.4 L248.8 170.5 L260.5 178.8 L271.0 188.2 L272.5 188.3 L274.2 186.1 L281.6 168.5 L285.5 149.6 L285.9 128.6 L282.7 107.6 L276.1 87.2 L267.1 69.2 L253.6 50.7 L237.5 35.9 L237.2 34.8 L238.6 33.7",
            "M375.5 93.6 L419.6 99.7 L420.2 100.8 L403.9 131.9 L396.5 149.5 L392.0 163.6 L392.3 165.0 L394.3 166.1 L422.8 170.6 L426.9 172.4 L427.2 175.2 L422.7 206.6 L421.6 208.5 L419.2 208.9 L382.6 204.7 L381.3 206.2 L380.0 212.8 L378.2 233.1 L378.6 244.6 L380.1 254.3 L383.0 263.3 L387.5 271.9 L392.7 278.6 L400.4 285.9 L408.2 291.1 L419.5 296.8 L421.1 298.9 L414.0 351.8 L413.1 355.1 L412.0 355.9 L398.3 352.0 L382.2 344.1 L369.8 335.5 L359.2 325.1 L350.2 313.1 L343.4 299.9 L338.3 285.0 L335.0 268.5 L333.5 247.6 L334.1 226.9 L337.0 202.9 L342.8 173.8 L350.0 149.0 L359.5 123.4 L370.0 100.9 L373.3 95.2 L375.5 93.6",
            "M15.8 76.8 L23.8 67.8 L31.7 61.7 L41.5 56.4 L51.3 53.3 L64.2 51.3 L76.2 51.9 L86.0 54.3 L97.0 59.3 L107.1 66.2 L114.7 73.6 L121.0 82.3 L125.5 91.8 L128.5 102.7 L129.7 114.6 L129.1 124.1 L126.1 138.4 L129.4 144.9 L131.2 146.5 L146.8 136.8 L158.5 131.4 L172.2 127.2 L187.9 124.7 L201.2 124.2 L217.9 125.5 L229.7 127.6 L252.0 134.6 L253.3 132.5 L252.4 122.8 L247.2 103.1 L239.8 87.5 L233.5 77.8 L227.6 70.7 L215.0 60.3 L131.7 5.6 L128.5 2.7 L130.6 1.7 L320.2 0.0 L324.0 0.3 L326.0 1.3 L340.9 20.4 L350.9 36.5 L359.8 55.5 L361.6 57.7 L476.6 74.7 L477.2 76.4 L448.7 118.6 L441.4 130.4 L437.3 139.0 L438.5 140.8 L445.9 144.5 L461.9 155.4 L462.6 157.7 L447.5 264.4 L446.2 265.4 L414.4 244.0 L412.6 243.8 L412.0 244.8 L412.6 248.7 L414.8 253.5 L421.1 260.2 L429.1 265.2 L454.6 275.7 L457.0 278.1 L441.5 392.6 L440.2 397.0 L438.4 397.6 L405.4 388.8 L389.7 383.6 L371.0 375.3 L356.7 366.6 L342.9 355.5 L329.1 340.2 L320.4 326.9 L310.8 306.5 L308.8 304.6 L215.2 305.3 L198.2 306.3 L180.2 305.0 L163.4 301.4 L161.8 303.7 L160.0 325.8 L157.2 343.2 L149.4 371.3 L139.6 393.5 L133.9 403.8 L124.4 417.4 L114.1 429.1 L104.7 437.7 L87.9 449.9 L75.1 457.0 L59.8 463.7 L26.3 476.2 L23.0 476.2 L21.8 472.6 L1.9 346.8 L4.2 344.1 L33.2 332.1 L43.7 324.6 L47.9 318.8 L51.0 310.9 L52.5 301.6 L52.7 290.6 L51.4 271.8 L47.7 247.6 L43.3 230.0 L38.5 214.8 L27.5 188.8 L0.0 142.4 L0.6 140.6 L5.9 138.9 L7.1 137.6 L3.6 120.6 L3.9 104.7 L8.1 90.0 L15.8 76.8"
        ],
        fill: "M97.9 158.6 L100.2 160.1 L103.2 166.1 L112.3 190.0 L119.7 216.6 L125.3 243.9 L128.2 269.1 L129.1 289.6 L128.5 309.6 L126.2 329.3 L122.4 347.4 L116.4 365.4 L108.7 381.6 L101.2 393.2 L90.7 405.6 L78.5 416.5 L61.9 426.9 L50.2 431.7 L48.6 430.6 L38.9 371.6 L38.7 366.8 L40.1 365.0 L52.5 358.5 L62.0 352.0 L69.2 345.1 L74.8 337.7 L79.2 329.2 L82.8 318.7 L84.7 308.6 L85.6 294.6 L85.2 280.9 L83.4 262.8 L77.0 229.4 L66.4 195.9 L53.3 166.7 L54.4 165.4Z M57.4 85.4 L63.2 84.3 L70.0 84.5 L74.9 85.4 L80.6 87.8 L89.5 94.8 L93.1 100.2 L95.4 105.9 L96.6 111.7 L96.7 117.6 L95.5 123.5 L93.2 129.2 L89.5 134.5 L84.9 138.9 L75.0 144.0 L69.2 145.0 L62.4 144.8 L57.5 143.8 L52.0 141.4 L47.2 138.1 L42.7 133.6 L37.5 123.8 L36.2 117.3 L36.1 111.9 L37.2 106.1 L39.5 100.4 L42.6 95.6 L47.1 91.0Z M238.6 33.7 L305.2 33.0 L309.5 33.8 L315.3 41.0 L323.5 54.9 L329.7 68.7 L334.2 83.1 L337.2 98.1 L338.4 112.6 L338.3 127.4 L336.2 145.2 L330.8 167.8 L321.7 191.7 L310.6 212.5 L297.1 231.9 L302.2 261.1 L302.5 268.6 L301.0 271.0 L255.2 272.1 L250.8 271.5 L249.8 269.6 L248.4 255.7 L245.9 243.5 L242.1 232.2 L236.7 220.6 L231.1 212.2 L223.5 203.8 L215.9 198.4 L208.8 195.6 L201.1 194.5 L193.2 195.2 L186.2 197.2 L180.6 200.5 L176.3 205.3 L174.0 210.8 L173.7 217.6 L175.2 223.1 L178.4 228.0 L183.4 231.9 L189.8 234.6 L196.3 235.8 L203.2 236.0 L211.0 234.9 L220.4 232.3 L229.5 228.4 L232.6 228.6 L237.4 238.9 L241.4 252.9 L242.6 262.5 L242.1 264.0 L240.3 265.3 L221.9 270.8 L202.2 273.5 L187.4 272.8 L171.5 268.8 L159.1 263.2 L145.7 252.6 L137.1 241.2 L131.8 228.5 L130.1 217.5 L130.8 206.7 L133.7 196.6 L138.5 187.5 L145.1 179.0 L153.6 171.6 L164.9 164.9 L175.7 160.7 L186.3 158.3 L199.2 157.2 L211.4 157.8 L225.0 160.4 L236.9 164.4 L248.8 170.5 L260.5 178.8 L271.0 188.2 L272.5 188.3 L274.2 186.1 L281.6 168.5 L285.5 149.6 L285.9 128.6 L282.7 107.6 L276.1 87.2 L267.1 69.2 L253.6 50.7 L237.5 35.9 L237.2 34.8Z M375.5 93.6 L419.6 99.7 L420.2 100.8 L403.9 131.9 L396.5 149.5 L392.0 163.6 L392.3 165.0 L394.3 166.1 L422.8 170.6 L426.9 172.4 L427.2 175.2 L422.7 206.6 L421.6 208.5 L419.2 208.9 L382.6 204.7 L381.3 206.2 L380.0 212.8 L378.2 233.1 L378.6 244.6 L380.1 254.3 L383.0 263.3 L387.5 271.9 L392.7 278.6 L400.4 285.9 L408.2 291.1 L419.5 296.8 L421.1 298.9 L414.0 351.8 L413.1 355.1 L412.0 355.9 L398.3 352.0 L382.2 344.1 L369.8 335.5 L359.2 325.1 L350.2 313.1 L343.4 299.9 L338.3 285.0 L335.0 268.5 L333.5 247.6 L334.1 226.9 L337.0 202.9 L342.8 173.8 L350.0 149.0 L359.5 123.4 L370.0 100.9 L373.3 95.2Z M15.8 76.8 L23.8 67.8 L31.7 61.7 L41.5 56.4 L51.3 53.3 L64.2 51.3 L76.2 51.9 L86.0 54.3 L97.0 59.3 L107.1 66.2 L114.7 73.6 L121.0 82.3 L125.5 91.8 L128.5 102.7 L129.7 114.6 L129.1 124.1 L126.1 138.4 L129.4 144.9 L131.2 146.5 L146.8 136.8 L158.5 131.4 L172.2 127.2 L187.9 124.7 L201.2 124.2 L217.9 125.5 L229.7 127.6 L252.0 134.6 L253.3 132.5 L252.4 122.8 L247.2 103.1 L239.8 87.5 L233.5 77.8 L227.6 70.7 L215.0 60.3 L131.7 5.6 L128.5 2.7 L130.6 1.7 L320.2 0.0 L324.0 0.3 L326.0 1.3 L340.9 20.4 L350.9 36.5 L359.8 55.5 L361.6 57.7 L476.6 74.7 L477.2 76.4 L448.7 118.6 L441.4 130.4 L437.3 139.0 L438.5 140.8 L445.9 144.5 L461.9 155.4 L462.6 157.7 L447.5 264.4 L446.2 265.4 L414.4 244.0 L412.6 243.8 L412.0 244.8 L412.6 248.7 L414.8 253.5 L421.1 260.2 L429.1 265.2 L454.6 275.7 L457.0 278.1 L441.5 392.6 L440.2 397.0 L438.4 397.6 L405.4 388.8 L389.7 383.6 L371.0 375.3 L356.7 366.6 L342.9 355.5 L329.1 340.2 L320.4 326.9 L310.8 306.5 L308.8 304.6 L215.2 305.3 L198.2 306.3 L180.2 305.0 L163.4 301.4 L161.8 303.7 L160.0 325.8 L157.2 343.2 L149.4 371.3 L139.6 393.5 L133.9 403.8 L124.4 417.4 L114.1 429.1 L104.7 437.7 L87.9 449.9 L75.1 457.0 L59.8 463.7 L26.3 476.2 L23.0 476.2 L21.8 472.6 L1.9 346.8 L4.2 344.1 L33.2 332.1 L43.7 324.6 L47.9 318.8 L51.0 310.9 L52.5 301.6 L52.7 290.6 L51.4 271.8 L47.7 247.6 L43.3 230.0 L38.5 214.8 L27.5 188.8 L0.0 142.4 L0.6 140.6 L5.9 138.9 L7.1 137.6 L3.6 120.6 L3.9 104.7 L8.1 90.0Z"
    };

    /* ---------- Utilidades ---------- */
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const smooth = (u) => u * u * (3 - 2 * u);
    function cubic(p0, p1, p2, p3, t) {
        const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
        return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
    }
    // Escala/traslada los números de un path (pares x,y) con comandos M/L/C
    function xf(d, ox, oy, k) {
        let i = 0;
        return d.replace(/-?\d+(?:\.\d+)?/g, (n) => {
            const v = parseFloat(n);
            return ((i++ % 2 === 0) ? ox + v * k : oy + v * k).toFixed(2);
        });
    }

    /* ---------- Capas: rastro (SVG) + chispas (canvas) ---------- */
    const layer = document.createElement('div');
    layer.className = 'wasp-flight';
    layer.setAttribute('aria-hidden', 'true');
    const ink = document.createElementNS(NS, 'svg');
    ink.setAttribute('class', 'wasp-ink');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    layer.append(ink, canvas);
    hero.appendChild(layer);

    /* La avispa sale de su sitio y pasa a la capa de vuelo */
    const baseSize = parseFloat(getComputedStyle(wasp).width) || 150;
    const hr0 = hero.getBoundingClientRect();
    const wr0 = wasp.getBoundingClientRect();
    const home = { x: wr0.left - hr0.left + wr0.width / 2, y: wr0.top - hr0.top + wr0.height / 2 };
    layer.appendChild(wasp);
    wasp.classList.add('wasp-fly');
    hero.classList.add('has-wasp-flight');

    /* ---------- Estado ---------- */
    let W = 0, H = 0, scale = 1, size = baseSize, dpr = 1;
    let strokes = [], legs = [], legIdx = 0, legT = 0;
    let phase = 'write', doneAt = 0, fading = false;
    const pen = { x: 0, y: 0 };
    const pose = { sx: 1, sxT: 1, tilt: 0, vx: 0, vy: 0 };
    const parts = [];
    let sparkAcc = 0;

    /* ---------- Geometría del logo ---------- */
    function layout() {
        const hr = hero.getBoundingClientRect();
        W = hero.clientWidth; H = hero.clientHeight;
        const bee = hero.querySelector('.hero-bee').getBoundingClientRect();
        const narrow = W < 640;

        // El logo ocupa la fila donde estaba la avispa (un poco más alto que ella)
        scale = Math.min(Math.min(W - (narrow ? 40 : 96), 760) / LOGO.w,
            Math.max(bee.height, 200) * 1.04 / LOGO.h,
            CFG.maxScale) * CFG.logoSize;
        const cx = bee.left - hr.left + bee.width / 2;
        const cy = bee.top - hr.top + bee.height / 2;
        const left = cx - (LOGO.w * scale) / 2;
        const top = cy - (LOGO.h * scale) / 2;

        // El tamaño de la avispa lo marca tu HTML (--w/--h); en pantallas pequeñas solo se reduce
        size = Math.round(narrow ? Math.min(baseSize, 96) : baseSize);
        wasp.style.setProperty('--w', size + 'px');
        wasp.style.setProperty('--h', size + 'px');

        // Canvas de chispas (nítido en pantallas de alta densidad)
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // SVG del rastro: solo cubre el logo, en coordenadas de la capa
        ink.replaceChildren();
        const bx = left - 28, by = top - 28, bw = LOGO.w * scale + 56, bh = LOGO.h * scale + 56;
        ink.setAttribute('viewBox', bx + ' ' + by + ' ' + bw + ' ' + bh);
        ink.style.left = bx + 'px'; ink.style.top = by + 'px';
        ink.style.width = bw + 'px'; ink.style.height = bh + 'px';

        // Relleno suave del contorno (aparece al terminar de dibujar)
        const fill = document.createElementNS(NS, 'path');
        fill.setAttribute('class', 'ink-fill');
        fill.setAttribute('fill-rule', 'evenodd');
        fill.setAttribute('d', xf(LOGO.fill, left, top, scale));
        ink.appendChild(fill);

        strokes = [];
        const core = clamp(4.4 * scale, 2.4, 6);
        LOGO.strokes.forEach((d0) => {
            const d = xf(d0, left, top, scale);
            const mk = (cls, w) => {
                const p = document.createElementNS(NS, 'path');
                p.setAttribute('d', d);
                p.setAttribute('class', cls);
                p.setAttribute('stroke-width', w.toFixed(2));
                ink.appendChild(p);
                return p;
            };
            const glow = mk('ink-glow', core * 4);
            const mid = mk('ink-mid', core);
            const hot = mk('ink-core', core * 0.38);
            const len = mid.getTotalLength();
            [glow, mid, hot].forEach((p) => {
                p.style.strokeDasharray = len + ' ' + len;
                p.style.strokeDashoffset = len;
                p.style.opacity = 0;
            });
            strokes.push({
                glow, mid, hot, len,
                start: mid.getPointAtLength(0),
                end: mid.getPointAtLength(len)
            });
        });
    }

    function setInk(i, u) {
        const s = strokes[i];
        if (!s) return;
        const off = s.len * (1 - u), op = u > 0.002 ? 1 : 0;
        [s.glow, s.mid, s.hot].forEach((p) => { p.style.strokeDashoffset = off; p.style.opacity = op; });
    }
    function resetInk() {
        strokes.forEach((_, i) => setInk(i, 0));
        ink.classList.remove('is-done', 'is-fading');
        fading = false;
    }

    /* ---------- Tramos de vuelo ---------- */
    function arc(p0, p1, bendFrac, up) {
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dist = Math.hypot(dx, dy) || 1;
        let nx = -dy / dist, ny = dx / dist;
        if (up && ny > 0) { nx = -nx; ny = -ny; }          // el salto se curva hacia arriba
        const b = bendFrac * dist;
        const c1 = { x: p0.x + dx * 0.3 + nx * b, y: p0.y + dy * 0.3 + ny * b };
        const c2 = { x: p0.x + dx * 0.7 + nx * b, y: p0.y + dy * 0.7 + ny * b };
        return { len: dist * (1 + Math.abs(bendFrac) * 0.9), pos: (u) => cubic(p0, c1, c2, p1, u) };
    }
    function travelLeg(p0, p1, speed, bend, up) {
        const a = arc({ x: p0.x, y: p0.y }, { x: p1.x, y: p1.y }, bend, up);
        return { ink: -1, ease: smooth, pos: a.pos, dur: clamp(a.len / speed * 1000, 140, 4000) };
    }
    function inkLeg(i) {
        const s = strokes[i], spd = CFG.writeSpeed * (0.6 + 0.4 * scale);
        return {
            ink: i,
            dur: Math.max(120, s.len / spd * 1000),
            ease: (u) => 0.7 * u + 0.3 * smooth(u),
            pos: (u) => s.mid.getPointAtLength(s.len * u)
        };
    }
    function buildRound() {
        legs = [];
        if (!strokes.length) return;
        legs.push(travelLeg(pen, strokes[0].start, CFG.travelSpeed, 0.2, true));
        strokes.forEach((s, i) => {
            if (i > 0) {
                const prev = strokes[i - 1].end;
                if (Math.hypot(s.start.x - prev.x, s.start.y - prev.y) > 1.5) {
                    legs.push(travelLeg(prev, s.start, CFG.hopSpeed, 0.22, true));
                }
            }
            legs.push(inkLeg(i));
        });
        legIdx = 0; legT = 0; phase = 'write';
    }
    function wanderLeg() {
        const padX = Math.max(60, size * 0.6);
        const top = 90 + size * 0.4;
        const bottom = Math.max(top + 80, Math.min(H * 0.78, H - size));
        const target = { x: padX + Math.random() * Math.max(40, W - 2 * padX), y: top + Math.random() * (bottom - top) };
        const bend = (0.16 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1);
        return travelLeg(pen, target, CFG.travelSpeed * (0.7 + Math.random() * 0.5), bend, false);
    }
    function onLegsDone(now) {
        if (phase === 'write') {
            phase = 'hold'; doneAt = now;
            ink.classList.add('is-done');
        }
        if (phase === 'hold' && CFG.loop) {
            const el = now - doneAt;
            if (el > CFG.holdMs && !fading) {
                fading = true;
                ink.style.transitionDuration = CFG.fadeMs + 'ms';
                ink.classList.add('is-fading');
            }
            if (el > CFG.holdMs + CFG.fadeMs) { resetInk(); buildRound(); return; }
        }
        legs = [wanderLeg()]; legIdx = 0;
    }

    /* ---------- Posición, giro e inclinación de la avispa ---------- */
    // El aguijón queda en (0.124, 0.44) del tamaño respecto al centro (avispa mirando a la izquierda)
    function place() {
        const ox = pose.sx * 0.124 * size, oy = 0.44 * size;
        const r = pose.tilt * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
        const cx = pen.x - (ox * c - oy * s), cy = pen.y - (ox * s + oy * c);
        wasp.style.transform = 'translate3d(' + (cx - size / 2).toFixed(1) + 'px,' + (cy - size / 2).toFixed(1) + 'px,0) ' +
            'rotate(' + pose.tilt.toFixed(2) + 'deg) scale(' + pose.sx.toFixed(3) + ',1)';
    }
    function move(p, dt, writing) {
        const vx = (p.x - pen.x) / dt, vy = (p.y - pen.y) / dt;
        pen.x = p.x; pen.y = p.y;
        const k = Math.min(1, dt * 6);
        pose.vx += (vx - pose.vx) * k; pose.vy += (vy - pose.vy) * k;
        if (writing) pose.sxT = -1;                       // al escribir mira hacia donde avanza el texto
        else if (pose.vx > 70) pose.sxT = -1;
        else if (pose.vx < -70) pose.sxT = 1;
        pose.sx += (pose.sxT - pose.sx) * Math.min(1, dt * 9);
        const tiltT = -pose.sx * clamp(pose.vy * 0.028, -15, 15);
        pose.tilt += (tiltT - pose.tilt) * Math.min(1, dt * 8);
        place();
        if (CFG.sparks) {
            sparkAcc += dt * (writing ? 150 : 26);
            while (sparkAcc >= 1 && parts.length < 140) {
                sparkAcc -= 1;
                parts.push({
                    x: pen.x + (Math.random() - 0.5) * 3, y: pen.y + (Math.random() - 0.5) * 3,
                    vx: (Math.random() - 0.5) * 70, vy: (Math.random() - 0.8) * 55,
                    life: 0, max: 0.5 + Math.random() * 0.6, r: 0.8 + Math.random() * 1.8
                });
            }
            sparkAcc = Math.min(sparkAcc, 3);
        }
    }
    function drawSparks(dt) {
        ctx.clearRect(0, 0, W, H);
        if (!parts.length) return;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = parts.length - 1; i >= 0; i--) {
            const q = parts[i];
            q.life += dt;
            if (q.life >= q.max) { parts.splice(i, 1); continue; }
            q.vy += 90 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
            const a = 1 - q.life / q.max;
            ctx.fillStyle = 'rgba(250,204,21,' + (a * 0.9).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.4 + a), 0, 6.2832); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- Bucle de animación ---------- */
    let raf = 0, last = 0, running = false;
    function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.05);
        last = now;
        legT += dt * 1000;
        let leg = legs[legIdx];
        let guard = 0;
        while (leg && legT >= leg.dur && guard++ < 50) {
            if (leg.ink >= 0) setInk(leg.ink, 1);
            legT -= leg.dur; legIdx++;
            leg = legs[legIdx];
            if (!leg) { onLegsDone(now); leg = legs[legIdx]; }
        }
        if (!leg) return;
        const e = leg.ease(clamp(legT / leg.dur, 0, 1));
        if (leg.ink >= 0) setInk(leg.ink, e);
        move(leg.pos(e), dt, leg.ink >= 0);
        drawSparks(dt);
    }
    function start() { if (!running && !reduceMotion) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    /* ---------- Arranque ---------- */
    layout();
    pen.x = home.x + 0.124 * size; pen.y = home.y + 0.44 * size;   // despega desde su sitio
    place();

    if (reduceMotion) {
        // Sin movimiento: logo ya dibujado y la avispa posada al final
        strokes.forEach((_, i) => setInk(i, 1));
        ink.classList.add('is-done');
        const lastEnd = strokes.length ? strokes[strokes.length - 1].end : pen;
        pose.sx = pose.sxT = -1;
        pen.x = lastEnd.x + size * 0.25; pen.y = lastEnd.y + size * 0.1;
        place();
        return;
    }

    buildRound();
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => { entries[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(hero);
    } else {
        start();
    }
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    let resizeTimer = 0;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (Math.abs(hero.clientWidth - W) < 8 && Math.abs(hero.clientHeight - H) < 80) return;
            layout(); resetInk(); buildRound();
        }, 200);
    }).observe(hero);
}

/* ============================================
   CONTADORES ANIMADOS (sección "Números")
   ============================================ */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = (el) => {
        // Leemos el target actual (que puede haber sido actualizado por Firebase)
        const target = parseFloat(el.dataset.target) || 0;

        // Si ya está en el target, no re-animamos
        if (parseInt(el.textContent) === target && target !== 0) return;

        if (reduceMotion) {
            el.textContent = target;
            return;
        }

        const DURATION = 1500;
        const start = performance.now();
        const startValue = parseInt(el.textContent) || 0; // Empieza desde donde estaba

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const tick = (now) => {
            const progress = Math.min((now - start) / DURATION, 1);
            const value = Math.round(startValue + (easeOutCubic(progress) * (target - startValue)));
            el.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = target;
            }
        };

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animate(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach((c) => observer.observe(c));

    // Exponer una función global para actualizar manualmente desde Firebase
    window.updateCounters = () => {
        counters.forEach(c => animate(c));
    };
}