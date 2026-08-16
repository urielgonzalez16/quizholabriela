// fetch-catalog.mjs — genera docs/products.json desde la API de Tiendanube
// Uso: STORE_ID=123 ACCESS_TOKEN=abc node fetch-catalog.mjs
// Requiere Node 18+ (fetch nativo). Sin dependencias.
import { writeFileSync } from "node:fs";

const STORE_ID = process.env.STORE_ID;
const TOKEN    = process.env.ACCESS_TOKEN;
if (!STORE_ID || !TOKEN) {
  console.error("Faltan STORE_ID y/o ACCESS_TOKEN en el ambiente.");
  process.exit(1);
}

const BASE    = `https://api.tiendanube.com/v1/${STORE_ID}`;
const HEADERS = {
  "Authentication": `bearer ${TOKEN}`,
  "User-Agent": "QuizGSEpro (ugonzalez@gsepro.com)"   // obligatorio para la API
};

async function getAll(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${BASE}${path}?per_page=200&page=${page}`, { headers: HEADERS });
    if (res.status === 404) break;                     // sin más páginas
    if (!res.ok) throw new Error(`${path} p${page}: HTTP ${res.status} ${await res.text()}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) break;
    out.push(...batch);
    if (batch.length < 200) break;
  }
  return out;
}

const es = v => (v && (v.es ?? Object.values(v)[0])) ?? "";

const [products, categories] = await Promise.all([
  getAll("/products"),
  getAll("/categories")
]);

const catName = {};
for (const c of categories) catName[c.id] = es(c.name);

const slim = products
  .filter(p => p.visibility ? p.visibility === "visible" : p.published !== false)
  .map(p => ({
    id: p.id,
    name: { es: es(p.name) },
    description: { es: es(p.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) },
    canonical_url: p.canonical_url,
    categories: (p.categories ?? []).map(c => (typeof c === "object" ? c.id : c)),
    tags: p.tags ?? "",
    images: [{ src: p.images?.[0]?.src ?? "" }],
    variants: [{
      price: p.variants?.[0]?.price ?? "0",
      stock: (p.variants ?? []).reduce((s, v) => s + (v.stock ?? 1), 0)
    }]
  }));

const withTraits = slim.filter(p => /rasgo:/i.test(p.tags)).length;

writeFileSync("docs/products.json", JSON.stringify({
  generated_at: new Date().toISOString(),
  categories: catName,
  products: slim
}, null, 1));

console.log(`OK: ${slim.length} productos (${withTraits} con rasgos) → docs/products.json`);
if (!withTraits) console.warn("AVISO: ningún producto tiene tags 'rasgo:...' — el quiz no tendrá candidatos.");
