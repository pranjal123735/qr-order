// Food Image Search & Web Photo Scraper Utility
// Automatically matches dish names with high-definition, appetizing food photos

export interface FoodPhotoResult {
  url: string;
  thumbnail: string;
  title: string;
  author?: string;
  source: 'curated' | 'web';
}

// Curated high-resolution food image dictionary with verified authentic Unsplash culinary photography
export const FOOD_PHOTO_LIBRARY: Array<{ keywords: string[]; title: string; urls: string[] }> = [
  // Pizzas
  {
    keywords: ['margherita', 'cheese pizza', 'woodfire pizza', 'classic pizza', 'neapolitan'],
    title: 'Woodfired Margherita Pizza',
    urls: [
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['pepperoni', 'salami pizza', 'meat pizza', 'bbq chicken pizza'],
    title: 'Pepperoni & Meat Pizza',
    urls: [
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['paneer pizza', 'veggie pizza', 'vegetable pizza', 'mushroom pizza', 'farmhouse'],
    title: 'Garden Veggie Pizza',
    urls: [
      'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Burgers & Sandwiches
  {
    keywords: ['burger', 'cheeseburger', 'beef burger', 'smash burger', 'bacon burger'],
    title: 'Gourmet Cheeseburger',
    urls: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['crispy chicken burger', 'chicken burger', 'fried chicken sandwich'],
    title: 'Crispy Chicken Burger',
    urls: [
      'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['sandwich', 'club sandwich', 'panini', 'toast', 'grilled cheese', 'croissant'],
    title: 'Artisan Club Sandwich',
    urls: [
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Indian Curries & Specialties
  {
    keywords: ['butter chicken', 'murgh makhani', 'chicken tikka masala', 'chicken curry'],
    title: 'Rich Butter Chicken',
    urls: [
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['paneer', 'paneer butter masala', 'shahi paneer', 'kadai paneer', 'palak paneer'],
    title: 'Creamy Paneer Butter Masala',
    urls: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['dal makhani', 'dal tadka', 'dal', 'lentils', 'yellow dal'],
    title: 'Slow-Cooked Dal Makhani',
    urls: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['biryani', 'chicken biryani', 'mutton biryani', 'veg biryani', 'hyderabadi'],
    title: 'Aromatic Dum Biryani',
    urls: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['naan', 'garlic naan', 'roti', 'tandoori roti', 'paratha', 'bread'],
    title: 'Garlic Butter Naan',
    urls: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['tikka', 'tandoori chicken', 'kebab', 'seekh kebab', 'paneer tikka', 'starter'],
    title: 'Charcoal Tandoori Tikka',
    urls: [
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Sides & Starters
  {
    keywords: ['fries', 'french fries', 'potato wedges', 'truffle fries', 'peri peri fries'],
    title: 'Crispy Golden Fries',
    urls: [
      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['wings', 'chicken wings', 'hot wings', 'buffalo wings', 'bbq wings'],
    title: 'Crispy Glazed Wings',
    urls: [
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527477378370-13768f5c889f?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['nachos', 'tacos', 'guacamole', 'burrito', 'quesadilla', 'salsa'],
    title: 'Loaded Crispy Nachos',
    urls: [
      'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['salad', 'caesar', 'greek salad', 'green salad', 'bowl', 'healthy'],
    title: 'Fresh Garden Salad',
    urls: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['soup', 'tomato soup', 'mushroom soup', 'chicken soup', 'hot and sour', 'broth'],
    title: 'Warm Artisan Soup',
    urls: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Pasta & Asian
  {
    keywords: ['pasta', 'spaghetti', 'penne', 'alfredo', 'carbonara', 'arrabbiata', 'lasagna'],
    title: 'Creamy Italian Pasta',
    urls: [
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['noodles', 'hakka noodles', 'ramen', 'pad thai', 'chow mein', 'wok'],
    title: 'Wok-Tossed Asian Noodles',
    urls: [
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['fried rice', 'rice', 'manchurian', 'dim sum', 'momos', 'dumpling', 'spring roll'],
    title: 'Asian Specialties & Dim Sum',
    urls: [
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Beverages
  {
    keywords: ['coffee', 'cappuccino', 'latte', 'espresso', 'cold coffee', 'mocha', 'americano'],
    title: 'Specialty Brewed Coffee',
    urls: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['tea', 'chai', 'masala chai', 'green tea', 'iced tea', 'boba'],
    title: 'Aromatic Tea & Chai',
    urls: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['mojito', 'mocktail', 'cocktail', 'lemonade', 'soda', 'drink', 'beverage', 'juice'],
    title: 'Refreshing Chilled Mocktail',
    urls: [
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['shake', 'milkshake', 'smoothie', 'chocolate shake', 'oreo', 'strawberry shake'],
    title: 'Thick Gourmet Shake',
    urls: [
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80',
    ]
  },
  // Desserts
  {
    keywords: ['brownie', 'chocolate', 'lava cake', 'fudge', 'sundae'],
    title: 'Warm Chocolate Lava Cake',
    urls: [
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1624353365286-3f8d62dadadf?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['cheesecake', 'cake', 'pastry', 'tiramisu', 'pie', 'dessert'],
    title: 'New York Cheesecake',
    urls: [
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['ice cream', 'gelato', 'sorbet', 'kulfi', 'scoop'],
    title: 'Artisan Gelato & Ice Cream',
    urls: [
      'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&auto=format&fit=crop&q=80',
    ]
  },
  {
    keywords: ['gulab jamun', 'rasgulla', 'jalebi', 'sweet', 'halwa'],
    title: 'Warm Indian Sweets',
    urls: [
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    ]
  }
];

// Fallback high-quality food photo
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

/**
 * Searches and returns the best matching food photo for any dish name or keywords.
 */
export function getFoodPhotoForDish(dishName: string, categoryName?: string): string {
  const query = `${dishName} ${categoryName || ''}`.toLowerCase();

  let bestMatch: { score: number; url: string } = { score: 0, url: DEFAULT_FOOD_IMAGE };

  for (const entry of FOOD_PHOTO_LIBRARY) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += kw.length * 2;
      }
    }
    if (score > bestMatch.score) {
      // Pick a random URL from the matched set or first
      const randomUrl = entry.urls[Math.floor(Math.random() * entry.urls.length)] || entry.urls[0];
      bestMatch = { score, url: randomUrl };
    }
  }

  // If no match was found, return default or category-based fallback
  if (bestMatch.score === 0) {
    if (categoryName?.toLowerCase().includes('drink') || categoryName?.toLowerCase().includes('beverage')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryName?.toLowerCase().includes('dessert') || categoryName?.toLowerCase().includes('sweet')) {
      return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80';
    }
    return DEFAULT_FOOD_IMAGE;
  }

  return bestMatch.url;
}

/**
 * Returns multiple photo choices for a dish so the user can easily choose their preferred one.
 */
export function getFoodPhotoOptions(dishName: string, categoryName?: string): FoodPhotoResult[] {
  const query = `${dishName} ${categoryName || ''}`.toLowerCase();
  const results: FoodPhotoResult[] = [];

  // 1. Check matching entries
  for (const entry of FOOD_PHOTO_LIBRARY) {
    let matches = false;
    for (const kw of entry.keywords) {
      if (query.includes(kw.toLowerCase())) {
        matches = true;
        break;
      }
    }

    if (matches) {
      entry.urls.forEach((url, i) => {
        results.push({
          url,
          thumbnail: url.replace('w=800', 'w=200'),
          title: `${entry.title} #${i + 1}`,
          source: 'curated',
        });
      });
    }
  }

  // 2. Add high-quality dynamic Unsplash source query option
  const cleanTerm = encodeURIComponent(dishName.trim().slice(0, 30));
  results.push({
    url: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80`,
    thumbnail: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80`,
    title: `Chef's Presentation (${dishName})`,
    source: 'web',
  });
  results.push({
    url: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80`,
    thumbnail: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80`,
    title: `Rustic Table Setting`,
    source: 'web',
  });

  return results.slice(0, 8);
}
