const orderTitleEl = document.getElementById("order-title");
const sheetEl = document.getElementById("sheet");
const cardsEl = document.getElementById("cards");
const pdfButton = document.getElementById("download-pdf");
const actionsEl = document.querySelector(".actions");
const pdfMode = new URLSearchParams(window.location.search).get("pdf");
const saveTimers = new Map();
let order = null;
let rows = [];
let editableColKeys = [];
let editableColIndexByKey = {};
let hidePrices = false;

const sizeChart = [
  { size: "XS", height: [150, 160], weight: [40, 45] },
  { size: "S", height: [160, 165], weight: [45, 50] },
  { size: "M", height: [165, 170], weight: [50, 55] },
  { size: "L", height: [170, 175], weight: [55, 60] },
  { size: "XL", height: [175, 180], weight: [60, 70] },
  { size: "2XL", height: [180, 185], weight: [70, 80] },
  { size: "3XL", height: [185, 190], weight: [80, 90] },
  { size: "4XL", height: [190, 195], weight: [90, 100] }
];

const hockeySizeChart = [
  { size: "110", height: [105, 115] },
  { size: "120", height: [116, 125] },
  { size: "130", height: [126, 135] },
  { size: "140", height: [136, 145] },
  { size: "150", height: [146, 155] },
  { size: "160/M", height: [156, 165] },
  { size: "170/L", height: [166, 175] },
  { size: "180/XL", height: [176, 185] },
  { size: "190/XXL", height: [186, 195] },
  { size: "190/3XL", height: [196, 999] }
];

let unitByKey = {};

function getSlug() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "orders" && parts[1]) return parts[1];
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

function inRange(value, range) {
  return value >= range[0] && value <= range[1];
}

function suggestSize(rowData) {
  const height = Number(rowData.height_cm);
  const weight = Number(rowData.weight_kg);
  const hasHeight = Number.isFinite(height) && height > 0;
  const hasWeight = Number.isFinite(weight) && weight > 0;
  // if order configured as Hockey, use height-only hockey chart
  if (order && order.config && order.config.sport === "Hockey") {
    if (!hasHeight) return null;
    const match = hockeySizeChart.find((r) => inRange(height, r.height));
    if (match) return { size: match.size, mode: "match" };
    return null;
  }

  if (!hasHeight || !hasWeight) return null;
  if (height >= 200 && weight >= 100) return { size: "5XL", mode: "match" };

  const match = sizeChart.find((row) => {
    const okHeight = hasHeight ? inRange(height, row.height) : true;
    const okWeight = hasWeight ? inRange(weight, row.weight) : true;
    return okHeight && okWeight;
  });

  if (match) return { size: match.size, mode: "match" };

  let best = null;
  sizeChart.forEach((row) => {
    const hDist = inRange(height, row.height)
      ? 0
      : Math.min(Math.abs(height - row.height[0]), Math.abs(height - row.height[1]));
    const wDist = inRange(weight, row.weight)
      ? 0
      : Math.min(Math.abs(weight - row.weight[0]), Math.abs(weight - row.weight[1]));
    const score = hDist + wDist;
    if (!best || score < best.score) {
      best = { size: row.size, score };
    }
  });

  return best ? { size: best.size, mode: "nearest" } : null;
}

function updateSuggestionElement(el, row) {
  const suggested = suggestSize(row.data);
  if (!suggested) {
    el.style.display = "none";
    el.dataset.suggested = "";
    return;
  }
  el.style.display = "flex";
  el.dataset.suggested = suggested.size;
  el.dataset.mode = suggested.mode;
  const text = el.querySelector(".suggestion-text");
  if (text) {
    text.textContent =
      suggested.mode === "nearest"
        ? `Nearest size: ${suggested.size}`
        : `Suggested: ${suggested.size}`;
  }
}

function updateSuggestionElements(row) {
  document
    .querySelectorAll(`.suggestion[data-row-id=\"${row.id}\"]`)
    .forEach((el) => updateSuggestionElement(el, row));
}

function renderSuggestion(col, row, container, onApply) {
  if (!(col.key === "size" || col.key === "size_shorts")) return;
  const hint = document.createElement("div");
  hint.className = "suggestion";
  hint.dataset.suggestionFor = col.key;
  hint.dataset.rowId = row.id;

  const text = document.createElement("span");
  text.className = "suggestion-text";

  hint.appendChild(text);
  container.appendChild(hint);
  updateSuggestionElement(hint, row);
}

