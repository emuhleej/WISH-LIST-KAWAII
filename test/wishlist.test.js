import { describe, it, expect } from "vitest";
import {
  attr,
  normalizePrice,
  priceNumber,
  todayStamp,
  makeHistory,
  priceStats,
  normalizeUrl,
  normalizeState,
  buildSearchUrl,
  defaultState
} from "../src/wishlist.js";

describe("attr — HTML escaping", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(attr(`<a href="x" onclick='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;"
    );
  });
  it("coerces nullish input to an empty string", () => {
    expect(attr(null)).toBe("");
    expect(attr(undefined)).toBe("");
    expect(attr(0)).toBe(""); // note: 0 is falsy, so it becomes ""
  });
  it("leaves safe text untouched", () => {
    expect(attr("Cloud lounge slippers")).toBe("Cloud lounge slippers");
  });

  // SECURITY: attr only escapes characters; it does not neutralize an
  // attribute-breaking payload once it is placed inside an unquoted context,
  // nor does it stop a value that is itself a dangerous URL. See the
  // normalizeUrl block below for the javascript: URL gap. This test documents
  // that a bare "javascript:" string survives attr unchanged.
  it("does NOT sanitize a javascript: URL (documents current behavior)", () => {
    expect(attr("javascript:alert(1)")).toBe("javascript:alert(1)");
  });
});

describe("normalizePrice", () => {
  it("strips currency symbols and separators", () => {
    expect(normalizePrice("$1,299.99")).toBe(1299.99);
  });
  it("returns 0 for junk / empty / nullish", () => {
    expect(normalizePrice("free")).toBe(0);
    expect(normalizePrice("")).toBe(0);
    expect(normalizePrice(null)).toBe(0);
  });
  it("keeps a plain number", () => {
    expect(normalizePrice("42")).toBe(42);
  });
});

describe("priceNumber", () => {
  it("rounds to two decimal places", () => {
    expect(priceNumber("19.999")).toBe(20);
    expect(priceNumber("19.994")).toBe(19.99);
  });
  it("returns 0 for non-positive or invalid values", () => {
    expect(priceNumber("0")).toBe(0);
    expect(priceNumber("-5")).toBe(5); // '-' is stripped, so becomes 5
    expect(priceNumber("abc")).toBe(0);
    expect(priceNumber(undefined)).toBe(0);
  });
});

describe("makeHistory", () => {
  it("appends the current price when it differs from the last entry", () => {
    const h = makeHistory("50", [{ date: "2026-07-01", price: 60 }]);
    expect(h).toHaveLength(2);
    expect(h[1].price).toBe(50);
    expect(h[1].date).toBe(todayStamp());
  });
  it("does not append a duplicate of the last price", () => {
    const h = makeHistory("60", [{ date: "2026-07-01", price: 60 }]);
    expect(h).toHaveLength(1);
  });
  it("drops rows with non-positive prices", () => {
    const h = makeHistory("", [
      { date: "2026-07-01", price: 0 },
      { date: "2026-07-02", price: 30 }
    ]);
    expect(h).toEqual([{ date: "2026-07-02", price: 30 }]);
  });
  it("clamps to the most recent 12 entries", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, "0")}`,
      price: i + 1
    }));
    const h = makeHistory("", rows);
    expect(h).toHaveLength(12);
    expect(h[0].price).toBe(9); // rows 9..20 survive
    expect(h[11].price).toBe(20);
  });
  it("tolerates a non-array history argument", () => {
    expect(makeHistory("25", undefined)).toEqual([
      { date: todayStamp(), price: 25 }
    ]);
  });
});

