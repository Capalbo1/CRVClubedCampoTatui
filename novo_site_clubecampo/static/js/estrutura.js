/* ==========================================================================
   ESTRUTURA — JavaScript local
   - Carrossel (mesma API/markup da Home)
   - Card "Horários & normas" (busca acento-insensível + chips)
   - Zero inline JS
   ========================================================================== */

(() => {
  'use strict';

  // =========================================================
  // Utils
  // =========================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Remove acentos/diacríticos e baixa caixa para busca robusta
  const normalize = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================
  // Carrossel (compatível com markup da Home)
  // =========================================================
  class Carousel {
    constructor(root) {
      this.root = root;
      this.track = $('.carousel__track', root);
      this.slides = $$('.carousel__slide', this.track);
      this.prev = $('.carousel__btn.prev', root);
      this.next = $('.carousel__btn.next', root);
      this.dotsWrap = $('.carousel__dots', root);
      this.index = 0;
      this.timer = null;
      this.autoplayMs = parseInt(root.dataset.autoplay || '0', 10) || 0;

      this.#buildDots();
      this.#bind();
      this.#update();
      this.#maybeAutoplay();
    }

    #buildDots() {
      if (!this.dotsWrap) return;
      this.dots = this.slides.map((_, i) => {
        const d = document.createElement('button');
        d.className = 'carousel__dot';
        d.type = 'button';
        d.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
        d.addEventListener('click', () => this.go(i));
        this.dotsWrap.appendChild(d);
        return d;
      });
    }

    #bind() {
      this.prev?.addEventListener('click', () => this.prevSlide());
      this.next?.addEventListener('click', () => this.nextSlide());

      // Pause/resume on hover
      this.root.addEventListener('mouseenter', () => this.stop());
      this.root.addEventListener('mouseleave', () => this.#maybeAutoplay());

      // Keyboard
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.prevSlide();
        else if (e.key === 'ArrowRight') this.nextSlide();
      }, true);

      // Resize safety
      window.addEventListener('resize', () => this.#update());
    }

    #translate() {
      const x = -this.index * 100;
      this.track.style.transform = `translateX(${x}%)`;
    }

    #update() {
      this.index = Math.max(0, Math.min(this.index, this.slides.length - 1));
      this.#translate();
      if (this.dots) {
        this.dots.forEach((d, i) => d.classList.toggle('is-active', i === this.index));
      }
    }

    go(i) { this.index = i; this.#update(); }
    nextSlide() { this.go((this.index + 1) % this.slides.length); }
    prevSlide() { this.go((this.index - 1 + this.slides.length) % this.slides.length); }

    #maybeAutoplay() {
      if (prefersReducedMotion) return;
      // autoplay automático se 3+ slides OU data-autoplay foi definido
      const should = (this.slides.length >= 3) || this.autoplayMs > 0;
      const ms = this.autoplayMs || 5000;
      if (!should) return;
      this.stop();
      this.timer = setInterval(() => this.nextSlide(), ms);
    }
    stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  }

  // Init all carousels in the page (scoped to Estrutura)
  const initCarousels = () => {
    $$('.estrutura-page .carousel').forEach((el) => new Carousel(el));
  };

  // =========================================================
  // Horários & Normas — Busca + Filtros
  // =========================================================
  const scheduleItems = [
    // group: esporte | lazer | bemestar | convivio
    {
      title: 'Deck',
      group: 'convivio',
      time: 'Conforme programação interna.',
      note: 'Espaço para confraternizações e integrações.',
      tags: ['convivio', 'eventos', 'deck']
    },
    {
      title: 'Salão Social',
      group: 'convivio',
      time: 'Conforme programação interna.',
      note: 'Ambiente climatizado e versátil para eventos.',
      tags: ['convivio', 'eventos', 'salão']
    },
    {
      title: 'Academia',
      group: 'esporte',
      time: 'Terça a Sexta: 6h às 22h • Sáb/Dom: 7h às 22h',
      note: 'Equipamentos modernos, ambiente climatizado e orientações no local.',
      tags: ['esporte', 'musculacao', 'bem-estar', 'academia']
    },
    {
      title: 'Área de Lutas',
      group: 'esporte',
      time: 'Aulas/treinos conforme grade esportiva.',
      note: 'Espaço apropriado e instrutores especializados.',
      tags: ['esporte', 'lutas', 'judô', 'karatê', 'muay thai']
    },
    {
      title: 'Balneário (piscina externa)',
      group: 'lazer',
      time: 'Terça a Domingo: 10h às 18h',
      note: 'Piscinas externas; atividades conforme grade de aulas e eventos.',
      tags: ['lazer', 'natação', 'piscina', 'hidroginástica']
    },
    {
      title: 'Piscina Aquecida',
      group: 'bemestar',
      time: 'Consultar grade de aulas e orientações técnicas.',
      note: 'Conforto térmico para natação e hidroginástica.',
      tags: ['bem-estar', 'lazer', 'piscina', 'natação']
    },
    {
      title: 'Campo',
      group: 'esporte',
      time: 'Agenda por evento/competição.',
      note: 'Reservas e informações na secretaria esportiva.',
      tags: ['futebol', 'campo', 'esporte']
    },
    {
      title: 'Campo Society',
      group: 'esporte',
      time: 'Reservas por aplicativo/secretaria.',
      note: 'Aulas/treinos conforme grade esportiva.',
      tags: ['society', 'futebol', 'esporte']
    },
    {
      title: 'Ginásio & Quadras',
      group: 'esporte',
      time: 'Uso conforme grade esportiva.',
      note: 'Estrutura para múltiplas modalidades.',
      tags: ['vôlei', 'basquete', 'tênis', 'poliesportiva', 'esporte']
    },
    {
      title: 'Quiosques',
      group: 'convivio',
      time: 'Reservas mediante disponibilidade.',
      note: 'Espaços para churrasco e encontros.',
      tags: ['convivio', 'churrasco', 'reservas']
    },
    {
      title: 'Pesqueiro',
      group: 'lazer',
      time: 'Consultar regras de pesca recreativa.',
      note: 'Ambiente natural, preservação e segurança.',
      tags: ['lazer', 'pesca']
    },
    {
      title: 'Parque Infantil',
      group: 'lazer',
      time: 'Uso livre acompanhado de responsáveis.',
      note: 'Brinquedos e áreas seguras para crianças.',
      tags: ['lazer', 'infantil', 'família']
    },
    {
      title: 'Sala de Dança',
      group: 'bemestar',
      time: 'Aulas conforme grade.',
      note: 'Espaço com piso adequado e espelhos.',
      tags: ['bem-estar', 'dança', 'aulas']
    },
    {
      title: 'Sauna',
      group: 'bemestar',
      time: 'Uso conforme normas e horários internos.',
      note: 'Ambiente confortável para relaxamento.',
      tags: ['bem-estar', 'relaxamento', 'sauna']
    }
  ];

  const state = {
    q: '',
    group: 'todos'
  };

  const els = {
    list: $('.schedule-list'),
    input: $('#sch-q'),
    chips: $$('.chip.filter')
  };

  const matchItem = (item, qNorm, group) => {
    const matchesGroup = group === 'todos' || item.group === group;
    if (!qNorm) return matchesGroup;
    const hay = normalize(
      [item.title, item.note, item.time, ...(item.tags || [])].join(' ')
    );
    return matchesGroup && hay.includes(qNorm);
  };

  const renderList = () => {
    if (!els.list) return;
    const qNorm = normalize(state.q);
    const group = state.group;
    const items = scheduleItems.filter((it) => matchItem(it, qNorm, group));

    if (!items.length) {
      els.list.innerHTML = `<div class="schedule-empty">Nenhum resultado para sua busca.</div>`;
      return;
    }

    els.list.innerHTML = items.map((it) => {
      const tags = (it.tags || []).map(t => `<span class="schedule-tag">${t}</span>`).join('');
      return `
        <article class="schedule-item">
          <h4>${it.title}</h4>
          <p class="time">${it.time}</p>
          <p class="note">${it.note}</p>
          <div class="schedule-tags">${tags}</div>
        </article>
      `;
    }).join('');
  };

  const bindSchedule = () => {
    if (els.input) {
      els.input.addEventListener('input', (e) => {
        state.q = e.target.value || '';
        renderList();
      });
    }

    els.chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        els.chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        state.group = chip.dataset.filter || 'todos';
        renderList();
      });
    });

    renderList(); // primeira renderização
  };

  // =========================================================
  // Boot
  // =========================================================
  const ready = () => {
    initCarousels();
    bindSchedule();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
