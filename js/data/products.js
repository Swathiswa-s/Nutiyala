/**
 * Aaradhya Clothing - Centralized Product Catalog
 * Indian craftsmanship, reimagined for the modern woman.
 */

export const CATEGORIES = [
  { id: 'all', name: 'All Pieces' },
  { id: 'kurtis', name: 'Kurtis', description: 'Everyday elegance, crafted with intention.' },
  { id: 'coords', name: 'Co-ord Sets', description: 'Modern silhouettes designed to move with you.' },
  { id: 'shawls', name: 'Shawls', description: 'Layers of warmth, artistry and grace.' },
  { id: 'hijabs', name: 'Hijabs', description: 'Soft textures. Refined drapes.' },
  { id: 'new-arrivals', name: 'New Arrivals', description: 'Freshly unveiled handcrafted masterworks.' },
  { id: 'bestsellers', name: 'Bestsellers', description: 'Beloved silhouettes cherished season after season.' }
];

export const PRODUCTS = [
  {
    id: 'sage-sharara-kurti',
    name: 'Sage Garden Embroidered Sharara Kurti',
    slug: 'sage-garden-embroidered-sharara-kurti',
    category: 'kurtis',
    categoryName: 'Kurtis',
    price: 18500,
    originalPrice: 22000,
    currency: 'INR',
    formattedPrice: '₹18,500',
    formattedOriginalPrice: '₹22,000',
    badge: 'Campaign Exclusive',
    isNew: true,
    isBestseller: true,
    rating: 4.9,
    reviewCount: 38,
    primaryImage: 'assets/images/pexels/sage_kurti_1.jpg',
    secondaryImage: 'assets/images/pexels/sage_kurti_2.jpg',
    detailImage: 'assets/images/pexels/craft_detail_new_1.jpg',
    colors: [
      { name: 'Sage & Gold', hex: '#8a9a86', image: 'assets/images/pexels/sage_kurti_1.jpg' },
      { name: 'Dusty Rosewood', hex: '#b58385', image: 'assets/images/pexels/rosewood_coord_new_1.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Pure Mulberry Silk & Chanderi Organza',
    craft: 'Handcrafted Zari & Resham Needlework',
    fit: 'Relaxed A-Line silhouette with kalidar sharara flare',
    description: 'An ode to royal Rajasthan courtyards. Handwoven in pure mulberry silk with subtle antique gold zari motifs and finished with a floating organza dupatta trimmed with hand-twisted tassels.',
    details: [
      'Pure Mulberry Silk kurti with gold zari floral bootas',
      'Flared kalidar sharara trousers with elasticated back waist',
      'Sheer Chanderi organza dupatta with hand-scalloped border',
      'Artisan crafted over 48 hours of precision embroidery',
      'Concealed side zipper and soft cotton mulmul lining'
    ],
    care: [
      'Dry clean only by luxury garment specialist',
      'Store wrapped in breathable unbleached muslin cloth',
      'Steam iron on reverse using low temperature',
      'Avoid spraying perfume directly onto gold zari work'
    ],
    shipping: 'Complimentary insured courier delivery across India within 3–5 business days. International express dispatch available.'
  },
  {
    id: 'lavender-chikankari-kurti',
    name: 'Lavender Embroidered Silk Kurti Set',
    slug: 'lavender-embroidered-silk-kurti-set',
    category: 'kurtis',
    categoryName: 'Kurtis',
    price: 16800,
    originalPrice: null,
    currency: 'INR',
    formattedPrice: '₹16,800',
    formattedOriginalPrice: null,
    badge: 'Artisan Made',
    isNew: true,
    isBestseller: true,
    rating: 5.0,
    reviewCount: 42,
    primaryImage: 'assets/images/pexels/lavender_kurti_new_1.jpg',
    secondaryImage: 'assets/images/pexels/lavender_kurti_new_2.jpg',
    detailImage: 'assets/images/pexels/craft_detail_new_1.jpg',
    colors: [
      { name: 'Pastel Lilac', hex: '#c5b5d1', image: 'assets/images/pexels/lavender_kurti_new_1.jpg' },
      { name: 'Warm Terracotta', hex: '#a65942', image: 'assets/images/pexels/terracotta_coord_new_1.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Raw Mulberry Silk & Handspun Chanderi',
    craft: 'Tonal White Silk Needle Embroidery',
    fit: 'Straight silhouette with side slits and tapered cigarette pants',
    description: 'A contemporary interpretation of delicate Indian needlecraft. Featuring tonal white floral vine embroidery cascading down the neckline and sleeves, paired with tailored straight-cut trousers.',
    details: [
      'Tailored from bespoke hand-dyed lavender mulberry silk',
      'Artisanal hand embroidery along collar, cuffs, and hemlines',
      'Includes coordinated silk cigarette trousers with pocket detail',
      'Featherlight breathable drape designed for evening celebrations',
      'Mother of pearl closure buttons'
    ],
    care: [
      'Dry clean only',
      'Do not wring or soak',
      'Iron on silk setting with damp pressing cloth',
      'Keep away from direct sunlight when storing'
    ],
    shipping: 'Dispatches within 48 hours in signature Aaradhya gift packaging.'
  },
  {
    id: 'terracotta-architectural-coord',
    name: 'Terracotta Architectural Silk Co-ord',
    slug: 'terracotta-architectural-silk-coord',
    category: 'coords',
    categoryName: 'Co-ord Sets',
    price: 15400,
    originalPrice: 17500,
    currency: 'INR',
    formattedPrice: '₹15,400',
    formattedOriginalPrice: '₹17,500',
    badge: 'Bestseller',
    isNew: false,
    isBestseller: true,
    rating: 4.8,
    reviewCount: 64,
    primaryImage: 'assets/images/pexels/terracotta_coord_new_1.jpg',
    secondaryImage: 'assets/images/pexels/terracotta_coord_new_2.jpg',
    detailImage: 'assets/images/pexels/editorial_model_1.jpg',
    colors: [
      { name: 'Baked Terracotta', hex: '#9d533f', image: 'assets/images/pexels/terracotta_coord_new_1.jpg' },
      { name: 'Sage Green', hex: '#8a9a86', image: 'assets/images/pexels/sage_kurti_1.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Heavy Crepe de Chine Silk',
    craft: 'Woven Brocade Border Weave',
    fit: 'Fluid longline tunic with architectural palazzo trousers',
    description: 'Sculpted for the modern woman who values quiet authority and effortless grace. Clean geometric lines meet earthy terracotta silk with woven heritage gold borders.',
    details: [
      'Minimalist mandarin slit collar with concealed placket',
      'Woven antique gold border along cuffs and deep tunic hem',
      'Wide-leg palazzo trousers with deep side pockets',
      'Natural wrinkle-resistant silk blend ideal for luxury travel'
    ],
    care: [
      'Specialist dry clean only',
      'Store flat in archival cotton garment bag',
      'Warm iron with cloth protector'
    ],
    shipping: 'Complimentary domestic express shipping with tracked delivery.'
  },
  {
    id: 'rosewood-palazzo-suit',
    name: 'Rosewood Silk Asymmetric Co-ord Set',
    slug: 'rosewood-silk-asymmetric-coord-set',
    category: 'coords',
    categoryName: 'Co-ord Sets',
    price: 17200,
    originalPrice: null,
    currency: 'INR',
    formattedPrice: '₹17,200',
    formattedOriginalPrice: null,
    badge: 'New Season',
    isNew: true,
    isBestseller: false,
    rating: 4.9,
    reviewCount: 19,
    primaryImage: 'assets/images/pexels/rosewood_coord_new_1.jpg',
    secondaryImage: 'assets/images/pexels/rosewood_coord_new_2.jpg',
    detailImage: 'assets/images/pexels/craft_detail_new_1.jpg',
    colors: [
      { name: 'Dusty Rosewood', hex: '#b58385', image: 'assets/images/pexels/rosewood_coord_new_1.jpg' },
      { name: 'Sage & Gold', hex: '#8a9a86', image: 'assets/images/pexels/sage_kurti_2.jpg' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Tussar Georgette & Handloom Cotton-Silk',
    craft: 'Zari Needlework & Hand-pleated accents',
    fit: 'Contemporary asymmetric tunic with fluid layered palazzo',
    description: 'An editorial balance of understated luxury and traditional textiles. Crafted in nuanced rosewood tones with delicate golden zari accents that catch candlelight.',
    details: [
      'Asymmetric side-draped hem with subtle zari detailing',
      'Flowing wide-leg trousers crafted in complementary tone',
      'Featherweight lining for all-day breathability and movement',
      'Individually hand-dyed using botanical pigments'
    ],
    care: [
      'Dry clean recommended',
      'Keep away from moisture and harsh perfumes',
      'Gentle steam iron only'
    ],
    shipping: 'Ships in 3-5 days in bespoke Aaradhya keepsake box.'
  },
  {
    id: 'pashmina-kashmiri-shawl',
    name: 'Royal Heritage Pashmina Twill Shawl',
    slug: 'royal-heritage-pashmina-twill-shawl',
    category: 'shawls',
    categoryName: 'Shawls',
    price: 24500,
    originalPrice: 28000,
    currency: 'INR',
    formattedPrice: '₹24,500',
    formattedOriginalPrice: '₹28,000',
    badge: 'Heirloom Piece',
    isNew: false,
    isBestseller: true,
    rating: 5.0,
    reviewCount: 56,
    primaryImage: 'assets/images/pexels/pashmina_shawl_new_1.jpg',
    secondaryImage: 'assets/images/pexels/pashmina_shawl_new_2.jpg',
    detailImage: 'assets/images/pexels/editorial_model_1.jpg',
    colors: [
      { name: 'Sage & Rosewood', hex: '#98867a', image: 'assets/images/pexels/pashmina_shawl_new_1.jpg' },
      { name: 'Pure Pashmina Rose', hex: '#b58385', image: 'assets/images/pexels/pashmina_shawl_new_2.jpg' }
    ],
    sizes: ['One Size (100cm x 200cm)'],
    fabric: '100% Grade-A Changthangi Cashmere Pashmina',
    craft: 'Hand-Spun & Hand-Loomed Diamond Weave',
    fit: 'Generous 2-meter wrap with fluid drape',
    description: 'Woven by master craftspersons in the Kashmir valley from the finest Himalayan Changthangi underfleece. Featherlight yet extraordinarily warm, finished with soft hand-rolled fringes.',
    details: [
      'Certified authentic pure Pashmina wool',
      'Double-sided reversible twill weave',
      'Ultra-fine micron count (under 14 microns) for cloud-like softness',
      'Finished with hand-twisted and knotted eyelash fringes',
      'Accompanied by a certificate of artisanal provenance'
    ],
    care: [
      'Professional pashmina dry clean only',
      'Never tumble dry or expose to heat',
      'Store with natural cedar balls to protect fibers',
      'Aerate naturally in shade'
    ],
    shipping: 'Packaged in a handcrafted cedarwood protective box with authentication card.'
  },
  {
    id: 'lavender-silk-draped-hijab',
    name: 'Draped Pure Mulberry Silk Hijab',
    slug: 'draped-pure-mulberry-silk-hijab',
    category: 'hijabs',
    categoryName: 'Hijabs',
    price: 4200,
    originalPrice: null,
    currency: 'INR',
    formattedPrice: '₹4,200',
    formattedOriginalPrice: null,
    badge: 'Essential',
    isNew: true,
    isBestseller: true,
    rating: 4.9,
    reviewCount: 88,
    primaryImage: 'assets/images/pexels/hijab_lav_new_1.jpg',
    secondaryImage: 'assets/images/pexels/hijab_lav_new_2.jpg',
    detailImage: 'assets/images/pexels/lavender_kurti_new_2.jpg',
    colors: [
      { name: 'Soft Lilac', hex: '#c5b5d1', image: 'assets/images/pexels/hijab_lav_new_1.jpg' },
      { name: 'Terracotta Earth', hex: '#9d533f', image: 'assets/images/pexels/hijab_terra_new_1.jpg' }
    ],
    sizes: ['One Size (75cm x 195cm)'],
    fabric: '100% Mulberry Silk Habotai (14 Momme)',
    craft: 'Hand-rolled Eyelash Hem',
    fit: 'Voluminous yet whisper-light drape that stays in place',
    description: 'Designed for effortless everyday draping and special celebrations. Woven with a subtle matte-satin sheen that gently reflects light without slipping or weighing down.',
    details: [
      'Pure organic Mulberry silk of the highest grade',
      'Subtle natural textured grip to prevent slipping',
      'Hand-rolled and stitched hems for enduring beauty',
      'Hypoallergenic and temperature-regulating'
    ],
    care: [
      'Hand wash gently in cold water with mild silk detergent',
      'Roll in towel to remove excess water; lay flat in shade to dry',
      'Iron on cool setting while slightly damp'
    ],
    shipping: 'Dispatches within 24 hours. Free shipping on all hijab orders above ₹3,000.'
  },
  {
    id: 'terracotta-satin-crepe-hijab',
    name: 'Terracotta Matte Satin Crepe Hijab',
    slug: 'terracotta-matte-satin-crepe-hijab',
    category: 'hijabs',
    categoryName: 'Hijabs',
    price: 3800,
    originalPrice: 4500,
    currency: 'INR',
    formattedPrice: '₹3,800',
    formattedOriginalPrice: '₹4,500',
    badge: 'Artisan Edit',
    isNew: false,
    isBestseller: false,
    rating: 4.8,
    reviewCount: 31,
    primaryImage: 'assets/images/pexels/hijab_terra_new_1.jpg',
    secondaryImage: 'assets/images/pexels/hijab_terra_new_2.jpg',
    detailImage: 'assets/images/pexels/editorial_model_1.jpg',
    colors: [
      { name: 'Terracotta Earth', hex: '#9d533f', image: 'assets/images/pexels/hijab_terra_new_1.jpg' },
      { name: 'Soft Lilac', hex: '#c5b5d1', image: 'assets/images/pexels/hijab_lav_new_2.jpg' }
    ],
    sizes: ['One Size (80cm x 200cm)'],
    fabric: 'High-Twist Silk Crepe de Chine',
    craft: 'Precision French Seam Edges',
    fit: 'Graceful architectural folds with all-day hold',
    description: 'Inspired by the warm sun-washed plaster of haveli corridors. This earthy terracotta hijab pairs effortlessly with neutral tunics and tailored evening wear.',
    details: [
      'Opaque, non-sheer luxury fabric',
      'Rich mineral dye that retains depth over repeated wears',
      'Micro-texture provides secure pin-free wearability',
      'Signature embroidered tonal monogram corner'
    ],
    care: [
      'Hand wash cold or gentle dry clean',
      'Steam gently before wear for fluid drape'
    ],
    shipping: 'Ready to ship in 1-2 business days.'
  },
  {
    id: 'atelier-craft-shawl-wrap',
    name: 'Atelier Pashmina & Silk Reversible Shawl',
    slug: 'atelier-pashmina-silk-reversible-shawl',
    category: 'shawls',
    categoryName: 'Shawls',
    price: 21000,
    originalPrice: null,
    currency: 'INR',
    formattedPrice: '₹21,000',
    formattedOriginalPrice: null,
    badge: 'Limited Edition',
    isNew: true,
    isBestseller: false,
    rating: 5.0,
    reviewCount: 14,
    primaryImage: 'assets/images/pexels/atelier_shawl_new_1.jpg',
    secondaryImage: 'assets/images/pexels/atelier_shawl_new_2.jpg',
    detailImage: 'assets/images/pexels/craft_detail_new_1.jpg',
    colors: [
      { name: 'Rosewood & Sage', hex: '#b58385', image: 'assets/images/pexels/atelier_shawl_new_1.jpg' },
      { name: 'Sage & Gold', hex: '#8a9a86', image: 'assets/images/pexels/atelier_shawl_new_2.jpg' }
    ],
    sizes: ['One Size (110cm x 210cm)'],
    fabric: '70% Fine Pashmina Wool, 30% Mulberry Silk',
    craft: 'Jacquard Weave with Intricate Border Bootis',
    fit: 'Oversized royal wrap silhouette',
    description: 'A study in tactile harmony. By weaving high-sheen mulberry silk through cloud-soft Kashmiri pashmina, our weavers have created a reversible shawl that transitions seamlessly from cool mornings to formal evenings.',
    details: [
      'Reversible color play between dusty rose and muted sage',
      'Woven floral Paisley borders inspired by royal Mughal archives',
      'Naturally thermoregulating for year-round elegance',
      'Hand-finished by seventh-generation artisans'
    ],
    care: [
      'Dry clean only with approved wool detergent',
      'Fold gently with acid-free tissue between layers'
    ],
    shipping: 'Dispatches with authenticity seal and hand-signed provenance card.'
  }
];

export const EDITORIAL_QUOTES = [
  { text: 'Crafted with grace.', sub: 'Every silhouette honoring centuries of Indian handloom heritage.' },
  { text: 'Elegance lives in the details.', sub: 'A quiet dedication to needle, thread, and timeless proportions.' },
  { text: 'Tradition, with a modern rhythm.', sub: 'Designed for the contemporary woman who carries heritage forward.' },
  { text: 'Made slowly. Worn beautifully.', sub: 'From the first cut to the final stitch, shaped with love for the craft.' },
  { text: 'Every thread tells a story.', sub: 'The tactile memory of master weavers, passed through generations.' }
];

export const BRAND_STORY = {
  title: 'THE STORY OF AARADHYA',
  headline: 'Indian craftsmanship, reimagined for the modern woman.',
  paragraphs: [
    'Aaradhya Clothing was founded on a singular conviction: that true luxury lies in patience, provenance, and the human hand. In an era of hurried fashion, we return to the quiet sanctuaries of master weavers, needlecraft artisans, and heritage dyers across India.',
    'Each silhouette is designed with intention—fusing the fluid drape of royal Indian attire with the clean, architectural minimalism of contemporary everyday life. From pure Mulberry silks to cloud-soft Kashmiri Pashmina, our textiles are shaped slowly so they may be worn and cherished for generations.',
    'Before it becomes a garment, it becomes a craft. This is our promise to you: clothing that feels like second nature, honoring the woman who wears it and the artisan who brought it to life.'
  ],
  stats: [
    { value: '48+', label: 'Hours of Hand-Embroidery per Piece' },
    { value: '100%', label: 'Ethically Sourced Natural Silks' },
    { value: '120+', label: 'Master Artisans Supported' },
    { value: 'Zero', label: 'Compromise on Timeless Quality' }
  ]
};
