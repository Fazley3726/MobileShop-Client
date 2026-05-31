# Mobile Shop

A modern mobile e-commerce frontend built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS**. Browse smartphones from top brands, manage a shopping cart and favorites, view detailed product specs, and complete a checkout flow — all with a clean, Apple-inspired UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Live Demo

> Add your deployed URL here after publishing to Vercel.

<!-- [View Live Demo](https://your-demo-url.vercel.app) -->

## Features

- **Product catalog** — Dynamic phone listing fetched from REST API
- **Hero section** — Featured phone carousel with Google Model Viewer 3D display
- **Brand filter** — Browse by Apple, Samsung, Xiaomi, OnePlus, and more
- **Product detail page** — Image gallery, variant selectors, ratings, pros/cons, and full specifications
- **Shopping cart** — Add/remove items, quantity controls, subtotal, and delivery charge
- **Favorites** — Save preferred phones (persisted in `localStorage`)
- **Checkout flow** — Multi-step Buy Now and cart checkout modals
- **Load more** — Paginated product loading
- **Responsive design** — Optimized for mobile, tablet, and desktop
- **Loading states** — Skeleton UI and error handling

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS v4, Custom CSS animations |
| Data | REST API, Fetch API |
| Storage | localStorage, sessionStorage |
| 3D | Google Model Viewer |
| Tooling | ESLint, npm |

## API

Product data is fetched from the [Programming Hero Open API](https://openapi.programming-hero.com/api/phones):

```
GET https://openapi.programming-hero.com/api/phones?search={keyword}
```

**Response fields used:** `brand`, `phone_name`, `slug`, `image`

> Prices, delivery charges, ratings, and some specifications are generated client-side for demo purposes.

## Project Structure

```
MobileShop-Client/
├── app/
│   ├── layout.tsx           # Root layout, fonts, Model Viewer script
│   ├── page.tsx             # Home page (catalog, cart, hero, modals)
│   ├── globals.css          # Global styles and animations
│   └── food/[id]/page.tsx   # Product detail page
├── public/                  # Static assets
├── next.config.ts
├── PROJECT_OVERVIEW.md      # Detailed project documentation (Bangla)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/MobileShop-Client.git
cd MobileShop-Client

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Scripts

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

> **Note:** Dev server uses `--webpack` instead of Turbopack for better compatibility on Windows.

## User Flow

1. Home page loads phones from API (default: iPhone)
2. User browses grid, filters by brand, or opens favorites
3. Clicking a phone opens the detail page (`/food/[slug]`)
4. User adds to cart or buys now
5. Checkout modal shows subtotal, delivery charge, and order confirmation

## Data Storage

| Key | Storage | Description |
|-----|---------|-------------|
| `cart` | localStorage | Cart items with quantity |
| `favorites` | localStorage | List of favorite phone slugs |
| `selectedPhone` | sessionStorage | Temporary data when navigating to detail page |

## Screenshots

> Add screenshots here after capturing from the running app.

<!--
| Home | Detail | Cart |
|------|--------|------|
| ![Home](./screenshots/home.png) | ![Detail](./screenshots/detail.png) | ![Cart](./screenshots/cart.png) |
-->

## Known Limitations

- No backend — orders are not saved to a server
- No authentication or payment gateway
- Search logic exists but navbar search input is not implemented yet
- Product route uses `/food/[slug]` (legacy path from initial template)
- 3D model file (`apple_iphone_13_pro_max.glb`) needs to be added to `public/` for full hero display

## Future Improvements

- [ ] Backend API + database for orders and users
- [ ] Login / signup
- [ ] Payment integration (bKash, SSLCommerz, Stripe)
- [ ] Search bar in navbar
- [ ] Refactor into reusable components
- [ ] Product comparison feature
- [ ] Deploy to Vercel with custom domain

## Deploy on Vercel

The easiest way to deploy this Next.js app:

1. Push the project to GitHub
2. Import the repo on [Vercel](https://vercel.com/new)
3. Deploy — no extra config needed

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Author

**Your Name**

- Portfolio: [your-portfolio-url]
- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [your-linkedin]

## License

This project is open source and available under the [MIT License](LICENSE).

---

For a detailed Bangla project overview, see [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).
