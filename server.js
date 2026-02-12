require("dotenv").config();
const express = require("express");
const path = require("path");
const {
  initDb,
  createOrder,
  getOrderBySlug,
  addRow,
  updateRow,
  deleteRow,
  listOrders
} = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { index: false }));

function baseColumns({
  priceJersey,
  priceJerseySublimated,
  priceJerseyEmbroidered,
  priceJerseyComplex,
  priceShorts,
  priceSocks,
  priceCaps
}) {
  return [
    { key: "name", label: "SURNAME", type: "text" },
    { key: "number", label: "NUMBER", type: "text" },
    { key: "cap", label: "CAP", type: "text" },
    { key: "height_cm", label: "HEIGHT", type: "number" },
    { key: "weight_kg", label: "WEIGHT", type: "number" },
    {
      key: "size",
      label: "JERSEY SIZE",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
    },
    {
      key: "size_shorts",
      label: "SHORTS SIZE",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
    },
    {
      key: "size_socks",
      label: "SOCKS SIZE",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
    },
    {
      key: "type",
      label: "TYPE",
      type: "select",
      options: ["Long", "Short"]
    },
    {
      key: "jersey_method",
      label: "JERSEY METHOD",
      type: "select",
      options: ["Sublimated", "Embroidered", "Complex"]
    },
    {
      key: "color",
      label: "COLOR",
      type: "select",
      options: ["Blue", "Yellow"]
    },
    {
      key: "style_cap",
      label: "STYLE",
      type: "select",
      options: ["6 panel cap", "trucker cap with a mesh at the backside"]
    },
    {
      key: "logo_cap",
      label: "LOGO",
      type: "select",
      options: ["Embroidery", "Print", "Patch"]
    },
    {
      key: "visor_cap",
      label: "VISOR",
      type: "select",
      options: ["Curved visor", "Flat visor"]
    },
    {
      key: "fastener_cap",
      label: "FASTENER",
      type: "select",
      options: ["plastic snap closure", "metal buckle", "velcro"]
    },
    {
      key: "size_cap",
      label: "SIZE",
      type: "select",
      options: ["Adult", "Youth", "Kids"]
    },
    { key: "destination", label: "DESTINATION", type: "text" },
    { key: "qty_jersey", label: "QUANTITY JERSEY", type: "number" },
    { key: "qty_shorts", label: "QUANTITY SHORTS", type: "number" },
    { key: "qty_socks", label: "QUANTITY SOCKS", type: "number" },
    { key: "qty_caps", label: "QUANTITY CAPS", type: "number" },
    {
      key: "price_jersey",
      label: "JERSEY PRICE",
      type: "fixed",
      default: priceJersey
    },
    {
      key: "price_jersey_sublimated",
      label: "JERSEY SUBLIMATED PRICE",
      type: "fixed",
      default: priceJerseySublimated
    },
    {
      key: "price_jersey_embroidered",
      label: "JERSEY EMBROIDERED PRICE",
      type: "fixed",
      default: priceJerseyEmbroidered
    },
    {
      key: "price_jersey_complex",
      label: "JERSEY COMPLEX PRICE",
      type: "fixed",
      default: priceJerseyComplex
    },
    {
      key: "price_shorts",
      label: "SHORTS PRICE",
      type: "fixed",
      default: priceShorts
    },
    {
      key: "price_socks",
      label: "SOCKS PRICE",
      type: "fixed",
      default: priceSocks
    },
    {
      key: "price_caps",
      label: "CAPS PRICE",
      type: "fixed",
      default: priceCaps
    },
    {
      key: "total_price",
      label: "TOTAL PRICE",
      type: "formula",
      formula:
        "qty_jersey*price_jersey_complex + qty_shorts*price_shorts + qty_socks*price_socks + qty_caps*price_caps"
    }
  ];
}

function fcPolakoColumns({
  priceJersey,
  priceJerseySublimated,
  priceJerseyEmbroidered,
  priceJerseyComplex,
  priceShorts,
  priceSocks,
  priceCaps,
  columnsKeys
}) {
  const all = baseColumns({
    priceJersey,
    priceJerseySublimated,
    priceJerseyEmbroidered,
    priceJerseyComplex,
    priceShorts,
    priceSocks,
    priceCaps
  });
  if (!Array.isArray(columnsKeys) || columnsKeys.length === 0) return all;
  const allowed = new Set(columnsKeys);
  return all.filter((col) => allowed.has(col.key));
}

