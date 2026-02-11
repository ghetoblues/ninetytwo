// Product definitions
const PRODUCT_CONFIG = {
  Hockey: {
    "Hockey Jerseys": {
      label: "Hockey Jerseys",
      fields: [
        { name: "name", label: "SURNAME", type: "checkbox" },
        { name: "number", label: "PLAYER NUMBER", type: "checkbox" },
        { name: "height_cm", label: "HEIGHT", type: "checkbox" },
        { name: "weight_kg", label: "WEIGHT", type: "checkbox" },
        { name: "size", label: "JERSEYS SIZE (Hockey Grid)", type: "checkbox" },
        { name: "jersey_color", label: "JERSEY COLOR", type: "checkbox" },
        { name: "qty_jersey", label: "JERSEY QUANTITY", type: "checkbox" },
        { name: "price_jersey", label: "JERSEY PRICE", type: "checkbox" }
      ]
    },
    "Hockey Shorts": {
      label: "Hockey Shorts",
      fields: [
        { name: "size_shorts", label: "SHORTS SIZE (Hockey Grid)", type: "checkbox" },
        { name: "jersey_color", label: "SHORTS COLOR (matches Jersey colors)", type: "checkbox" },
        { name: "qty_shorts", label: "SHORTS QUANTITY", type: "checkbox" },
        { name: "price_shorts", label: "SHORTS PRICE", type: "checkbox" }
      ]
    },
    "Hockey Socks": {
      label: "Hockey Socks",
      fields: [
        { name: "size_socks", label: "SOCKS SIZE", type: "checkbox" },
        { name: "jersey_color", label: "SOCKS COLOR (matches Jersey colors)", type: "checkbox" },
        { name: "qty_socks", label: "SOCKS QUANTITY", type: "checkbox" },
        { name: "price_socks", label: "SOCKS PRICE", type: "checkbox" }
      ]
    }
  },
  Football: {
    "Football Jerseys": {
      label: "Football Jerseys",
      fields: [
        { name: "name", label: "SURNAME", type: "checkbox" },
        { name: "number", label: "PLAYER NUMBER", type: "checkbox" },
        { name: "height_cm", label: "HEIGHT", type: "checkbox" },
        { name: "weight_kg", label: "WEIGHT", type: "checkbox" },
        { name: "size", label: "JERSEYS SIZE (Football Grid)", type: "checkbox" },
        { name: "jersey_color", label: "JERSEY COLOR", type: "checkbox" },
        { name: "qty_jersey", label: "JERSEY QUANTITY", type: "checkbox" },
        { name: "price_jersey", label: "JERSEY PRICE", type: "checkbox" }
      ]
    },
    "Football Shorts": {
      label: "Football Shorts",
      fields: [
        { name: "size_shorts", label: "SHORTS SIZE (Football Grid)", type: "checkbox" },
        { name: "jersey_color", label: "SHORTS COLOR (matches Jersey colors)", type: "checkbox" },
        { name: "qty_shorts", label: "SHORTS QUANTITY", type: "checkbox" },
        { name: "price_shorts", label: "SHORTS PRICE", type: "checkbox" }
      ]
    }
  },
  Other: {
    "Caps": {
      label: "Caps",
      fields: [
        { name: "cap_style", label: "STYLE (6 panel cap, trucker cap with mesh)", type: "checkbox" },
        { name: "cap_logo", label: "LOGO (Embroidery 3D)", type: "checkbox" },
        { name: "cap_visor", label: "VISOR (Curved)", type: "checkbox" },
        { name: "cap_fastener", label: "FASTENER (Plastic snap closure)", type: "checkbox" },
        { name: "cap_size", label: "CAP SIZE (Adult / Kids)", type: "checkbox" }
      ]
    }
  }
};

document.querySelector('.tabs-container').addEventListener('click', function(e) {
  const btn = e.target.closest('.tab-button');
  if (!btn) return;
  const tabName = btn.dataset.tab;
  // Remove active class from all buttons and contents
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabName).classList.add('active');
});

// Sport and Product Selection
const sportSelect = document.getElementById("sport-select");
const productsContainer = document.getElementById("products-container");
const optionsContainer = document.getElementById("options-container");

function renderProductCheckboxes() {
  const sport = sportSelect.value;
  const products = PRODUCT_CONFIG[sport] || {};
  
  productsContainer.innerHTML = "";
  
  Object.keys(products).forEach(productKey => {
    const product = products[productKey];
    const checkbox = document.createElement("div");
    checkbox.className = "product-checkbox";
    checkbox.innerHTML = `
      <input type="checkbox" name="selected-products" value="${productKey}" id="product-${productKey.replace(/\s+/g, "-").toLowerCase()}" />
      <label for="product-${productKey.replace(/\s+/g, "-").toLowerCase()}">${product.label}</label>
    `;
    
    checkbox.querySelector("input").addEventListener("change", () => {
      checkbox.classList.toggle("checked");
      renderProductOptions();
    });
    
    productsContainer.appendChild(checkbox);
  });
}

