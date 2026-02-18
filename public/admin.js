const form = document.getElementById("create-form");
const resultEl = document.getElementById("create-result");
const ordersList = document.getElementById("orders-list");
const languageSelect = document.getElementById("language");
const sportSelect = document.getElementById("sport");
const productsStep = document.getElementById("products-step");
const pricingStep = document.getElementById("pricing-step");
const productsContainer = document.getElementById("products-container");
const pricingFields = document.getElementById("pricing-fields");

const SIZE_OPTIONS_BY_SPORT = {
  hockey: {
    size: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    size_shorts: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    size_socks: ["31-34", "35-38", "39-42", "43-46", "47-50"]
  },
  football: {
    size: ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    size_shorts: ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    size_socks: ["35-38", "39-42", "43-46"]
  },
  other: {}
};

const COLUMN_META = {
  name: { key: "name", label: "SURNAME", type: "text" },
  number: { key: "number", label: "NUMBER", type: "text" },
  cap: { key: "cap", label: "CAP", type: "text" },
  height_cm: { key: "height_cm", label: "HEIGHT", type: "number" },
  weight_kg: { key: "weight_kg", label: "WEIGHT", type: "number" },
  size: {
    key: "size",
    label: "JERSEY SIZE",
    type: "select",
    options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
  },
  size_shorts: {
    key: "size_shorts",
    label: "SHORTS SIZE",
    type: "select",
    options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
  },
  size_socks: {
    key: "size_socks",
    label: "SOCKS SIZE",
    type: "select",
    options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
  },
  type: {
    key: "type",
    label: "TYPE",
    type: "select",
    options: ["Long", "Short"]
  },
  jersey_method: {
    key: "jersey_method",
    label: "JERSEY METHOD",
    type: "select",
    options: ["Sublimated", "Embroidered", "Complex"]
  },
  color: {
    key: "color",
    label: "COLOR",
    type: "select",
    options: ["Blue", "Yellow", "White", "Black", "Red"]
  },
  style_cap: {
    key: "style_cap",
    label: "STYLE",
    type: "select",
    options: ["6 panel cap", "trucker cap with a mesh at the backside"]
  },
  logo_cap: {
    key: "logo_cap",
    label: "LOGO",
    type: "select",
    options: ["Embroidery", "Print", "Patch"]
  },
  visor_cap: {
    key: "visor_cap",
    label: "VISOR",
    type: "select",
    options: ["Curved visor", "Flat visor"]
  },
  fastener_cap: {
    key: "fastener_cap",
    label: "FASTENER",
    type: "select",
    options: ["plastic snap closure", "metal buckle", "velcro"]
  },
  size_cap: {
    key: "size_cap",
    label: "SIZE",
    type: "select",
    options: ["Adult", "Youth", "Kids"]
  },
  destination: { key: "destination", label: "DESTINATION", type: "text" },
  qty_jersey: { key: "qty_jersey", label: "QUANTITY JERSEY", type: "number" },
  qty_shorts: { key: "qty_shorts", label: "QUANTITY SHORTS", type: "number" },
  qty_socks: { key: "qty_socks", label: "QUANTITY SOCKS", type: "number" },
  qty_caps: { key: "qty_caps", label: "QUANTITY CAPS", type: "number" },
  price_jersey: { key: "price_jersey", label: "JERSEY PRICE", type: "fixed" },
  price_jersey_sublimated: {
    key: "price_jersey_sublimated",
    label: "JERSEY SUBLIMATED PRICE",
    type: "fixed"
  },
  price_jersey_embroidered: {
    key: "price_jersey_embroidered",
    label: "JERSEY EMBROIDERED PRICE",
    type: "fixed"
  },
  price_jersey_complex: {
    key: "price_jersey_complex",
    label: "JERSEY COMPLEX PRICE",
    type: "fixed"
  },
  price_shorts: { key: "price_shorts", label: "SHORTS PRICE", type: "fixed" },
  price_socks: { key: "price_socks", label: "SOCKS PRICE", type: "fixed" },
  price_caps: { key: "price_caps", label: "CAPS PRICE", type: "fixed" },
  total_price: {
    key: "total_price",
    label: "TOTAL PRICE",
    type: "formula",
    formula: "qty_jersey*price_jersey + qty_shorts*price_shorts + qty_socks*price_socks + qty_caps*price_caps"
  }
};

