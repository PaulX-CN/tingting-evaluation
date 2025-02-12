const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch("http://localhost:3000/cart").then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch("http://localhost:3000/inventory").then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(
      "http://localhost:3000/cart",
       { 
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify(inventoryItem)
      }
    ).then((res) => res.json());
  }
  const updateCart = (id, newAmount) => {

    // define your method to update an item in cart
    return fetch(
      `http://localhost:3000/cart/${id}`,
       { 
        method: "PATCH",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({id: id, count: newAmount})
      }
    ).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(
      `http://localhost:3000/cart/${id}`,
       { 
        method: "DELETE",
      }
    ).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    #page;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
      this.#page = sessionStorage.getItem("page")??1;
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }
    get pages() {
      return Math.ceil(Number(this.#inventory.length)/2);
    }

    get page() {
      return this.#page;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }
    set page(pageNumber) {
      this.#page = pageNumber;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryEl = document.querySelector(".inventory-item");
  const cartEl = document.querySelector(".cart-item");
  const checkoutEl = document.querySelector(".checkout-btn");
  const pageEl = document.querySelector(".pages");
  const renderInventory = (inventory, pageId) => {
    let inventoryList = "";
    const newInventory = inventory.slice((pageId-1)*2, pageId*2);
    newInventory.forEach((item)=>{
      let count = item.count??0;
      const listItem = `<li id="inventory-${item.id}"><span>${item.content}</span><button class="updateAmount minus">-</button>${count}<button class="updateAmount plus">+</button><button class="cart">add to cart</button></li>`;
      inventoryList+=listItem;
    })
    inventoryEl.innerHTML = inventoryList;
    
  }

  const renderCarts = (cartItems) => {
    let cartList = "";
    cartItems.forEach((item)=>{
      const cartItem = `<li id=${item.id}><span>${item.content} x ${item.count}</span><button class="delete">delete</button></li>`;
      cartList+=cartItem;
    })
    cartEl.innerHTML = cartList;
  }
  
  const renderPages = (pages, page) => {
    let pageNumberItems = "";
    for(let i=1; i <= pages; i++){
      const pageNumberItem = `<span id="page-${i}" class="page-number ${page == i?"active":""}">${i}</span>`;
      pageNumberItems+=pageNumberItem;
    }
    pageEl.innerHTML = pageNumberItems;

  }

  return {renderInventory, renderCarts, renderPages, inventoryEl, cartEl, checkoutEl, pageEl};
})();

const Controller = ((view, model) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      state.inventory = data;
    });
    model.getCart().then((data) => {
      state.cart = data;
    })
  };
  const handleUpdateAmount = () => {
    view.inventoryEl.addEventListener("click", (event) => {
      const element = event.target;
        const content = element.innerText;
        const itemId = Number(element.parentElement.getAttribute("id").split("-")[1]);
        const inventory = state.inventory;
        if(content == "-") {
          const previousCount = inventory[itemId-1].count == undefined ? 0 : inventory[itemId-1].count;
          if (previousCount >= 1) {
            inventory[itemId-1].count --
          }
        } else if (content == "+") {
          const previousCount = inventory[itemId-1].count == undefined ? 0 : inventory[itemId-1].count;
          inventory[itemId-1].count = previousCount + 1;
        }
        state.inventory = inventory;
    });
  };

  const handleAddToCart = () => {
    view.inventoryEl.addEventListener("click", (event) => {
      const element = event.target;
      const itemId = Number(element.parentElement.getAttribute("id").split("-")[1]);
      if(element.className == "cart") {
        const count = state.inventory[itemId-1].count == undefined? 0 : state.inventory[itemId-1].count;
        const previousItem = state.cart.find((item) => (item.id == itemId));
        if(count == 0) {
          return;
        }
        if (previousItem === undefined) {
          model.addToCart({
            ...state.inventory[itemId-1],
            count: count,
          }).then(() => {
            return model.getCart();
          }).then((data) => state.cart = data);
        } else {
          model.updateCart(
            itemId,
            previousItem.count + count,
          ).then((data) => {
            model.getCart().then((data) => {
              state.cart = data;
            });
          })
          
        }
        
      }
    })
  };
  
  const handlePageClick = () => {
    view.pageEl.addEventListener("click", (event) => {
      const element = event.target;
      const itemId = Number(element.getAttribute("id").split("-")[1]);
      state.page = itemId;
      sessionStorage.setItem("page", itemId);

    })
  }

  const handleDelete = () => {
    view.cartEl.addEventListener("click", (event)=>{
      const element = event.target;
      const itemId = element.parentElement.getAttribute("id");
      if(element.className == "delete") {
        model.deleteFromCart(itemId).then(()=>{
          model.getCart().then((data) => {
            state.cart = data;
          })
        });
      }
      
    })
  };

  const handleCheckout = () => {
    view.checkoutEl.addEventListener("click", (event) => {
      event.preventDefault();
      model.checkout().then(()=>{state.cart=[]})
    })
  };
  const bootstrap = () => {
    init();
    state.subscribe(()=>{
      view.renderInventory(state.inventory, state.page);
      view.renderCarts(state.cart);
      view.renderPages(state.pages, state.page);
    })
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
    handlePageClick();
  };
  return {
    bootstrap,
  };
})(View, Model);

Controller.bootstrap();
