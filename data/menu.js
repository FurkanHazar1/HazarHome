// Oturma Odası Kategorileri (Alt kategoriler)
export const oturmaOdasiCategories = [
  {
    href: "/oturma-odasi",
    src: "/images/menu/oturma_odasi/oturma_odasi_main.jpg",
    alt: "Living-Room-Sets",
    name: "Oturma Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Trend" }],
  },
  {
    href: "/uclu-koltuklar",
    src: "/images/menu/oturma_odasi/uclu_koltuk.jpg",
    alt: "Three-Seater-Sofa",
    name: "Koltuklar",
    labels: [{ text: "Hot" }],
  },
  {
    href: "/kose-koltuklar",
    src: "/images/menu/oturma_odasi/kose_koltuk.jpg",
    alt: "Corner-Sofa",
    name: "Köşe Koltuklar",
    labels: [{ text: "Popular" }],
  },
  {
    href: "/berjer-koltuklar",
    src: "/images/menu/oturma_odasi/berjer.jpg",
    alt: "Armchair",
    name: "Berjer/Tekli Koltuklar",
  },
  {
    href: "/tv-uniteleri",
    src: "/images/menu/oturma_odasi/tv_unitesi.jpg",
    alt: "TV-Unit",
    name: "TV Üniteleri",
  },
  {
    href: "/sehpalar",
    src: "/images/menu/oturma_odasi/sehpa.jpg",
    alt: "Coffee-Table",
    name: "Sehpalar",
  },
];

// Yemek Odası Kategorileri (Alt kategoriler)
export const yemekOdasiCategories = [
  {
    href: "/yemek-odasi",
    src: "/images/menu/yemek_odasi/yemek-odasi-main.jpg",
    alt: "Dining-Room-Sets",
    name: "Yemek Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Hot" }],
  },
  {
    href: "/yemek-masalari",
    src: "/images/menu/yemek_odasi/yemek_masasi.jpg",
    alt: "Dining-Table",
    name: "Yemek Masaları",
  },

  {
    href: "/konsol-vitrin",
    src: "/images/menu/yemek_odasi/konsol_vitrin.jpg",
    alt: "Console-Table",
    name: "Konsol ve Vitrinler",
  },
];

// Yatak Odası Kategorileri (Alt kategoriler)
export const yatakOdasiCategories = [
  {
    href: "/yatak-odasi",
    src: "/images/menu/yatak_odasi/yatak-odasi-main.jpg",
    alt: "Bedroom-Sets",
    name: "Yatak Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Hot" }],
  },
  {
    href: "/yataklar",
    src: "/images/menu/yatak_odasi/yatak.jpg",
    alt: "Bed",
    name: "Yataklar",
  },
  {
    href: "/gardiroplar",
    src: "/images/menu/yatak_odasi/gardirop.jpg",
    alt: "Wardrobe",
    name: "Gardıroplar",
  },
  {
    href: "/komodinler",
    src: "/images/menu/yatak_odasi/komodin.jpg",
    alt: "Nightstand",
    name: "Komodinler",
  },

  {
    href: "/sifonyerler",
    src: "/images/menu/yatak_odasi/sifonyer.jpg",
    alt: "Dresser",
    name: "Şifonyerler",
  },
];

// Ana kategoriler (Menu için)
export const mainCategories = [
  {
    href: "/oturma-odasi-takimlari",
    src: "/images/menu/oturma_odasi/oturma_odasi_main.jpg",
    alt: "Living-Room",
    name: "Oturma Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Trend" }],
    subCategories: oturmaOdasiCategories
  },
  {
    href: "/yemek-odasi-takimlari",
    src: "/images/menu/yemek_odasi/yemek-odasi-main.jpg",
    alt: "Dining-Room",
    name: "Yemek Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Hot" }],
    subCategories: yemekOdasiCategories
  },
  {
    href: "/yatak-odasi-takimlari",
    src: "/images/menu/yatak_odasi/yatak-odasi-main.jpg",
    alt: "Bedroom",
    name: "Yatak Odası Takımları",
    labels: [{ className: "demo-new", text: "New" }, { text: "Hot" }],
    subCategories: yatakOdasiCategories
  }
];