function getColumnDefault(col) {
  if (col.type === "fixed" && typeof col.default !== "undefined") return col.default;
  return "";
}

function getValue(rowData, col) {
  if (col.type === "fixed") return getColumnDefault(col);
  if (col.type === "formula") return computeFormula(rowData, col);
  const value = rowData[col.key];
  return typeof value === "undefined" ? "" : value;
}

function computeFormula(rowData, col) {
  if (col.key === "total_price") {
    const qtyJersey = Number(rowData.qty_jersey || 0);
    const qtyShorts = Number(rowData.qty_shorts || 0);
    const qtySocks = Number(rowData.qty_socks || 0);
    const priceJersey = Number(rowData.price_jersey || col.priceJersey || getPriceDefault("price_jersey"));
    const priceShorts = Number(rowData.price_shorts || col.priceShorts || getPriceDefault("price_shorts"));
    const priceSocks = Number(rowData.price_socks || col.priceSocks || getPriceDefault("price_socks"));
    const total = qtyJersey * priceJersey + qtyShorts * priceShorts + qtySocks * priceSocks;
    return Number.isFinite(total) ? total.toFixed(2) : "0.00";
  }
  return "";
}

function getPriceDefault(key) {
  const priceCol = order.columns.find((col) => col.key === key);
  return priceCol && typeof priceCol.default !== "undefined" ? priceCol.default : 0;
}

function getEditableColumns() {
  return order ? order.columns.filter((col) => col.type !== "fixed" && col.type !== "formula") : [];
}

function focusNextEditable(current) {
  if (!sheetEl) return;
  const list = Array.from(sheetEl.querySelectorAll("input.cell-input, select.cell-select"));
  const index = list.indexOf(current);
  if (index < 0) return;
  const next = list[index + 1];
  if (next) next.focus();
}

function setupActions() {
  if (!actionsEl) return;
  actionsEl.innerHTML = "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "";
}

function formatPdfCell(col, value) {
  if (value === null || typeof value === "undefined") return "";
  if (col.key === "total_price" || col.key.startsWith("price_")) {
    return formatMoney(value);
  }
  return String(value);
}

function getPdfColumns() {
  if (pdfMode === "factory") {
    return order.columns.filter(
      (col) =>
        col.key !== "price_jersey" &&
        col.key !== "price_shorts" &&
        col.key !== "price_socks" &&
        col.key !== "total_price"
    );
  }
  return order.columns;
}

function isRowZeroQuantity(rowData) {
  const qtyJersey = Number(rowData.qty_jersey || 0);
  const qtyShorts = Number(rowData.qty_shorts || 0);
  const qtySocks = Number(rowData.qty_socks || 0);
  return qtyJersey === 0 && qtyShorts === 0 && qtySocks === 0;
}

function getPdfMeta() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const currencyLabel = (order.unitLabels && order.unitLabels.currency) || "EUR";
  const totalPrice = sumTotalPrice();
  return { dateLabel, timeLabel, currencyLabel, totalPrice };
}

function getPdfStyles() {
  return `
      :root {
        --ink: #0b0f0d;
        --muted: #55605a;
        --line: #d8ddd7;
        --brand: #0f3d2e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Space Grotesk", "IBM Plex Sans", "Avenir Next", "Helvetica Neue", sans-serif;
        color: var(--ink);
        background: #fff;
      }
      .page {
        padding: 24px 6px 6px;
        width: 100%;
      }
      .header {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
        border-bottom: 2px solid var(--line);
        padding-bottom: 12px;
      }
      .logo {
        width: 100px;
        height: auto;
        object-fit: contain;
      }
      .title {
        display: grid;
        gap: 6px;
      }
      .title h1 {
        margin: 0;
        font-size: 24px;
      }
      .meta {
        font-size: 12px;
        color: var(--muted);
      }
      .summary {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .summary-card {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px;
      }
      .summary-card span {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        margin-bottom: 6px;
      }
      .summary-card strong {
        font-size: 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        font-size: 9px;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid var(--line);
        padding: 4px 5px;
        text-align: left;
        word-break: break-word;
      }
      th {
        font-size: 8px;
        letter-spacing: 0.02em;
      }
      th {
        background: #eef2ee;
        font-weight: 600;
      }
      tr:nth-child(even) td {
        background: #fafbf8;
      }
      .index {
        width: 28px;
        text-align: center;
        font-weight: 600;
        background: #f4f6f2;
      }
      .total-row td {
        font-weight: 700;
        background: #f4f8f2;
      }
      .note {
        margin-top: 16px;
        font-size: 10px;
        color: var(--muted);
      }
      @page {
        size: A4;
        margin: 18mm 6mm 6mm 6mm;
      }
      @media print {
        .page { padding: 0; }
      }
  `;
}

