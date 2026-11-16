const search = document.querySelector('#search');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.deck')];
let activeFilter = 'all';
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function updateCollection() {
  const term = normalize(search.value.trim());
  let visible = 0;
  cards.forEach(card => {
    const matches = (activeFilter === 'all' || card.dataset.category === activeFilter) && normalize(card.dataset.search + card.textContent).includes(term);
    card.hidden = !matches;
    if (matches) visible++;
  });
  document.querySelector('#result-count').textContent = `(${String(visible).padStart(2,'0')})`;
  document.querySelector('#empty').hidden = visible !== 0;
}
search.addEventListener('input', updateCollection);
filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  updateCollection();
}));
