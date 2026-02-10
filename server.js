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
  listOrders,
  deleteOrder
} = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { index: false }));

const translations = {
  ENG: {
    SURNAME: "SURNAME",
    NUMBER: "NUMBER",
    HEIGHT: "HEIGHT",
    WEIGHT: "WEIGHT",
    JERSEY_SIZE: "JERSEY SIZE",
    SHORTS_SIZE: "SHORTS SIZE",
    SOCKS_SIZE: "SOCKS SIZE",
    TYPE: "TYPE",
    COLOR: "COLOR",
    DESTINATION: "DESTINATION",
    QTY_JERSEY: "QUANTITY JERSEY",
    QTY_SHORTS: "QUANTITY SHORTS",
    QTY_SOCKS: "QUANTITY SOCKS",
    PRICE_JERSEY: "JERSEY PRICE",
    PRICE_SHORTS: "SHORTS PRICE",
    PRICE_SOCKS: "SOCKS PRICE",
    TOTAL_PRICE: "TOTAL PRICE"
  },
  RUS: {
    SURNAME: "ФАМИЛИЯ",
    NUMBER: "НОМЕР",
    HEIGHT: "РОСТ",
    WEIGHT: "ВЕС",
    JERSEY_SIZE: "РАЗМЕР МАЙКИ",
    SHORTS_SIZE: "РАЗМЕР ШОРТ",
    SOCKS_SIZE: "РАЗМЕР НОСКОВ",
    TYPE: "ТИП",
    COLOR: "ЦВЕТ",
    DESTINATION: "НАЗНАЧЕНИЕ",
    QTY_JERSEY: "КОЛ-ВО МАЕК",
    QTY_SHORTS: "КОЛ-ВО ШОРТ",
    QTY_SOCKS: "КОЛ-ВО НОСКОВ",
    PRICE_JERSEY: "ЦЕНА МАЙКИ",
    PRICE_SHORTS: "ЦЕНА ШОРТ",
    PRICE_SOCKS: "ЦЕНА НОСКОВ",
    TOTAL_PRICE: "ИТОГО"
  }
};

const colorTranslations = {
  ENG: {
    Red: "Red",
    Blue: "Blue",
    White: "White",
    Yellow: "Yellow",
    Black: "Black",
    Green: "Green",
    Orange: "Orange",
    Purple: "Purple",
    Pink: "Pink",
    Gray: "Gray"
  },
  RUS: {
    Red: "Красный",
    Blue: "Синий",
    White: "Белый",
    Yellow: "Жёлтый",
    Black: "Чёрный",
    Green: "Зелёный",
    Orange: "Оранжевый",
    Purple: "Фиолетовый",
    Pink: "Розовый",
    Gray: "Серый"
  }
};

function getLabel(key, language = "ENG") {
  const lang = translations[language] || translations.ENG;
  return lang[key] || key;
}

function getColorLabel(color, language = "ENG") {
  const lang = colorTranslations[language] || colorTranslations.ENG;
  return lang[color] || color;
}

function baseColumns({ priceJersey, priceShorts, priceSocks, colorOptions, sport, language = "ENG" }) {
  // default football sizes
  let sizeOptions = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  if (sport === "Hockey") {
    sizeOptions = [
      "110",
      "120",
      "130",
      "140",
      "150",
      "160/M",
      "170/L",
      "180/XL",
      "190/XXL",
      "190/3XL"
    ];
  }

  const colorOpts = Array.isArray(colorOptions) && colorOptions.length > 0 ? colorOptions : ["Blue", "Yellow"];

  return [
    { key: "name", label: getLabel("SURNAME", language), type: "text" },
    { key: "number", label: getLabel("NUMBER", language), type: "text" },
    { key: "height_cm", label: getLabel("HEIGHT", language), type: "number" },
    { key: "weight_kg", label: getLabel("WEIGHT", language), type: "number" },
    {
      key: "size",
      label: getLabel("JERSEY_SIZE", language),
      type: "select",
      options: sizeOptions
    },
    {
      key: "size_shorts",
      label: getLabel("SHORTS_SIZE", language),
      type: "select",
      options: sizeOptions
    },
    {
      key: "size_socks",
      label: getLabel("SOCKS_SIZE", language),
      type: "select",
      options: sizeOptions
    },
    {
      key: "type",
      label: getLabel("TYPE", language),
      type: "select",
      options: ["Long", "Short"]
    },
    {
      key: "color",
      label: getLabel("COLOR", language),
      type: "select",
      options: colorOpts.map(c => ({ value: c, label: getColorLabel(c, language) }))
    },
    { key: "destination", label: getLabel("DESTINATION", language), type: "text" },
    { key: "qty_jersey", label: getLabel("QTY_JERSEY", language), type: "number" },
    { key: "qty_shorts", label: getLabel("QTY_SHORTS", language), type: "number" },
    { key: "qty_socks", label: getLabel("QTY_SOCKS", language), type: "number" },
    {
      key: "price_jersey",
      label: getLabel("PRICE_JERSEY", language),
      type: "fixed",
      default: priceJersey
    },
    {
      key: "price_shorts",
      label: getLabel("PRICE_SHORTS", language),
      type: "fixed",
      default: priceShorts
    },
    {
      key: "price_socks",
      label: getLabel("PRICE_SOCKS", language),
      type: "fixed",
      default: priceSocks
    },
    {
      key: "total_price",
      label: getLabel("TOTAL_PRICE", language),
      type: "formula",
      formula: "qty_jersey*price_jersey + qty_shorts*price_shorts + qty_socks*price_socks"
    }
  ];
}

function buildOrderColumns({ priceJersey, priceShorts, priceSocks, columnsKeys, colorOptions, sport, language = "ENG" }) {
  const all = baseColumns({ priceJersey, priceShorts, priceSocks, colorOptions, sport, language });
  if (!Array.isArray(columnsKeys) || columnsKeys.length === 0) return all;
  const allowed = new Set(columnsKeys);
  return all.filter((col) => allowed.has(col.key));
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
    priceShorts = 7.7,
    priceSocks = 0,
    columnsKeys = [],
    unitPcsLabel = "pcs",
    unitCurrencyLabel = "EUR"
  } = req.body || {};

  const { sport = "Football", colorOptions = [], language = "ENG" } = req.body || {};

  if (!slug || !title) {
    res.status(400).json({ error: "slug and title are required" });
    return;
  }

  const columns = buildOrderColumns({ priceJersey, priceShorts, priceSocks, columnsKeys, colorOptions, sport, language });

  try {
    await createOrder({
      slug,
      title,
      columns,
      rowsCount,
      unitPcsLabel,
      unitCurrencyLabel,
      config: { sport, colorOptions, language }
    });
    res.json({ ok: true, slug });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/orders/:slug", requireAdmin, async (req, res) => {
  const order = await getOrderBySlug(req.params.slug);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const ok = await deleteOrder(order.id);
  if (!ok) {
    res.status(500).json({ error: "Failed to delete order" });
    return;
  }
  res.json({ ok: true });
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