function getPdfBodyHtml() {
  const { dateLabel, timeLabel, currencyLabel, totalPrice } = getPdfMeta();
  const pdfColumns = getPdfColumns();

  const columnHeaders = pdfColumns.map((col) => {
    const unit = unitByKey[col.key];
    const label = unit ? `${col.label} (${unit})` : col.label;
    return `<th>${escapeHtml(label)}</th>`;
  });

  const bodyRows = rows
    .filter((row) => !isRowZeroQuantity(row.data || {}))
    .map((row, idx) => {
      const cells = pdfColumns
        .map((col) => {
          const value = getValue(row.data, col);
          return `<td>${escapeHtml(formatPdfCell(col, value))}</td>`;
        })
        .join("");
      return `<tr><td class="index">${idx + 1}</td>${cells}</tr>`;
    })
    .join("");

  const footerCells = pdfColumns
    .map((col) => {
      if (col.key === "qty_jersey" || col.key === "qty_shorts" || col.key === "qty_socks") {
        return `<td>${escapeHtml(sumColumn(col.key))}</td>`;
      }
      if (col.key === "total_price") {
        return `<td>${escapeHtml(formatMoney(totalPrice))}</td>`;
      }
      return "<td></td>";
    })
    .join("");

  const summaryCards = [];
  summaryCards.push(`
        <div class="summary-card">
          <span>Total rows</span>
          <strong>${escapeHtml(rows.length)}</strong>
        </div>`);
  if (pdfMode !== "factory") {
    summaryCards.push(`
        <div class="summary-card">
          <span>Total price</span>
          <strong>${escapeHtml(formatMoney(totalPrice))} ${escapeHtml(currencyLabel)}</strong>
        </div>`);
  } else {
    summaryCards.push(`
        <div class="summary-card">
          <span>Prices</span>
          <strong>Hidden</strong>
        </div>`);
  }
  summaryCards.push(`
        <div class="summary-card">
          <span>Units</span>
          <strong>${escapeHtml(currencyLabel)}</strong>
        </div>`);

  return `
      <div class="header">
        <img class="logo" id="pdf-logo" src="/logo_black.png" alt="NinetyTwo" />
        <div class="title">
          <h1>${escapeHtml(order.title)}</h1>
          <div class="meta">Order ID: ${escapeHtml(order.slug)}</div>
          <div class="meta">Generated: ${escapeHtml(dateLabel)} ${escapeHtml(timeLabel)}</div>
        </div>
      </div>
      <div class="summary">
        ${summaryCards.join("")}
      </div>
      <table>
        <thead>
          <tr><th>#</th>${columnHeaders.join("")}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
        <tfoot>
          <tr class="total-row"><td>TOTAL</td>${footerCells}</tr>
        </tfoot>
      </table>
      <div class="note">Values reflect current order data</div>
  `;
}

function buildPdfHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(order.title)} - PDF</title>
    <style>${getPdfStyles()}</style>
  </head>
  <body>
    <div class="page">
      ${getPdfBodyHtml()}
    </div>
  </body>
</html>`;
}

function exportPdf() {
  if (!order) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to save the PDF.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPdfHtml());
  printWindow.document.close();

  const finish = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  const logo = printWindow.document.getElementById("pdf-logo");
  const fontsReady = printWindow.document.fonts ? printWindow.document.fonts.ready : Promise.resolve();

  Promise.all([
    fontsReady,
    new Promise((resolve) => {
      if (!logo) return resolve();
      if (logo.complete) return resolve();
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    })
  ]).then(() => setTimeout(finish, 100));
}

function renderPdfInPlace() {
  const appPage = document.querySelector(".page");
  if (appPage) {
    appPage.style.display = "none";
  }

  const styleEl = document.createElement("style");
  styleEl.textContent = `
    ${getPdfStyles()}
    body { background: #fff; }
  `;
  document.head.appendChild(styleEl);

  const pdfRoot = document.createElement("div");
  pdfRoot.className = "page";
  pdfRoot.innerHTML = getPdfBodyHtml();
  document.body.appendChild(pdfRoot);

  setTimeout(() => {
    window.print();
  }, 100);
}

function scheduleSave(rowId) {
  if (saveTimers.has(rowId)) clearTimeout(saveTimers.get(rowId));
  const timer = setTimeout(() => saveRow(rowId), 600);
  saveTimers.set(rowId, timer);
}

async function saveRow(rowId) {
  const row = rows.find((r) => r.id === rowId);
  if (!row) return;
  await fetch(`/api/orders/${order.slug}/rows/${rowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: row.data })
  });
}

