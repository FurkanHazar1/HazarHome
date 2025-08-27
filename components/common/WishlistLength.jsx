"use client";

import { useContextElement } from "@/context/Context";

export default function WishlistLength() {
  const context = useContextElement();
  const wishList = context?.wishList || [];
  return <>{wishList.length}</>;
}
