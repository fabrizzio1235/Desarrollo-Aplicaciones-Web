'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const listaEl = document.getElementById('lista-favoritos');
  const contadorEl = document.getElementById('favoritos-contador');
  const vacioEl = document.getElementById('favoritos-vacio');
  if (!listaEl) return;

  const esc = (txt) => String(txt ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  const moneda = (n) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number(n || 0));

  const resolverRutaImagen = (ruta) => {
    const limpia = String(ruta || '').trim();
    if (!limpia) return '../assets/images/image-placeholder.jpg';
    if (limpia.startsWith('../') || limpia.startsWith('http')) return limpia;
    return `../${limpia.replace(/^\/+/, '')}`;
  };

  async function cargarFavoritos() {
    if (!window.jzFavoritos) {
      listaEl.innerHTML = '<p class="feedback-msg">Error: servicio de favoritos no disponible.</p>';
      return;
    }

    try {
      const res = await window.jzFavoritos.listar();
      if (!res || !res.ok) {
        if (vacioEl) vacioEl.hidden = true;
        listaEl.hidden = false;
        listaEl.innerHTML = `<p class="feedback-msg">${esc(res?.mensaje || 'No se pudieron cargar tus favoritos.')}</p>`;
        return;
      }

      const lista = Array.isArray(res.datos?.favoritos)
        ? res.datos.favoritos
        : (Array.isArray(res.datos) ? res.datos : []);

      if (contadorEl) {
        contadorEl.textContent = lista.length === 1
          ? '1 artículo guardado'
          : `${lista.length} artículos guardados`;
      }

      if (lista.length === 0) {
        listaEl.innerHTML = '';
        listaEl.hidden = true;
        if (vacioEl) vacioEl.hidden = false;
        return;
      }

      if (vacioEl) vacioEl.hidden = true;
      listaEl.hidden = false;

      listaEl.innerHTML = lista.map((p) => {
        const idProducto = Number(p.id || p.producto_id || 0);
        const imagen = resolverRutaImagen(p.imagen || p.imagen_ruta || p.foto);
        const categoria = p.categoriaNombre || p.categoria || 'General';
        const modalidad = p.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo';
        const entrega = p.entregaTexto || p.campus || 'Entrega en campus UADY';
        const vendedor = p.vendedorNombre || p.vendedor || 'Estudiante UADY';
        const promedio = Number(p.vendedorPromedio || 0).toFixed(1);

        return `
          <article class="product-card" data-id="${idProducto}">
            <img src="${esc(imagen)}" alt="${esc(p.titulo)}" class="product-card__image">
            <div class="product-card__body">
              <span class="badge">${esc(categoria)} · ${esc(modalidad)}</span>
              <h3><a href="detalle-producto.php?id=${idProducto}">${esc(p.titulo)}</a></h3>
              <p class="product-price">${moneda(p.precio)}</p>
              <p class="product-meta">Entrega: ${esc(entrega)}</p>
              <p class="product-meta">Vendedor: ${esc(vendedor)} (★ ${promedio})</p>
              <div class="card-actions">
                <a href="detalle-producto.php?id=${idProducto}" class="btn btn-primary btn-sm">Ver artículo</a>
                <button type="button" class="btn btn-secondary btn-sm" data-action="quitar-favorito" data-id="${idProducto}">Quitar</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    } catch (err) {
      if (vacioEl) vacioEl.hidden = true;
      listaEl.hidden = false;
      listaEl.innerHTML = `<p class="feedback-msg">${esc(err.message || 'Error al cargar favoritos.')}</p>`;
    }
  }

  listaEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="quitar-favorito"]');
    if (!btn) return;

    btn.disabled = true;
    try {
      const res = await window.jzFavoritos.toggle(Number(btn.dataset.id));
      if (!res || !res.ok) {
        alert(res?.mensaje || 'No se pudo quitar el artículo de favoritos.');
        btn.disabled = false;
        return;
      }
      await cargarFavoritos();
    } catch (err) {
      alert(err.message || 'No se pudo actualizar favoritos.');
      btn.disabled = false;
    }
  });

  await cargarFavoritos();
});