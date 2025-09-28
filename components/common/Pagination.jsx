"use client";
import React, { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ currentPage = 1, totalPages = 1 }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageClick = (pageNumber) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber);
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  // Sayfa numaralarını oluştur
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <>
      {pageNumbers.map((num) => (
        <li key={num} className={currentPage === num ? "active" : ""}>
          <a className="pagination-link animate-hover-btn" onClick={() => handlePageClick(num)}>
            {num}
          </a>
        </li>
      ))}
      {currentPage < totalPages && (
        <li>
          <a
            onClick={() => handlePageClick(currentPage + 1)}
            className="pagination-link animate-hover-btn"
          >
            <span className="icon icon-arrow-right" />
          </a>
        </li>
      )}
    </>
  );
}
