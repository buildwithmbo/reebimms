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
