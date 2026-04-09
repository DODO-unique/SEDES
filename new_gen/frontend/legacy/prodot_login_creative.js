const panelLeft = document.querySelector('.panel-left');
const glow = document.getElementById('cursor-glow');

panelLeft.addEventListener('mousemove', (e) => {
  const rect = panelLeft.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  glow.style.left = `${x}px`;
  glow.style.top = `${y}px`;
  glow.style.opacity = '1';
});

panelLeft.addEventListener('mouseleave', () => {
  glow.style.opacity = '0';
});