async function deleteRowById(rowId) {
  await fetch(`/api/orders/${order.slug}/rows/${rowId}`, { method: "DELETE" });
  rows = rows.filter((row) => row.id !== rowId);
  renderTable();
  renderCards();
}

function handlePaste(event) {
  const target = document.activeElement;
  if (!target || !target.dataset) return;
  const startRow = Number(target.dataset.rowIdx);
  const startCol = Number(target.dataset.colIdx);
  if (!Number.isFinite(startRow) || !Number.isFinite(startCol)) return;

  const text = (event.clipboardData || window.clipboardData).getData("text");
  if (!text) return;
  event.preventDefault();

  const lines = text.replace(/\r/g, "").split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (lines.length === 0) return;

  const updated = new Set();
  lines.forEach((line, rIndex) => {
    const cells = line.split("\t");
    cells.forEach((rawCell, cIndex) => {
      const rowIndex = startRow + rIndex;
      const colIndex = startCol + cIndex;
      const row = rows[rowIndex];
      const key = editableColKeys[colIndex];
      if (!row || !key) return;
      const col = order.columns.find((c) => c.key === key);
      if (!col) return;
      let value = rawCell.trim();
      if (col.type === "number") value = value.replace(",", ".");
      if (col.type === "select" && !col.options.includes(value)) return;
      row.data[key] = value;
      updated.add(row.id);
    });
  });

  renderTable();
  renderCards();
  refreshTotals();
  updated.forEach((id) => saveRow(id));
}

