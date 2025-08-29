(() => {
  const page = document.querySelector('.page-institucional');
  if (!page) return;

  /* ================================
   * Config (compatível com o CSS enviado)
   * ================================ */
  const DUR_EXPAND_MS = 450;   // == --dur-expand: 0.45s
  const DUR_COLLAPSE_MS = 420; // == --dur-collapse: 0.42s
  const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const prefersReduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

  /* ================================
   * Helpers
   * ================================ */
  const sectionOf = (el) => el.closest('.section') || el;
  const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;
  const bottomOf = (el) => el.getBoundingClientRect().bottom + window.scrollY;
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  const smoothScrollTo = (y) => {
    if (prefersReduced) {
      window.scrollTo(0, Math.max(0, y));
    } else {
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const scrollToBottomOf = (el, padding = 28) => {
    const y = bottomOf(el) - window.innerHeight + padding;
    if (y > window.scrollY) smoothScrollTo(y);
  };

  // Transição suave de altura para um container (sem depender do CSS)
  const transitionHeight = async (el, toHeightPx, duration) => {
    if (prefersReduced) {
      el.style.maxHeight = '';
      el.style.overflow = '';
      return;
    }
    const startH = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.maxHeight = `${startH}px`;
    // força reflow
    // eslint-disable-next-line no-unused-expressions
    el.offsetHeight;
    el.style.transition = `max-height ${duration}ms ${EASE}`;
    requestAnimationFrame(() => (el.style.maxHeight = `${toHeightPx}px`));

    await new Promise((resolve) => {
      const end = () => {
        el.removeEventListener('transitionend', end);
        resolve();
      };
      setTimeout(end, duration + 60); // fallback
      el.addEventListener('transitionend', end);
    });

    el.style.transition = '';
    el.style.maxHeight = '';
    el.style.overflow = '';
  };

  /* ================================
   * Clamp de listas (Diretoria/Deliberativo)
   * ================================ */
  const clampList = (listEl, limit = 8) => {
    const items = [...listEl.querySelectorAll('.card-person')];
    const btn = page.querySelector(`.btn-reveal[data-reveal="#${listEl.id}"]`);

    // limpa estados anteriores
    items.forEach((li) => {
      li.classList.remove('is-hidden', 'fade-in');
      li.style.removeProperty('animationDelay');
      li.style.removeProperty('animationDuration');
    });

    if (items.length > limit) {
      items.forEach((li, i) => {
        if (i >= limit) li.classList.add('is-hidden');
      });
      if (btn) {
        btn.classList.remove('is-hidden');
        btn.textContent = 'Ver todos';
        btn.dataset.state = 'closed';
        btn.setAttribute('aria-expanded', 'false');
      }
    } else if (btn) {
      btn.classList.add('is-hidden');
    }
  };

  // Inicialização das listas
  const listaDiretoria = page.querySelector('#lista-diretoria');
  if (listaDiretoria) clampList(listaDiretoria, 8);
  const listaDeliberativo = page.querySelector('#lista-deliberativo');
  if (listaDeliberativo) clampList(listaDeliberativo, 8);

  /* ================================
   * "Ver todos" / "Ver menos" (mesma fluidez do Presidente)
   * ================================ */
  page.querySelectorAll('.btn-reveal[data-reveal]').forEach((btn) => {
    const sel = btn.getAttribute('data-reveal');
    const list = page.querySelector(sel);
    if (!list) return;

    btn.addEventListener('click', async () => {
      const state = btn.dataset.state || 'closed';
      const section = sectionOf(list);

      if (state === 'closed') {
        // EXPANDIR: mede altura atual, revela itens e anima até a nova altura
        const currentH = list.offsetHeight;

        const hidden = [...list.querySelectorAll('.card-person.is-hidden')];
        let k = 0;
        hidden.forEach((li) => {
          li.classList.remove('is-hidden');
          // fade-in sutil (compatível com o CSS)
          li.classList.add('fade-in');
          if (!prefersReduced) {
            li.style.animationDelay = `${k * 0.03}s`;
            li.style.animationDuration = '0.32s';
          }
          li.addEventListener('animationend', () => li.classList.remove('fade-in'), {
            once: true,
          });
          k++;
        });

        await nextFrame(); // layout recalcula
        const targetH = list.scrollHeight;

        // volta à altura antiga antes de animar (para não pular)
        list.style.maxHeight = `${currentH}px`;
        await transitionHeight(list, targetH, DUR_EXPAND_MS);

        btn.textContent = 'Ver menos';
        btn.dataset.state = 'open';
        btn.setAttribute('aria-expanded', 'true');

        // rola suavemente para o fim da seção
        scrollToBottomOf(section, 28);
      } else {
        // COLAPSAR: anima de altura atual até a altura pós-clamp (8 itens)
        const currentH = list.offsetHeight;

        // aplica clamp (esconde excedentes) mas segura a animação de altura
        const items = [...list.querySelectorAll('.card-person')];
        items.forEach((li, i) => {
          if (i >= 8) li.classList.add('is-hidden');
        });

        await nextFrame(); // layout com itens ocultos
        const targetH = list.scrollHeight;

        // define ponto de partida e anima para baixo
        list.style.maxHeight = `${currentH}px`;
        await transitionHeight(list, targetH, DUR_COLLAPSE_MS);

        // finaliza estados do botão
        btn.textContent = 'Ver todos';
        btn.dataset.state = 'closed';
        btn.setAttribute('aria-expanded', 'false');

        // garante o estado consistente com o clamp oficial (limpa delays, etc.)
        clampList(list, 8);

        // rola suavemente de volta ao topo da seção
        smoothScrollTo(topOf(section) - 8);
      }
    });
  });

  /* ================================
   * Palavra do Presidente — já OK
   * (mantém exatamente como estava)
   * ================================ */
  const btnToggle = page.querySelector('#btn-ler-mais');
  const box = page.querySelector('#presidente-texto');

  if (btnToggle && box) {
    // assegura que não há estilos inline antigos
    box.style.removeProperty('max-height');
    box.style.removeProperty('transition');
    // estado inicial
    box.classList.add('is-collapsed');

    const updateLabel = () => {
      const expanded = !box.classList.contains('is-collapsed');
      btnToggle.textContent = expanded ? 'Ver menos' : 'Ver tudo';
      btnToggle.setAttribute('aria-expanded', String(expanded));
      box.setAttribute('aria-expanded', String(expanded));
    };
    updateLabel();

    btnToggle.addEventListener('click', async () => {
      const willExpand = box.classList.contains('is-collapsed');
      const section = sectionOf(box);

      // alterna classe (CSS cuida da transição de max-height)
      box.classList.toggle('is-collapsed');
      updateLabel();

      // sincroniza o scroll com a duração
      if (willExpand) {
        await nextFrame();
        scrollToBottomOf(section, 28);
      } else {
        smoothScrollTo(topOf(section) - 8);
      }

      // foco de volta no botão
      if (!prefersReduced) setTimeout(() => btnToggle.focus(), willExpand ? DUR_EXPAND_MS : DUR_COLLAPSE_MS);
      else btnToggle.focus();
    });
  }
})();
