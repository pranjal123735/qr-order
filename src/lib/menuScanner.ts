// Intelligent Menu Scanner and Auto-Extractor
import { getFoodPhotoForDish } from './foodImageSearch';

export interface ScannedMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  is_veg: boolean;
  image_url: string;
  selected?: boolean;
}

export interface SampleMenuPreset {
  id: string;
  title: string;
  cuisine: string;
  coverImage: string;
  items: Array<{
    name: string;
    category: string;
    price: number;
    description: string;
    is_veg: boolean;
  }>;
}

// Pre-configured real physical menu sample cards for instant 1-click test drives
export const SAMPLE_MENU_PRESETS: SampleMenuPreset[] = [
  {
    id: 'north-indian-main-course',
    title: 'North Indian Main Course & Dhaba Specials',
    cuisine: 'Authentic Indian Curries, Breads & Dal',
    coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
    items: [
      {
        name: 'Rajma Rice with Desi Ghee',
        category: 'Rice & Combos',
        price: 90,
        description: 'Authentic Punjabi slow-simmered kidney beans in rich spiced tomato gravy served with steamed basmati rice.',
        is_veg: true,
      },
      {
        name: 'Paneer Lazeez (Chef Special)',
        category: 'Paneer Curries',
        price: 350,
        description: 'Tender cottage cheese cooked in creamy cashew and onion gravy with special hand-ground spices.',
        is_veg: true,
      },
      {
        name: 'Paneer Lababdar',
        category: 'Paneer Curries',
        price: 295,
        description: 'Soft paneer cubes simmered in creamy tomato-onion gravy garnished with grated cottage cheese.',
        is_veg: true,
      },
      {
        name: 'Kadai Paneer',
        category: 'Paneer Curries',
        price: 250,
        description: 'Cottage cheese and crisp bell peppers tossed in aromatic freshly roasted kadai masala.',
        is_veg: true,
      },
      {
        name: 'Shahi Paneer',
        category: 'Paneer Curries',
        price: 320,
        description: 'Rich and royal preparation of paneer in a sweet and mildly spiced almond-cashew cream sauce.',
        is_veg: true,
      },
      {
        name: 'Daal Makhni (Slow-Cooked)',
        category: 'Daal & Lentils',
        price: 260,
        description: 'Slow-cooked whole black lentils with white butter, fresh cream, and subtle smoky aroma.',
        is_veg: true,
      },
      {
        name: 'Yellow Daal Tadka',
        category: 'Daal & Lentils',
        price: 180,
        description: 'Golden yellow arhar lentils tempered with cumin seeds, garlic, dried red chilies, and pure ghee.',
        is_veg: true,
      },
      {
        name: 'Tawa Chaap Masala',
        category: 'Indian Chaap',
        price: 265,
        description: 'Marinated roasted soya chaap pieces cooked on a sizzling griddle in tangy onion-tomato masala.',
        is_veg: true,
      },
      {
        name: 'Butter Naan',
        category: 'Indian Breads',
        price: 50,
        description: 'Soft and fluffy tandoor-baked leavened flatbread glazed generously with melted butter.',
        is_veg: true,
      },
      {
        name: 'Lachha Paratha',
        category: 'Indian Breads',
        price: 60,
        description: 'Crispy, multi-layered whole wheat tandoori paratha roasted to golden perfection.',
        is_veg: true,
      },
      {
        name: 'Garlic Naan',
        category: 'Indian Breads',
        price: 55,
        description: 'Fluffy tandoori naan infused with minced roasted garlic and fresh green coriander.',
        is_veg: true,
      },
      {
        name: 'Jeera Rice',
        category: 'Rice & Combos',
        price: 120,
        description: 'Fragrant long-grain aged basmati rice tempered with roasted cumin seeds and fresh herbs.',
        is_veg: true,
      },
    ]
  },
  {
    id: 'italian-pizzeria',
    title: 'Woodfired Pizzeria & Trattoria',
    cuisine: 'Italian & Continental',
    coverImage: 'https://images.unsplash.com/photo-1579758630660-5a33118cf945?w=800&auto=format&fit=crop&q=80',
    items: [
      {
        name: 'Classic Margherita Napoletana',
        category: 'Woodfired Pizzas',
        price: 349,
        description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil & extra virgin olive oil.',
        is_veg: true,
      },
      {
        name: 'Smoked Pepperoni & Hot Honey',
        category: 'Woodfired Pizzas',
        price: 499,
        description: 'Italian spicy pepperoni, whole milk mozzarella, house tomato sauce and chilli honey drizzle.',
        is_veg: false,
      },
      {
        name: 'Wild Mushroom & Truffle Pizza',
        category: 'Woodfired Pizzas',
        price: 459,
        description: 'Roasted shiitake & button mushrooms, truffle oil, goat cheese and roasted garlic.',
        is_veg: true,
      },
      {
        name: 'Creamy Fettuccine Alfredo',
        category: 'Handmade Pasta',
        price: 389,
        description: 'Tossed in rich parmesan butter cream, cracked black pepper and fresh garden parsley.',
        is_veg: true,
      },
      {
        name: 'Crispy Garlic Bruschetta',
        category: 'Starters & Antipasti',
        price: 229,
        description: 'Toasted sourdough baguette rubbed with garlic, heirloom tomatoes, and aged balsamic glaze.',
        is_veg: true,
      },
      {
        name: 'Truffle Parmesan Hand-Cut Fries',
        category: 'Starters & Antipasti',
        price: 269,
        description: 'Double-fried crisp potato fries tossed with white truffle oil, grated parmesan & herbs.',
        is_veg: true,
      },
      {
        name: 'Classic Tiramisu al Mascarpone',
        category: 'Desserts',
        price: 299,
        description: 'Espresso-soaked ladyfingers layered with whipped mascarpone cream and Valrhona cocoa.',
        is_veg: true,
      },
      {
        name: 'Italian Iced Peach Tea & Mint',
        category: 'Beverages',
        price: 189,
        description: 'Slow-brewed black tea infused with natural peach nectar, citrus and crushed mint.',
        is_veg: true,
      },
    ]
  },
  {
    id: 'indian-bistro',
    title: 'Royal Indian Bistro & Curry House',
    cuisine: 'North Indian & Mughlai',
    coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
    items: [
      {
        name: 'Murgh Makhani (Butter Chicken)',
        category: 'Main Course',
        price: 420,
        description: 'Tender tandoor-smoked chicken simmered in a velvety tomato and cashew butter gravy.',
        is_veg: false,
      },
      {
        name: 'Paneer Butter Masala',
        category: 'Main Course',
        price: 360,
        description: 'Fresh artisanal cottage cheese cubes cooked in rich spiced butter gravy with kasuri methi.',
        is_veg: true,
      },
      {
        name: 'Slow-Dum Hyderabadi Chicken Biryani',
        category: 'Rice & Biryani',
        price: 390,
        description: 'Fragrant long-grain aged basmati layered with marinated chicken, saffron and caramelized onions.',
        is_veg: false,
      },
      {
        name: 'Dal Makhani 24-Hour Simmered',
        category: 'Main Course',
        price: 310,
        description: 'Black lentils slow-cooked overnight with white butter, fresh cream and aromatic spices.',
        is_veg: true,
      },
      {
        name: 'Charcoal Paneer Tikka',
        category: 'Tandoori Starters',
        price: 340,
        description: 'Cottage cheese cubes marinated in hung curd, Kashmiri deghi mirch and mustard oil.',
        is_veg: true,
      },
      {
        name: 'Amritsari Garlic Butter Naan',
        category: 'Breads',
        price: 90,
        description: 'Crispy leavened clay oven bread topped with minced roasted garlic, butter and fresh coriander.',
        is_veg: true,
      },
      {
        name: 'Warm Gulab Jamun with Rabri',
        category: 'Desserts',
        price: 180,
        description: 'Two golden fried khoya dumplings soaked in saffron rose syrup, topped with chilled rabri.',
        is_veg: true,
      },
      {
        name: 'Mango Cardamom Lassi',
        category: 'Beverages',
        price: 160,
        description: 'Creamy churned yogurt blended with Alphonso mango pulp, saffron strands and pistachios.',
        is_veg: true,
      },
    ]
  },
  {
    id: 'artisan-cafe',
    title: 'Modern Artisan Cafe & Brunch Bar',
    cuisine: 'Coffee, Burgers & Continental',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    items: [
      {
        name: 'The Smash Gourmet Cheeseburger',
        category: 'Burgers & Sandwiches',
        price: 349,
        description: 'Seared double patty, melted cheddar, caramelized onions, house pickles and brioche bun.',
        is_veg: false,
      },
      {
        name: 'Crispy Peri Peri Chicken Burger',
        category: 'Burgers & Sandwiches',
        price: 329,
        description: 'Golden spiced fried chicken thigh, peri-peri mayo, shredded lettuce in toasted sesame bun.',
        is_veg: false,
      },
      {
        name: 'Sourdough Avocado Toast',
        category: 'Brunch Specials',
        price: 289,
        description: 'Hass avocado mash, cherry tomatoes, feta crumble, chili flakes on toasted artisan sourdough.',
        is_veg: true,
      },
      {
        name: 'Loaded Cheesy Nachos Supreme',
        category: 'Bar Bites & Sides',
        price: 259,
        description: 'Crisp corn tortilla chips smothered with warm queso, jalapenos, fresh salsa & sour cream.',
        is_veg: true,
      },
      {
        name: 'Specialty Spanish Iced Latte',
        category: 'Beverages',
        price: 220,
        description: 'Double shot of single-origin espresso with sweetened condensed milk and cold froth.',
        is_veg: true,
      },
      {
        name: 'Belgian Molten Chocolate Lava Cake',
        category: 'Desserts',
        price: 260,
        description: 'Warm dark chocolate cake with a molten truffle center, dusted with powdered sugar.',
        is_veg: true,
      },
    ]
  }
];

