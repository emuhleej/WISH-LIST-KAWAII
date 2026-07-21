// Pure, framework-free logic for the wish list app.
//
// These functions have no dependency on the DOM, localStorage, or Firebase,
// so they can be imported both by index.html (in the browser) and by the
// unit tests (in Node/Vitest). Keep this file free of browser-only globals
// other than crypto.randomUUID / structuredClone (both available in modern
// browsers and Node 18+).

export const defaultState = {
  items: [
    {
      id: crypto.randomUUID(),
      title: "Example linen robe",
      price: "78",
      targetPrice: "60",
      priceHistory: [
        { date: "2026-07-01", price: 92 },
        { date: "2026-07-08", price: 84 },
        { date: "2026-07-15", price: 78 }
      ],
      link: "https://www.google.com/search?tbm=shop&q=linen+robe",
      checkoutLink: "",
      image: "",
      store: "Shopping search",
      category: "Home",
      priority: "Love",
      recipient: "Me",
      notes: "Replace this sample with your first real find.",
      status: "saved",
      createdAt: Date.now()
    }
  ],
  ui: { text:"", status:"all", category:"all", priority:"all", recipient:"all" }
};

export function attr(value){ return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

export function normalizePrice(value){ return Number(String(value || "").replace(/[^0-9.]/g,"")) || 0; }

export function priceNumber(value){
  const n = Number(String(value || "").replace(/[^0-9.]/g,""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

export function todayStamp(){ return new Date().toISOString().slice(0,10); }

export function makeHistory(price, history){
  const seen = Array.isArray(history) ? history : [];
  const cleaned = seen
    .map(row => ({ date: String(row.date || todayStamp()).slice(0,10), price: priceNumber(row.price) }))
    .filter(row => row.price > 0)
    .slice(-12);
  const current = priceNumber(price);
  if(current && (!cleaned.length || cleaned[cleaned.length - 1].price !== current)){
    cleaned.push({ date: todayStamp(), price: current });
  }
  return cleaned.slice(-12);
}

export function priceStats(item){
  const history = makeHistory(item.price, item.priceHistory);
  const prices = history.map(row => row.price).filter(Boolean);
  const current = priceNumber(item.price);
  const target = priceNumber(item.targetPrice);
  const low = prices.length ? Math.min(...prices) : current;
  const high = prices.length ? Math.max(...prices) : current;
  const previous = prices.length > 1 ? prices[prices.length - 2] : 0;
  const delta = current && previous ? current - previous : 0;
  const atTarget = current && target && current <= target;
  return { history, current, target, low, high, previous, delta, atTarget };
}

export function normalizeUrl(value){
  const url = String(value || "").trim();
  if(!url) return "";
  if(/^https?:\/\//i.test(url)) return url;
  if(/^[\w-]+(\.[\w-]+)+/.test(url)) return `https://${url}`;
  return url;
}

export function normalizeState(next){
  const base = structuredClone(defaultState);
  if(!next || typeof next !== "object") return base;
  const items = Array.isArray(next.items) ? next.items : base.items;
  return {
    ...base,
    ...next,
    items: items.map(item => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || "Untitled find",
      price: item.price || "",
      targetPrice: item.targetPrice || "",
      priceHistory: makeHistory(item.price, item.priceHistory),
      link: normalizeUrl(item.link),
      checkoutLink: normalizeUrl(item.checkoutLink),
      image: item.image || "",
      searchQuery: item.searchQuery || item.title || "",
      store: item.store || "",
      category: item.category || "Other",
      priority: item.priority || "Maybe",
      recipient: item.recipient || "",
      notes: item.notes || "",
      status: item.status || "saved",
      createdAt: item.createdAt || Date.now()
    })),
    ui: { ...base.ui, ...(next.ui || {}) }
  };
}

// Pure form of the in-page searchUrl(): takes an explicit query rather than
// reading it from the DOM. index.html wraps this to supply the input value.
export function buildSearchUrl(site, q){
  const encoded = encodeURIComponent(q || "");
  const urls = {
    "Google": `https://www.google.com/search?tbm=shop&q=${encoded}`,
    "Amazon": `https://www.amazon.com/s?k=${encoded}`,
    "Etsy": `https://www.etsy.com/search?q=${encoded}`,
  };
  return urls[site];
}
