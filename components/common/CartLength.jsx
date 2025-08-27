"use client";

import { useContextElement } from "@/context/Context";

export default function CartLength() {
  const contextData = useContextElement();
  
  if (!contextData || !contextData.cartProducts) {
    return <>0</>;
  }
  
  const { cartProducts } = contextData;
  return <>{cartProducts.length}</>;
}