const PRODUCTS_BY_SPORT = {
  hockey: [
    {
      id: "jersey",
      title: "Hockey Jersey",
      qtyKey: "qty_jersey",
      priceKey: "price_jersey",
      params: ["size", "type", "color"]
    },
    {
      id: "shorts",
      title: "Hockey Shorts",
      qtyKey: "qty_shorts",
      priceKey: "price_shorts",
      params: ["size_shorts", "color"]
    },
    {
      id: "socks",
      title: "Hockey Socks",
      qtyKey: "qty_socks",
      priceKey: "price_socks",
      params: ["size_socks", "color"]
    }
  ],
  football: [
    {
      id: "jersey",
      title: "Football Jersey",
      qtyKey: "qty_jersey",
      priceKey: "price_jersey",
      params: ["size", "type", "color"]
    },
    {
      id: "shorts",
      title: "Football Shorts",
      qtyKey: "qty_shorts",
      priceKey: "price_shorts",
      params: ["size_shorts", "color"]
    },
    {
      id: "socks",
      title: "Football Socks",
      qtyKey: "qty_socks",
      priceKey: "price_socks",
      params: ["size_socks", "color"]
    }
  ],
  other: [
    {
      id: "caps",
      title: "Caps",
      qtyKey: "qty_caps",
      priceKey: "price_caps",
      baseFields: ["cap"],
      params: ["style_cap", "logo_cap", "visor_cap", "fastener_cap", "size_cap"]
    }
  ]
};

const JERSEY_PRICING_BY_SPORT = {
  hockey: [
    { value: "Sublimated", price: 35 },
    { value: "Embroidered", price: 72 },
    { value: "Complex", price: 82 }
  ],
  football: [{ value: "Complex", price: 22 }]
};

const PRICE_FIELD_META = {
  priceJersey: {
    label: "Jersey price",
    defaultValue: 22,
    columnKey: "price_jersey"
  },
  priceShorts: {
    label: "Shorts price",
    defaultValue: 7.7,
    columnKey: "price_shorts"
  },
  priceSocks: {
    label: "Socks price",
    defaultValue: 0,
    columnKey: "price_socks"
  },
  priceCaps: {
    label: "Caps price",
    defaultValue: 0,
    columnKey: "price_caps"
  }
};

function setStepEnabled(stepEl, enabled) {
  stepEl.disabled = !enabled;
  stepEl.classList.toggle("is-locked", !enabled);
}

function getSelectedProductsSet() {
  return new Set(Array.from(form.querySelectorAll('input[name="products"]:checked')).map((el) => el.value));
}

function getJerseyPricingOptions() {
  return JERSEY_PRICING_BY_SPORT[sportSelect.value] || [{ value: "Complex", price: 22 }];
}

function getDefaultJerseyPricingMode() {
  const options = getJerseyPricingOptions();
  return options.length > 0 ? options[0].value : "Complex";
}

function getJerseyPriceByMode(mode) {
  const options = getJerseyPricingOptions();
  const found = options.find((item) => item.value === mode);
  return found ? Number(found.price) : Number(PRICE_FIELD_META.priceJersey.defaultValue);
}

function renderSimplePriceField(name, previousValues) {
  const meta = PRICE_FIELD_META[name];
  if (!meta) return;
  const label = document.createElement("label");
  label.textContent = meta.label;

  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.1";
  input.name = name;
  input.value = previousValues[name] || String(meta.defaultValue);

  label.appendChild(input);
  pricingFields.appendChild(label);
}

function renderPricingFields() {
  const previousValues = Object.fromEntries(Array.from(pricingFields.querySelectorAll("[name]")).map((el) => [el.name, el.value]));
  pricingFields.innerHTML = "";

  const selectedProducts = getSelectedProductsSet();
  if (selectedProducts.has("jersey")) {
    const methodLabel = document.createElement("label");
    methodLabel.textContent = "Jersey type";
    const methodSelect = document.createElement("select");
    methodSelect.name = "jerseyPricingMode";

    const options = getJerseyPricingOptions();
    const defaultMode = options.some((opt) => opt.value === previousValues.jerseyPricingMode)
      ? previousValues.jerseyPricingMode
      : getDefaultJerseyPricingMode();

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.value;
      methodSelect.appendChild(option);
    });
    methodSelect.value = defaultMode;
    methodLabel.appendChild(methodSelect);
    pricingFields.appendChild(methodLabel);

    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Jersey price";
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "0.1";
    priceInput.name = "priceJersey";
    priceInput.value = previousValues.priceJersey || String(getJerseyPriceByMode(defaultMode));
    methodSelect.addEventListener("change", () => {
      priceInput.value = String(getJerseyPriceByMode(methodSelect.value));
    });
    priceLabel.appendChild(priceInput);
    pricingFields.appendChild(priceLabel);
  }
  if (selectedProducts.has("shorts")) renderSimplePriceField("priceShorts", previousValues);
  if (selectedProducts.has("socks")) renderSimplePriceField("priceSocks", previousValues);
  if (selectedProducts.has("caps")) renderSimplePriceField("priceCaps", previousValues);
}