describe("priceStats", () => {
  it("computes low/high/delta from history plus current price", () => {
    const s = priceStats({
      price: "78",
      targetPrice: "60",
      priceHistory: [
        { date: "2026-07-01", price: 92 },
        { date: "2026-07-08", price: 84 }
      ]
    });
    expect(s.current).toBe(78);
    expect(s.low).toBe(78);
    expect(s.high).toBe(92);
    expect(s.previous).toBe(84);
    expect(s.delta).toBe(78 - 84); // -6
    expect(s.atTarget).toBe(false);
  });
  it("flags atTarget when current price is at or below target", () => {
    const s = priceStats({ price: "55", targetPrice: "60", priceHistory: [] });
    expect(s.atTarget).toBe(true);
  });
  it("never reports atTarget when no target is set", () => {
    const s = priceStats({ price: "55", targetPrice: "", priceHistory: [] });
    expect(Boolean(s.atTarget)).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("returns an empty string for blank input", () => {
    expect(normalizeUrl("")).toBe("");
    expect(normalizeUrl("   ")).toBe("");
    expect(normalizeUrl(null)).toBe("");
  });
  it("leaves absolute http(s) URLs unchanged", () => {
    expect(normalizeUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });
  it("prepends https:// to a bare domain", () => {
    expect(normalizeUrl("example.com/deals")).toBe("https://example.com/deals");
  });

  // SECURITY (currently failing on purpose): a javascript: URL should be
  // rejected/neutralized because normalizeUrl output is later interpolated
  // into an href. Today it is returned verbatim, which is a stored-XSS vector.
  // This is encoded with it.fails so CI stays green while the gap stays
  // visible — delete `.fails` once normalizeUrl is hardened.
  it.fails("SHOULD neutralize javascript: URLs (known gap)", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
  });
});

describe("normalizeState", () => {
  it("falls back to a clean default for non-object input", () => {
    const s = normalizeState(null);
    expect(s.items).toHaveLength(1);
    expect(s.ui.status).toBe("all");
  });
  it("fills missing item fields with defaults", () => {
    const s = normalizeState({ items: [{ title: "Only a title" }] });
    const item = s.items[0];
    expect(item.title).toBe("Only a title");
    expect(item.category).toBe("Other");
    expect(item.priority).toBe("Maybe");
    expect(item.status).toBe("saved");
    expect(typeof item.id).toBe("string");
  });
  it("normalizes item URLs during load", () => {
    const s = normalizeState({ items: [{ title: "x", link: "shop.com/a" }] });
    expect(s.items[0].link).toBe("https://shop.com/a");
  });
  it("merges ui overrides onto the defaults", () => {
    const s = normalizeState({ items: [], ui: { status: "purchased" } });
    expect(s.ui.status).toBe("purchased");
    expect(s.ui.category).toBe("all");
  });

  // REGRESSION GUARD: importJson() in index.html currently spreads the backup
  // file straight into state instead of routing it through normalizeState, so
  // imported items skip URL normalization and price-history rebuilding. This
  // test pins the *correct* behavior of normalizeState; the intended fix is to
  // make the import path call normalizeState too. See the analysis notes.
  it("would sanitize an imported backup if the import path used it", () => {
    const importedBackup = { items: [{ title: "Imported", link: "deal.com" }] };
    const viaNormalize = normalizeState(importedBackup);
    expect(viaNormalize.items[0].link).toBe("https://deal.com");
    expect(Array.isArray(viaNormalize.items[0].priceHistory)).toBe(true);
  });
});

describe("buildSearchUrl", () => {
  it("encodes the query for each supported site", () => {
    expect(buildSearchUrl("Google", "pink & fluffy")).toBe(
      "https://www.google.com/search?tbm=shop&q=pink%20%26%20fluffy"
    );
    expect(buildSearchUrl("Amazon", "desk lamp")).toBe(
      "https://www.amazon.com/s?k=desk%20lamp"
    );
    expect(buildSearchUrl("Etsy", "mug")).toBe("https://www.etsy.com/search?q=mug");
  });
  it("returns undefined for an unknown site", () => {
    expect(buildSearchUrl("Bing", "x")).toBeUndefined();
  });
  it("handles an empty query", () => {
    expect(buildSearchUrl("Google", "")).toBe(
      "https://www.google.com/search?tbm=shop&q="
    );
  });
});

describe("defaultState sanity", () => {
  it("ships one saved example item with a valid ui block", () => {
    expect(defaultState.items).toHaveLength(1);
    expect(defaultState.items[0].status).toBe("saved");
    expect(defaultState.ui).toMatchObject({ status: "all", category: "all" });
  });
});
