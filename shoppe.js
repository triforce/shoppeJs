/* 
* shoppeJs
* A shopping cart for small e-commerce websites
* No dependencies required (apart from a modern browser)
* Created by Chris Andrews
*/

window.shoppeJs = (function() {
	var model = new ShoppeModel();
	//var uniqueId = new Date().getTime() * Math.random();
	var store = window.sessionStorage;
	var thisDoc = document;
 	var defaults = {
		currency: 'GBP',
		payment: {
			type: 'Paypal',
			username: ''
		}
	};
	// ========================
	// The main shoppeJs object
	// ========================
    var shoppe = {
        init: function(options) {
			var shopItems;
			model.setShopItemList(thisDoc.getElementsByClassName(model.itemMainName));
			model.setShopItemCountList(thisDoc.getElementsByClassName(model.itemCount));
			model.setCartTotalList(thisDoc.getElementsByClassName(model.cartTotal));
			model.setCartViewList(thisDoc.getElementsByClassName(model.cartView));

			// Reset total
			shoppe.total = model.zero;

			// Check if a shoppe has already been initialised with options for this session
        	if (options === undefined) {
        		options = restoreOptions();
        	}

        	// Make sure at least default options defined
        	for (var p in options) {
                if (options.hasOwnProperty(p)) {
                    defaults[p] = options[p];
                }
			}

			options = defaults;
        	shopItems = restoreShoppeItems();
			// Master options
			shoppe.options = options;
			// Master item list
			shoppe.items = shopItems;
			// Save options
			store.setItem(model.optionsStorage, JSON.stringify(options));

			// =====================
			// Populate shoppe items
			// =====================

			// First find an item
			for (var i = 0; i < model.getShopItemList().length; i++) {
				var itemEl = model.getShopItemList()[i];
				var nameEl, descrEl, priceEl, addEl;
				
				// Find an item properties
				for (var i2 = 0; i2 < itemEl.children.length; i2++) {
					var childEl = itemEl.children[i2];

					// Find item name
					if (childEl.id === model.itemName) {
						nameEl = childEl;
					}
					// Find item description
					if (childEl.id === model.itemDescription) {
						descrEl = childEl;
					}
					// Find item price
					if (childEl.id === model.itemPrice) {
						priceEl = childEl;
					}
					// Find add element
					if (childEl.id === model.addCallback) {
						addEl = childEl;
					}
				}

				var itemObj = new ShoppeItem({
					id: itemEl.id,
					name: nameEl.innerHTML,
					description: descrEl.innerHTML,
					price: parseFloat(priceEl.innerHTML),
					element: itemEl
				});

				if (addEl) {
					addEl.onclick = createAddFn(itemObj);
				}

				// Add currency symbol
				priceEl.innerHTML = (currencyLookup(shoppe.getOptions().currency) + priceEl.innerHTML);
			}

			refreshUI();
		},
		// Return the current options
		getOptions: function() {
			return shoppe.options;
		},
		setOptions: function(options) {
            for (var p in options) {
                if (options.hasOwnProperty(p)) {
                    defaults[p] = options[p];
                }
            }
            shoppe.options = defaults;
		},
		checkout: function(items) {
			checkout(items);
		},
		// Return a list of items in the cart
		getItems: function() {
			return shoppe.items;
		},
		setItems: function(items) {
			shoppe.items = items;
		},
		getCartTotal: function () {
			return shoppe.total;
		},
		// Add an item to the shoppe cart
		addItem: function(itemObj, elementId) {
			addItemToCart(itemObj, elementId);
		},
		// Remove all items from the shoppe cart
		clearItems: function() {
			shoppe.items.length = 0;
			shoppe.items = [];
			shoppe.total = model.zero;
			store.setItem(model.itemsStorage, "");
			refreshUI();
		},
		dispose: function() {
			disposeShoppe();
		},
		attachCallback: function(id, property, callback) {
			for (var i = 0; i < shoppe.items.length; i++) {
				if (shoppe.items[i].getId() === id) {
					shoppe.items[i].element[property] = callback;
				}
			}
		}
    };

	function disposeShoppe() {
		store.clear();
        shoppe.items = [];
        shoppe.options = [];
        shoppe.total = model.zero;
	}

	function checkout(items) {
		if (items === undefined) {
			items = shoppe.getItems();
		}

		if (shoppe.getOptions().payment.type.toLowerCase() === 'paypal') {
            var options =
            {
                action: 'https://www.paypal.com/cgi-bin/webscr',
                method: 'POST',
                data: items
            };
            sendCheckoutData(options);
		}
	}

    function sendCheckoutData(options) {
        var form = thisDoc.createElement('form');
        form.setAttribute('style', 'display:none;');
        form.setAttribute('action', options.action);
        form.setAttribute('method', options.method);
        for (var i = 0; i< options.data.length; i++) {
            var input = thisDoc.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', options.data[i].getName());
            input.nodeValue = options.data[i].getPrice();
            form.appendChild(input);
        }
        thisDoc.body.appendChild(form);
        form.submit();
        form.remove();
    }

    function refreshUI() {
    	// Update total trackers
		for (var i = 0; i < model.getCartTotalList().length; i++) {
			model.getCartTotalList()[i].innerHTML = (currencyLookup(shoppe.getOptions().currency) + parseFloat(shoppe.getCartTotal()).toFixed(2));
		}

    	// Update item counts
		for (i = 0; i < model.getShopItemCountList().length; i++) {
			model.getShopItemCountList()[i].innerHTML = shoppe.getItems().length;
		}

		// Update any visible cart display
		for (i = 0; i < model.getCartViewList().length; i++) {
			var cartEl = model.getCartViewList()[i];
			var cartTblEl = (thisDoc.getElementById(model.cartList) === null) ? thisDoc.createElement("table") : thisDoc.getElementById(model.cartList);
            var cartHdngsEl = (thisDoc.getElementById(model.cartHeadings) === null) ? thisDoc.createElement("thead") : thisDoc.getElementById(model.cartHeadings);
			cartTblEl.id = model.cartList;
			cartTblEl.style = 'display: table; border-spacing: 2px; border-color: grey; width: 100%; text-align: left';

            if (cartHdngsEl.id.length === 0) {
                cartHdngsEl.id = model.cartHeadings;
                cartHdngsEl.appendChild(createCartHeadings());
                cartTblEl.appendChild(cartHdngsEl);
            }

			var elementsToRemove = [];

			if (shoppe.getItems().length === 0) {
				if (cartTblEl !== null) {
					while (cartTblEl.firstChild) {
					    cartTblEl.removeChild(cartTblEl.firstChild);
					}
				}
			} else {
				// Create list of cart items that shouldn't be in the visible cart
				if (cartTblEl !== null) {
					for (var i2 = 0; i2 < cartTblEl.children.length; i2++) {
						var child = cartTblEl.children[i2];

                        if (child.id === model.cartHeadings) {
                            continue;
                        }

						if (checkExists(child, shoppe.getItems(), 'id') === false) {
							elementsToRemove.push(child);
						}
					}
				}
			}

			// Remove any cart items that have been removed from the actual item list
			for (var i3 = 0; i3 < elementsToRemove.length; i3++) {
				cartTblEl.removeChild(elementsToRemove[i3]);
			}

			for (i3 = 0; i3 < shoppe.getItems().length; i3++) {
				var itemObj = shoppe.getItems()[i3];
				var cartItemRowEl = (thisDoc.getElementById(model.cartItem + itemObj.getId()) === null) ? thisDoc.createElement('tr') : thisDoc.getElementById(model.cartItem + itemObj.getId());
				
				if (cartItemRowEl.id !== (model.cartItem + itemObj.getId())) {
					var lineNode = createCartItem(cartItemRowEl, shoppe.getItems()[i3]);
					cartTblEl.appendChild(lineNode);
				} else {
                    // Update quantity on the item
                    for (var i4 = 0; i4 < cartItemRowEl.children.length; i4++) {
                        var itemChildEl = cartItemRowEl.children[i4];

                        if (itemChildEl.id.substring(0, itemChildEl.id.length - 1) === cartItemRowEl.id) {
                            itemChildEl.innerHTML = itemObj.getQuantity();
                        }
                    }
                }
			}

			cartEl.appendChild(cartTblEl);
		}
    }

    function restoreShoppeItems() {
    	var sortedItems = [];

		if (store.getItem(model.itemsStorage) !== undefined) {
			var savedItems = [];
			var jsonData = store.getItem(model.itemsStorage);

			if (jsonData === "") {
				savedItems = [];
			} else {
				savedItems = JSON.parse(store.getItem(model.itemsStorage));
			}
			
			if (savedItems === null) {
				savedItems = [];
			}

			// Create new shoppe item for each object
			for (var i = 0; i < savedItems.length; i++) {
				var newitem = new ShoppeItem(savedItems[i]);

				sortedItems.push(new ShoppeItem(newitem));
				shoppe.total = parseFloat(shoppe.total);
				shoppe.total+=(newitem.getPrice() * newitem.getQuantity());
                shoppe.total.toFixed(2);
			}
		}

		return sortedItems;
    }

    function restoreOptions() {
    	var options = {};

		if (store.getItem(model.optionsStorage) !== undefined) {
			options = JSON.parse(store.getItem(model.optionsStorage));
			if (options === null) {
				options = {};
			}
		}

		return options;
    }

    // Check whether an object with a property exists in a list of objects
    function checkExists(item, list, property) {
    	var result = false;

		for (var i = 0; i < list.length; i++) {
			if ( (item[property] === list[i][property]) || (item[property] === model.cartItem + list[i][property]) ) {
				result = true;
			}
		}

		return result;
    }

    function addItemToCart(itemObj, elementId) {
        itemObj = new ShoppeItem(itemObj);

        if (elementId !== undefined) {
            itemObj.element = thisDoc.getElementById(elementId);
        }

		if (!checkExists(itemObj, shoppe.getItems(), 'id')) {
            itemObj.setQuantity(1);
			shoppe.getItems().push(itemObj);
            shoppe.total = parseFloat(shoppe.total);
			shoppe.total+=itemObj.getPrice();
            shoppe.total.toFixed(2);
		} else {
            for (var i = 0; i < shoppe.getItems().length; i++) {
                if (itemObj.getId() === shoppe.getItems()[i].getId()) {
                    shoppe.getItems()[i].setQuantity(shoppe.getItems()[i].getQuantity() + 1);
                    shoppe.total = parseFloat(shoppe.total);
                    shoppe.total+=itemObj.getPrice();
                    shoppe.total.toFixed(2);
                    break;
                }
            }
        }

		store.setItem(model.itemsStorage, JSON.stringify(shoppe.getItems()));
		refreshUI();
    }

    function createAddFn(itemObj) {
    	return function () {
			addItemToCart(itemObj);
    	};
    }

   	function removeItemFromCart(itemObj) {
		for (var i = 0; i < shoppe.getItems().length; i++) {
			if (shoppe.getItems()[i].getId() === itemObj.getId()) {
                if (itemObj.getQuantity() === 1) {
                    shoppe.getItems().splice(i, 1);
                } else {
                    shoppe.getItems()[i].setQuantity(itemObj.getQuantity() - 1);
                }
                shoppe.total = parseFloat(shoppe.total);
                shoppe.total-=itemObj.getPrice();
                shoppe.total.toFixed(2);
                break;
			}
		}
		store.setItem(model.itemsStorage, JSON.stringify(shoppe.getItems()));
		refreshUI();
    }

    function createRemoveFn(itemObj) {
    	return function () {
			removeItemFromCart(itemObj);
    	};
    }

    function ShoppeItem(props) {
    	if (props === undefined) {
    		console.error('shoppeJs: Empty item');
    		return {};
    	}

    	this.id = (props.id !== undefined) ? props.id : null;
		this.name = (props.name !== undefined) ? props.name : null;
		this.description = (props.description !== undefined) ? props.description : null;
		this.price = (props.price !== undefined) ? props.price : null;
        this.quantity = (props.quantity !== undefined) ? props.quantity : null;
		this.element = (props.element !== undefined) ? props.element : null;
	}

    ShoppeItem.prototype.getId = function () {
        return this.id;
    };

    ShoppeItem.prototype.setId = function (id) {
        this.id = id;
    };

    ShoppeItem.prototype.getName = function () {
        return this.name;
    };

    ShoppeItem.prototype.setName = function (name) {
        this.name = name;
    };

    ShoppeItem.prototype.getQuantity = function () {
        return this.quantity;
    };

    ShoppeItem.prototype.setQuantity = function (quantity) {
        this.quantity = quantity;
    };

    ShoppeItem.prototype.getPrice = function () {
        return this.price;
    };

    ShoppeItem.prototype.setPrice = function (price) {
        this.price = price;
    };

	function ShoppeModel() {
		this.itemMainName = 'shoppe-item';
		this.itemName ='item-name';
		this.itemDescription = 'item-description';
		this.itemPrice = 'item-price';
		this.optionsStorage = 'shoppe-options';
		this.itemsStorage = 'shoppe-items';
		this.itemCount = 'shoppe-item-count';
		this.addCallback = 'shoppe-add';
		this.cartView = 'shoppe-cart';
        this.cartHeadings = 'shoppe-cart-heading';
		this.cartList = 'shoppe-cart-list';
		this.cartItem = 'shoppe-cart-item-';
		this.cartTotal = 'shoppe-cart-total';
		this.shopItemList = [];
		this.shopItemCountList = [];
		this.cartTotalList = [];
		this.cartViewList = [];
        this.zero = '0.00';
	}

    ShoppeModel.prototype.getShopItemList = function () {
        return this.shopItemList;
    };

    ShoppeModel.prototype.setShopItemList = function (elements) {
        this.shopItemList = elements;
    };

    ShoppeModel.prototype.getShopItemCountList = function () {
        return this.shopItemCountList;
    };

    ShoppeModel.prototype.setShopItemCountList = function (elements) {
        this.shopItemCountList = elements;
    };

    ShoppeModel.prototype.getCartViewList = function () {
        return this.cartViewList;
    };

    ShoppeModel.prototype.setCartViewList = function (elements) {
        this.cartViewList = elements;
    };

    ShoppeModel.prototype.getCartTotalList = function () {
        return this.cartTotalList;
    };

    ShoppeModel.prototype.setCartTotalList = function (elements) {
        this.cartTotalList = elements;
    };

	function createCartItem(itemEl, itemObj) {
		var nameNode, removeTextNode, costNode, removeNode, quantityNode;

		nameNode = thisDoc.createElement('td');
		nameNode.innerHTML = itemObj.getName();
		nameNode.style = 'padding-right: 5px';

		costNode = thisDoc.createElement('td');
		costNode.innerHTML = currencyLookup(shoppe.getOptions().currency) + itemObj.getPrice().toFixed(2);
		costNode.style = 'padding-right: 5px';

        quantityNode = thisDoc.createElement('td');
        quantityNode.innerHTML = itemObj.getQuantity();
        quantityNode.style = 'padding-right: 5px';
        quantityNode.id = model.cartItem + itemObj.getId() + 'q';

        removeNode = thisDoc.createElement('td');
		removeTextNode = thisDoc.createElement('span');
		removeTextNode.innerHTML = 'Remove';
		removeTextNode.style = 'text-decoration: underline; cursor: pointer';
		removeTextNode.onclick = createRemoveFn(itemObj);
        removeNode.appendChild(removeTextNode);

		itemEl.id = (model.cartItem + itemObj.getId());
		itemEl.appendChild(nameNode);
		itemEl.appendChild(costNode);
        itemEl.appendChild(quantityNode);
		itemEl.appendChild(removeNode);

		return itemEl;
	}

    function createCartHeadings() {
        var tr = thisDoc.createElement("tr");
        var th1 = thisDoc.createElement("th");
        var th2 = thisDoc.createElement("th");
        var th3 = thisDoc.createElement("th");
        var th4 = thisDoc.createElement("th");

        th1.innerHTML = "Name";
        th2.innerHTML = "Cost";
        th3.innerHTML = "Quantity";
        th4.innerHTML = "";
        tr.appendChild(th1);
        tr.appendChild(th2);
        tr.appendChild(th3);
        tr.appendChild(th4);

        return tr;
    }

	// Find currency symbol
	function currencyLookup(abbr) {
		var symbol;

		switch (abbr) {
			case 'GBP':
				symbol = '&pound;';
				break;
			case 'USD':
				symbol = '$';
				break;
			default:
				symbol = '$';
		}

		return symbol;
	}
     
    return shoppe;
}());