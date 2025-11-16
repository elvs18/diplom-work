import './style.css'
import './media.css'

const container = document.querySelector('.products_grid')
const catalog = document.querySelector('.top_header_nav_catalog')
const catalogList = document.getElementById('catalog_menu')

/* === МЕНЮ КАТАЛОГА === */
if (catalog && catalogList) {
  catalog.onclick = () => {
    catalog.classList.toggle('open')
    catalogList.style.display = catalog.classList.contains('open') ? 'block' : 'none'
  }
}

/* === СОЗДАНИЕ КАРТОЧЕК === */
function Card(container, products, append = false) {
  if (!container) return
  if (!append) container.innerHTML = ""

  return Promise.all([
    fetch('http://localhost:3000/cart').then(r => r.json()),
    fetch('http://localhost:3000/favorites').then(r => r.json())
  ]).then(([cartItems, favItems]) => {
    products.forEach(product => {
      const inCart = cartItems.some(el => el.id == product.id)
      const inFav = favItems.some(el => el.id == product.id)

      const card = document.createElement('div')
      card.classList.add('product')

      card.innerHTML = `
        <div class="product_img">
        <img src="${product.media}" alt="">
        </div>
        <div class="product_info">
        <p class="info_sell">
            <span>${parseFloat(product.price).toLocaleString()}</span>
            <img src="./img/credit-card.png" alt="">
        </p>

        <span class="gray">${parseFloat(product.price).toLocaleString()}</span><br>
        <span class="yellow">${product.salePercentage}%</span>

        <p class="title">${product.title}</p>

        <div class="review">
            <img src="./img/reviewstar.png" alt="">
            <span>${product.rating} (6308 отзывов)</span>
        </div>

        <button class="add_basket" data-id="${product.id}" ${inCart ? "disabled style='background:#999'" : ""}>
          ${inCart ? "В корзине" : "заказать"}
        </button>

        <button class="add_fav" data-id="${product.id}">
          <img src="./img/${inFav ? "nav-fav-filled.png" : "nav-fav.png"}">
        </button>
        </div>
      `

      container.append(card)
      attachProductOpen(card, product);
    })

    addButtonListeners()

  })
}

