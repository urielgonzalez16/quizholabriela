# Quiz Tiendanube — kit de despliegue

Contenido listo para subir a un repositorio de GitHub y publicar con
GitHub Pages. Los pasos completos están en `guia-quiz-tiendanube.md`.

```
fetch-catalog.mjs                exportador: API de Tiendanube → docs/products.json
docs/index.html                  el quiz (lee products.json + rasgos.json)
docs/products.json               catálogo real de Hola Briela (el cron lo actualiza)
docs/rasgos.json                 rasgos de los 193 productos (producto → rasgo → 0..5)
.github/workflows/catalogo.yml   cron cada 6 h (necesita secrets STORE_ID y ACCESS_TOKEN)
```

Producto nuevo en la tienda: agrégale su entrada en `docs/rasgos.json`
(`"id": {"rasgo": peso}`), o ponle tags `rasgo:nombre=n` en el admin de
Tiendanube — los tags tienen prioridad sobre rasgos.json.

Prueba local: `cd docs && python -m http.server 8000` y abre
<http://localhost:8000> (con doble clic no funciona el `fetch` del JSON).

Para producción: configura los *secrets* `STORE_ID` y `ACCESS_TOKEN` en el
repo, corre el workflow a mano una vez (pestaña Actions → "Actualizar
catálogo" → Run workflow) y activa Pages sirviendo la carpeta `/docs`.
