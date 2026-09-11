import {
  auth,
  db,
  storage,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
} from "./firebase.js";

let products = [];
let orders = [];
let editingId = null;

const $ = id => document.getElementById(id);

const money = n =>
  "" + Number(n || 0).toLocaleString("bn-BD");

// LOGIN
window.login = async function () {
  try {
    const email = $("user").value.trim();
    const password = $("pass").value;

    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Login failed: " + e.message);
  }
};

// LOGOUT
window.logout = async function () {
  await signOut(auth);
};

// AUTH STATE
onAuthStateChanged(auth, user => {
  if (user) {
    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");
    listenData();
  } else {
    $("login").classList.remove("hidden");
    $("app").classList.add("hidden");
  }
});

// PAGE
window.showPage = function (id, button) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.add("hidden")
  );

  $(id).classList.remove("hidden");

  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    categories: "Categories",
    settings: "Settings"
  };

  $("pageTitle").textContent = titles[id] || "Dashboard";

  document.querySelectorAll(".menu").forEach(x =>
    x.classList.remove("active")
  );

  if (button) button.classList.add("active");

  document.querySelector(".sidebar")?.classList.remove("show");
};

// FIRESTORE LISTEN
function listenData() {

  onSnapshot(
    query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    ),
    snapshot => {

      products = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      renderProducts();
      updateDashboard();
    },
    error => {
      console.error(error);
    }
  );

  onSnapshot(
    query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    ),
    snapshot => {

      orders = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      renderOrders();
      updateDashboard();
    },
    error => {
      console.error(error);
    }
  );
}

// DASHBOARD
function updateDashboard() {

  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;

  $("statNew").textContent =
    orders.filter(x => x.status === "").length;

  const sales = orders.reduce(
    (sum, x) => sum + Number(x.total || 0),
    0
  );

  $("statSales").textContent = money(sales);

  $("recentOrders").innerHTML =
    orders.slice(0, 5).map(x => `
      <div style="padding:10px;border-bottom:1px solid #eee">
        ${escapeHtml(x.customer || "Customer")}
         ${money(x.total)}
         ${escapeHtml(x.status || "")}
      </div>
    `).join("") || "<p> </p>";
}

// PRODUCTS
function renderProducts() {

  const table = $("productTable");

  if (!products.length) {
    table.innerHTML =
      `<tr><td colspan="5">  </td></tr>`;
    return;
  }

  table.innerHTML = products.map(p => `
    <tr>
      <td>
        ${
          p.imageUrl
            ? `<img src="${p.imageUrl}" width="55" style="height:55px;object-fit:cover;border-radius:8px">`
            : ""
        }
        ${escapeHtml(p.name || "")}
      </td>

      <td>${escapeHtml(p.category || "")}</td>

      <td>${money(p.price)}</td>

      <td>${escapeHtml(p.unit || "")}</td>

      <td>
        <button
          class="action"
          onclick="editProduct('${p.id}')">
          
        </button>

        <button
          class="action danger"
          onclick="deleteProduct('${p.id}')">
          
        </button>
      </td>
    </tr>
  `).join("");
}

// OPEN PRODUCT
window.openProduct = function () {

  editingId = null;

  $("modalTitle").textContent = " ";

  $("pName").value = "";
  $("pCategory").value = "";
  $("pPrice").value = "";
  $("pUnit").value = "";
  $("pEmoji").value = "";
  $("pBadge").value = "";
  $("pId").value = "";

  $("productModal").classList.remove("hidden");
};

// CLOSE
window.closeProduct = function () {
  $("productModal").classList.add("hidden");
};

// EDIT
window.editProduct = function (id) {

  const p = products.find(x => x.id === id);

  if (!p) return;

  editingId = id;

  $("modalTitle").textContent = " ";

  $("pName").value = p.name || "";
  $("pCategory").value = p.category || "";
  $("pPrice").value = p.price || "";
  $("pUnit").value = p.unit || "";
  $("pEmoji").value = p.emoji || "";
  $("pBadge").value = p.badge || "";
  $("pId").value = id;

  $("productModal").classList.remove("hidden");
};

