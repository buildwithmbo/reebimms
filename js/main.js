// Flag JS availability so CSS can opt into enhancement (progressive
// enhancement: without this class, .reveal content is fully visible).
document.documentElement.classList.add('js');

const revealTargets = document.querySelectorAll('.reveal');

if (revealTargets.length > 0) {
  const onIntersect = (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  };

  const observer = new IntersectionObserver(onIntersect, {
    threshold: 0.15,
  });

  for (const target of revealTargets) {
    observer.observe(target);
  }
}

// Sticky nav: hidden while the hero is in view, revealed once it
// scrolls past (see .site-header rules in main.css).
const siteHeader = document.querySelector('.site-header');
const hero = document.querySelector('.hero');

if (siteHeader && hero) {
  const onHeroIntersect = (entries) => {
    const heroVisible = entries[0].isIntersecting;
    siteHeader.classList.toggle('is-visible', !heroVisible);
  };

  new IntersectionObserver(onHeroIntersect, { threshold: 0 }).observe(hero);
}

// Mobile burger menu: aria-expanded on the toggle is the one source of
// truth — CSS reads it directly (see .site-header__toggle in main.css),
// so this only ever flips that attribute, never a separate class.
const navToggle = document.querySelector('.site-header__toggle');
const navPanel = document.querySelector('.site-header__panel');

if (navToggle && navPanel) {
  const closeNav = () => navToggle.setAttribute('aria-expanded', 'false');

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  navPanel.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeNav();
    navToggle.focus();
  });

  document.addEventListener('click', (event) => {
    const clickedInside = navToggle.contains(event.target) || navPanel.contains(event.target);
    if (!clickedInside) closeNav();
  });
}

// Before/after comparison sliders: drag, touch, or arrow keys move the
// divider. Falls back to the CSS default (50/50 split) without JS.
//
// The divider/handle's on-screen position is clamped a little inside the
// true 0-100% range so the 36px handle never sits close enough to the
// container's overflow: hidden edge to get clipped and become
// ungrabbable (client-reported: swipe fully to one side, then can't grab
// it again). The underlying image reveal (clip-path) still runs the full
// true 0-100% — at a true 0/100% split there's no seam to line the
// divider up with anyway, so decoupling the two costs nothing visually.
const initBeforeAfter = (container) => {
  const divider = container.querySelector('[data-before-after-divider]');
  const handle = container.querySelector('.before-after__handle');
  const afterImage = container.querySelector('.before-after__image--after');
  if (!divider || !handle || !afterImage) return;

  const setSliderPosition = (percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    afterImage.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    divider.setAttribute('aria-valuenow', String(Math.round(clamped)));

    const edgeSafeMargin = (handle.offsetWidth / 2 / container.clientWidth) * 100;
    const visualPercent = Math.min(100 - edgeSafeMargin, Math.max(edgeSafeMargin, clamped));
    divider.style.insetInlineStart = `${visualPercent}%`;
  };

  const moveToClientX = (clientX) => {
    const rect = container.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(percent);
  };

  divider.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    divider.setPointerCapture(event.pointerId);
  });

  divider.addEventListener('pointermove', (event) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    moveToClientX(event.clientX);
  });

  const stopDragging = (event) => {
    if (divider.hasPointerCapture(event.pointerId)) divider.releasePointerCapture(event.pointerId);
  };

  divider.addEventListener('pointerup', stopDragging);
  divider.addEventListener('pointercancel', stopDragging);

  divider.addEventListener('keydown', (event) => {
    const current = Number(divider.getAttribute('aria-valuenow'));
    if (event.key === 'ArrowLeft') {
      setSliderPosition(current - 5);
    } else if (event.key === 'ArrowRight') {
      setSliderPosition(current + 5);
    } else {
      return;
    }
    event.preventDefault();
  });
};

for (const container of document.querySelectorAll('[data-before-after]')) {
  initBeforeAfter(container);
}

// Booking form: no submission handler exists yet (see DESIGN.md,
// Booking section). Validate client-side and point Gloria at the two
// working contact methods instead of pretending this succeeded.
const bookingForm = document.querySelector('[data-booking-form]');

if (bookingForm) {
  const statusMessage = bookingForm.querySelector('[data-booking-status]');

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }
    statusMessage.textContent =
      "Online booking isn't live yet — call 07709 876567 or use WhatsApp/SMS on the right and we'll sort your booking directly.";
    statusMessage.hidden = false;
  });
}