function renderTable() {
  const editableColumns = getEditableColumns();
  editableColKeys = editableColumns.map((col) => col.key);
  editableColIndexByKey = editableColKeys.reduce((acc, key, idx) => {
    acc[key] = idx;
    return acc;
  }, {});

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const indexTh = document.createElement("th");
  indexTh.textContent = "#";
  indexTh.className = "sticky-col sticky-0 col-index";
  headRow.appendChild(indexTh);
  order.columns.forEach((col, colIndex) => {
    const th = document.createElement("th");
    const label = document.createElement("span");
    label.textContent = col.label;
    th.appendChild(label);
    if (unitByKey[col.key]) {
      const unit = document.createElement("span");
      unit.className = "unit-hint";
      unit.textContent = unitByKey[col.key];
      th.appendChild(unit);
    }
    th.classList.add(`col-${col.key}`);
    if (colIndex < 2) {
      th.classList.add("sticky-col", `sticky-${colIndex + 1}`);
    }
    headRow.appendChild(th);
  });
  const deleteTh = document.createElement("th");
  deleteTh.className = "delete-col";
  deleteTh.textContent = "";
  headRow.appendChild(deleteTh);
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.addEventListener("focusin", () => tr.classList.add("active-row"));
    tr.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!tr.contains(document.activeElement)) tr.classList.remove("active-row");
      }, 0);
    });
    const indexTd = document.createElement("td");
    indexTd.textContent = String(idx + 1);
    indexTd.className = "sticky-col sticky-0 col-index";
    tr.appendChild(indexTd);

    order.columns.forEach((col, colIndex) => {
      const td = document.createElement("td");
      td.classList.add(`col-${col.key}`);
      if (colIndex < 2) {
        td.classList.add("sticky-col", `sticky-${colIndex + 1}`);
      }
      if (col.type === "select") {
        const select = document.createElement("select");
        select.className = "cell-select";
        select.dataset.rowIdx = idx;
        select.dataset.colIdx = editableColIndexByKey[col.key];
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "";
        select.appendChild(empty);
        col.options.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        select.value = row.data[col.key] || "";
        select.addEventListener("change", (e) => {
          row.data[col.key] = e.target.value;
          scheduleSave(row.id);
          refreshTotals();
        });
        select.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            focusNextEditable(select);
          }
        });
        td.appendChild(select);
        renderSuggestion(col, row, td, (value) => {
          row.data[col.key] = value;
          select.value = value;
          scheduleSave(row.id);
          refreshTotals();
        });
      } else if (col.type === "fixed") {
        const span = document.createElement("div");
        span.className = "cell-readonly";
        span.textContent = getColumnDefault(col);
        td.appendChild(span);
        row.data[col.key] = getColumnDefault(col);
      } else if (col.type === "formula") {
        const span = document.createElement("div");
        span.className = "cell-readonly";
        span.textContent = computeFormula(row.data, col);
        td.appendChild(span);
      } else {
        const input = document.createElement("input");
        input.className = "cell-input";
        input.type = col.type === "number" ? "number" : "text";
        input.dataset.rowIdx = idx;
        input.dataset.colIdx = editableColIndexByKey[col.key];
        input.value = row.data[col.key] || "";
        input.addEventListener("input", (e) => {
          row.data[col.key] = e.target.value;
          scheduleSave(row.id);
          refreshTotals();
          if (col.key === "height_cm" || col.key === "weight_kg") {
            updateSuggestionElements(row);
          }
        });
        input.addEventListener("blur", () => {
          renderTable();
          renderCards();
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            focusNextEditable(input);
          }
        });
        td.appendChild(input);
      }
      tr.appendChild(td);
    });

    const deleteTd = document.createElement("td");
    deleteTd.className = "delete-col";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-row-btn";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => deleteRowById(row.id));
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    tbody.appendChild(tr);
  });

  const tfoot = document.createElement("tfoot");
  const totalRow = document.createElement("tr");
  totalRow.className = "footer-row";
  const totalLabel = document.createElement("td");
  totalLabel.textContent = "TOTAL";
  totalRow.appendChild(totalLabel);

  order.columns.forEach((col) => {
    const td = document.createElement("td");
    td.dataset.key = col.key;
    if (col.key === "qty_jersey" || col.key === "qty_shorts" || col.key === "qty_socks") {
      td.textContent = sumColumn(col.key).toString();
    } else if (col.key === "total_price") {
      td.textContent = sumTotalPrice().toFixed(2);
    } else {
      td.textContent = "";
    }
    totalRow.appendChild(td);
  });
  const totalDelete = document.createElement("td");
  totalDelete.className = "delete-col";
  totalRow.appendChild(totalDelete);

  const addRowTr = document.createElement("tr");
  addRowTr.className = "add-row";
  const addRowTd = document.createElement("td");
  addRowTd.colSpan = order.columns.length + 2;
  addRowTd.innerHTML = "<span class=\"plus\">+</span> Add new row";
  addRowTd.addEventListener("click", addRow);
  addRowTr.appendChild(addRowTd);

  tfoot.appendChild(addRowTr);
  tfoot.appendChild(totalRow);

  sheetEl.innerHTML = "";
  sheetEl.appendChild(thead);
  sheetEl.appendChild(tbody);
  sheetEl.appendChild(tfoot);

  if (!sheetEl.dataset.pasteBound) {
    sheetEl.addEventListener("paste", handlePaste);
    sheetEl.dataset.pasteBound = "1";
  }
}

