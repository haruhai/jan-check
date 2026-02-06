const orderList = document.getElementById("orderList");
const toast = document.getElementById("toast");
const csvInput = document.getElementById("csvInput");

let orders = [];
let lastScan = "";
let lastScanTime = 0;

/* ===== 注文明細描画 ===== */
function renderOrders() {
  orderList.innerHTML = "";
  orders.forEach(o => {
    const li = document.createElement("li");
    if (o.scanned >= o.qty) li.classList.add("done");
    li.innerHTML = `
      <span>${o.name}</span>
      <span>${o.scanned}/${o.qty}</span>
    `;
    orderList.appendChild(li);
  });
}

/* ===== トースト ===== */
function showToast(message, type = "ok", duration = 800) {
  toast.textContent = message;
  toast.className = type;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, duration);
}

/* ===== CSV読み込み ===== */
csvInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    orders = [];
    const lines = reader.result.trim().split("\n");
    lines.shift(); // ヘッダ削除

    lines.forEach(line => {
      const [code, name, qty] = line.split(",");
      orders.push({
        code: code.trim(),
        name: name.trim(),
        qty: Number(qty),
        scanned: 0
      });
    });

    renderOrders();
    showToast("📄 CSV読み込み完了", "ok", 1000);
  };
  reader.readAsText(file, "utf-8");
});

/* ===== スキャン処理 ===== */
function handleScan(code) {
  const now = Date.now();

  if (code === lastScan && now - lastScanTime < 1500) return;
  lastScan = code;
  lastScanTime = now;

  const order = orders.find(o => o.code === code);

  if (!order) {
    showToast("❌ 注文リスト該当なし", "error", 1200);
    return;
  }

  if (order.scanned >= order.qty) {
    showToast("⚠️ すでに完了", "error", 800);
    return;
  }

  order.scanned++;
  renderOrders();
  showToast("OK", "ok", 600);
}

/* ===== カメラ起動 ===== */
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector("#camera"),
    constraints: {
      facingMode: "environment"
    }
  },
  decoder: {
    readers: ["ean_reader", "ean_13_reader", "code_128_reader"]
  }
}, err => {
  if (!err) Quagga.start();
});

Quagga.onDetected(data => {
  handleScan(data.codeResult.code);
});
