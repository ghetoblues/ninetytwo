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

function baseColumns({ priceJersey, priceShorts, priceSocks }) {
  return [
    { key: "name", label: "SURNAME", type: "text" },
    { key: "number", label: "NUMBER", type: "text" },
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
      key: "color",
      label: "COLOR",
      type: "select",
      options: ["Blue", "Yellow"]
    },
    { key: "destination", label: "DESTINATION", type: "text" },
    { key: "qty_jersey", label: "QUANTITY JERSEY", type: "number" },
    { key: "qty_shorts", label: "QUANTITY SHORTS", type: "number" },
    { key: "qty_socks", label: "QUANTITY SOCKS", type: "number" },
    {
      key: "price_jersey",
      label: "JERSEY PRICE",
      type: "fixed",
      default: priceJersey
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
      key: "total_price",
      label: "TOTAL PRICE",
      type: "formula",
      formula: "qty_jersey*price_jersey + qty_shorts*price_shorts + qty_socks*price_socks"
    }
  ];
}

function fcPolakoColumns({ priceJersey, priceShorts, columnsKeys }) {
  const all = baseColumns({ priceJersey, priceShorts });
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

  if (!slug || !title) {
    res.status(400).json({ error: "slug and title are required" });
    return;
  }

  const columns = fcPolakoColumns({ priceJersey, priceShorts, priceSocks, columnsKeys });

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