function renderCards() {
  cardsEl.innerHTML = "";
  rows.forEach((row, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    const title = document.createElement("h3");
    title.textContent = `Row ${idx + 1}`;
    card.appendChild(title);

    order.columns.forEach((col) => {
      const label = document.createElement("label");
      label.dataset.key = col.key;
      const labelText = document.createElement("span");
      labelText.textContent = col.label;
      label.appendChild(labelText);
      if (unitByKey[col.key]) {
        const unit = document.createElement("span");
        unit.className = "unit-hint";
        unit.textContent = unitByKey[col.key];
        label.appendChild(unit);
      }

      if (col.type === "select") {
        const select = document.createElement("select");
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "";
        select.appendChild(empty);
        col.options.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        select.value = row.data[col.key] || "";
        select.addEventListener("change", (e) => {
          row.data[col.key] = e.target.value;
          scheduleSave(row.id);
          refreshTotals();
        });
        label.appendChild(select);
        renderSuggestion(col, row, label, (value) => {
          row.data[col.key] = value;
          select.value = value;
          scheduleSave(row.id);
          refreshTotals();
        });
      } else if (col.type === "fixed") {
        const readonly = document.createElement("div");
        readonly.className = "readonly";
        readonly.textContent = getColumnDefault(col);
        label.appendChild(readonly);
        row.data[col.key] = getColumnDefault(col);
      } else if (col.type === "formula") {
        const readonly = document.createElement("div");
        readonly.className = "readonly";
        readonly.textContent = computeFormula(row.data, col);
        label.appendChild(readonly);
      } else {
        const input = document.createElement("input");
        input.type = col.type === "number" ? "number" : "text";
        input.value = row.data[col.key] || "";
        input.addEventListener("input", (e) => {
          row.data[col.key] = e.target.value;
          scheduleSave(row.id);
          refreshTotals();
          if (col.key === "height_cm" || col.key === "weight_kg") {
            updateSuggestionElements(row);
          }
        });
        input.addEventListener("blur", () => {
          renderCards();
          renderTable();
        });
        label.appendChild(input);
      }

      card.appendChild(label);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-row-btn card-delete";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => deleteRowById(row.id));
    card.appendChild(deleteBtn);

    cardsEl.appendChild(card);
  });

  const addCard = document.createElement("div");
  addCard.className = "card add-card";
  addCard.innerHTML = "<div class=\"plus\">+</div><div>Add new row</div>";
  addCard.addEventListener("click", addRow);
  cardsEl.appendChild(addCard);
}

function sumColumn(key) {
  return rows.reduce((acc, row) => acc + Number(row.data[key] || 0), 0);
}

function sumTotalPrice() {
  return rows.reduce((acc, row) => {
    const qtyJersey = Number(row.data.qty_jersey || 0);
    const qtyShorts = Number(row.data.qty_shorts || 0);
    const qtySocks = Number(row.data.qty_socks || 0);
    const priceJersey = Number(row.data.price_jersey || getPriceDefault("price_jersey"));
    const priceShorts = Number(row.data.price_shorts || getPriceDefault("price_shorts"));
    const priceSocks = Number(row.data.price_socks || getPriceDefault("price_socks"));
    return acc + qtyJersey * priceJersey + qtyShorts * priceShorts + qtySocks * priceSocks;
  }, 0);
}

function refreshTotals() {
  const footer = sheetEl.querySelector("tfoot");
  if (!footer) return;
  const totalRow = footer.querySelector(".footer-row");
  if (!totalRow) return;
  order.columns.forEach((col) => {
    const cell = totalRow.querySelector(`td[data-key="${col.key}"]`);
    if (!cell) return;
    if (col.key === "qty_jersey" || col.key === "qty_shorts" || col.key === "qty_socks") {
      cell.textContent = sumColumn(col.key).toString();
    } else if (col.key === "total_price") {
      cell.textContent = sumTotalPrice().toFixed(2);
    }
  });
}

async function addRow() {
  const res = await fetch(`/api/orders/${order.slug}/rows`, { method: "POST" });
  const data = await res.json();
  rows.push({ id: data.id, data: {} });
  renderTable();
  renderCards();
}

async function loadOrder() {
  const slug = getSlug();
  if (!slug) {
    orderTitleEl.textContent = "Missing slug";
    return;
  }
  const res = await fetch(`/api/orders/${slug}`);
  if (!res.ok) {
    orderTitleEl.textContent = "Order not found";
    return;
  }
  order = await res.json();
  rows = order.rows.map((row) => ({ id: row.id, data: row.data || {} }));
  orderTitleEl.textContent = order.title;
  const pcsLabel = (order.unitLabels && order.unitLabels.pcs) || "pcs";
  const currencyLabel = (order.unitLabels && order.unitLabels.currency) || "EUR";
  unitByKey = {
    height_cm: "cm",
    weight_kg: "kg",
    qty_jersey: pcsLabel,
    qty_shorts: pcsLabel,
    qty_socks: pcsLabel,
    price_jersey: currencyLabel,
    price_shorts: currencyLabel,
    price_socks: currencyLabel,
    total_price: currencyLabel
  };
  renderTable();
  renderCards();
  setupActions();
}

if (pdfButton) {
  pdfButton.addEventListener("click", exportPdf);
}

loadOrder().then(() => {
  if (pdfMode === "full" || pdfMode === "factory") {
    renderPdfInPlace();
  }
});
