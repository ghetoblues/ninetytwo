const form = document.getElementById("login-form");
const resultEl = document.getElementById("login-result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultEl.textContent = "";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    resultEl.textContent = data.error || "Login error";
    return;
  }

  window.location.href = "/admin";
});