export const subCategories = [
  {
    href: "/uclu-koltuklar",
    src: "/images/menu/oturma_odasi/uclu_koltuk.jpg",
    alt: "Three-Seater-Sofa",
    name: "Koltuklar",
    labels: [{ text: "Hot" }],
  },
  {
    href: "/kose-koltuklar",
    src: "/images/menu/oturma_odasi/kose_koltuk.jpg",
    alt: "Corner-Sofa",
    name: "Köşe Koltuklar",
    labels: [{ text: "Popular" }],
  },
  {
    href: "/berjer-koltuklar",
    src: "/images/menu/oturma_odasi/berjer.jpg",
    alt: "Armchair",
    name: "Berjer/Tekli Koltuklar",
  },
  {
    href: "/tv-uniteleri",
    src: "/images/menu/oturma_odasi/tv_unitesi.jpg",
    alt: "TV-Unit",
    name: "TV Üniteleri",
  },
  {
    href: "/sehpalar",
    src: "/images/menu/oturma_odasi/sehpa.jpg",
    alt: "Coffee-Table",
    name: "Sehpalar",
  },
    {
    href: "/yemek-masalari",
    src: "/images/menu/yemek_odasi/yemek_masasi.jpg",
    alt: "Dining-Table",
    name: "Yemek Masaları",
  },
  {
    href: "/konsol-vitrin",
    src: "/images/menu/yemek_odasi/konsol_vitrin.jpg",
    alt: "Console-Table",
    name: "Konsol ve Vitrinler",
  },
    {
    href: "/yataklar",
    src: "/images/menu/yatak_odasi/yatak.jpg",
    alt: "Bed",
    name: "Yataklar",
  },
  {
    href: "/gardiroplar",
    src: "/images/menu/yatak_odasi/gardirop.jpg",
    alt: "Wardrobe",
    name: "Gardıroplar",
  },
  {
    href: "/komodinler",
    src: "/images/menu/yatak_odasi/komodin.jpg",
    alt: "Nightstand",
    name: "Komodinler",
  },

  {
    href: "/sifonyerler",
    src: "/images/menu/yatak_odasi/sifonyer.jpg",
    alt: "Dresser",
    name: "Şifonyerler",
  },
];

export const productsPages = [
  {
    heading: "Shop layouts",
    links: [
      { href: "/shop-default", text: "Default" },
      { href: "/shop-left-sidebar", text: "Left sidebar" },
      { href: "/shop-right-sidebar", text: "Right sidebar" },
      { href: "/shop-fullwidth", text: "Fullwidth" },
      { href: "/shop-collection-sub", text: "Sub collection" },
      { href: "/shop-collection-list", text: "Collections list" },
    ],
  },
  {
    heading: "Features",
    links: [
      { href: "/shop-link", text: "Pagination links" },
      { href: "/shop-loadmore", text: "Pagination loadmore" },
      {
        href: "/shop-infinite-scrolling",
        text: "Pagination infinite scrolling",
      },
      { href: "/shop-filter-sidebar", text: "Filter sidebar" },
      { href: "/shop-filter-hidden", text: "Filter hidden" },
    ],
  },
  {
    heading: "Product styles",
    links: [
      // { href: "/product-style-list", text: "Product style list" },s
      { href: "/product-style-01", text: "Product style 01" },
      { href: "/product-style-02", text: "Product style 02" },
      { href: "/product-style-03", text: "Product style 03" },
      { href: "/product-style-04", text: "Product style 04" },
      { href: "/product-style-05", text: "Product style 05" },
      { href: "/product-style-06", text: "Product style 06" },
      { href: "/product-style-07", text: "Product style 07" },
    ],
  },
];