function renderProductOptions() {
  const sport = sportSelect.value;
  const selectedProducts = Array.from(document.querySelectorAll("input[name='selected-products']:checked")).map(el => el.value);
  
  optionsContainer.innerHTML = "";
  
  selectedProducts.forEach(productKey => {
    const product = PRODUCT_CONFIG[sport][productKey];
    if (!product) return;
    
    const section = document.createElement("div");
    section.className = "product-options active";
    section.innerHTML = `<h4>${product.label}</h4><div class="options-grid"></div>`;
    
    const grid = section.querySelector(".options-grid");
    
    product.fields.forEach(field => {
      const group = document.createElement("div");
      group.className = "form-group";
      group.innerHTML = `
        <label>
          <input type="checkbox" name="columns" value="${field.name}" />
          ${field.label}
        </label>
      `;
      grid.appendChild(group);
    });
    
    optionsContainer.appendChild(section);
  });
}

sportSelect.addEventListener("change", () => {
  renderProductCheckboxes();
  renderProductOptions();
});

// Initialize on page load
renderProductCheckboxes();

const form = document.getElementById("create-form");
const resultEl = document.getElementById("create-result");
const ordersList = document.getElementById("orders-list");

// Function to add custom color checkbox
function addCustomColorCheckbox(containerId, colorName, autoCheck = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Check if already exists
  const existing = Array.from(container.querySelectorAll("label")).find(
    label => label.textContent.trim().toLowerCase() === colorName.toLowerCase()
  );
  if (existing) {
    alert(`Color "${colorName}" already exists`);
    return;
  }
  
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "colorOptions";
  input.value = colorName;
  input.checked = autoCheck;
  
  label.appendChild(input);
  label.appendChild(document.createTextNode(" " + colorName));
  
  container.appendChild(label);
}

// Handle adding custom colors in create form
const createColorBtn = document.querySelector(".custom-color-input .btn-add-color");
if (createColorBtn) {
  createColorBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const input = document.getElementById("custom-color-input");
    const colorName = input.value.trim();
    
    if (!colorName) {
      alert("Please enter a color name");
      return;
    }
    
    addCustomColorCheckbox("color-options-container", colorName, true);
    input.value = "";
    input.focus();
  });
}

// Handle Enter key in custom color input (create form)
const createColorInput = document.getElementById("custom-color-input");
if (createColorInput) {
  createColorInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createColorBtn?.click();
    }
  });
}

// Handle adding custom colors in edit form
const editColorBtn = document.getElementById("edit-btn-add-color");
if (editColorBtn) {
  editColorBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const input = document.getElementById("edit-custom-color-input");
    const colorName = input.value.trim();
    
    if (!colorName) {
      alert("Please enter a color name");
      return;
    }
    
    addCustomColorCheckbox("edit-color-options-container", colorName, true);
    input.value = "";
    input.focus();
  });
}

