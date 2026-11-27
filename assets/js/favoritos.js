'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('grid-favoritos') || document.querySelector('[data-lista-favoritos]');
  const contadorEl = document.getElementById('contador-favoritos');
  if (!contenedor) return;

  const esc = (txt) => String(txt ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  const moneda = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));

  async function cargarFavoritos() {
    try {
      const res = await window.jzFavoritos.listar();
      const lista = res.favoritos || [];
      if (contadorEl) contadorEl.textContent = String(lista.length);

      if (lista.length === 0) {
        contenedor.innerHTML = `
          <div class="estado-vacio">
            <p>Aún no tienes artículos guardados en tus favoritos.</p>
            <a href="catalogo.php" class="btn-primario">Explorar catálogo UADY</a>
          </div>`;
        return;
      }

      contenedor.innerHTML = lista.map((p) => `
        <article class="tarjeta-producto" data-id="${p.id}">
          <img src="${esc(p.imagen)}" alt="${esc(p.titulo)}" class="tarjeta-producto__img">
          <div class="tarjeta-producto__cuerpo">
            <span class="badge-categoria">${esc(p.categoriaNombre)} · ${p.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo'}</span>
            <h3><a href="detalle-producto.php?id=${p.id}">${esc(p.titulo)}</a></h3>
            <p class="precio">${moneda(p.precio)}</p>
            <p class="meta">Entrega: ${esc(p.entregaTexto)}</p>
            <p class="meta">Vendedor: ${esc(p.vendedorNombre)} (★ ${Number(p.vendedorPromedio || 0).toFixed(1)})</p>
            <div class="acciones-tarjeta">
              <a href="detalle-producto.php?id=${p.id}" class="btn-primario">Ver artículo</a>
              <button type="button" class="btn-secundario btn-quitar-fav" data-id="${p.id}">Quitar</button>
            </div>
          </div>
        </article>
      `).join('');
    } catch (err) {
      contenedor.innerHTML = `<p class="alerta-error">${esc(err.message || 'Error al cargar favoritos.')}</p>`;
    }
  }

  contenedor.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-quitar-fav');
    if (!btn) return;
    btn.disabled = true;
    try {
      await window.jzFavoritos.toggle(Number(btn.dataset.id));
      await cargarFavoritos();
    } catch (err) {
      alert(err.message || 'No se pudo actualizar favoritos.');
      btn.disabled = false;
    }
  });

  await cargarFavoritos();
});