function applyCustomColumns({
  priceJersey,
  priceJerseySublimated,
  priceJerseyEmbroidered,
  priceJerseyComplex,
  priceShorts,
  priceSocks,
  priceCaps,
  customColumns
}) {
  const all = baseColumns({
    priceJersey,
    priceJerseySublimated,
    priceJerseyEmbroidered,
    priceJerseyComplex,
    priceShorts,
    priceSocks,
    priceCaps
  });
  const byKey = new Map(all.map((col) => [col.key, col]));
  if (!Array.isArray(customColumns) || customColumns.length === 0) return null;

  const next = [];
  customColumns.forEach((item) => {
    if (!item || typeof item !== "object" || typeof item.key !== "string") return;
    const base = byKey.get(item.key);
    if (!base) return;

    const col = { ...base };
    if (typeof item.label === "string" && item.label.trim()) {
      col.label = item.label.trim();
    }
    if (col.type === "select" && Array.isArray(item.options)) {
      const options = item.options
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
      if (options.length > 0) {
        col.options = Array.from(new Set(options));
      }
    }
    if (col.type === "fixed" && Number.isFinite(Number(item.default))) {
      col.default = Number(item.default);
    }
    if (col.type === "formula") {
      col.priceJersey = Number.isFinite(Number(item.priceJersey))
        ? Number(item.priceJersey)
        : priceJersey;
      col.priceJerseySublimated = Number.isFinite(Number(item.priceJerseySublimated))
        ? Number(item.priceJerseySublimated)
        : priceJerseySublimated;
      col.priceJerseyEmbroidered = Number.isFinite(Number(item.priceJerseyEmbroidered))
        ? Number(item.priceJerseyEmbroidered)
        : priceJerseyEmbroidered;
      col.priceJerseyComplex = Number.isFinite(Number(item.priceJerseyComplex))
        ? Number(item.priceJerseyComplex)
        : priceJerseyComplex;
      col.priceShorts = Number.isFinite(Number(item.priceShorts))
        ? Number(item.priceShorts)
        : priceShorts;
      col.priceSocks = Number.isFinite(Number(item.priceSocks))
        ? Number(item.priceSocks)
        : priceSocks;
      col.priceCaps = Number.isFinite(Number(item.priceCaps))
        ? Number(item.priceCaps)
        : priceCaps;
      if (typeof item.jerseyPricingMode === "string" && item.jerseyPricingMode.trim()) {
        col.jerseyPricingMode = item.jerseyPricingMode.trim();
      }
    }
    next.push(col);
  });

  return next.length > 0 ? next : null;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function isAdmin(req) {
  const cookies = parseCookies(req);
  return cookies.nt_admin === "1";
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

app.post("/api/login", (req, res) => {
  const { login, password } = req.body || {};
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    res.setHeader(
      "Set-Cookie",
      "nt_admin=1; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly"
    );
    res.json({ ok: true });
    return;
  }
  res.status(401).json({ error: "Invalid login or password" });
});

app.get("/api/orders", requireAdmin, async (req, res) => {
  const orders = await listOrders();
  res.json({ orders });
});

app.post("/api/orders", requireAdmin, async (req, res) => {
  const {
    slug,
    title,
    rowsCount = 20,
    priceJersey = 21.9,
    priceJerseySublimated = 35,
    priceJerseyEmbroidered = 72,
    priceJerseyComplex = 82,
    priceShorts = 7.7,
    priceSocks = 0,
    priceCaps = 0,
    columnsKeys = [],
    customColumns = [],
    unitPcsLabel = "pcs",
    unitCurrencyLabel = "EUR"
  } = req.body || {};

  if (!slug || !title) {
    res.status(400).json({ error: "slug and title are required" });
    return;
  }

  const columns =
    applyCustomColumns({
      priceJersey,
      priceJerseySublimated,
      priceJerseyEmbroidered,
      priceJerseyComplex,
      priceShorts,
      priceSocks,
      priceCaps,
      customColumns
    }) ||
    fcPolakoColumns({
      priceJersey,
      priceJerseySublimated,
      priceJerseyEmbroidered,
      priceJerseyComplex,
      priceShorts,
      priceSocks,
      priceCaps,
      columnsKeys
    });

  try {
    await createOrder({
      slug,
      title,
      columns,
      rowsCount,
      unitPcsLabel,
      unitCurrencyLabel
    });
    res.json({ ok: true, slug });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/orders/:slug", async (req, res) => {
  const order = await getOrderBySlug(req.params.slug);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

app.post("/api/orders/:slug/rows", async (req, res) => {
  const order = await getOrderBySlug(req.params.slug);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const rowId = await addRow(order.id);
  res.json({ id: rowId });
});

app.patch("/api/orders/:slug/rows/:id", async (req, res) => {
  const order = await getOrderBySlug(req.params.slug);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const rowId = Number(req.params.id);
  const ok = await updateRow(order.id, rowId, req.body && req.body.data);
  if (!ok) {
    res.status(404).json({ error: "Row not found" });
    return;
  }
  res.json({ ok: true });
});

app.delete("/api/orders/:slug/rows/:id", async (req, res) => {
  const order = await getOrderBySlug(req.params.slug);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const rowId = Number(req.params.id);
  const ok = await deleteRow(order.id, rowId);
  if (!ok) {
    res.status(404).json({ error: "Row not found" });
    return;
  }
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/admin", (req, res) => {
  if (!isAdmin(req)) {
    res.redirect("/login");
    return;
  }
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/orders", (req, res) => {
  res.redirect("/");
});

app.get("/orders/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`NinetyTwo server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init database:", err);
    process.exit(1);
  });