function updateProgressiveVisibility() {
  const isOrderInfoReady = Boolean(languageSelect.value) && Boolean(sportSelect.value);
  setStepEnabled(productsStep, isOrderInfoReady);

  if (!isOrderInfoReady) {
    setStepEnabled(pricingStep, false);
    pricingFields.innerHTML = "";
    return;
  }

  const hasSelectedProducts = getSelectedProductsSet().size > 0;
  setStepEnabled(pricingStep, hasSelectedProducts);
  renderPricingFields();
}

function createOptionCheckbox(list, value) {
  const label = document.createElement("label");
  label.className = "tiny-check";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "__unused__";
  input.value = value;
  input.checked = true;

  label.appendChild(input);
  label.append(` ${value}`);
  list.appendChild(label);
}

function syncOptionGroupInputNames(optionGroup, productId, paramKey, enabled) {
  optionGroup.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.name = enabled ? `param_values__${productId}__${paramKey}` : "__unused__";
  });
}

function setOptionGroupEnabled(optionGroup, productId, paramKey, enabled) {
  syncOptionGroupInputNames(optionGroup, productId, paramKey, enabled);
  optionGroup.classList.toggle("is-disabled", !enabled);
  optionGroup.querySelectorAll("input, button").forEach((el) => {
    el.disabled = !enabled;
  });
}

function createOptionGroup(productId, paramKey, options) {
  const wrapper = document.createElement("div");
  wrapper.className = "param-options";
  wrapper.dataset.paramOptions = paramKey;
  wrapper.dataset.productId = productId;
  wrapper.hidden = true;

  const title = document.createElement("div");
  title.className = "param-options-title";
  title.textContent = `Select ${COLUMN_META[paramKey].label.toLowerCase()} values`;
  wrapper.appendChild(title);

  const list = document.createElement("div");
  list.className = "param-options-list";
  options.forEach((opt) => {
    createOptionCheckbox(list, opt);
  });

  wrapper.appendChild(list);

  if (paramKey === "color") {
    const customWrap = document.createElement("div");
    customWrap.className = "custom-color-input";

    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.placeholder = "Custom color (e.g. Neon Green, #39FF14)";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-add-color";
    addBtn.textContent = "Add";

    const addCustomColor = () => {
      const raw = customInput.value.trim();
      if (!raw) return;

      const exists = Array.from(list.querySelectorAll('input[type="checkbox"]')).some(
        (input) => input.value.toLowerCase() === raw.toLowerCase()
      );
      if (exists) {
        customInput.value = "";
        return;
      }

      createOptionCheckbox(list, raw);
      const enabled = !wrapper.hidden;
      syncOptionGroupInputNames(wrapper, productId, paramKey, enabled);
      customInput.value = "";
    };

    addBtn.addEventListener("click", addCustomColor);
    customInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomColor();
      }
    });

    customWrap.appendChild(customInput);
    customWrap.appendChild(addBtn);
    wrapper.appendChild(customWrap);
  }

  return wrapper;
}

function getParamOptionsForSport(paramKey, sport) {
  const sportOptions = SIZE_OPTIONS_BY_SPORT[sport];
  if (sportOptions && Array.isArray(sportOptions[paramKey]) && sportOptions[paramKey].length > 0) {
    return sportOptions[paramKey];
  }
  const meta = COLUMN_META[paramKey];
  return meta && Array.isArray(meta.options) ? meta.options : [];
}

