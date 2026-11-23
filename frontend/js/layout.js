import { icon, hydrateIcons } from './icons.js';

const pages = [
  ['home', '/', 'Home'],
  ['vehiculos', '/vehiculos.html', 'Vehículos'],
  ['historial', '/historial.html', 'Historial'],
  ['gastos', '/gastos.html', 'Gastos'],
  ['ajustes', '/ajustes.html', 'Ajustes'],
];

export function renderLayout() {
  const currentPage = document.body.dataset.page;
  const brand = `<span class="brand-icon">${icon('car')}</span><span>Auto<span class="brand-accent">Registro</span></span>`;

  document.querySelector('#site-header').innerHTML = `
    <header class="site-header">
      <div class="container nav-container">
        <a class="brand" href="/" aria-label="AutoRegistro · Home">${brand}</a>
        <button class="menu-toggle button button-secondary" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Abrir menú">${icon('menu')}</button>
        <nav id="main-navigation" class="main-navigation" aria-label="Navegación principal">
          <ul>${pages.map(([id, href, label]) => `<li><a href="${href}"${id === currentPage ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
          <a class="button button-primary nav-add" href="/anadir-mantenimiento.html"${currentPage === 'anadir-mantenimiento' ? ' aria-current="page"' : ''}>${icon('plus')}Añadir mantenimiento</a>
        </nav>
      </div>
    </header>`;

  document.querySelector('#site-footer').innerHTML = `
    <footer class="site-footer">
      <div class="container footer-content">
        <div class="footer-identity"><a class="brand footer-brand" href="/" aria-label="AutoRegistro · Home">${brand}</a><p>El cuidado de tu vehículo, sin complicaciones.</p></div>
        <p class="copyright">© ${new Date().getFullYear()} AutoRegistro</p>
      </div>
    </footer>`;

  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-navigation');
  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    navigation.classList.toggle('is-open', isOpen);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-container')) closeMenu();
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', closeMenu);
  hydrateIcons();
}