/* === ДОБАВЛЕНИЕ В КОРЗИНУ / ИЗБРАННОЕ === */
function reload(id, type) {
  fetch(`http://localhost:3000/${type}`)
    .then(r => r.json())
    .then(list => {
      const exists = list.some(el => el.id == id);

      if (exists) {
        fetch(`http://localhost:3000/${type}/${id}`, { method: "DELETE" })
          .then(() => {
            if (type === 'favorites') {
              const favBtn = document.querySelector(`.add_fav[data-id="${id}"] img`);
              if (favBtn) favBtn.src = "./img/nav-fav.png";

              removeFromFavorites(id);
            }

            if (type === 'cart') {
              const basketBtn = document.querySelector(`.add_basket[data-id="${id}"]`);
              if (basketBtn) {
                basketBtn.disabled = false;
                basketBtn.style.background = "";
                basketBtn.textContent = "заказать";
              }
            }

            loadAdded(type);
          });
        return;
      }

      fetch('http://localhost:3000/goods')
        .then(r => r.json())
        .then(goods => {
          let item = goods.find(el => el.id == id);
          if (!item) return;

          item.count = 1;

          fetch(`http://localhost:3000/${type}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          }).then(() => {
            if (type === 'favorites') {
              const favBtn = document.querySelector(`.add_fav[data-id="${id}"] img`);
              if (favBtn) favBtn.src = "./img/nav-fav-filled.png";

              addToFavorites(id);
            }

            if (type === 'cart') {
              const basketBtn = document.querySelector(`.add_basket[data-id="${id}"]`);
              if (basketBtn) {
                basketBtn.disabled = true;
                basketBtn.style.background = "#999";
                basketBtn.textContent = "В корзине";
              }
            }

            loadAdded(type);
          });
        });
    });
}


/* === ОБРАБОТЧИКИ КНОПОК === */
function addButtonListeners() {
  document.querySelectorAll('.add_fav').forEach(btn => {
    btn.onclick = () => reload(btn.dataset.id, 'favorites');
  });

  document.querySelectorAll('.add_basket').forEach(btn => {
    btn.onclick = () => reload(btn.dataset.id, 'cart');
  });
}



/* === ОТОБРАЖЕНИЕ ПУСТОЙ КОРЗИНЫ === */
function updateCartVisibility(items) {
  const empty = document.querySelector('.empty_basket')
  const products = document.querySelector('.products_container')
  const order = document.querySelector('.order_block')

  if (!empty || !products || !order) return

  if (items.length === 0) {
    empty.style.display = "flex"
    products.style.display = "none"
    order.style.display = "none"
  } else {
    empty.style.display = "none"
    products.style.display = "grid"
    order.style.display = "flex"
  }
}

/*  === ОТОБРАЖЕНИЕ ПУСТОЙ ИЗБРАННОЙ ===  */
function updateFavCartVisibility(items) {
  const empty = document.querySelector('.empty_favbox')
  const products = document.querySelector('.products_container')

  if (!empty || !products) return

  if (items.length === 0) {
    empty.style.display = "flex"
    products.style.display = "none"
  } else {
    empty.style.display = "none"
    products.style.display = "grid"
  }
}

/* === ЗАГРУЗКА ДАННЫХ ДЛЯ CART / FAV === */
function loadAdded(type) {
  Promise.all([
    fetch(`http://localhost:3000/${type}`).then(r => r.json()),
    fetch(`http://localhost:3000/cart`).then(r => r.json())
  ]).then(([items, cartItems]) => {
    if (type === "cart") { updateCartVisibility(items), updateOrderBlock(items) }
    if (type === "favorites") updateFavCartVisibility(items)

    const grid = document.querySelector(type === 'cart' ? '.cart_grid' : '.fav_grid')
    if (!grid) return

    grid.innerHTML = ""

    const favorites = JSON.parse(localStorage.getItem('favorites')) || []

    items.forEach(el => {
      const inCart = cartItems.some(ci => ci.id == el.id)

      let basketButton = `<button class="add_basket" data-id="${el.id}">заказать</button>`
      if (inCart) {
        basketButton = `<button class="add_basket" data-id="${el.id}" disabled style="background:#999">В корзине</button>`
      }

      const isFav = favorites.includes(el.id.toString())
      const favButton = `
        <button class="add_fav ${isFav ? 'liked' : ''}" data-id="${el.id}">
          <img src="./img/${isFav ? 'nav-fav-filled.png' : 'nav-fav.png'}">
        </button>
      `

      let controls = ""
      if (type === "cart") {
        controls = `
          <div class="quantity_control" data-id="${el.id}">
            <button class="minus">−</button>
            <span class="count">${el.count || 1}</span>
            <button class="plus">+</button>
          </div>`
      } else {
        controls = basketButton
      }

      const div = document.createElement('div')
      div.classList.add('product')
      div.innerHTML = `
        <div class="product_img">
        <img src="${el.media}">
        </div>
        <div class="product_info">
        <p class="info_sell">
          <span>${parseFloat(el.price).toLocaleString()}</span>
          <img src="./img/credit-card.png">
        </p>

        <p class="title">${el.title}</p>

        ${controls}

        ${favButton}
        </div>
      `
      grid.append(div)
    })

    grid.querySelectorAll('.add_fav').forEach(btn => {
      btn.onclick = () => reload(btn.dataset.id, 'favorites')
    })
    grid.querySelectorAll('.add_basket').forEach(btn => {
      btn.onclick = () => reload(btn.dataset.id, 'cart')
    })

    if (type === 'cart') setupCartListeners()
  })
}




/* === ЛОГИКА ПЛЮС / МИНУС === */
function setupCartListeners() {
  const minusBtns = document.querySelectorAll('.minus')
  const plusBtns = document.querySelectorAll('.plus')

  minusBtns.forEach(btn => {
    btn.onclick = () => {
      const id = btn.parentElement.dataset.id

      fetch(`http://localhost:3000/cart/${id}`)
        .then(r => r.json())
        .then(item => {
          if (item.count > 1) {
            item.count--
            fetch(`http://localhost:3000/cart/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            }).then(() => {
              loadAdded('cart')
              updateOrderBlock([item])
            })
          } else {

            fetch(`http://localhost:3000/cart/${id}`, { method: "DELETE" })
              .then(() => loadAdded('cart'))
          }
        })
    }
  })

  plusBtns.forEach(btn => {
    btn.onclick = () => {
      const id = btn.parentElement.dataset.id

      fetch(`http://localhost:3000/cart/${id}`)
        .then(r => r.json())
        .then(item => {
          item.count++
          fetch(`http://localhost:3000/cart/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
          }).then(() => {
            loadAdded('cart')
            updateOrderBlock([item])
          })
        })
    }
  })
}


function changeCount(btn, delta) {
  const parent = btn.closest('.quantity_control')
  const id = parent.dataset.id
  const countEl = parent.querySelector('.count')

  let count = parseInt(countEl.textContent) + delta

  if (count < 1) {
    deleteFromCart(id)
    parent.closest('.product').remove()
    loadAdded('cart')
    return
  }

  countEl.textContent = count
  updateCartCount(id, count)
}

function updateCartCount(id, newCount) {
  fetch(`http://localhost:3000/cart/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: newCount })
  })
}

function addToFavorites(id) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favorites.includes(id)) favorites.push(id);
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function removeFromFavorites(id) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  favorites = favorites.filter(favId => favId !== id);
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function deleteFromCart(id) {
  return fetch(`http://localhost:3000/cart/${id}`, { method: "DELETE" })
}

/* === Показать ещё === */
let allProducts = []
let shownCount = 15
const addTenProds = document.querySelector('.add_ten_products_btn_box')

if (container) {
  fetch('http://localhost:3000/goods')
    .then(r => r.json())
    .then(products => {
      allProducts = products
      Card(container, allProducts.slice(0, shownCount))
    })
}

if (addTenProds) {
  addTenProds.onclick = () => {
    const part = allProducts.slice(shownCount, shownCount + 10)
    if (part.length) Card(container, part, true)
    shownCount += part.length
    if (shownCount >= allProducts.length) addTenProds.style.display = "none"
  }
}

/* === popup === */
let dialog = document.querySelector('dialog')
let showDialog = document.querySelector('#showDialog')
let closeDialog = document.querySelector('#closeDialog')
let showFavDialog = document.querySelector('.showFavDialog')

if (showDialog) {
  showDialog.onclick = () => {
    if (dialog) {
      dialog.showModal()
      dialog.style.display = 'flex'
    }
  }
}

if (showFavDialog) {
  showFavDialog.onclick = () => {
    if (dialog) {
      dialog.showModal()
      dialog.style.display = 'flex'
    }
  }
}

if (closeDialog) {
  closeDialog.onclick = () => {
    if (dialog) {
      dialog.close()
      dialog.style.display = 'none'
    }
  }
}

async function attachProductOpen(card, product) {
  card.onclick = async (e) => {
    if (e.target.closest('.add_basket') || e.target.closest('.add_fav')) return;

    const productPage = document.querySelector('#product_page')
    if (!productPage) return

    document.querySelector('.swiper')?.classList.add('hidden')
    document.querySelector('.after_swiper_boxs')?.classList.add('hidden')
    document.querySelector('.add_ten_products_btn_box')?.classList.add('hidden')
    productPage.classList.remove('hidden')

    const clearIn = document.querySelector('.products_grid')
    clearIn.innerHTML = ``

    productPage.innerHTML = `
      <div class="left">
        <h1>${product.title}</h1>
        <div class="review">
          <img src="./img/reviewstar.png" alt="">
          <span>${product.rating} (6308 отзывов)</span>
        </div>
        <span class="yellow">${product.salePercentage}%</span>
        <img src="${product.media}" alt="" class="prod_img">
      </div>

      <div class="right">
        <div class="main_info_about_prod">
          <h3>${parseFloat(product.price).toLocaleString()} сум</h3>
          <p>Без карты Uzum ${parseFloat(product.price).toLocaleString()} сум</p>

          <div class="oneclk">
            <button id="buy">Купить в 1 клик</button>
            <button class="single_fav"><img src="./img/nav-fav.png" alt=""></button>
          </div>

          <button class="add_to_basket">Добавить в корзину</button>

          <div class="inf_about_prod">
            <img src="./img/check.png" alt="">
            <p>Можно купить ещё 5 шт.</p>
          </div>
          <div class="inf_about_prod">
            <img src="./img/badge_bought.png" alt="">
            <p>1436 человек купили на этой неделе.</p>
          </div>
        </div>
      </div>
    `

    const favBtn = document.querySelector('.single_fav')
    const favImg = favBtn.querySelector('img')
    const basketBtn = document.querySelector('.add_to_basket')

    let favList = await fetch('http://localhost:3000/favorites')
                     .then(res => res.json())
                     .catch(() => [])
    let cartList = await fetch('http://localhost:3000/cart')
                     .then(res => res.json())
                     .catch(() => [])

    function updateFavState() {
      const inFav = favList.some(item => item.id == product.id)
      favImg.src = inFav ? "./img/nav-fav-filled.png" : "./img/nav-fav.png"
    }

    function updateBasketState() {
      const inCart = cartList.some(item => item.id == product.id)
      if (inCart) {
        basketBtn.disabled = true
        basketBtn.style.background = "#999"
        basketBtn.textContent = "В корзине"
      } else {
        basketBtn.disabled = false
        basketBtn.style.background = ""
        basketBtn.textContent = "Добавить в корзину"
      }
    }

    updateFavState()
    updateBasketState()

    // Обработчик корзины
    basketBtn.onclick = async () => {
      const inCart = cartList.find(item => item.id == product.id)
      if (!inCart) {

        cartList.push({ ...product })
        localStorage.setItem('cart', JSON.stringify(cartList))

        try {
          const res = await fetch('http://localhost:3000/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
          })
          if (!res.ok) console.error('Ошибка при добавлении в корзину на сервер')
        } catch (err) {
          console.error('Ошибка fetch:', err)
        }
      }
      updateBasketState()
    }

    // Обработчик избранного
    favBtn.onclick = async () => {
      const index = favList.findIndex(item => item.id == product.id)
      if (index > -1) {

        favList.splice(index, 1)
        localStorage.setItem('favourites', JSON.stringify(favList))

        try {
          await fetch(`http://localhost:3000/favorites/${product.id}`, { method: 'DELETE' })
        } catch (err) {
          console.error('Ошибка удаления из избранного на сервере:', err)
        }
      } else {

        favList.push({ ...product })
        localStorage.setItem('favourites', JSON.stringify(favList))

        try {
          await fetch('http://localhost:3000/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
          })
        } catch (err) {
          console.error('Ошибка добавления в избранное на сервере:', err)
        }
      }
      updateFavState()
    }
  }
}


function updateOrderBlock(items) {
  const orderBlock = document.querySelector('.order_block')
  if (!orderBlock) return

  const totalCount = items.reduce((sum, item) => sum + (item.count || 1), 0)
  const totalSum = items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.count || 1)), 0)

  orderBlock.querySelector('span').textContent = `Товары (${totalCount}):`
  orderBlock.querySelector('b').textContent = `Итог: ${totalSum.toLocaleString()} сум`

  const withCardSpan = orderBlock.querySelector('.with_uzum_card span')
  const withoutCardSpan = orderBlock.querySelector('.without_uzum_card span')

  if (withCardSpan) withCardSpan.textContent = totalSum.toLocaleString()
  if (withoutCardSpan) withoutCardSpan.textContent = totalSum.toLocaleString()
}

/* === загрузка корзины и избранного === */
loadAdded('cart')
loadAdded('favorites')