export const productDetailPages = [
  {
    heading: "Product layouts",
    links: [
      { href: "/product-detail/1", text: "Product default" },
      { href: "/product-grid-1/2", text: "Product grid 1" },
      { href: "/product-grid-2/3", text: "Product grid 2" },
      { href: "/product-stacked/4", text: "Product stacked" },
      { href: "/product-right-thumbnails/5", text: "Product right thumbnails" },
      {
        href: "/product-bottom-thumbnails/6",
        text: "Product bottom thumbnails",
      },
      { href: "/product-drawer-sidebar/7", text: "Product drawer sidebar" },
      {
        href: "/product-description-accordion/8",
        text: "Product description accordion",
      },
      {
        href: "/product-description-list/10",
        text: "Product description list",
      },
      {
        href: "/product-description-vertical/11",
        text: "Product description vertical",
      },
    ],
  },
  {
    heading: "Product details",
    links: [
      { href: "/product-inner-zoom/12", text: "Product inner zoom" },
      { href: "/product-zoom-magnifier/13", text: "Product zoom magnifier" },
      { href: "/product-no-zoom/14", text: "Product no zoom" },
      {
        href: "/product-photoswipe-popup/15",
        text: "Product photoswipe popup",
      },
      {
        href: "/product-zoom-popup/16",
        text: "Product external zoom and photoswipe popup",
      },
      { href: "/product-video/17", text: "Product video" },
      { href: "/product-3d/18", text: "Product 3D, AR models" },
      {
        href: "/product-options-customizer/19",
        text: "Product options & customizer",
      },
      { href: "/product-advanced-types/20", text: "Advanced product types" },
      {
        href: "/product-giftcard/21",
        text: "Recipient information form for gift card products",
      },
    ],
  },
  {
    heading: "Product swatches",
    links: [
      { href: "/product-color-swatch/22", text: "Product color swatch" },
      { href: "/product-rectangle/23", text: "Product rectangle" },
      { href: "/product-rectangle-color/24", text: "Product rectangle color" },
      { href: "/product-swatch-image/25", text: "Product swatch image" },
      {
        href: "/product-swatch-image-rounded/26",
        text: "Product swatch image rounded",
      },
      { href: "/product-swatch-dropdown/27", text: "Product swatch dropdown" },
      {
        href: "/product-swatch-dropdown-color/29",
        text: "Product swatch dropdown color",
      },
    ],
  },
  {
    heading: "Product features",
    links: [
      {
        href: "/product-frequently-bought-together/30",
        text: "Frequently bought together",
      },
      {
        href: "/product-frequently-bought-together-2/31",
        text: "Frequently bought together 2",
      },
      { href: "/product-upsell-features/32", text: "Product upsell features" },
      { href: "/product-pre-orders/33", text: "Product pre-orders" },
      { href: "/product-notification/34", text: "Back in stock notification" },
      { href: "/product-pickup/35", text: "Product pickup" },
      { href: "/product-images-grouped/36", text: "Variant images grouped" },
      { href: "/product-complimentary/37", text: "Complimentary products" },
      {
        href: "/product-quick-order-list/38",
        text: "Quick order list",
        extra: (
          <div className="demo-label">
            <span className="demo-new">New</span>
          </div>
        ),
      },
      {
        href: "/product-detail-volume-discount/38",
        text: "Volume Discount",
        extra: (
          <div className="demo-label">
            <span className="demo-new">New</span>
          </div>
        ),
      },
      {
        href: "/product-detail-volume-discount-grid/38",
        text: "Volume Discount Grid",
        extra: (
          <div className="demo-label">
            <span className="demo-new">New</span>
          </div>
        ),
      },
      {
        href: "/product-detail-buyx-gety/38",
        text: "Buy X Get Y",
        extra: (
          <div className="demo-label">
            <span className="demo-new">New</span>
          </div>
        ),
      },
    ],
  },
];

