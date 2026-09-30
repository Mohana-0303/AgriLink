// Run with: npm run seed   (WARNING: clears users, products and orders)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { COMMISSION_RATE, calcDeliveryCharge } = require('./utils/constants');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const demoImagePath = (name) => `/demo-products/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.svg`;

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);

  // Users (passwords are hashed by the model)
  await User.create({ name: 'AgriLink Admin', email: 'admin@agrilink.com', password: 'Admin@123', phone: '9000000000', role: 'admin', address: 'Chennai', verified: true });

  const farmers = await User.create([
    { name: 'Ravi Kumar', email: 'ravi@agrilink.com', password: 'Farmer@123', phone: '9876500001', role: 'farmer', address: 'Attur, Salem', verified: true },
    { name: 'Lakshmi Devi', email: 'lakshmi@agrilink.com', password: 'Farmer@123', phone: '9876500002', role: 'farmer', address: 'Perundurai, Erode', verified: true },
    { name: 'Murugan S', email: 'murugan@agrilink.com', password: 'Farmer@123', phone: '9876500003', role: 'farmer', address: 'Namakkal', verified: false },
    { name: 'Selvam P', email: 'selvam@agrilink.com', password: 'Farmer@123', phone: '9876500004', role: 'farmer', address: 'Pollachi, Coimbatore', verified: true },
    { name: 'Kavitha R', email: 'kavitha@agrilink.com', password: 'Farmer@123', phone: '9876500005', role: 'farmer', address: 'Thanjavur', verified: true },
    { name: 'Arun M', email: 'arun@agrilink.com', password: 'Farmer@123', phone: '9876500006', role: 'farmer', address: 'Ooty, Nilgiris', verified: true },
  ]);
  const buyers = await User.create([
    { name: 'Anitha Retail Store', email: 'anitha@agrilink.com', password: 'Buyer@123', phone: '9123400001', role: 'buyer', address: '12 Market Road, Chennai' },
    { name: 'Karthik Wholesale', email: 'karthik@agrilink.com', password: 'Buyer@123', phone: '9123400002', role: 'buyer', address: '45 APMC Yard, Salem' },
    { name: 'Priya S', email: 'priya@agrilink.com', password: 'Buyer@123', phone: '9123400003', role: 'buyer', address: '7 Gandhi Nagar, Coimbatore' },
  ]);
  const [ravi, lakshmi, murugan, selvam, kavitha, arun] = farmers;

  // Catalog: [farmer, name, category, price, mandiPrice|null, quantity, unit, location, description, verified]
  // Demo catalog uses deterministic local product illustrations so every seeded product has a matching image.
  // Farmer-uploaded images replace these demo images with their Cloudinary URL.
  const catalog = [
    // Vegetables
    [ravi, 'Tomato', 'Vegetables', 18, 26, 300, 'kg', 'Salem', 'Farm-fresh country tomatoes, picked this morning.', true],
    [ravi, 'Onion (Big)', 'Vegetables', 28, 35, 500, 'kg', 'Salem', 'Red onions, good shelf life.', true],
    [murugan, 'Small Onion (Sambar)', 'Vegetables', 65, 78, 200, 'kg', 'Namakkal', 'Aromatic sambar onions, ideal for South Indian cooking.', false],
    [lakshmi, 'Potato', 'Vegetables', 32, 38, 400, 'kg', 'Erode', 'Clean washed potatoes.', false],
    [arun, 'Carrot', 'Vegetables', 45, 55, 250, 'kg', 'Ooty', 'Crunchy hill-grown Ooty carrots.', true],
    [arun, 'Cabbage', 'Vegetables', 22, 28, 300, 'kg', 'Ooty', 'Tight green cabbage heads from the Nilgiris.', true],
    [arun, 'Beetroot', 'Vegetables', 38, 46, 180, 'kg', 'Ooty', 'Sweet deep-red beetroot.', true],
    [ravi, 'Brinjal', 'Vegetables', 30, 40, 150, 'kg', 'Salem', 'Fresh purple brinjal.', false],
    [ravi, 'Ladies Finger (Okra)', 'Vegetables', 42, 52, 120, 'kg', 'Salem', 'Tender green okra, harvested daily.', true],
    [selvam, 'Drumstick', 'Vegetables', 80, 100, 90, 'kg', 'Pollachi', 'Long, tender drumsticks.', true],
    [selvam, 'Bottle Gourd', 'Vegetables', 20, 26, 140, 'piece', 'Pollachi', 'Fresh bottle gourd (sorakkai).', false],
    [ravi, 'Cauliflower', 'Vegetables', 35, 45, 100, 'piece', 'Salem', 'White compact cauliflower.', false],
    [selvam, 'Cucumber', 'Vegetables', 25, 32, 160, 'kg', 'Pollachi', 'Cool, crisp cucumbers.', false],
    [kavitha, 'Green Chilli', 'Vegetables', 48, 60, 90, 'kg', 'Thanjavur', 'Spicy fresh green chillies.', true],
    [kavitha, 'Coriander Leaves', 'Vegetables', 15, 20, 80, 'bunch', 'Thanjavur', 'Fresh coriander bunches.', false],
    [kavitha, 'Spinach (Keerai)', 'Vegetables', 12, 15, 100, 'bunch', 'Thanjavur', 'Tender keerai, freshly cut.', false],
    // Fruits
    [selvam, 'Banana (Robusta)', 'Fruits', 40, 48, 250, 'dozen', 'Pollachi', 'Ripe and sweet bananas.', true],
    [selvam, 'Mango (Banganapalli)', 'Fruits', 85, 105, 180, 'kg', 'Pollachi', 'Naturally ripened Banganapalli mangoes.', true],
    [arun, 'Apple', 'Fruits', 140, 165, 120, 'kg', 'Ooty', 'Crisp hill-station apples.', true],
    [murugan, 'Papaya', 'Fruits', 30, 38, 100, 'kg', 'Namakkal', 'Sweet ripe papaya.', false],
    [selvam, 'Guava', 'Fruits', 50, 62, 110, 'kg', 'Pollachi', 'Juicy pink guavas.', false],
    [lakshmi, 'Pomegranate', 'Fruits', 130, 155, 80, 'kg', 'Erode', 'Ruby-red pomegranates.', true],
    [selvam, 'Watermelon', 'Fruits', 18, 24, 400, 'kg', 'Pollachi', 'Sweet red watermelon.', false],
    [lakshmi, 'Sweet Lime (Mosambi)', 'Fruits', 60, 72, 140, 'kg', 'Erode', 'Juicy mosambi, great for fresh juice.', false],
    [selvam, 'Coconut', 'Fruits', 24, 30, 600, 'piece', 'Pollachi', 'Big mature coconuts.', false],
    // Grains
    [kavitha, 'Rice (Ponni)', 'Grains', 46, 54, 1000, 'kg', 'Thanjavur', 'Unpolished Ponni rice straight from the mill.', true],
    [kavitha, 'Rice (Seeraga Samba)', 'Grains', 95, 110, 400, 'kg', 'Thanjavur', 'Aromatic Seeraga Samba, perfect for biryani.', true],
    [murugan, 'Wheat', 'Grains', 30, 34, 700, 'kg', 'Namakkal', 'Whole wheat, stone cleaned.', false],
    [murugan, 'Ragi (Finger Millet)', 'Grains', 55, 64, 300, 'kg', 'Namakkal', 'Nutritious whole ragi.', true],
    [murugan, 'Pearl Millet (Kambu)', 'Grains', 42, 50, 250, 'kg', 'Namakkal', 'Cleaned bajra / kambu.', false],
    [lakshmi, 'Maize (Corn)', 'Grains', 24, 28, 600, 'kg', 'Erode', 'Dry yellow maize kernels.', false],
    [murugan, 'Sorghum (Cholam)', 'Grains', 38, 45, 300, 'kg', 'Namakkal', 'Whole jowar / cholam.', false],
    // Pulses
    [murugan, 'Toor Dal', 'Pulses', 110, 128, 200, 'kg', 'Namakkal', 'Fresh toor dal.', false],
    [murugan, 'Urad Dal', 'Pulses', 105, 122, 180, 'kg', 'Namakkal', 'Whole white urad dal for idli and dosa.', true],
    [lakshmi, 'Moong Dal (Green Gram)', 'Pulses', 98, 115, 150, 'kg', 'Erode', 'Split green gram, quick cooking.', false],
    [lakshmi, 'Chickpeas (Kabuli Channa)', 'Pulses', 88, 102, 200, 'kg', 'Erode', 'Large cream chickpeas.', false],
    [kavitha, 'Groundnut (Peanut)', 'Pulses', 85, 98, 250, 'kg', 'Thanjavur', 'Shelled groundnuts, fresh harvest.', true],
    // Spices
    [ravi, 'Red Chilli (Dry)', 'Spices', 90, 110, 80, 'kg', 'Salem', 'Sun-dried red chilli.', false],
    [lakshmi, 'Turmeric', 'Spices', 120, 145, 150, 'kg', 'Erode', 'Erode turmeric, high curcumin.', true],
    [arun, 'Black Pepper', 'Spices', 620, 700, 40, 'kg', 'Ooty', 'Bold black pepper from the hills.', true],
    [arun, 'Cardamom', 'Spices', 1800, 2050, 15, 'kg', 'Ooty', 'Green cardamom, strong aroma.', true],
    [kavitha, 'Coriander Seeds', 'Spices', 110, 128, 70, 'kg', 'Thanjavur', 'Clean dry coriander seeds.', false],
    [kavitha, 'Tamarind', 'Spices', 95, 112, 90, 'kg', 'Thanjavur', 'Seedless cleaned tamarind.', false],
    [lakshmi, 'Cumin Seeds', 'Spices', 340, 390, 30, 'kg', 'Erode', 'Aromatic jeera.', false],
    // Dairy
    [murugan, 'Farm Eggs', 'Dairy', 72, 84, 100, 'dozen', 'Namakkal', 'Country eggs from free-range hens.', true],
    [selvam, 'Fresh Milk', 'Dairy', 55, 62, 120, 'litre', 'Pollachi', 'Raw cow milk, delivered same day.', true],
    [selvam, 'Ghee (Cow)', 'Dairy', 620, 700, 40, 'litre', 'Pollachi', 'Traditional bilona cow ghee.', true],
    [murugan, 'Curd (Thayir)', 'Dairy', 60, 68, 60, 'litre', 'Namakkal', 'Thick set curd made from fresh milk.', false],
    [selvam, 'Paneer', 'Dairy', 320, 360, 25, 'kg', 'Pollachi', 'Soft fresh paneer made daily.', false],
    // Oilseeds & Oils
    [kavitha, 'Groundnut Oil (Cold Pressed)', 'Oilseeds & Oils', 210, 240, 80, 'litre', 'Thanjavur', 'Wood-pressed groundnut oil.', true],
    [selvam, 'Coconut Oil (Cold Pressed)', 'Oilseeds & Oils', 260, 295, 70, 'litre', 'Pollachi', 'Pure virgin coconut oil.', true],
    [kavitha, 'Gingelly (Sesame) Oil', 'Oilseeds & Oils', 380, 430, 50, 'litre', 'Thanjavur', 'Chekku gingelly oil.', true],
    [kavitha, 'Sesame Seeds', 'Oilseeds & Oils', 140, 160, 100, 'kg', 'Thanjavur', 'Cleaned white sesame seeds.', false],
    [lakshmi, 'Sunflower Seeds', 'Oilseeds & Oils', 95, 110, 90, 'kg', 'Erode', 'Raw sunflower seeds.', false],
    [selvam, 'Copra (Dry Coconut)', 'Oilseeds & Oils', 135, 150, 120, 'kg', 'Pollachi', 'Sun-dried copra.', false],
    // Flowers
    [kavitha, 'Jasmine (Malli)', 'Flowers', 90, 120, 40, 'kg', 'Thanjavur', 'Fragrant fresh jasmine buds.', true],
    [murugan, 'Marigold', 'Flowers', 55, 70, 100, 'kg', 'Namakkal', 'Bright orange marigold for pooja and decoration.', false],
    [arun, 'Rose (Fresh Cut)', 'Flowers', 8, 12, 500, 'piece', 'Ooty', 'Long-stem fresh cut roses.', true],
    // Farm Inputs
    [ravi, 'Vermicompost', 'Farm Inputs', 12, 16, 800, 'kg', 'Salem', 'Organic vermicompost for healthy soil.', true],
    [lakshmi, 'Cow Dung Manure', 'Farm Inputs', 5, 7, 1500, 'kg', 'Erode', 'Well-decomposed farmyard manure.', false],
    [selvam, 'Neem Cake Fertilizer', 'Farm Inputs', 38, 46, 400, 'kg', 'Pollachi', 'Organic neem cake, natural pest repellent.', true],
    [murugan, 'Tomato Seeds (Hybrid)', 'Farm Inputs', 180, 210, 200, 'packet', 'Namakkal', 'High-yield hybrid tomato seed packet.', false],
    [kavitha, 'Paddy Seeds (Certified)', 'Farm Inputs', 1450, 1600, 60, 'bag', 'Thanjavur', '25 kg certified paddy seed bag.', true],
    [selvam, 'Coconut Sapling', 'Farm Inputs', 120, 150, 150, 'piece', 'Pollachi', 'Healthy tall-variety coconut saplings.', true],
    [arun, 'Organic Pesticide (Neem Oil)', 'Farm Inputs', 340, 390, 60, 'litre', 'Ooty', 'Neem oil bio-pesticide for vegetable crops.', false],
    [ravi, 'Drip Irrigation Kit', 'Farm Inputs', 2200, 2600, 30, 'piece', 'Salem', 'Drip kit for up to 1/4 acre.', false],
    // Other
    [selvam, 'Jaggery (Vellam)', 'Other', 75, 88, 200, 'kg', 'Pollachi', 'Chemical-free country jaggery.', true],
    [murugan, 'Honey (Forest)', 'Other', 450, 520, 50, 'litre', 'Namakkal', 'Raw forest honey.', true],
    [arun, 'Tea Leaves (Nilgiri)', 'Other', 260, 300, 90, 'kg', 'Ooty', 'Fresh Nilgiri orthodox tea.', true],
    [arun, 'Coffee Beans (Arabica)', 'Other', 520, 590, 40, 'kg', 'Ooty', 'Shade-grown arabica beans.', true],
    [lakshmi, 'Sugarcane', 'Other', 4, 5, 2000, 'kg', 'Erode', 'Fresh sugarcane stalks for juice.', false],
  ];

  const products = await Product.create(
    catalog.map(([farmer, name, category, price, mandiPrice, quantity, unit, location, description, verified]) => ({
      farmer: farmer._id, name, category, price, mandiPrice, quantity, unit, location, description, verified,
      image: demoImagePath(name),
    }))
  );
  const p = Object.fromEntries(products.map((x) => [x.name, x]));

  // Sample orders spread over the last months
  const make = (buyer, farmer, list, status, ago, pm = 'COD') => {
    const items = list.map(([prod, quantity]) => ({ product: prod._id, name: prod.name, price: prod.price, quantity, unit: prod.unit, image: prod.image }));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryCharge = calcDeliveryCharge(subtotal);
    return {
      buyer: buyer._id, farmer: farmer._id, items, subtotal, deliveryCharge,
      commission: Math.round(subtotal * COMMISSION_RATE * 100) / 100,
      totalAmount: subtotal + deliveryCharge, deliveryAddress: buyer.address, status, createdAt: daysAgo(ago),
      paymentMethod: pm, paymentStatus: pm === 'COD' ? (status === 'pending' || status === 'confirmed' ? 'pending' : 'paid') : 'paid',
    };
  };
  await Order.create([
    make(buyers[0], ravi, [[p['Tomato'], 40], [p['Onion (Big)'], 30]], 'delivered', 120, 'UPI'),
    make(buyers[1], kavitha, [[p['Rice (Ponni)'], 200]], 'delivered', 95, 'Card'),
    make(buyers[2], selvam, [[p['Banana (Robusta)'], 6]], 'delivered', 70, 'COD'),
    make(buyers[0], selvam, [[p['Mango (Banganapalli)'], 25]], 'delivered', 55, 'GPay'),
    make(buyers[1], ravi, [[p['Onion (Big)'], 100], [p['Tomato'], 60]], 'delivered', 40, 'COD'),
    make(buyers[1], lakshmi, [[p['Turmeric'], 20]], 'delivered', 32, 'UPI'),
    make(buyers[2], murugan, [[p['Farm Eggs'], 5]], 'cancelled', 25, 'COD'),
    make(buyers[0], ravi, [[p['Tomato'], 50]], 'shipped', 6, 'Card'),
    make(buyers[2], selvam, [[p['Fresh Milk'], 10]], 'confirmed', 4, 'Paytm'),
    make(buyers[1], murugan, [[p['Wheat'], 150]], 'pending', 2, 'COD'),
    make(buyers[0], lakshmi, [[p['Potato'], 60]], 'pending', 1, 'COD'),
    make(buyers[2], arun, [[p['Carrot'], 3], [p['Tea Leaves (Nilgiri)'], 1]], 'delivered', 15, 'GPay'),
  ]);

  console.log('Seed complete!\n  Admin : admin@agrilink.com / Admin@123\n  Farmer: ravi@agrilink.com / Farmer@123\n  Buyer : anitha@agrilink.com / Buyer@123');
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