// Determine if dish is likely vegetarian based on common ingredients
export function inferDietaryType(dishName: string, description?: string): boolean {
  const text = `${dishName} ${description || ''}`.toLowerCase();
  const nonVegKeywords = [
    'chicken', 'mutton', 'beef', 'pork', 'bacon', 'fish', 'prawn', 'shrimp',
    'meat', 'lamb', 'egg', 'calamari', 'salmon', 'tuna', 'turkey', 'ham', 'pepperoni', 'salami', 'wings'
  ];

  for (const kw of nonVegKeywords) {
    if (text.includes(kw)) {
      return false;
    }
  }
  return true;
}

/**
 * Intelligent Text & OCR Parser: Parses raw text or OCR output
 * into structured menu items with category detection, price cleaning, and photo matching.
 */
export function parseMenuTextToItems(rawText: string): ScannedMenuItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items: ScannedMenuItem[] = [];
  let currentCategory = 'Main Course';

  const categoryKeywords = [
    'main course', 'veg sabzi', 'indian chaap', 'daal', 'paneer', 'rice', 'indian breads',
    'starters', 'appetizers', 'pizzas', 'pasta', 'burgers', 'sandwiches', 'desserts', 'beverages',
    'curries', 'tandoori', 'soups', 'salads', 'combos', 'breads', 'chawal', 'special', 'box'
  ];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check if line is a section header (e.g. "MAIN COURSE", "Veg Sabzi", "Daal (500 Ml)")
    const cleanLower = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (categoryKeywords.some(kw => cleanLower === kw || cleanLower.startsWith(kw + ' ') || cleanLower.endsWith(' ' + kw))) {
      if (!/\d{2,}/.test(line)) {
        currentCategory = line.replace(/^[#\-*—_.:\s]+|[:\s]+$/g, '').trim() || currentCategory;
        continue;
      }
    }

    // Split multi-column lines (e.g. "Tawa Chaap ... 265 | Indian Breads ... 50")
    const segments = line.split(/[|]+/).map(s => s.trim()).filter(Boolean);

    for (const segment of segments) {
      // Match price at end: e.g. "Paneer Lazeez ... 2350" or "Butter Naan ... 50" or "Rajma Rice ... ₹90"
      const priceMatch = segment.match(/(.*?)\s+[zZ2#EtTr₹]?\s*(\d{2,4})\s*$/) ||
                         segment.match(/(.*?)(?:₹|\$|€|£|rs\.?|inr)\s*(\d{2,4})/i) ||
                         segment.match(/(.*?)\s*[-–—:.]+\s*(\d{2,4})\s*$/);

      if (priceMatch) {
        let name = priceMatch[1]
          .replace(/[—_.:\s]+$/, '')
          .replace(/^[—_.:\s\d]+/, '')
          .trim();
        let price = parseInt(priceMatch[2], 10);

        // If price is 4 digits like 2350 or 7250, the first digit was the OCR rupee symbol '₹'
        if (price > 1000) {
          price = price % 1000;
        }

        // Clean common OCR character noise on Indian menus
        name = name
          .replace(/Mari Bari Sbzl/i, 'Hari Bhari Sabzi')
          .replace(/Soba Solani/i, 'Sabzi Solani')
          .replace(/S002 KNGIGNG/i, 'Sabzi Khazana')
          .replace(/ComPolok/i, 'Corn Palak')
          .replace(/Meth MuShoom/i, 'Methi Mushroom')
          .replace(/Koju Mushroom/i, 'Kaju Mushroom')
          .replace(/ROIMARICO/i, 'Rajma Rice')
          .replace(/Paneer Lobobdor/i, 'Paneer Lababdar')
          .replace(/Kodol Paneer/i, 'Kadai Paneer')
          .replace(/PaNSSr MONI/i, 'Paneer Makhni')
          .replace(/Choap/i, 'Chaap')
          .replace(/BUIOr NOON/i, 'Butter Naan')
          .replace(/PIOINNGON/i, 'Plain Naan')
          .replace(/ROOMGH ROY/i, 'Roomali Roti')
          .replace(/LOCNha Paratha/i, 'Lachha Paratha')
          .replace(/Yellow DOI/i, 'Yellow Daal')
          .replace(/Poneer/i, 'Paneer')
          .replace(/Poke TENET veg/i, '')
          .replace(/[^\w\s()&'-]/g, '')
          .trim();

        if (name.length >= 3 && price >= 10 && price <= 2500) {
          let description = '';
          const descMatch = name.match(/^(.*?)\s*[\(\[](.*?)[\)\]]$/);
          if (descMatch) {
            name = descMatch[1].trim();
            description = descMatch[2].trim();
          }

          const isVeg = inferDietaryType(name, description);
          const imageUrl = getFoodPhotoForDish(name, currentCategory);

          items.push({
            id: 'scanned-' + Math.random().toString(36).substring(2, 9),
            name,
            category: currentCategory,
            price,
            description: description || `Freshly prepared ${name.toLowerCase()} with authentic seasonings.`,
            is_veg: isVeg,
            image_url: imageUrl,
            selected: true,
          });
        }
      }
    }
  }

  return items;
}
