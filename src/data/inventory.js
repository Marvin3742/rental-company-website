// Individual rental items. Bundles are the headline offer — these are
// for customers who only need a few pieces.
//   unit: "each" → price per piece
//   unit: "event" → flat price for the day
export const inventory = [
  {
    id: "chair",
    name: "Plastic Folding Chair",
    price: 3,
    unit: "each",
    image: "/images/inventory/chair.jpg",
  },
  {
    id: "table",
    name: "6ft Table",
    price: 10,
    unit: "each",
    image: "/images/inventory/table.jpg",
  },
  {
    id: "tent",
    name: "20×30 Tent",
    price: 300,
    unit: "day",
    image: "/images/inventory/tent.jpg",
  },
  {
    id: "bounce",
    name: "Bounce House",
    price: 175,
    unit: "day",
    image: "/images/inventory/bounce.jpg",
  },
];
