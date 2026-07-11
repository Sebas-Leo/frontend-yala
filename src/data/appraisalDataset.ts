// Local dataset for the "Agente de Tasación por Foto". Prices in PEN (S/.).
// The AI identifies the item (category/franchise/character); we match against this
// list by category + franchise + character (fuzzy, normalized — not exact text) to
// return a price range and a few comparables. Easy to extend for the demo.

export interface Comparable {
  title: string;
  price: number; // PEN
}

export interface DatasetItem {
  category: 'funko' | 'nendoroid' | 'manga' | 'comic' | 'tcg';
  franchise: string;
  character: string; // personaje o título
  name: string; // nombre mostrado del ítem
  priceMin: number;
  priceMax: number;
  comparables: Comparable[];
}

export const APPRAISAL_DATASET: DatasetItem[] = [
  // ---------------- TCG (cartas) ----------------
  {
    category: 'tcg', franchise: 'Pokémon', character: 'Charizard',
    name: 'Charizard Base Set Holo (Pokémon TCG)',
    priceMin: 900, priceMax: 3800,
    comparables: [
      { title: 'Charizard Base Set Holo — PSA 7', price: 2600 },
      { title: 'Charizard Base Set Unlimited — sin gradear', price: 950 },
      { title: 'Charizard 1st Edition — PSA 8', price: 3600 },
    ],
  },
  {
    category: 'tcg', franchise: 'Pokémon', character: 'Pikachu',
    name: 'Pikachu Illustrator / Promo (Pokémon TCG)',
    priceMin: 120, priceMax: 1400,
    comparables: [
      { title: 'Pikachu VMAX Rainbow — NM', price: 180 },
      { title: 'Pikachu Promo Holo — PSA 9', price: 420 },
      { title: 'Pikachu Gold Metal — coleccionista', price: 1300 },
    ],
  },
  {
    category: 'tcg', franchise: 'Yu-Gi-Oh!', character: 'Dark Magician',
    name: 'Dark Magician (Yu-Gi-Oh! TCG)',
    priceMin: 60, priceMax: 700,
    comparables: [
      { title: 'Dark Magician LOB Ultra Rare', price: 480 },
      { title: 'Dark Magician Reprint — NM', price: 65 },
    ],
  },
  {
    category: 'tcg', franchise: 'Magic', character: 'Black Lotus',
    name: 'Black Lotus (Magic: The Gathering)',
    priceMin: 8000, priceMax: 90000,
    comparables: [
      { title: 'Black Lotus Unlimited — PSA 6', price: 24000 },
      { title: 'Black Lotus Beta — jugado', price: 42000 },
    ],
  },

  // ---------------- FUNKO ----------------
  {
    category: 'funko', franchise: 'Marvel', character: 'Spider-Man',
    name: 'Funko Pop! Spider-Man',
    priceMin: 45, priceMax: 320,
    comparables: [
      { title: 'Funko Pop! Spider-Man Glow — Exclusivo', price: 160 },
      { title: 'Funko Pop! Spider-Man estándar', price: 55 },
      { title: 'Funko Pop! Spider-Man Metallic Chase', price: 300 },
    ],
  },
  {
    category: 'funko', franchise: 'DC', character: 'Batman',
    name: 'Funko Pop! Batman',
    priceMin: 40, priceMax: 280,
    comparables: [
      { title: 'Funko Pop! Batman 1989 — NYCC', price: 210 },
      { title: 'Funko Pop! Batman estándar', price: 50 },
    ],
  },
  {
    category: 'funko', franchise: 'Dragon Ball', character: 'Goku',
    name: 'Funko Pop! Goku (Dragon Ball)',
    priceMin: 55, priceMax: 350,
    comparables: [
      { title: 'Funko Pop! Goku Ultra Instinct — Chase', price: 320 },
      { title: 'Funko Pop! Goku Super Saiyan', price: 70 },
    ],
  },
  {
    category: 'funko', franchise: 'One Piece', character: 'Luffy',
    name: 'Funko Pop! Monkey D. Luffy (One Piece)',
    priceMin: 50, priceMax: 260,
    comparables: [
      { title: 'Funko Pop! Luffy Gear 5 — Exclusivo', price: 240 },
      { title: 'Funko Pop! Luffy estándar', price: 60 },
    ],
  },

  // ---------------- NENDOROID ----------------
  {
    category: 'nendoroid', franchise: 'Naruto', character: 'Naruto Uzumaki',
    name: 'Nendoroid Naruto Uzumaki',
    priceMin: 160, priceMax: 420,
    comparables: [
      { title: 'Nendoroid Naruto Sage Mode', price: 380 },
      { title: 'Nendoroid Naruto estándar — usado', price: 170 },
    ],
  },
  {
    category: 'nendoroid', franchise: 'Demon Slayer', character: 'Tanjiro Kamado',
    name: 'Nendoroid Tanjiro Kamado (Kimetsu no Yaiba)',
    priceMin: 170, priceMax: 400,
    comparables: [
      { title: 'Nendoroid Tanjiro — sellado', price: 360 },
      { title: 'Nendoroid Tanjiro — caja abierta', price: 190 },
    ],
  },
  {
    category: 'nendoroid', franchise: 'Hatsune Miku', character: 'Hatsune Miku',
    name: 'Nendoroid Hatsune Miku',
    priceMin: 150, priceMax: 500,
    comparables: [
      { title: 'Nendoroid Miku 10th Anniversary', price: 470 },
      { title: 'Nendoroid Miku estándar', price: 160 },
    ],
  },

  // ---------------- MANGA ----------------
  {
    category: 'manga', franchise: 'One Piece', character: 'One Piece',
    name: 'One Piece — Tomo (manga)',
    priceMin: 25, priceMax: 90,
    comparables: [
      { title: 'One Piece Tomo 1 — 1ª edición', price: 85 },
      { title: 'One Piece Tomo reciente — nuevo', price: 30 },
    ],
  },
  {
    category: 'manga', franchise: 'Dragon Ball', character: 'Dragon Ball',
    name: 'Dragon Ball — Tomo (manga)',
    priceMin: 30, priceMax: 140,
    comparables: [
      { title: 'Dragon Ball Ultimate Edition', price: 120 },
      { title: 'Dragon Ball Tomo suelto', price: 35 },
    ],
  },
  {
    category: 'manga', franchise: 'Naruto', character: 'Naruto',
    name: 'Naruto — Tomo (manga)',
    priceMin: 25, priceMax: 80,
    comparables: [
      { title: 'Naruto colección completa', price: 75 },
      { title: 'Naruto tomo suelto — nuevo', price: 28 },
    ],
  },

  // ---------------- CÓMIC ----------------
  {
    category: 'comic', franchise: 'Marvel', character: 'Spider-Man',
    name: 'The Amazing Spider-Man (cómic Marvel)',
    priceMin: 40, priceMax: 5000,
    comparables: [
      { title: 'Amazing Spider-Man #300 — CGC 9.0', price: 1800 },
      { title: 'Amazing Spider-Man reciente — NM', price: 45 },
    ],
  },
  {
    category: 'comic', franchise: 'DC', character: 'Batman',
    name: 'Batman (cómic DC)',
    priceMin: 45, priceMax: 4200,
    comparables: [
      { title: 'Batman: The Killing Joke — 1ª impresión', price: 260 },
      { title: 'Batman reciente — NM', price: 50 },
    ],
  },
  {
    category: 'comic', franchise: 'Marvel', character: 'X-Men',
    name: 'X-Men (cómic Marvel)',
    priceMin: 40, priceMax: 3000,
    comparables: [
      { title: 'Giant-Size X-Men #1 — reprint', price: 90 },
      { title: 'Uncanny X-Men reciente — NM', price: 45 },
    ],
  },
];
