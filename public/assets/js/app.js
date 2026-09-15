const $=s=>document.querySelector(s);const money=v=>new Intl.NumberFormat('pt-AO',{style:'currency',currency:'AOA',maximumFractionDigits:0}).format(v).replace('AOA','Kz');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const img=p=>p||'assets/images/logo.jpeg';
async function loadSite(){
 try{
  const d=await fetch('/api/site').then(r=>r.json()); const s=d.settings||{};
  $('#heroTitle').textContent=s.hero_title||'O sabor que dá vontade de voltar';$('#heroText').textContent=s.hero_text||'';
  $('#aboutText').textContent=s.about_text||'';$('#address').textContent=s.address||'';$('#phone').textContent=s.phone||'';$('#hours').textContent=s.hours||'';$('#maps').href=s.maps_url||'#';$('#reviewCount').textContent=(s.review_count||6)+' avaliações';
  const cats=d.categories||[]; $('#filters').innerHTML='<button class="filter active" data-cat="all">Todos</button>'+cats.map(c=>`<button class="filter" data-cat="${c.id}">${esc(c.name)}</button>`).join('');
  renderProducts(d.products||[]);renderGallery(d.gallery||[]);renderReviews(d.reviews||[]);
  document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.product').forEach(p=>p.style.display=b.dataset.cat==='all'||p.dataset.cat===p.dataset.category?'block':'none')});
 }catch(e){$('#products').innerHTML='<div class="empty">Não foi possível carregar o menu.</div>'}
}
function renderProducts(ps){$('#products').innerHTML=ps.length?ps.map(p=>`<article class="product" data-category="${p.category_id||''}"><div class="product-img">${p.image?`<img src="${esc(img(p.image))}" alt="${esc(p.name)}">`:'<div class="empty">Sem imagem</div>'}</div><div class="product-body"><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><span class="price">A partir de ${money(p.price)}</span></div></article>`).join(''):'<div class="empty">Nenhum produto disponível.</div>'}
function renderGallery(gs){$('#gallery').innerHTML=gs.length?gs.map(g=>`<figure><img src="${esc(g.image)}" alt="${esc(g.caption)}"></figure>`).join(''):'<div class="empty">Galeria vazia.</div>'}
function renderReviews(rs){$('#reviews').innerHTML=rs.length?rs.map(r=>`<article class="review"><div class="stars">${'★'.repeat(Number(r.rating))}${'☆'.repeat(5-Number(r.rating))}</div><h3>${esc(r.name)}</h3><p>“${esc(r.comment)}”</p></article>`).join(''):'<div class="empty">Ainda não há avaliações.</div>'}
document.addEventListener('DOMContentLoaded',()=>{loadSite();$('#year').textContent=new Date().getFullYear();const t=$('.menu-toggle'),n=$('.main-nav');t.onclick=()=>{n.classList.toggle('open');t.textContent=n.classList.contains('open')?'✕':'☰'}});