// DELETE
window.deleteProduct = async function (id) {

  if (!confirm("   ?")) return;

  try {

    await deleteDoc(
      doc(db, "products", id)
    );

  } catch (e) {

    alert(e.message);
  }
};

// SAVE PRODUCT
window.saveProduct = async function () {

  const name = $("pName").value.trim();
  const category = $("pCategory").value.trim();
  const price = Number($("pPrice").value);
  const unit = $("pUnit").value.trim();
  const emoji = $("pEmoji").value.trim();
  const badge = $("pBadge").value.trim();

  if (!name || !price) {
    alert("    ");
    return;
  }

  try {

    const data = {
      name,
      category,
      price,
      unit,
      emoji,
      badge,
      updatedAt: serverTimestamp()
    };

    // IMAGE UPLOAD
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    /*
      HTML-  image input 
         Upload  
      browser file picker   
    */

    const chooseImage = confirm(
      "  Upload  ?\n\nOK =  \nCancel =   Save"
    );

    if (chooseImage) {

      fileInput.click();

      await new Promise(resolve => {
        fileInput.onchange = resolve;
      });

      const file = fileInput.files[0];

      if (file) {

        const storageRef = ref(
          storage,
          "products/" +
          Date.now() +
          "-" +
          file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        );

        await uploadBytes(storageRef, file);

        data.imageUrl =
          await getDownloadURL(storageRef);
      }
    }

    if (editingId) {

      await updateDoc(
        doc(db, "products", editingId),
        data
      );

    } else {

      await addDoc(
        collection(db, "products"),
        {
          ...data,
          createdAt: serverTimestamp()
        }
      );
    }

    closeProduct();

  } catch (e) {

    alert("Error: " + e.message);
  }
};

// ORDERS
function renderOrders() {

  const table = $("orderTable");

  if (!orders.length) {

    table.innerHTML =
      `<tr><td colspan="7"> </td></tr>`;

    return;
  }

  table.innerHTML = orders.map(x => `
    <tr>

      <td>${x.id.slice(-6)}</td>

      <td>${escapeHtml(x.customer || "")}</td>

      <td>${escapeHtml(x.phone || "")}</td>

      <td>${money(x.total)}</td>

      <td>

        <select
          onchange="setOrderStatus('${x.id}',this.value)">

          <option ${
            x.status === "" ? "selected" : ""
          }></option>

          <option ${
            x.status === "" ? "selected" : ""
          }></option>

          <option ${
            x.status === "" ? "selected" : ""
          }></option>

          <option ${
            x.status === "" ? "selected" : ""
          }></option>

          <option ${
            x.status === "" ? "selected" : ""
          }></option>

        </select>

      </td>

      <td>
        ${
          x.createdAt?.toDate
            ? x.createdAt.toDate().toLocaleDateString("bn-BD")
            : ""
        }
      </td>

      <td>

        <button
          class="action danger"
          onclick="deleteOrder('${x.id}')">
          
        </button>

      </td>

    </tr>
  `).join("");
}

// ORDER STATUS
window.setOrderStatus = async function (id, status) {

  await updateDoc(
    doc(db, "orders", id),
    {
      status,
      updatedAt: serverTimestamp()
    }
  );
};

// DELETE ORDER
window.deleteOrder = async function (id) {

  if (!confirm("   ?")) return;

  await deleteDoc(
    doc(db, "orders", id)
  );
};

// CATEGORY
window.addCategory = function () {

  alert(
    "Category management    collection    "
  );
};

// SETTINGS
window.saveSettings = function () {

  localStorage.setItem(
    "freshBasketSettings",
    JSON.stringify({
      brand: $("brandSetting").value,
      phone: $("phoneSetting").value,
      delivery: $("deliverySetting").value
    })
  );

  alert("Settings saved");
};

// ESCAPE HTML
function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}