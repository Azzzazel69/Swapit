import React, { useEffect } from 'react';

function createConfettiElements(count = 60) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'dev-confetti';
    const size = 6 + Math.floor(Math.random() * 8);
    el.style.width = `${size}px`;
    el.style.height = `${size * 0.6}px`;
    el.style.position = 'fixed';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = `${-10 - Math.random() * 20}vh`;
    el.style.opacity = '0.95';
    el.style.transform = `rotate(${Math.random() * 360}deg) translateZ(0)`;
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.background = `hsl(${Math.floor(Math.random() * 360)} 80% 60%)`;
    el.style.transition = `transform 2.4s linear, top 2.4s linear, opacity 0.6s ease`;
    frag.appendChild(el);
  }
  return frag;
}

export default function Confetti({ show = false }: { show?: boolean }) {
  useEffect(() => {
    if (!show) return;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.zIndex = '9998';
    wrapper.style.pointerEvents = 'none';
    document.body.appendChild(wrapper);

    const frag = createConfettiElements();
    wrapper.appendChild(frag);

    // animate: move confetti down
    const children = Array.from(wrapper.querySelectorAll('.dev-confetti')) as HTMLElement[];
    children.forEach((el, i) => {
      setTimeout(() => {
        el.style.top = `${60 + Math.random() * 40}vh`;
        el.style.transform = `translateY(0px) rotate(${Math.random() * 720}deg) translateZ(0)`;
      }, i * 10);
    });

    const cleanupTimer = setTimeout(() => {
      try { wrapper.remove(); } catch(_) {}
    }, 2600);

    return () => {
      clearTimeout(cleanupTimer);
      try { wrapper.remove(); } catch(_) {}
    };
  }, [show]);

  return null;
}