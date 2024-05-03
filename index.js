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
  };

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
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
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
  const renderInventory = (inventory) => {
    let inventoryList = "";
    inventory.forEach((item)=>{
      let count = item.count === undefined ? 0 : item.count;
      const listItem = `<li id=${item.id}><span>${item.content}</span><button class="updateAmount">-</button>${count}<button class="updateAmount">+</button><button class="cart">add to cart</button></li>`;
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

  return {renderInventory, renderCarts, inventoryEl, cartEl, checkoutEl};
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
      event.preventDefault();
      const element = event.target;
      if (element.className === "updateAmount") {
        const content = element.innerText;
        const itemId = Number(element.parentElement.getAttribute("id"));
        const inventory = state.inventory;
        if(content == "-") {
          const previousCount = inventory[itemId-1].count == undefined ? 0 : inventory[itemId-1].count;
          if (previousCount >= 1) {
            inventory[itemId-1].count --
          }
          state.inventory = inventory;
        } else if (content == "+") {
          const previousCount = inventory[itemId-1].count == undefined ? 0 : inventory[itemId-1].count;
          inventory[itemId-1].count = previousCount + 1;
          state.inventory = inventory;
        }
      }
    });
  };

  const handleAddToCart = () => {
    view.inventoryEl.addEventListener("click", (event) => {
      event.preventDefault();
      const element = event.target;
      const itemId = Number(element.parentElement.getAttribute("id"));
      if(element.className == "cart") {
        const count = state.inventory[itemId-1].count;
        const previousItem = state.cart.find((item) => (item.id == itemId))
        if (previousItem === undefined) {
          model.addToCart({
            ...state.inventory[itemId-1],
            count: count,
          }).then((data) => {
            state.cart = [...state.cart.filter((item) => (item.id !== item.id)), data]
          })
        } else {
          model.updateCart(
            itemId,
            previousItem.count + count,
          ).then((data) => {
            state.cart = [...state.cart.filter((item) => (item.id !== item.id)), data]
          })
        }
        
      }
    })
  };

  const handleDelete = () => {
    view.cartEl.addEventListener("click", (event)=>{
      const element = event.target;
      const itemId = element.parentElement.getAttribute("id");
      if(element.className == "delete") {
        model.deleteFromCart(itemId);
        state.cart = state.cart.filter((item)=>(item.id === itemId));
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
      view.renderInventory(state.inventory);
      view.renderCarts(state.cart);
    })
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
  };
  return {
    bootstrap,
  };
})(View, Model);

Controller.bootstrap();
