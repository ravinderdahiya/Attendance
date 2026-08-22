export const SLIDES = [
  { src: '/brand/storefront.jpg', caption: 'The wooden arch. The same steps.' },
  { src: '/brand/entrance.png', caption: 'म्हारी ढाणी' },
  { src: '/brand/facade.png', caption: 'Tea, coffee, shakes — and a full kitchen.' },
  { src: '/brand/interior.jpg', caption: 'Warm lights. Long conversations.' },
  { src: '/brand/food.png', caption: 'Cheesy penne, made to share.' },
];

export const GALLERY = [
  '/brand/entrance.png',
  '/brand/facade.png',
  '/brand/storefront.jpg',
  '/brand/interior.jpg',
  '/brand/food.png',
];

export const OUTLETS = [
  {
    id: 'red-square',
    name: 'MHARI DHANI',
    hindi: 'म्हारी ढाणी',
    type: 'Cafe',
    rating: '4.8',
    reviews: 128,
    price: '₹1–200',
    address: 'SCO 22, Red Square Market, Mehta Nagar, Hisar',
    hours: 'Open daily · closes 8:00 pm',
    services: ['Dine-in', 'Takeaway', 'Delivery'],
    map: 'https://www.google.com/maps/search/?api=1&query=MHARI+DHANI+SCO+22+Red+square+Mehta+Nagar+Hisar',
    image: '/brand/facade.png',
  },
  {
    id: 'hau',
    name: 'Mhari Dhani HAU',
    hindi: 'म्हारी ढाणी HAU',
    type: 'Restaurant',
    rating: '4.6',
    reviews: 17,
    price: '₹1–200',
    address: 'HARSAC Parking, near Gangotri Girls Hostel, HAU, Hisar',
    hours: 'Opens 9:00 am · Mon–Sat',
    services: ['Dine-in', 'Takeaway'],
    map: 'https://www.google.com/maps/search/?api=1&query=Mhari+Dhani+HAU+HARSAC+PARKING+Gangotri+Girls+Hostel+Hisar',
    image: '/brand/entrance.png',
  },
] as const;

export const MENU = {
  chai: [
    { name: 'Masala Chai', hi: 'मसाला चाय', desc: 'Slow-brewed, ginger-cardamom, served in a kulhad.', price: 60 },
    { name: 'Adrak Elaichi', hi: 'अदरक इलायची', desc: 'Stronger, spicier, the house pour.', price: 70 },
    { name: 'Filter Coffee', hi: 'फ़िल्टर कॉफ़ी', desc: 'South Indian decoction, hot milk, brass davara.', price: 90 },
    { name: 'Cold Coffee', hi: 'कोल्ड कॉफ़ी', desc: 'Blended, ice-cold, a little too generous with cream.', price: 140 },
  ],
  shakes: [
    { name: 'Oreo Shake', hi: 'ओरियो शेक', desc: 'Crushed biscuit, vanilla, thick enough for a spoon.', price: 160 },
    { name: 'Mango Lassi', hi: 'आम लस्सी', desc: 'Seasonal Alphonso when we have it. Always cold.', price: 150 },
    { name: 'KitKat Shake', hi: 'किटकैट शेक', desc: 'Chocolate, wafer, a second straw on the house.', price: 170 },
    { name: 'Rose Milk', hi: 'गुलाब दूध', desc: 'Rooh afza, chilled milk, a dhani classic.', price: 90 },
  ],
  burgers: [
    { name: 'Dhani Veg Burger', hi: 'ढाणी वेज बर्गर', desc: 'Crisp patty, house sauce, toasted sesame bun.', price: 180 },
    { name: 'Paneer Tikka Burger', hi: 'पनीर टिक्का बर्गर', desc: 'Charred paneer, mint chutney, pickled onion.', price: 220 },
    { name: 'Chicken Burger', hi: 'चिकन बर्गर', desc: 'Juicy fillet, slaw, smoked mayo.', price: 240 },
  ],
  pizza: [
    { name: 'Margherita', hi: 'मार्गेरिटा', desc: 'San Marzano, fior di latte, basil. Simple, right.', price: 280 },
    { name: 'Farmhouse', hi: 'फ़ार्महाउस', desc: 'Capsicum, onion, mushroom, corn, extra cheese.', price: 340 },
    { name: 'Tandoori Paneer', hi: 'तंदूरी पनीर', desc: 'Our pizza. Their tandoor. A good argument.', price: 360 },
    { name: 'BBQ Chicken', hi: 'बीबीक्यू चिकन', desc: 'Smoky chicken, red onion, mozzarella.', price: 390 },
  ],
  pasta: [
    { name: 'White Sauce Penne', hi: 'व्हाइट सॉस पेने', desc: 'Cream, garlic, parmesan. The one from the photos.', price: 260 },
    { name: 'Arrabbiata', hi: 'अरेबियाटा', desc: 'Tomato, chilli flake, olive oil, basil.', price: 240 },
    { name: 'Pink Sauce', hi: 'पिंक सॉस', desc: 'Half cream, half tomato, all comfort.', price: 270 },
  ],
  kitchen: [
    { name: 'Dal Tadka Thali', hi: 'दाल तड़का थाली', desc: 'Dal, jeera rice, two sabzi, roti, pickle, salad.', price: 220 },
    { name: 'Kadhi Pakora', hi: 'कढ़ी पकोड़ा', desc: 'Haryanvi-style kadhi, ghee tadka, steamed rice.', price: 190 },
    { name: 'Tandoori Platter', hi: 'तंदूरी प्लैटर', desc: 'Paneer, mushroom, malai chaap. For the table.', price: 420 },
    { name: 'Chole Bhature', hi: 'छोले भटूरे', desc: 'Overnight chole, puffed bhatura, onion, pickle.', price: 180 },
  ],
} as const;

export const MENU_TABS = [
  { id: 'chai', label: 'Chai & Coffee' },
  { id: 'shakes', label: 'Shakes' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'pasta', label: 'Pasta' },
  { id: 'kitchen', label: 'Kitchen' },
] as const;

export type MenuTab = (typeof MENU_TABS)[number]['id'];
