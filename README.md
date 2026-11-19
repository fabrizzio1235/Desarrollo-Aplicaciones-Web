# xX😎 Repositorio de Desarrollo Web 😎Xx

## 👥 Integrantes del Equipo

|<img width="200" height="280" alt="image" src="https://github.com/user-attachments/assets/1b84f728-b79c-40ba-92d8-55dbfeeaa937" />|<img width="200" height="280" alt="image" src="https://github.com/user-attachments/assets/76d3b2ca-1b67-4557-89ad-94701ce84e78" />|<img width="200" height="280" alt="image" src="https://github.com/user-attachments/assets/07cb1a38-b1a6-4ed6-b6ad-df0231e11ff3" />|<img width="200" height="250" alt="image" src="https://github.com/user-attachments/assets/a4716f4d-24de-4c6a-aa53-4e2b98eb0cbe" />|
| :---: | :---: | :---: | :---: |
| **José Luis<br>Basulto Cámara** | **Fabrizzio Sebastian<br>España Chi**| **José Alberto<br>Osorno Herrera**| **François Bilal<br>Pageau Santos**|



# JaguarZon UADY — Prototipo frontend

Prototipo de la plataforma de comercio estudiantil de la UADY hecho solo con **HTML, CSS y JavaScript**.
Todos los datos se simulan en el navegador con `localStorage` / `sessionStorage`; no hay backend.

## Cómo abrirlo
Abrir `index.html` en el navegador

## Cuentas de demostración
Contraseña de todas: `demo1234`

| Correo | Vende |
|---|---|
| a21000001@alumnos.uady.mx | Cálculo de una Variable (precio fijo) |
| a21000002@alumnos.uady.mx | Kit Arduino (subasta, cierra 7 días después de la primera visita) |
| a21000003@alumnos.uady.mx | Bata de laboratorio (precio fijo) |

También se puede crear una cuenta nueva con un correo `@alumnos.uady.mx` o `@correo.uady.mx`.

## Guion de demostración (ciclo completo)
1. Crear una cuenta, iniciar sesión y explorar el catálogo (filtros, búsqueda, favoritos).
2. Abrir un producto de precio fijo, **solicitar la compra** y pulsar «Ir al chat del pedido».
3. Cerrar sesión (botón «Salir») e iniciar como el vendedor (`a21000001@...`): ver el mensaje sin leer, responder y, en **Mis Ventas**, marcar el pedido como entregado.
4. Volver a entrar como comprador: en **Mi Perfil** calificar al vendedor.
5. Subasta: pujar con dos cuentas distintas; al llegar la hora de cierre gana la puja más alta y se genera un pedido.
6. En **Mis Ventas** probar **Editar** y **Eliminar** publicaciones.

## Estructura
- `css/` hojas de estilo por página + `base.css` y `componentes.css` compartidos.
- `js/api/` capa de datos simulada (`apiAutenticacion`, `apiProductos`, `apiMensajes`) y utilidades (`guardianRutas`). En la siguiente entrega se sustituirá por llamadas al backend.
- `js/pages/` lógica de cada página.
- `pages/` páginas HTML; `index.html` es la presentación al sitio web.

## Llaves de localStorage
`jz_usuarios`, `jz_sesion`, `jz_productos`, `jz_pedidos`, `jz_resenas`, `jz_mensajes`, `jz_favoritos_<correo>`.