function renderProducts() {
  productsContainer.innerHTML = "";
  const isOrderInfoReady = Boolean(languageSelect.value) && Boolean(sportSelect.value);
  if (!isOrderInfoReady) {
    return;
  }
  const sport = sportSelect.value;
  const products = PRODUCTS_BY_SPORT[sport] || [];

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const topLabel = document.createElement("label");
    topLabel.className = "product-toggle";

    const productToggle = document.createElement("input");
    productToggle.type = "checkbox";
    productToggle.name = "products";
    productToggle.value = product.id;
    productToggle.dataset.productToggle = "1";

    const strong = document.createElement("strong");
    strong.textContent = product.title;

    topLabel.appendChild(productToggle);
    topLabel.appendChild(strong);
    card.appendChild(topLabel);

    const paramsWrap = document.createElement("div");
    paramsWrap.className = "product-params";
    paramsWrap.hidden = true;

    product.params.forEach((paramKey) => {
      const paramMeta = COLUMN_META[paramKey];
      const paramLabel = document.createElement("label");
      paramLabel.className = "tiny-check";

      const paramInput = document.createElement("input");
      paramInput.type = "checkbox";
      paramInput.name = `params__${product.id}`;
      paramInput.value = paramKey;
      paramInput.dataset.paramKey = paramKey;

      paramLabel.appendChild(paramInput);
      paramLabel.append(` ${paramMeta.label}`);
      paramsWrap.appendChild(paramLabel);

      if (paramMeta.type === "select" && Array.isArray(paramMeta.options)) {
        const optionGroup = createOptionGroup(product.id, paramKey, getParamOptionsForSport(paramKey, sport));
        paramsWrap.appendChild(optionGroup);
        optionGroup.hidden = false;
        setOptionGroupEnabled(optionGroup, product.id, paramKey, false);

        paramInput.addEventListener("change", () => {
          setOptionGroupEnabled(optionGroup, product.id, paramKey, paramInput.checked);
        });
      }
    });

    productToggle.addEventListener("change", () => {
      paramsWrap.hidden = !productToggle.checked;
      if (productToggle.checked) {
        paramsWrap
          .querySelectorAll(".param-options")
          .forEach((el) => {
            el.hidden = false;
          });
      }
      if (!productToggle.checked) {
        paramsWrap
          .querySelectorAll(`input[name="params__${product.id}"]`)
          .forEach((input) => {
            input.checked = false;
          });
        paramsWrap
          .querySelectorAll('[data-param-options] input[type="checkbox"]')
          .forEach((input) => {
            input.checked = true;
          });
        paramsWrap
          .querySelectorAll('[data-param-options]')
          .forEach((optionGroup) => {
            const paramKey = optionGroup.dataset.paramOptions;
            if (!paramKey) return;
            setOptionGroupEnabled(optionGroup, product.id, paramKey, false);
          });
      }
      updateProgressiveVisibility();
    });

    card.appendChild(paramsWrap);
    productsContainer.appendChild(card);
  });

  updateProgressiveVisibility();
}

function getSelectedOptions(productId, paramKey, fallback) {
  const selected = Array.from(
    form.querySelectorAll(`input[name="param_values__${productId}__${paramKey}"]:checked`)
  ).map((el) => el.value);
  const unique = Array.from(new Set(selected));
  return unique.length > 0 ? unique : fallback;
}

function buildCustomColumns({
  jerseyPricingMode,
  priceJersey,
  priceShorts,
  priceSocks,
  priceCaps
}) {
  const selectedProducts = getSelectedProductsSet();
  const sport = sportSelect.value;

  const columns = [COLUMN_META.name, COLUMN_META.number];
  let hasMeasureColumns = false;

  const products = PRODUCTS_BY_SPORT[sportSelect.value] || [];
  products.forEach((product) => {
    if (!selectedProducts.has(product.id)) return;

    (product.baseFields || []).forEach((fieldKey) => {
      if (COLUMN_META[fieldKey]) {
        columns.push(COLUMN_META[fieldKey]);
      }
    });

    const selectedParams = new Set(
      Array.from(form.querySelectorAll(`input[name="params__${product.id}"]:checked`)).map(
        (el) => el.value
      )
    );

    product.params.forEach((paramKey) => {
      if (!selectedParams.has(paramKey)) return;
      const base = COLUMN_META[paramKey];
      if ((paramKey === "size" || paramKey === "size_shorts") && !hasMeasureColumns) {
        columns.push(COLUMN_META.height_cm, COLUMN_META.weight_kg);
        hasMeasureColumns = true;
      }
      const nextCol = { ...base };
      nextCol.options = getParamOptionsForSport(paramKey, sportSelect.value);

      if (nextCol.type === "select" && Array.isArray(nextCol.options)) {
        nextCol.options = getSelectedOptions(product.id, paramKey, nextCol.options);
      }

      columns.push(nextCol);
    });

    columns.push(COLUMN_META[product.qtyKey]);
  });

  if (selectedProducts.has("jersey")) {
    columns.push({ ...COLUMN_META.price_jersey, default: priceJersey });
  }
  if (selectedProducts.has("shorts")) {
    columns.push({ ...COLUMN_META.price_shorts, default: priceShorts });
  }
  if (selectedProducts.has("socks")) {
    columns.push({ ...COLUMN_META.price_socks, default: priceSocks });
  }
  if (selectedProducts.has("caps")) {
    columns.push({ ...COLUMN_META.price_caps, default: priceCaps });
  }

  columns.push({
    ...COLUMN_META.total_price,
    priceJersey,
    jerseyPricingMode,
    priceShorts,
    priceSocks,
    priceCaps
  });

  return columns;
}