// Handle Enter key in custom color input (edit form)
const editColorInput = document.getElementById("edit-custom-color-input");
if (editColorInput) {
  editColorInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editColorBtn?.click();
    }
  });
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

    const editBtn = document.createElement("button");
    editBtn.className = "mini-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      openEditOrder(order.slug);
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "mini-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm(`Delete order ${order.slug}? This cannot be undone.`)) return;
      const res = await fetch(`/api/orders/${order.slug}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Error deleting order");
        return;
      }
      loadOrders();
    });
    actions.appendChild(delBtn);

    item.appendChild(actions);
    list.appendChild(item);
  });
  ordersList.innerHTML = "";
  ordersList.appendChild(list);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultEl.textContent = "";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const columns = Array.from(form.querySelectorAll("input[name=\"columns\"]:checked")).map(
    (el) => el.value
  );
  payload.columnsKeys = columns;
  payload.unitPcsLabel = payload.unitPcsLabel || "pcs";
  payload.unitCurrencyLabel = payload.unitCurrencyLabel || "EUR";
  payload.rowsCount = Number(payload.rowsCount || 20);
  payload.priceJersey = Number(payload.priceJersey || 21.9);
  payload.priceShorts = Number(payload.priceShorts || 7.7);
  payload.priceSocks = Number(payload.priceSocks || 0);

  const colors = Array.from(form.querySelectorAll("input[name=\"colorOptions\"]:checked")).map((el) => el.value);
  payload.colorOptions = colors;
  
  payload.language = payload.language || "ENG";
  payload.sport = payload.sport || "Football";
  if (columns.length === 0) {
    resultEl.textContent = "Select at least one column";
    return;
  }

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
  loadOrders();
});

const editForm = document.getElementById("edit-form");
const editResultEl = document.getElementById("edit-result");
const editSection = document.getElementById("edit-section");

function updateEditColorOptionsVisibility() {
  const colorCheckbox = editForm.querySelector("input[name=\"columns\"][value=\"jersey_color\"]");
  const el = document.getElementById("edit-color-options");
  if (!el || !colorCheckbox) return;
  el.style.display = colorCheckbox.checked ? "block" : "none";
}

async function openEditOrder(slug) {
  const res = await fetch(`/api/orders/${slug}`);
  if (!res.ok) {
    alert("Failed to load order");
    return;
  }
  const order = await res.json();
  
  // Set slug
  document.getElementById("edit-slug").value = slug;
  
  // Load columns from order.columns
  const columnKeys = new Set(order.columns.map(col => col.key));
  editForm.querySelectorAll("input[name=\"columns\"]").forEach(checkbox => {
    checkbox.checked = columnKeys.has(checkbox.value);
  });
  
  // Clear custom colors from previous order
  const container = document.getElementById("edit-color-options-container");
  const defaultColors = ["Red", "Blue", "White", "Yellow", "Black", "Green", "Orange", "Purple", "Pink", "Gray"];
  const customLabels = Array.from(container.querySelectorAll("label")).filter(label => {
    const text = label.textContent.trim();
    return !defaultColors.includes(text);
  });
  customLabels.forEach(label => label.remove());
  
  // Load color options from config
  const colorOptions = order.config?.colorOptions || [];
  editForm.querySelectorAll("input[name=\"colorOptions\"]").forEach(checkbox => {
    checkbox.checked = colorOptions.includes(checkbox.value);
  });
  
  // Add custom colors from this order
  colorOptions.forEach(color => {
    if (!defaultColors.includes(color)) {
      addCustomColorCheckbox("edit-color-options-container", color, true);
    }
  });
  
  // Load prices
  const priceJerseyCol = order.columns.find(col => col.key === "price_jersey");
  const priceShortsCol = order.columns.find(col => col.key === "price_shorts");
  const priceSocksCol = order.columns.find(col => col.key === "price_socks");
  
  document.querySelector("#edit-form input[name=\"priceJersey\"]").value = priceJerseyCol?.default || "";
  document.querySelector("#edit-form input[name=\"priceShorts\"]").value = priceShortsCol?.default || "";
  document.querySelector("#edit-form input[name=\"priceSocks\"]").value = priceSocksCol?.default || "";
  
  // Load units
  const unitPcsLabel = order.unitLabels?.pcs || "pcs";
  const unitCurrencyLabel = order.unitLabels?.currency || "EUR";
  document.getElementById("edit-unitPcsLabel").value = unitPcsLabel;
  document.getElementById("edit-unitCurrencyLabel").value = unitCurrencyLabel;
  
  // Show edit section
  editSection.style.display = "block";
  updateEditColorOptionsVisibility();
  
  // Scroll to edit section
  editSection.scrollIntoView({ behavior: "smooth" });
}

function closeEditOrder() {
  editSection.style.display = "none";
  editResultEl.textContent = "";
  editForm.reset();
}

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  editResultEl.textContent = "";
  
  const slug = document.getElementById("edit-slug").value;
  if (!slug) {
    editResultEl.textContent = "Error: no slug";
    return;
  }
  
  const columns = Array.from(editForm.querySelectorAll("input[name=\"columns\"]:checked")).map(el => el.value);
  const colors = Array.from(editForm.querySelectorAll("input[name=\"colorOptions\"]:checked")).map(el => el.value);
  
  const payload = {
    columnsKeys: columns,
    colorOptions: colors,
    priceJersey: Number(document.querySelector("#edit-form input[name=\"priceJersey\"]").value || 0),
    priceShorts: Number(document.querySelector("#edit-form input[name=\"priceShorts\"]").value || 0),
    priceSocks: Number(document.querySelector("#edit-form input[name=\"priceSocks\"]").value || 0),
    unitPcsLabel: document.getElementById("edit-unitPcsLabel").value,
    unitCurrencyLabel: document.getElementById("edit-unitCurrencyLabel").value
  };
  
  const res = await fetch(`/api/orders/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (res.status === 401) {
    window.location.href = "/";
    return;
  }
  
  const data = await res.json();
  if (!res.ok) {
    editResultEl.textContent = data.error || "Error";
    return;
  }
  
  editResultEl.textContent = "Order updated successfully";
  setTimeout(() => closeEditOrder(), 1500);
  loadOrders();
});

editForm.addEventListener("change", (e) => {
  if (!e.target) return;
  if (e.target.name === "columns") {
    updateEditColorOptionsVisibility();
  }
});

document.getElementById("cancel-edit").addEventListener("click", closeEditOrder);

loadOrders();
