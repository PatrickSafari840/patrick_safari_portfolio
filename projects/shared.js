/* Shared behaviour for certificate project pages: header/footer, language, light/dark, motion helpers, 3D scenes. */
(function () {
    var PROJECTS = [
        { id: 'gpm', file: 'project-management.html', en: 'Project Management', fr: 'Gestion de projet', cert: 'Google Project Management' },
        { id: 'gcs', file: 'cybersecurity.html', en: 'Cybersecurity', fr: 'Cybersécurité', cert: 'Google Cybersecurity' },
        { id: 'ibm', file: 'full-stack.html', en: 'Full Stack Development', fr: 'Développement Full Stack', cert: 'IBM Full Stack Developer' },
        { id: 'gux', file: 'ux-design.html', en: 'UX Design', fr: 'Design UX', cert: 'Google UX Design' },
        { id: 'gitp', file: 'it-automation.html', en: 'IT Automation with Python', fr: 'Automatisation IT avec Python', cert: 'Google IT Automation with Python' },
        { id: 'gits', file: 'it-support.html', en: 'IT Support', fr: 'Support informatique', cert: 'Google IT Support' },
        { id: 'gda-gbi', file: 'data-analytics.html', en: 'Data Analytics & BI', fr: 'Analyse de données & BI', cert: 'Google Advanced Data Analytics + Business Intelligence' }
    ];

    var root = document.documentElement;
    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var langListeners = [], modeListeners = [];

    var PS = window.PS = {
        projects: PROJECTS,
        reduceMotion: reduceMotion,
        lang: 'fr',
        t: function (en, fr) { return PS.lang === 'fr' ? fr : en; },
        onLang: function (fn) { langListeners.push(fn); },
        onMode: function (fn) { modeListeners.push(fn); },
        css: function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); },
        $: function (sel, el) { return (el || document).querySelector(sel); },
        $$: function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); },
        esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
        fmt: function (n, d) { return Number(n).toLocaleString(PS.lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
    };

    /* ---------- Header and footer ---------- */
    function buildChrome() {
        var id = document.body.getAttribute('data-project');
        var idx = PROJECTS.findIndex(function (p) { return p.id === id; });
        var header = document.createElement('header');
        header.className = 'ps-header';
        var options = PROJECTS.map(function (p) {
            return '<option value="' + p.file + '"' + (p.id === id ? ' selected' : '') + '>' + PS.esc(p.cert) + '</option>';
        }).join('');
        header.innerHTML =
            '<div class="wrap">' +
            '<a class="ps-back" href="../index.html#projects">&larr; <span><span lang="en">Portfolio</span><span lang="fr">Portfolio</span></span></a>' +
            '<div class="ps-tools">' +
            '<label class="sr-only" for="ps-jump" style="position:absolute;left:-9999px">Projects</label>' +
            '<select class="ps-select" id="ps-jump" aria-label="Projects">' + options + '</select>' +
            '<div class="ps-lang" role="group" aria-label="Language"><button type="button" data-lang-btn="en">EN</button><button type="button" data-lang-btn="fr">FR</button></div>' +
            '<button type="button" class="ps-mode" id="ps-mode" aria-label="Light or dark mode">◐</button>' +
            '</div></div>';
        document.body.insertBefore(header, document.body.firstChild);
        PS.$('#ps-jump').addEventListener('change', function (e) { location.href = e.target.value; });

        if (idx >= 0) {
            var prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
            var next = PROJECTS[(idx + 1) % PROJECTS.length];
            var foot = document.createElement('footer');
            foot.className = 'ps-foot';
            foot.innerHTML = '<div class="wrap">' +
                '<a href="' + prev.file + '"><small>&larr; <span lang="en">Previous</span><span lang="fr">Précédent</span></small><strong><span lang="en">' + prev.en + '</span><span lang="fr">' + prev.fr + '</span></strong></a>' +
                '<a href="' + next.file + '" style="text-align:right"><small><span lang="en">Next</span><span lang="fr">Suivant</span> &rarr;</small><strong><span lang="en">' + next.en + '</span><span lang="fr">' + next.fr + '</span></strong></a>' +
                '</div>';
            document.body.appendChild(foot);
        }
    }

    /* ---------- Language ---------- */
    function setLang(lang) {
        PS.lang = lang;
        root.setAttribute('data-lang', lang);
        root.setAttribute('lang', lang);
        PS.$$('[data-lang-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang-btn') === lang ? 'true' : 'false'); });
        PS.$$('[data-ph-en]').forEach(function (el) { el.placeholder = el.getAttribute(lang === 'fr' ? 'data-ph-fr' : 'data-ph-en'); });
        store.set('lang', lang);
        langListeners.forEach(function (fn) { try { fn(lang); } catch (e) { console.error(e); } });
    }

    /* ---------- Light / dark (shares the portfolio's saved choice) ---------- */
    function setMode(mode) {
        root.setAttribute('data-mode', mode);
        var btn = PS.$('#ps-mode');
        if (btn) btn.textContent = mode === 'dark' ? '☀' : '☾';
        modeListeners.forEach(function (fn) { try { fn(mode); } catch (e) { console.error(e); } });
    }

    /* ---------- Motion helpers ---------- */
    function initReveal() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        PS.$$('.reveal').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight) return; // already on screen: leave as is
            io.observe(el);
        });
    }
    function initTilt() {
        if (reduceMotion) return;
        PS.$$('[data-tilt]').forEach(function (el) {
            var max = parseFloat(el.getAttribute('data-tilt')) || 8;
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = 'perspective(900px) rotateY(' + (x * max) + 'deg) rotateX(' + (-y * max) + 'deg)';
            });
            el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        });
    }

    /* ---------- Code tabs ---------- */
    function initCodeTabs() {
        PS.$$('.codebox').forEach(function (box) {
            var btns = PS.$$('.bar button', box), pres = PS.$$('pre', box);
            btns.forEach(function (b, i) {
                b.setAttribute('role', 'tab');
                b.addEventListener('click', function () {
                    btns.forEach(function (x, j) { x.setAttribute('aria-selected', i === j ? 'true' : 'false'); pres[j].hidden = i !== j; });
                });
            });
            if (btns[0]) btns[0].click();
        });
    }

    /* ---------- 3D scene helper (three.js r128) ----------
       PS.scene(container, function setup(ctx) { ...; return function update(t, dt) {} })
       ctx = { THREE, scene, camera, renderer, color(cssVar), pointer } */
    PS.scene = function (container, setup) {
        if (!container) return;
        if (!window.THREE) { container.classList.add('no-3d'); return; }
        var THREE = window.THREE;
        var renderer;
        try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
        catch (e) { container.classList.add('no-3d'); return; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.insertBefore(renderer.domElement, container.firstChild);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
        var pointer = { x: 0, y: 0 };
        var ctx = {
            THREE: THREE, scene: scene, camera: camera, renderer: renderer, pointer: pointer,
            color: function (v) { return new THREE.Color(PS.css(v) || '#888888'); }
        };
        var update = setup(ctx) || function () {};
        function size() {
            var w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h; camera.updateProjectionMatrix();
        }
        size();
        if ('ResizeObserver' in window) new ResizeObserver(size).observe(container); else window.addEventListener('resize', size);
        container.addEventListener('pointermove', function (e) {
            var r = container.getBoundingClientRect();
            pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
            pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        });
        container.addEventListener('pointerleave', function () { pointer.x = 0; pointer.y = 0; });
        var visible = true, last = performance.now(), t = 0;
        if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(container);
        function frame(now) {
            var dt = Math.min(0.05, (now - last) / 1000); last = now;
            if (visible && !document.hidden) { t += dt; update(t, dt); renderer.render(scene, camera); }
            requestAnimationFrame(frame);
        }
        if (reduceMotion) { update(1.2, 0); renderer.render(scene, camera); PS.onMode(function () { setTimeout(function () { update(1.2, 0); renderer.render(scene, camera); }, 30); }); }
        else requestAnimationFrame(frame);
        return ctx;
    };

    /* ---------- Boot ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        buildChrome();
        var savedLang = store.get('lang');
        setLang(savedLang || ((navigator.language || '').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en'));
        PS.$$('[data-lang-btn]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-btn')); }); });

        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var attr = root.getAttribute('data-theme');
        setMode(store.get('theme') || attr || (prefersDark ? 'dark' : 'light'));
        PS.$('#ps-mode').addEventListener('click', function () {
            var m = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
            store.set('theme', m); setMode(m);
        });

        initCodeTabs();
        initReveal();
        initTilt();
        if (typeof window.pageInit === 'function') window.pageInit();
        setLang(PS.lang); // let page listeners render in the active language
        setMode(root.getAttribute('data-mode'));
    });
})();
