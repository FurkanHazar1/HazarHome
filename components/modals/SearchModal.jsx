"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SearchModal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results || []);
      } else {
        console.error('Search error:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search request failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500); // 500ms delay
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    performSearch(searchQuery);
  };

  // Clear search when modal closes
  const handleModalClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className="offcanvas offcanvas-end canvas-search" id="canvasSearch">
      <div className="canvas-wrapper">
        <header className="tf-search-head">
          <div className="title fw-5">
            Ürün Ara
            <div className="close">
              <span
                className="icon-close icon-close-popup"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
                onClick={handleModalClose}
              />
            </div>
          </div>
          <div className="tf-search-sticky">
            <form
              onSubmit={handleSubmit}
              className="tf-mini-search-frm"
            >
              <fieldset className="text">
                <input
                  type="text"
                  placeholder="Mobilya ara..."
                  className=""
                  name="text"
                  tabIndex={0}
                  value={searchQuery}
                  onChange={handleInputChange}
                  aria-required="true"
                />
              </fieldset>
              <button className="" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <i className="icon-search" />
                )}
              </button>
            </form>
          </div>
        </header>
        <div className="canvas-body p-0">
          <div className="tf-search-content">
            {!hasSearched ? (
              // Arama yapılmadığında gösterilecek boş alan
              <div className="tf-cart-hide-has-results">
                <div className="text-center p-4">
                  <i className="icon-search fs-1 text-muted mb-3"></i>
                  <h5>Ürün Arama</h5>
                  <p className="text-muted">
                    Aradığınız mobilyayı yazmaya başlayın...
                  </p>
                </div>
              </div>
            ) : (
              // Arama sonuçları
              <div className="tf-search-results">
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Aranıyor...</span>
                    </div>
                    <p className="mt-2">Ürünler aranıyor...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="tf-search-content-title fw-5 mb-3">
                      {searchResults.length} ürün bulundu
                    </div>
                    <div className="tf-search-hidden-inner">
                      {searchResults.map((product, index) => (
                        <div className="tf-loop-item" key={`${product.type}-${product.id}`}>
                          <div className="image">
                            <Link href={product.href} onClick={handleModalClose}>
                              <Image
                                alt={product.title}
                                src={product.imgSrc}
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = '/images/products/placeholder.jpg';
                                }}
                              />
                            </Link>
                          </div>
                          <div className="content">
                            <Link href={product.href} onClick={handleModalClose}>
                              <h6 className="mb-1">{product.title}</h6>
                            </Link>
                            {product.category && (
                              <p className="text-muted small mb-1">
                                <i className="icon-list me-1"></i>
                                {product.category}
                              </p>
                            )}
                            {/* Etiketler */}
                            {product.tags && product.tags.length > 0 && (
                              <div className="mb-1">
                                {product.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span 
                                    key={tagIndex}
                                    className="badge bg-light text-dark me-1"
                                    style={{ fontSize: '10px' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {product.tags.length > 2 && (
                                  <span className="text-muted small">+{product.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                            <div className="tf-product-info-price">
                              <div className="price fw-6">
                                ${product.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <i className="icon-search fs-1 text-muted mb-3"></i>
                    <h5>Sonuç bulunamadı</h5>
                    <p className="text-muted">
                      "{searchQuery}" için hiçbir ürün bulunamadı. <br />
                      Lütfen farklı bir arama terimi deneyin.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
