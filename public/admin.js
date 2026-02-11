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
const createColorBtn = document.getElementById("color-options")?.querySelector(".btn-add-color");
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
      const btn = document.getElementById("color-options")?.querySelector(".btn-add-color");
      if (btn) btn.click();
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
      const btn = document.getElementById("edit-btn-add-color");
      if (btn) btn.click();
    }
  });
}

function updatePriceFields() {
  const checked = new Set(
    Array.from(form.querySelectorAll("input[name=\"columns\"]:checked")).map((el) => el.value)
  );
  const priceInputs = form.querySelectorAll("[data-price-field]");
  priceInputs.forEach((input) => {
    const label = input.closest("label");
    if (!label) return;
    label.style.display = checked.has(input.dataset.priceField) ? "grid" : "none";
  });
}

function updateColorOptionsVisibility() {
  const colorCheckbox = form.querySelector("input[name=\"columns\"][value=\"jersey_color\"]");
  const el = document.getElementById("color-options");
  if (!el || !colorCheckbox) return;
  el.style.display = colorCheckbox.checked ? "block" : "none";
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

  // sport is included in formData, but colorOptions can be multiple values
  const colors = Array.from(form.querySelectorAll("input[name=\"colorOptions\"]:checked")).map((el) => el.value);
  payload.colorOptions = colors;
  
  // language is in formData, also ensure sport is present
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

function updateEditPriceFields() {
  const checked = new Set(
    Array.from(editForm.querySelectorAll("input[name=\"columns\"]:checked")).map((el) => el.value)
  );
  const priceInputs = editForm.querySelectorAll("[data-price-field]");
  priceInputs.forEach((input) => {
    const label = input.closest("label");
    if (!label) return;
    label.style.display = checked.has(input.dataset.priceField) ? "grid" : "none";
  });
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
  
  // Load prices - need to calculate them from columns
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
  updateEditPriceFields();
  
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
  
  const formData = new FormData(editForm);
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
    updateEditPriceFields();
  }
});

document.getElementById("cancel-edit").addEventListener("click", closeEditOrder);

loadOrders();
updatePriceFields();
form.addEventListener("change", (e) => {
  if (!e.target) return;
  if (e.target.name === "columns") {
    updatePriceFields();
    updateColorOptionsVisibility();
  }
});

// initial visibility on page load
setTimeout(updateColorOptionsVisibility, 100);
