
// =========================
// MOBILE MENU TOGGLE
// =========================
const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");
 
if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isOpen);
  });
 
  // Close menu when a link is clicked (mobile UX)
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}
 
// =========================
// PRODUCT FILTERING (flowers.html)
// =========================
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".products-grid .flower-card");
const noResults = document.querySelector(".no-results");
 
if (filterButtons.length && productCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
 
      // Update active button state
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
 
      // Show/hide matching cards
      let visibleCount = 0;
 
      productCards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
      });
 
      if (noResults) {
        noResults.hidden = visibleCount !== 0;
      }
    });
  });
}


// =========================
// SHOPPING CART
// =========================
const CART_KEY = "flowerRoomCart";
 
// Read cart from localStorage (array of { name, price, image, qty })
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
 
// Save cart back to localStorage and refresh the badge everywhere
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
 
// Add a product to the cart, or bump quantity if it's already there
function addToCart({ name, price, image }) {
  const cart = getCart();
  const existing = cart.find((item) => item.name === name);
 
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price: Number(price), image, qty: 1 });
  }
 
  saveCart(cart);
}
 
// Remove a product entirely from the cart
function removeFromCart(name) {
  const cart = getCart().filter((item) => item.name !== name);
  saveCart(cart);
}
 
// Set an exact quantity for a product (removes it if qty drops to 0)
function updateQuantity(name, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.name === name);
  if (!item) return;
 
  if (qty <= 0) {
    removeFromCart(name);
    return;
  }
 
  item.qty = qty;
  saveCart(cart);
}
 
// Update the little number badge on the cart icon (present on every page)
function updateCartBadge() {
  const totalItems = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = totalItems;
    badge.hidden = totalItems === 0;
  });
}
 
// Wire up every "Add to Cart" button on the page (currently flowers.html)
function initAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart({
        name: button.dataset.name,
        price: button.dataset.price,
        image: button.dataset.image,
      });
 
      // Quick visual confirmation
      const originalText = button.textContent;
      button.textContent = "Added ✓";
      button.disabled = true;
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 900);
    });
  });
}
 
// Build the full cart.html page: items, quantity controls, totals
function renderCartPage() {
  const cartList = document.querySelector(".cart-list");
  if (!cartList) return; // Not on cart.html, skip
 
  const emptyState = document.querySelector(".cart-empty");
  const summary = document.querySelector(".cart-summary");
  const subtotalEl = document.querySelector(".cart-subtotal");
  const checkoutBtn = document.querySelector(".checkout-btn");
  const cart = getCart();
 
  if (cart.length === 0) {
    cartList.hidden = true;
    if (summary) summary.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }
 
  if (emptyState) emptyState.hidden = true;
  cartList.hidden = false;
  if (summary) summary.hidden = false;
 
  cartList.innerHTML = "";
  let subtotal = 0;
 
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
 
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <span>$${item.price}</span>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="decrease" data-name="${item.name}">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" data-action="increase" data-name="${item.name}">+</button>
      </div>
      <div class="cart-item-total">$${(item.price * item.qty).toFixed(2)}</div>
      <button class="cart-remove" data-name="${item.name}" aria-label="Remove ${item.name}">✕</button>
    `;
    cartList.appendChild(row);
  });
 
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
 
  // Quantity +/- buttons
  cartList.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const item = getCart().find((i) => i.name === name);
      if (!item) return;
 
      const newQty = btn.dataset.action === "increase" ? item.qty + 1 : item.qty - 1;
      updateQuantity(name, newQty);
      renderCartPage();
    });
  });
 
  // Remove buttons
  cartList.querySelectorAll(".cart-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.name);
      renderCartPage();
    });
  });
 
  // Checkout: save a readable summary, then hand off to the contact page
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const summaryText = getCart()
        .map((item) => `${item.qty} x ${item.name} ($${item.price} each)`)
        .join("\n");
      const total = `Total: $${subtotal.toFixed(2)}`;
 
      localStorage.setItem(
        "flowerRoomOrderSummary",
        `${summaryText}\n${total}`
      );
 
      window.location.href = "contact.html?checkout=1";
    });
  }
}
 
// Run cart-related setup on every page load
updateCartBadge();
initAddToCartButtons();
renderCartPage();
 