async function loadOrders() {
  const res = await fetch("/api/orders");
  if (res.status === 401) {
    window.location.href = "/";
    return;
  }
  const data = await res.json();
  if (!data.orders || data.orders.length === 0) {
    ordersList.textContent = "No orders yet";
    return;
  }

  const list = document.createElement("div");
  data.orders.forEach((order) => {
    const item = document.createElement("div");
    item.className = "order-item";
    const link = document.createElement("a");
    link.href = `/orders/${order.slug}`;
    link.textContent = `${order.title} (${order.slug})`;
    link.style.color = "#1a5a45";
    link.style.fontWeight = "600";
    item.appendChild(link);

    const actions = document.createElement("div");
    actions.className = "order-actions";

    const fullBtn = document.createElement("a");
    fullBtn.className = "mini-btn";
    fullBtn.href = `/orders/${order.slug}?pdf=full`;
    fullBtn.textContent = "Save full";
    fullBtn.target = "_blank";
    actions.appendChild(fullBtn);

    const factoryBtn = document.createElement("a");
    factoryBtn.className = "mini-btn";
    factoryBtn.href = `/orders/${order.slug}?pdf=factory`;
    factoryBtn.textContent = "Save factory";
    factoryBtn.target = "_blank";
    actions.appendChild(factoryBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "mini-btn mini-btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      const shouldDelete = window.confirm(`Delete order "${order.title}" (${order.slug})?`);
      if (!shouldDelete) return;
      const delRes = await fetch(`/api/orders/${order.slug}`, { method: "DELETE" });
      const delData = await delRes.json().catch(() => ({}));
      if (!delRes.ok) {
        resultEl.textContent = delData.error || "Failed to delete order";
        return;
      }
      resultEl.textContent = `Deleted: ${order.slug}`;
      loadOrders();
    });
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    list.appendChild(item);
  });
  ordersList.innerHTML = "";
  ordersList.appendChild(list);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultEl.textContent = "";

  const selectedProducts = Array.from(form.querySelectorAll('input[name="products"]:checked'));
  if (selectedProducts.length === 0) {
    resultEl.textContent = "Select at least one product";
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.jerseyPricingMode = payload.jerseyPricingMode || getDefaultJerseyPricingMode();

  const readPrice = (name) => {
    const meta = PRICE_FIELD_META[name];
    const raw = payload[name];
    if (typeof raw === "undefined" || raw === "") {
      if (name === "priceJersey") return getJerseyPriceByMode(payload.jerseyPricingMode);
      return meta ? Number(meta.defaultValue) : 0;
    }
    return Number(raw);
  };

  payload.rowsCount = Number(payload.rowsCount || 20);
  payload.priceJersey = readPrice("priceJersey");
  payload.priceShorts = readPrice("priceShorts");
  payload.priceSocks = readPrice("priceSocks");
  payload.priceCaps = readPrice("priceCaps");

  const customColumns = buildCustomColumns({
    jerseyPricingMode: payload.jerseyPricingMode,
    priceJersey: payload.priceJersey,
    priceShorts: payload.priceShorts,
    priceSocks: payload.priceSocks,
    priceCaps: payload.priceCaps
  });

  payload.columnsKeys = customColumns.map((col) => col.key);
  payload.customColumns = customColumns;

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.status === 401) {
    window.location.href = "/";
    return;
  }

  const data = await res.json();
  if (!res.ok) {
    resultEl.textContent = data.error || "Error";
    return;
  }

  resultEl.innerHTML = `Created: <a href="/orders/${data.slug}">/orders/${data.slug}</a>`;
  form.reset();
  productsContainer.innerHTML = "";
  pricingFields.innerHTML = "";
  setStepEnabled(productsStep, false);
  setStepEnabled(pricingStep, false);
  loadOrders();
});

languageSelect.addEventListener("change", () => {
  renderProducts();
  updateProgressiveVisibility();
});
sportSelect.addEventListener("change", () => {
  renderProducts();
  updateProgressiveVisibility();
});

setStepEnabled(productsStep, false);
setStepEnabled(pricingStep, false);
loadOrders();
