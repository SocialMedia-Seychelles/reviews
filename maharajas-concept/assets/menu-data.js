/* The Maharajas menu, typed up from the 14 menu pictures on themaharajasseychelles.com/menu.html (copies in _src/their-menu).
   Prices in SR, inclusive of taxes, as printed. v = vegetarian. Lamb curries page was not on their site. */
export const PHONE = "+2484346869", PHONE_TXT = "4 346 869";
export const MOBILE = "2482811461", MOBILE_TXT = "2 811 461"; // to confirm: WhatsApp on this number
export const MAIL = "b.vijay@themaharajasseychelles.com";

export const COURSES = [
  { slug: "soups", name: "Soups", stage: 2, groups: [{ items: [
    ["Tamatar Dhaniya ka Shorba", 100, 1, "Fresh tomato and coriander, with a delicate touch of spice."],
    ["Dal ka Shorba", 100, 1, "Gently spiced lentil soup with fresh coriander."],
    ["Potato Soup", 100, 1, "Potato, a little spice and cream."],
  ] }] },
  { slug: "street-food", name: "Street food", stage: 2, groups: [{ items: [
    ["Punjabi Chole Bhature (2 pcs)", 260, 1, "Chickpea curry with puffed, fried flatbreads."],
    ["Pani Puri", 115, 1, "Crisp hollow puris filled with potato and chickpeas, with tamarind and mint water."],
    ["Vodka Pani Puri", 233, 1, "The same, with a spicy vodka and mint water."],
    ["Samosa Chaat", 146, 1, "Crunchy samosa with spicy chickpeas, yoghurt and chutneys."],
    ["Vegetable Samosa (4 pcs)", 145, 1, "Pastry filled with potato, peas, chilli and ginger."],
    ["Papdi Chaat", 144, 1, "Crisp puris with sweet and sour chutneys and yoghurt."],
  ] }] },
  { slug: "salads", name: "Salads & sides", stage: 2, groups: [{ items: [
    ["Chicken Tikka Salad", 200, 0, "Chicken tikka, lettuce, tomato, cucumber and onion with a lemon mayonnaise dressing."],
    ["Kuchumber Salad", 100, 1, "Cucumber, tomato, onion and carrot with lemon and rock salt."],
    ["Masala Papad", 155, 1, "Roasted papadum topped with a tangy onion, tomato and cucumber mix."],
    ["Kuchumber or Boondi Raita", 75, 1, "Whipped yoghurt with chopped salad, or with gram flour pearls."],
    ["Papad (2 pcs)", 45, 1, "Crisp lentil wafers with mild spices."],
  ] }] },
  { slug: "tandoor", name: "Starters from the tandoor", stage: 3, groups: [
    { name: "Meat & seafood", items: [
      ["Maharaja Non-Veg Kebab Platter", 468, 0, "Sizzling tandoori chicken, lamb, prawn and fish with salad and lemon."],
      ["Tandoori Prawn", 410, 0, "Prawns in hung yoghurt and Indian spices, cooked in the clay oven."],
      ["Chingri Chaap", 374, 0, "Breadcrumbed prawns in ginger, garlic and spices, fried golden."],
      ["Fish Malai Tikka", 340, 0, "Fish in cream, cheese and cashew paste, from the clay oven."],
      ["Lemon Fish Tikka", 344, 0, "Fish with lemon zest, hung curd and mustard oil."],
      ["Barra Kebab", 524, 0, "Lamb chops marinated in hung curd and fine spices."],
      ["Gilafi Seekh Kebab", 515, 0, "Rolls of spiced lamb mince with peppers, on the skewer."],
      ["Peshawari Seekh Kebab", 414, 0, "Lamb mince with garlic and nuts, rolled on the skewer."],
      ["Dawat-e-Raan", 3000, 0, "The house leg of lamb in yoghurt and the chef's spices. Order 24 hours ahead."],
    ] },
    { name: "Vegetarian", items: [
      ["Maharaja Veg Kebab Platter", 410, 1, "Paneer tikka, aloo nazakat, banjara seekh and broccoli from the tandoor."],
      ["Paneer Peshawari Tikka", 414, 1, "Saffron paneer in cashew and hung curd spices."],
      ["Aloo ki Nazakat", 329, 1, "Crisp potato shells stuffed with paneer, nuts and herbs."],
      ["Mushroom Tikka", 280, 1, "Mushrooms in the chef's secret marinade."],
      ["Malai Broccoli", 284, 1, "Broccoli in cream and cheese, from the clay oven."],
      ["Banjara Seekh Kebab", 282, 1, "Spiced vegetable mince with peppers and nuts on the skewer."],
      ["Makhmali Subz Kebab", 215, 1, "Paneer and vegetable patties cooked on a hot plate."],
      ["Dahi ke Kebab", 200, 1, "Golden patties of spiced hung yoghurt and paneer."],
      ["Mix Veg or Onion Bhajia", 179, 1, "Fritters in gram flour batter."],
    ] }] },
  { slug: "curries", name: "Curries", stage: 4, groups: [
    { name: "Chicken", items: [
      ["Butter Chicken", 320, 0, "The Delhi classic: chicken tikka in a creamy tomato and cashew gravy with butter."],
      ["Chicken Tikka Masala", 330, 0, "Chicken tikka in a spiced onion and tomato gravy."],
      ["Chicken Methi Malai", 340, 0, "Chicken in yoghurt and cream with fenugreek leaves."],
      ["Chicken Shahi Korma", 330, 0, "Chicken in yoghurt and cream with kewra water."],
      ["Chicken Changezi", 330, 0, "Rich and mild, with milk, cashews, cream and garam masala."],
      ["Chicken do Pyaaz", 320, 0, "Chicken and onion, with deep flavour."],
      ["Kadhai Chicken", 320, 0, "Chicken in onion and tomato with kadhai masala."],
      ["Kashmiri Chicken Masala", 320, 0, "Chicken with cream, yoghurt and dried fruit."],
    ] },
    { name: "Seafood", items: [
      ["Tandoori Lobster Masala", 1609, 0, "Lobster in tandoori spices from the clay oven, with masala gravy."],
      ["Prawn Masaledar", 409, 0, "Prawns in a thick tomato, onion and garlic masala."],
      ["Prawn Curry", 409, 0, "Mustard seed, curry leaves, tomato and coconut cream."],
      ["Crab Curry", 350, 0, "Crab with mustard seed, curry leaves and coconut cream."],
      ["Fish Tikka Masala", 340, 0, "Fish tikka in a spiced onion and tomato gravy."],
      ["Meen Moilee", 305, 0, "Fish simmered in coconut milk with mustard seeds and curry leaves."],
    ] },
    { name: "Vegetarian", items: [
      ["Dal Makhani", 214, 1, "Black lentils with butter and cream. The chef's own recipe."],
      ["Palak Paneer", 284, 1, "Paneer in a bright green spinach and onion gravy."],
      ["Paneer Makhani", 305, 1, "Paneer in a smooth tomato and cashew gravy with butter."],
      ["Paneer Tikka Lababdar", 343, 1, "Chargrilled paneer in a rich tomato and onion gravy."],
      ["Shahi Paneer", 318, 1, "Paneer in a thick gravy of cream and tomato."],
      ["Nawabi Paneer Handi", 316, 1, "Mughlai-style paneer in a creamy white curry."],
      ["Nawabi Handi", 318, 1, "Paneer and vegetables in a creamy white curry."],
      ["Kadhai Paneer", 260, 1, "Paneer in onion and tomato with kadhai masala."],
      ["Kadhai Veg", 258, 1, "Mixed vegetables with kadhai masala."],
      ["Dum Aloo Banarasi", 260, 1, "Stuffed potatoes in a creamy tomato gravy with fennel."],
      ["Mushroom Mutter", 258, 1, "Mushroom and green peas with onion and tomato."],
      ["Mushroom do Pyaza", 258, 1, "Mushrooms with lightly caramelised onions."],
      ["Gobhi Mutter", 215, 1, "Cauliflower and peas tempered with cumin."],
      ["Zeera Aloo", 178, 1, "Potatoes with cumin."],
      ["Dal Tadka", 178, 1, "Yellow lentils tempered with cumin, garlic and ghee."],
    ] }] },
  { slug: "rice", name: "Rice & biryani", stage: 5, groups: [{ items: [
    ["Jhinga Biryani", 414, 0, "Prawns and basmati with herbs, finished with saffron and rose water."],
    ["Lamb Biryani", 414, 0, "Basmati layered with boneless lamb and whole spices."],
    ["Chicken Biryani", 330, 0, "Basmati layered with boneless chicken and whole spices."],
    ["Vegetable Biryani", 258, 1, "Basmati and vegetables cooked slowly with spices."],
    ["Biryani Rice", 200, 1, "Basmati with spices, herbs and saffron."],
    ["Saffron Rice", 179, 1, "Basmati with cardamom and saffron."],
    ["Peas Pulao", 147, 1, "Basmati and green peas with cumin and coriander."],
    ["Steamed Rice", 86, 1, "Plain long-grain basmati."],
  ] }] },
  { slug: "breads", name: "Breads", stage: 6, groups: [{ items: [
    ["Naan", 75, 1, "From the clay oven: plain, butter or garlic."],
    ["Cheese Naan", 144, 1, "Naan stuffed with cheddar."],
    ["Amritsari Kulcha", 144, 1, "Soft bread stuffed with spiced potato."],
    ["Stuffed Paratha", 144, 1, "Whole wheat bread stuffed with spiced potato."],
    ["Paratha", 75, 1, "Flaky layered whole wheat bread, butter or mint."],
    ["Tandoori Roti", 65, 1, "Whole wheat bread, plain or with butter."],
  ] }] },
  { slug: "desserts", name: "Desserts", stage: 7, groups: [{ items: [
    ["Gulab Jamun", 98, 1, "Warm milk dumplings in rose and cardamom syrup."],
    ["Rasmalai", 132, 1, "Soft paneer dumplings in sweet, thickened milk with cardamom."],
    ["Malai Pista Kulfi", 180, 1, "Indian ice cream of reduced milk and pistachio, with falooda."],
    ["Mango Kulfi", 180, 1, "Reduced milk and mango, with falooda."],
    ["Walnut Brownie with Ice Cream", 190, 1, "Warm walnut brownie with vanilla ice cream."],
    ["Passion Fruit Sorbet", 88, 1, "Dairy free."],
    ["Ice Cream", 88, 1, "Vanilla, strawberry or chocolate."],
    ["Sundae", 200, 1, "Three scoops with syrup, cream and nuts."],
  ] }] },
  { slug: "kids", name: "For kids", stage: 7, groups: [{ items: [
    ["Butter Chicken with Steamed Rice", 260, 0, "The grown-up favourite, kid-sized."],
    ["Crumbed Chicken with Fries or Rice", 230, 0, "Breadcrumbed boneless chicken."],
    ["Murgh Malai Tikka with Fries or Rice", 230, 0, "Creamy, mild chicken tikka."],
    ["Crumbed Fish with Fries", 230, 0, "Breadcrumbed boneless fish."],
    ["Paneer Makhani with Steamed Rice", 230, 1, "Paneer in a mild tomato and cashew gravy."],
    ["Vegetable Patties with Fries", 230, 1, "Crisp mixed vegetable patties."],
  ] }] },
];

/* Opening hours as printed on their booking page. Confirm: other pages and listings disagree. */
export const HOURS = { open: 12 * 60, close: 22 * 60 + 45, text: "Every day, 12 noon to 10.45 pm" };
