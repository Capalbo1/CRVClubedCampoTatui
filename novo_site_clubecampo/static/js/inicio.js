document.addEventListener('DOMContentLoaded', () => {
  /* ===== Carousel genérico (.carousel) ===== */
  document.querySelectorAll('.carousel').forEach((car) => {
    const track = car.querySelector('.carousel__track');
    const slides = Array.from(track?.querySelectorAll('.carousel__slide') || []);
    const prev = car.querySelector('.carousel__btn.prev');
    const next = car.querySelector('.carousel__btn.next');
    const dotsWrap = car.querySelector('.carousel__dots');

    // NOVO: se não tiver data-autoplay, usamos 5000ms como padrão
    const autoplayAttr = car.getAttribute('data-autoplay');
    const intervalMs = autoplayAttr ? parseInt(autoplayAttr, 10) : 5000;

    if (!track || slides.length === 0) return;

    let index = 0;
    let timer = null;
    const slideW = () => slides[0].getBoundingClientRect().width;

    // Dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    const updateDots = () => {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('.carousel__dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
      });
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * slideW()}px)`;
      updateDots();
    };

    const nextSlide = () => goTo(index + 1);
    const prevSlide = () => goTo(index - 1);

    next?.addEventListener('click', nextSlide);
    prev?.addEventListener('click', prevSlide);

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => goTo(index));
    });

    // Autoplay
    const start = () => {
      if (intervalMs > 0) {
        stop();
        timer = setInterval(nextSlide, intervalMs);
      }
    };
    const stop = () => timer && (clearInterval(timer), (timer = null));
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);
    start();
  });

  /* ===== Marquee de destaques (compat legado .features-marquee) ===== */
  document.querySelectorAll('.features-marquee').forEach((wrap) => {
    const track = wrap.querySelector('.features-marquee__track');
    if (!track) return;

    const items = Array.from(track.children);
    if (items.length === 0) return;

    // Duplicar uma vez para rolagem contínua
    if (!wrap.dataset._cloned) {
      items.forEach((i) => track.appendChild(i.cloneNode(true)));
      wrap.dataset._cloned = '1';
    }

    const speed = parseFloat(wrap.dataset.speed || '6.0'); // s por item
    const duration = Math.max(30, Math.round(items.length * speed));
    // Só define se não existir já um --featDuration vindo do CSS/inline
    const existing = getComputedStyle(track).getPropertyValue('--featDuration').trim();
    if (!existing) track.style.setProperty('--featDuration', `${duration}s`);

    wrap.addEventListener('mouseenter', () => (track.style.animationPlayState = 'paused'));
    wrap.addEventListener('mouseleave', () => (track.style.animationPlayState = 'running'));
  });

  /* ===== NOVO: Marquee de destaques (.features-carousel / .features-track) ===== */
  document.querySelectorAll('.features-carousel').forEach((wrap) => {
    const track = wrap.querySelector('.features-track');
    if (!track) return;

    const items = Array.from(track.children);
    if (items.length === 0) return;

    // Duplicar uma vez para rolagem contínua (evita saltos)
    if (!wrap.dataset._cloned) {
      items.forEach((i) => track.appendChild(i.cloneNode(true)));
      wrap.dataset._cloned = '1';
    }

    // Respeita velocidade já definida (inline/CSS). Se não tiver, usa data-duration ou 40s.
    const existing = getComputedStyle(track).getPropertyValue('--featDuration').trim();
    if (!existing) {
      const dur = (wrap.dataset.duration || '40s').toString();
      track.style.setProperty('--featDuration', dur);
    }

    wrap.addEventListener('mouseenter', () => (track.style.animationPlayState = 'paused'));
    wrap.addEventListener('mouseleave', () => (track.style.animationPlayState = 'running'));
  });

  /* ===== Máscara de telefone (DDD + 8/9 dígitos) ===== */
  const phoneInput = document.querySelector('#contato form.contact-form input[name="telefone"]');
  if (phoneInput) {
    const formatPhone = (val) => {
      const d = val.replace(/\D/g, '').slice(0, 11);
      if (!d) return '';
      if (d.length <= 2) return `(${d}`;
      const ddd = d.slice(0, 2);
      const rest = d.slice(2);
      if (rest.length >= 9) {
        const p1 = rest.slice(0, 5);
        const p2 = rest.slice(5, 9);
        return `(${ddd}) ${p1}-${p2}`;
      }
      if (rest.length >= 8) {
        const p1 = rest.slice(0, 4);
        const p2 = rest.slice(4, 8);
        return `(${ddd}) ${p1}-${p2}`;
      }
      if (rest.length > 5) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
      if (rest.length > 4) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
      return `(${ddd}) ${rest}`;
    };
    const applyMask = (e) => {
      e.target.value = formatPhone(e.target.value);
      try {
        e.target.setSelectionRange(e.target.value.length, e.target.value.length);
      } catch {}
    };
    phoneInput.addEventListener('input', applyMask);
    phoneInput.addEventListener('blur', applyMask);
    phoneInput.addEventListener('paste', () => setTimeout(applyMask, 0));
  }

  /* ===== Envio AJAX + Toast popup (sem reload) ===== */
  const contatoForm = document.querySelector('#contato form.contact-form');

  const showToast = (msg, type = 'success') => {
    const old = document.querySelector('.toast-pop');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = `toast-pop ${type}`;
    el.innerHTML = `
      <div class="toast-pop__inner">
        <span class="toast-pop__msg">${msg}</span>
        <button class="toast-pop__close" aria-label="Fechar">&times;</button>
      </div>
    `;
    document.body.appendChild(el);

    const close = () => {
      el.classList.add('is-hide');
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector('.toast-pop__close').addEventListener('click', close);
    setTimeout(close, 4500);
  };

  const getCSRF = (form) => {
    const input = form.querySelector('input[name="csrfmiddlewaretoken"]');
    if (input) return input.value;
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : '';
  };

  if (contatoForm) {
    contatoForm.addEventListener('submit', async (e) => {
      if (!contatoForm.checkValidity()) return; // deixa HTML5 validar primeiro
      e.preventDefault();

      const url = contatoForm.getAttribute('action');
      const data = new URLSearchParams(new FormData(contatoForm));
      const btn = contatoForm.querySelector('button[type="submit"]');
      btn?.setAttribute('disabled', 'disabled');

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRF(contatoForm),
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: data.toString(),
        });

        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.ok) {
          showToast(json.message || 'Mensagem enviada com sucesso!', 'success');
          contatoForm.reset();
        } else {
          const msg =
            (json && (json.message || (json.errors && 'Há campos inválidos.'))) ||
            'Não foi possível enviar. Tente novamente.';
          showToast(msg, 'error');
        }
      } catch {
        showToast('Falha de conexão. Tente novamente.', 'error');
      } finally {
        btn?.removeAttribute('disabled');
      }
    });
  }
});
