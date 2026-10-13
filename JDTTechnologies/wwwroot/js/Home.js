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