export const pages = [
  {
    href: "/about-us",
    text: "About us",
    className: "menu-link-text link text_black-2",
    links: null,
  },
  {
    href: "#",
    text: "Brands",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/brands",
        text: "Brands",
        className: "menu-link-text link text_black-2 position-relative",
        label: "New",
      },
      {
        href: "/brands-v2",
        text: "Brand V2",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "#",
    text: "Contact",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/contact-1",
        text: "Contact 1",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/contact-2",
        text: "Contact 2",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "#",
    text: "FAQ",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/faq-1",
        text: "FAQ 01",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/faq-2",
        text: "FAQ 02",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "#",
    text: "Store",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/our-store",
        text: "Our store",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/store-locations",
        text: "Store locator",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "/timeline",
    text: "Timeline",
    className: "menu-link-text link text_black-2 position-relative",
    label: "New",
  },
  {
    href: "/view-cart",
    text: "View cart",
    className: "menu-link-text link text_black-2 position-relative",
  },
  {
    href: "/checkout",
    text: "Check out",
    className: "menu-link-text link text_black-2 position-relative",
  },
  {
    href: "#",
    text: "Payment",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/payment-confirmation",
        text: "Payment Confirmation",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/payment-failure",
        text: "Payment Failure",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "#",
    text: "My account",
    className: "menu-link-text link text_black-2",
    links: [
      {
        href: "/my-account",
        text: "My account",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/my-account-orders",
        text: "My order",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/my-account-orders-details",
        text: "My order details",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/my-account-address",
        text: "My address",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/my-account-edit",
        text: "My account details",
        className: "menu-link-text link text_black-2",
      },
      {
        href: "/my-account-wishlist",
        text: "My wishlist",
        className: "menu-link-text link text_black-2",
      },
    ],
  },
  {
    href: "/invoice",
    text: "Invoice",
    className: "menu-link-text link text_black-2 position-relative",
  },
  {
    href: "/page-not-found",
    text: "404",
    className: "menu-link-text link text_black-2 position-relative",
  },
];

export const blogLinks = [
  { href: "/blog-grid", text: "Grid layout" },
  { href: "/blog-sidebar-left", text: "Left sidebar" },
  { href: "/blog-sidebar-right", text: "Right sidebar" },
  { href: "/blog-list", text: "Blog list" },
  { href: "/blog-detail/1", text: "Single Post" },
];

