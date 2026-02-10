const form = document.getElementById("create-form");
const resultEl = document.getElementById("create-result");
const ordersList = document.getElementById("orders-list");

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
  const colorColumnChecked = !!form.querySelector("input[name=\"columns\"][value=\"color\"]:checked");
  const el = document.getElementById("color-options");
  if (!el) return;
  el.style.display = colorColumnChecked ? "block" : "none";
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

loadOrders();
updatePriceFields();
form.addEventListener("change", (e) => {
  if (e.target && e.target.name === "columns") {
    updatePriceFields();
    updateColorOptionsVisibility();
  }
});
// initial visibility
updateColorOptionsVisibility();

// also show/hide when sport or color options change
form.addEventListener("input", (e) => {
  if (!e.target) return;
  if (e.target.name === "columns") updateColorOptionsVisibility();
});
