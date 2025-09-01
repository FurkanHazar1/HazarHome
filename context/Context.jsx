"use client";
import { openCartModal } from "@/utlis/openCartModal";
// import { openCart } from "@/utlis/toggleCart";
import React, { useEffect } from "react";
import { useContext, useState } from "react";
const dataContext = React.createContext();
export const useContextElement = () => {
  return useContext(dataContext);
};

export default function Context({ children }) {
  const [cartProducts, setCartProducts] = useState([]);
  const [wishList, setWishList] = useState([1, 2, 3]);
  const [compareItem, setCompareItem] = useState([1, 2, 3]);
  const [quickViewItem, setQuickViewItem] = useState({
    id: 1,
    title: "Sample Product",
    price: 0,
    imgSrc: "/images/default-product.jpg",
    type: "furniture",
    images: ["/images/default-product.jpg"],
    colors: [],
    sizes: [],
  });
  const [quickAddItem, setQuickAddItem] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  useEffect(() => {
    const subtotal = cartProducts.reduce((accumulator, product) => {
      return accumulator + product.quantity * product.price;
    }, 0);
    setTotalPrice(subtotal);
  }, [cartProducts]);

  const addProductToCart = (productData, qty = 1, options = {}) => {
    // Yeni kullanım: Doğrudan ürün objesi geçilmesi
    if (productData && productData.id) {
      const existingInCart = cartProducts.find((elm) => elm.id == productData.id);
      
      if (existingInCart) {
        // Zaten sepette varsa, miktarını artır
        setCartProducts(prev => 
          prev.map(item => 
            item.id === productData.id 
              ? { ...item, quantity: item.quantity + qty }
              : item
          )
        );
      } else {
        // Sepette yoksa, yeni ürün olarak ekle
        const cartItem = {
          id: productData.id,
          title: productData.title || productData.name,
          price: productData.price,
          imgSrc: productData.imgSrc || (productData.images && productData.images[0]) || '/images/default-product.jpg',
          quantity: qty,
          type: productData.type,
          category: productData.category || productData.categoryName || null,
          // Seçilen özellikler (renk, boyut vs.)
          selectedColor: options.color || null,
          selectedSize: options.size || null,
        };
        setCartProducts((pre) => [...pre, cartItem]);
      }
      openCartModal();
    }
  };
  const isAddedToCartProducts = (id) => {
    return cartProducts.some((elm) => elm.id == id);
  };

  const updateQuantity = (id, qty) => {
    const existingProduct = cartProducts.find((elm) => elm.id == id);
    if (existingProduct) {
      setCartProducts(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, quantity: qty }
            : item
        )
      );
      openCartModal();
    }
  };
  const addToWishlist = (id) => {
    if (!wishList.includes(id)) {
      setWishList((pre) => [...pre, id]);
    } else {
      setWishList((pre) => [...pre].filter((elm) => elm != id));
    }
  };
  const removeFromWishlist = (id) => {
    if (wishList.includes(id)) {
      setWishList((pre) => [...pre.filter((elm) => elm != id)]);
    }
  };
  const addToCompareItem = (id) => {
    if (!compareItem.includes(id)) {
      setCompareItem((pre) => [...pre, id]);
    }
  };
  const removeFromCompareItem = (id) => {
    if (compareItem.includes(id)) {
      setCompareItem((pre) => [...pre.filter((elm) => elm != id)]);
    }
  };
  const isAddedtoWishlist = (id) => {
    if (wishList.includes(id)) {
      return true;
    }
    return false;
  };
  const isAddedtoCompareItem = (id) => {
    if (compareItem.includes(id)) {
      return true;
    }
    return false;
  };
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cartList"));
    if (items?.length) {
      setCartProducts(items);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartList", JSON.stringify(cartProducts));
  }, [cartProducts]);
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("wishlist"));
    if (items?.length) {
      setWishList(items);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishList));
  }, [wishList]);

  const contextElement = {
    cartProducts,
    setCartProducts,
    totalPrice,
    addProductToCart,
    isAddedToCartProducts,
    removeFromWishlist,
    addToWishlist,
    isAddedtoWishlist,
    quickViewItem,
    wishList,
    setQuickViewItem,
    quickAddItem,
    setQuickAddItem,
    addToCompareItem,
    isAddedtoCompareItem,
    removeFromCompareItem,
    compareItem,
    setCompareItem,
    updateQuantity,
  };
  return (
    <dataContext.Provider value={contextElement}>
      {children}
    </dataContext.Provider>
  );
}