export const navItems = [
  {
    id: "dropdown-menu-one",
    label: "Home",
    links: [
      { href: "/", label: "Home Fashion 01" },
      { href: "/home-multi-brand", label: "Home Multi Brand" },
      { href: "/home-02", label: "Home Fashion 02" },
      { href: "/home-03", label: "Home Fashion 03" },
      { href: "/home-04", label: "Home Fashion 04" },
      { href: "/home-05", label: "Home Fashion 05" },
      { href: "/home-06", label: "Home Fashion 06" },
      { href: "/home-personalized-pod", label: "Home Personalized Pod" },
      { href: "/home-pickleball", label: "Home Pickleball" },
      { href: "/home-ceramic", label: "Home Ceramic" },
      { href: "/home-food", label: "Home Food" },
      { href: "/home-camp-and-hike", label: "Home Camp And Hike" },
      { href: "/home-07", label: "Home Fashion 07" },
      { href: "/home-08", label: "Home Fashion 08" },
      { href: "/home-skincare", label: "Home Skincare" },
      { href: "/home-headphone", label: "Home Headphone" },
      { href: "/home-giftcard", label: "Home Gift Card" },
      { href: "/home-furniture", label: "Home Furniture" },
      { href: "/home-furniture-02", label: "Home Furniture 2" },
      { href: "/home-skateboard", label: "Home Skateboard" },
      { href: "/home-stroller", label: "Home Stroller" },
      { href: "/home-decor", label: "Home Decor" },
      { href: "/home-electronic", label: "Home Electronic" },
      { href: "/home-setup-gear", label: "Home Setup Gear" },
      { href: "/home-dog-accessories", label: "Home Dog Accessories" },
      { href: "/home-kitchen-wear", label: "Home Kitchen Wear" },
      { href: "/home-phonecase", label: "Home Phonecase" },
      { href: "/home-paddle-boards", label: "Home Paddle Boards" },
      { href: "/home-glasses", label: "Home Glasses" },
      { href: "/home-pod-store", label: "Home POD Store" },
      { href: "/home-activewear", label: "Activewear" },
      { href: "/home-handbag", label: "Home Handbag" },
      { href: "/home-tee", label: "Home Tee" },
      { href: "/home-sock", label: "Home Sock" },
      { href: "/home-jewerly", label: "Home Jewelry" },
      { href: "/home-sneaker", label: "Home Sneaker" },
      { href: "/home-accessories", label: "Home Accessories" },
      { href: "/home-grocery", label: "Home Grocery" },
      { href: "/home-baby", label: "Home Baby" },
      { href: "/home-cosmetic", label: "Home Cosmetic" },
      { href: "/home-plant", label: "Home Plant" },
      { href: "/home-swimwear", label: "Home Swimwear" },
      { href: "/home-electric-bike", label: "Home Electric Bike" },
      { href: "/home-footwear", label: "Home Footwear" },
      { href: "/home-bookstore", label: "Home Bookstore" },
      { href: "/home-gaming-accessories", label: "Home Gaming Accessories" },
    ],
  },
  {
    id: "dropdown-menu-two",
    label: "Shop",
    links: [
      {
        id: "sub-shop-one",
        label: "Ana Kategoriler",
        links: [
          { href: "/oturma-odasi", label: "Oturma Odası Takımları" },
          { href: "/yemek-odasi", label: "Yemek Odası Takımları" },
          { href: "/yatak-odasi", label: "Yatak Odası Takımları" },
        ],
      },
      {
        id: "sub-shop-two",
        label: "Oturma Odası",
        links: [
          { href: "/oturma-odasi-takimlari", label: "Oturma Odası Takımları" },
          { href: "/uclu-koltuklar", label: "Üçlü Koltuklar" },
          { href: "/kose-koltuklar", label: "Köşe Koltuklar" },
          { href: "/berjerler", label: "Berjerler" },
          { href: "/tv-uniteleri", label: "TV Üniteleri" },
          { href: "/sehpalar", label: "Sehpalar" },
        ],
      },
      {
        id: "sub-shop-three",
        label: "Yemek Odası",
        links: [
          { href: "/yemek-odasi-takimlari", label: "Yemek Odası Takımları" },
          { href: "/yemek-masalari", label: "Yemek Masaları" },
          { href: "/konsol-vitrin", label: "Konsol ve Vitrinler" },
        ],
      },
      {
        id: "sub-shop-four",
        label: "Yatak Odası",
        links: [
          { href: "/yatak-odasi-takimlari", label: "Yatak Odası Takımları" },
          { href: "/yataklar", label: "Yataklar" },
          { href: "/gardiroplar", label: "Gardıroplar" },
          { href: "/komodinler", label: "Komodinler" },
          { href: "/makyaj-masalari", label: "Makyaj Masaları" },
          { href: "/sifonyer", label: "Şifonyer" },
        ],
      },
    ],
  },
  {
    id: "dropdown-menu-three",
    label: "Products",
    links: [
      {
        id: "sub-product-one",
        label: "Product layouts",
        links: [
          { href: "/product-detail/1", label: "Product default" },
          { href: "/product-grid-1/2", label: "Product grid 1" },
          { href: "/product-grid-2/3", label: "Product grid 2" },
          { href: "/product-stacked/4", label: "Product stacked" },
          {
            href: "/product-right-thumbnails/5",
            label: "Product right thumbnails",
          },
          {
            href: "/product-bottom-thumbnails/6",
            label: "Product bottom thumbnails",
          },
          {
            href: "/product-drawer-sidebar/7",
            label: "Product drawer sidebar",
          },
          {
            href: "/product-description-accordion/8",
            label: "Product description accordion",
          },
          {
            href: "/product-description-list/9",
            label: "Product description list",
          },
          {
            href: "/product-description-vertical/10",
            label: "Product description vertical",
          },
        ],
      },
      {
        id: "sub-product-two",
        label: "Product details",
        links: [
          { href: "/product-inner-zoom/11", label: "Product inner zoom" },
          {
            href: "/product-zoom-magnifier/12",
            label: "Product zoom magnifier",
          },
          { href: "/product-no-zoom", label: "Product no zoom" },
          {
            href: "/product-photoswipe-popup/13",
            label: "Product photoswipe popup",
          },
          {
            href: "/product-zoom-popup/15",
            label: "Product external zoom and photoswipe popup",
          },
          { href: "/product-video/16", label: "Product video" },
          { href: "/product-3d", label: "Product 3D, AR models" },
          {
            href: "/product-options-customizer/17",
            label: "Product options & customizer",
          },
          {
            href: "/product-advanced-types/18",
            label: "Advanced product types",
          },
          {
            href: "/product-giftcard/19",
            label: "Recipient information form for gift card products",
          },
        ],
      },
      {
        id: "sub-product-three",
        label: "Product swatchs",
        links: [
          { href: "/product-color-swatch/20", label: "Product color swatch" },
          { href: "/product-rectangle", label: "Product rectangle" },
          {
            href: "/product-rectangle-color/21",
            label: "Product rectangle color",
          },
          { href: "/product-swatch-image/22", label: "Product swatch image" },
          {
            href: "/product-swatch-image-rounded",
            label: "Product swatch image rounded",
          },
          {
            href: "/product-swatch-dropdown/23",
            label: "Product swatch dropdown",
          },
          {
            href: "/product-swatch-dropdown-color/24",
            label: "Product swatch dropdown color",
          },
        ],
      },
      {
        id: "sub-product-four",
        label: "Product features",
        links: [
          {
            href: "/product-frequently-bought-together/25",
            label: "Frequently bought together",
          },
          {
            href: "/product-frequently-bought-together-2/26",
            label: "Frequently bought together 2",
          },
          {
            href: "/product-upsell-features/27",
            label: "Product upsell features",
          },
          { href: "/product-pre-orders/28", label: "Product pre-orders" },
          {
            href: "/product-notification/28",
            label: "Back in stock notification",
          },
          { href: "/product-pickup/29", label: "Product pickup" },
          {
            href: "/product-images-grouped/30",
            label: "Variant images grouped",
          },
          {
            href: "/product-complimentary/31",
            label: "Complimentary products",
          },
          {
            href: "/product-quick-order-list/32",
            label: "Quick order list",
            demoLabel: true,
          },
          {
            href: "/product-detail-volume-discount/38",
            label: "Volume Discount",
            demoLabel: true,
          },
          {
            href: "/product-detail-volume-discount-grid/38",
            label: "Volume Discount Grid",
            demoLabel: true,
          },
          {
            href: "/product-detail-buyx-gety/38",
            label: "Buy X Get Y",
            demoLabel: true,
          },
        ],
      },
    ],
  },
  {
    id: "dropdown-menu-four",
    label: "Pages",
    links: [
      { href: "/about-us", label: "About us" },
      { href: "/brands", label: "Brands", demoLabel: true },
      { href: "/brands-v2", label: "Brands V2" },
      { href: "/contact-1", label: "Contact 1" },
      { href: "/contact-2", label: "Contact 2" },
      { href: "/faq-1", label: "FAQ 01" },
      { href: "/faq-2", label: "FAQ 02" },
      { href: "/our-store", label: "Our store" },
      { href: "/store-locations", label: "Store locator" },
      { href: "/timeline", label: "Timeline", demoLabel: true },
      { href: "/view-cart", label: "View cart" },
      { href: "/my-account", label: "My account" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/terms", label: "Terms and conditions" },
      { href: "/page-not-found", label: "404 page" },
    ],
  },
  {
    id: "dropdown-menu-five",
    label: "Blogs",
    links: [
      { href: "/blog-grid", label: "Grid layout" },
      { href: "/blog-sidebar-left", label: "Left sidebar" },
      { href: "/blog-sidebar-right", label: "Right sidebar" },
      { href: "/blog-list", label: "Blog list" },
      { href: "/blog-detail/1", label: "Single Post" },
    ],
  },
];
