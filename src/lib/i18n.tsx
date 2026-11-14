'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  // Website Navbar
  brand_tag: string;
  btn_dashboard: string;
  btn_sign_out: string;
  btn_login: string;
  btn_restaurant_login: string;
  btn_register: string;
  btn_register_restaurant: string;
  supabase_connected: string;
  local_sync_ready: string;

  // Website Hero & Sections
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;
  auth_manager: string;
  signed_in_as: string;
  btn_open_dashboard: string;
  kds_title: string;
  kds_desc: string;
  btn_open_kds: string;
  menu_title: string;
  menu_desc: string;
  btn_manage_dishes: string;
  tables_title: string;
  tables_desc: string;
  btn_print_qrs: string;
  preview_menu_title: string;
  preview_menu_desc: string;
  btn_view_table1: string;
  auth_enforced: string;
  portal_protected_title: string;
  portal_protected_desc: string;
  btn_sign_in_access: string;
  btn_register_new: string;
  diner_no_login_note: string;

  // Website Features
  why_choose_title: string;
  why_choose_subtitle: string;
  feat1_title: string;
  feat1_desc: string;
  feat2_title: string;
  feat2_desc: string;
  feat3_title: string;
  feat3_desc: string;
  footer_text: string;

  // Customer Menu Page
  opening_menu: string;
  restaurant_menu: string;
  scan_and_dine: string;
  select_table: string;
  table_number: string;
  active_order_banner: string;
  btn_track_order: string;
  search_placeholder: string;
  veg_label: string;
  all_items: string;
  no_items_found: string;
  no_items_desc: string;
  sold_out: string;
  btn_add: string;
  btn_view_cart: string;
  table_order: string;
  order_summary: string;
  cooking_note_placeholder: string;
  diner_details_title: string;
  name_placeholder: string;
  phone_placeholder: string;
  chef_notes_placeholder: string;
  cancel_policy_note: string;
  total_bill: string;
  btn_place_order: string;
  select_table_modal_title: string;
  select_table_modal_desc: string;
  btn_continue_table: string;
  alert_select_table: string;
  alert_order_failed: string;

  // Customer Order Tracking
  syncing_kitchen: string;
  order_not_found: string;
  order_expired_desc: string;
  btn_back_to_menu: string;
  order_hash: string;
  status_pending_badge: string;
  status_pending_title: string;
  status_pending_desc: string;
  btn_cancel_order_now: string;
  free_cancel_subtext: string;
  status_cooking_badge: string;
  status_confirmed_badge: string;
  status_cooking_title: string;
  status_cooking_desc: string;
  cancellation_locked: string;
  status_ontheway_badge: string;
  status_ontheway_title: string;
  status_ontheway_desc: string;
  status_served_badge: string;
  status_served_title: string;
  status_served_desc: string;
  status_cancelled_badge: string;
  status_cancelled_title: string;
  status_cancelled_desc: string;
  btn_place_new_order: string;
  status_declined_badge: string;
  status_declined_title: string;
  status_declined_desc: string;
  btn_choose_different: string;
  step_progress_title: string;
  step_sent: string;
  step_cooking: string;
  step_ontheway: string;
  step_served: string;
  receipt_table_items: string;
  cooked_and_ready: string;
  preparing_status: string;
  special_note_label: string;
  rate_dish_title: string;
  rate_dish_subtitle: string;
  remark_for_dish: string;
  overall_meal_rating: string;
  overall_comment_placeholder: string;
  btn_submit_reviews: string;
  btn_update_reviews: string;
  review_submitted_thanks: string;
  btn_order_more: string;
  cancel_modal_title: string;
  cancel_modal_desc: string;
  btn_keep_order: string;
  btn_yes_cancel: string;
  cancelling_text: string;
  cancel_error_default: string;

  each: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Website Navbar
    brand_tag: 'Multi-Tenant',
    btn_dashboard: 'Dashboard',
    btn_sign_out: 'Sign Out',
    btn_login: 'Login',
    btn_restaurant_login: 'Restaurant Login',
    btn_register: 'Register',
    btn_register_restaurant: 'Register Restaurant',
    supabase_connected: 'Supabase Connected',
    local_sync_ready: 'Local Sync Ready',

    // Website Hero & Sections
    hero_badge: 'Multi-Tenant QR Table Ordering & Kitchen Automation',
    hero_title_1: 'Smarter Table Ordering for',
    hero_title_2: 'Any Restaurant, Instantly.',
    hero_subtitle: 'Diners scan table QR codes to order in under 60 seconds with zero app downloads. Kitchen screens chime in real time. Full multi-tenant data isolation for every restaurant.',
    auth_manager: 'Authenticated Manager',
    signed_in_as: 'Signed in as',
    btn_open_dashboard: 'Open Restaurant Dashboard',
    kds_title: 'Kitchen Display (KDS)',
    kds_desc: 'Live orders, sound chimes, and preparation status.',
    btn_open_kds: 'Open Kitchen Screen',
    menu_title: 'Menu & AI Scanner',
    menu_desc: 'Scan menu photos & 1-click Sold Out stock switches.',
    btn_manage_dishes: 'Manage Dishes',
    tables_title: 'Print Table QRs',
    tables_desc: 'Print tabletop acrylic stand cards for Tables 1 to N.',
    btn_print_qrs: 'Print QR Codes',
    preview_menu_title: 'Preview Diner Menu',
    preview_menu_desc: 'See your digital menu as diners see it when scanning.',
    btn_view_table1: 'View Table #1',
    auth_enforced: 'Authentication Enforced',
    portal_protected_title: 'Restaurant Manager Portals are Protected',
    portal_protected_desc: 'Live kitchen screens, dish stock managers, and tabletop QR codes require verified restaurant manager credentials.',
    btn_sign_in_access: 'Sign In to Access Restaurant',
    btn_register_new: 'Register New Restaurant',
    diner_no_login_note: 'Diners ordering via table QR codes do not require login.',

    // Website Features
    why_choose_title: 'Why Restaurants Use TableBite',
    why_choose_subtitle: 'Everything is tailored for low overhead, fast kitchen turnaround, and zero diner friction.',
    feat1_title: 'Zero App Downloads for Diners',
    feat1_desc: 'Customers point their mobile camera at the table QR code. The menu opens instantly in Safari or Chrome without installing apps.',
    feat2_title: 'Strict Multi-Tenant Isolation',
    feat2_desc: 'Every restaurant has their own private database rows, custom URL, dishes, and kitchen screen. No restaurant can access another.',
    feat3_title: 'Real-Time Kitchen Audio Chimes',
    feat3_desc: 'When a diner places an order from their phone, the kitchen screen chimes instantly with live status updates and countdown timers.',
    footer_text: 'TableBite • Multi-Tenant QR Restaurant Ordering SaaS • Built with Next.js & Supabase',

    // Customer Menu Page
    opening_menu: 'Opening Menu...',
    restaurant_menu: 'Restaurant Menu',
    scan_and_dine: 'Scan & Dine Experience',
    select_table: 'Select Table',
    table_number: 'Table #',
    active_order_banner: 'You have an active order on Table #{table}!',
    btn_track_order: 'Track Order →',
    search_placeholder: 'Search food, drinks, desserts...',
    veg_label: 'VEG',
    all_items: 'All Items',
    no_items_found: 'No items match your filter',
    no_items_desc: 'Try clearing your search query or veg filter.',
    sold_out: 'Sold Out',
    btn_add: 'ADD',
    btn_view_cart: 'View Cart',
    table_order: 'Table #{table} Order',
    order_summary: 'Your Order Summary',
    cooking_note_placeholder: 'Cooking note (e.g. less spicy, no onions)...',
    diner_details_title: 'Diner Details (Optional)',
    name_placeholder: 'Your Name (e.g. Alex)',
    phone_placeholder: 'Phone (Optional)',
    chef_notes_placeholder: 'Special instructions for kitchen chef...',
    cancel_policy_note: 'You can freely cancel this order until the kitchen confirms it. Settle payment at the table or counter when finished.',
    total_bill: 'Total Bill',
    btn_place_order: 'Place Table #{table} Order',
    select_table_modal_title: 'Select Table Number',
    select_table_modal_desc: 'Choose the table number written on your table stand.',
    btn_continue_table: 'Continue at Table #{table}',
    alert_select_table: 'Please select your table number first.',
    alert_order_failed: 'Failed to place order. Please try again or alert staff.',

    // Customer Order Tracking
    syncing_kitchen: 'Syncing with Kitchen...',
    order_not_found: 'Order Not Found',
    order_expired_desc: 'This order could not be loaded or has expired.',
    btn_back_to_menu: 'Menu',
    order_hash: 'Order #',
    status_pending_badge: 'Waiting for Kitchen Confirmation',
    status_pending_title: 'Order Sent to Kitchen!',
    status_pending_desc: 'Your order has been transmitted to Table #{table}\'s kitchen terminal.',
    btn_cancel_order_now: 'Cancel Order Now',
    free_cancel_subtext: 'Free cancellation until kitchen hits "Accept".',
    status_cooking_badge: 'Cooking on the Stove',
    status_confirmed_badge: 'Order Confirmed',
    status_cooking_title: 'Chef is Cooking Your Food! 🍳',
    status_cooking_desc: 'The kitchen staff confirmed your order and dishes are cooking now. Sit back and relax!',
    cancellation_locked: 'Cooking in progress (cancellation locked)',
    status_ontheway_badge: 'Food Cooked • On the Way!',
    status_ontheway_title: 'Coming to Table #{table}! 🚀',
    status_ontheway_desc: 'Your dishes have finished cooking! Our staff is carrying them straight to your table now.',
    status_served_badge: 'Served to Table #{table}',
    status_served_title: 'Enjoy Your Meal! 🍽️',
    status_served_desc: 'Your dishes have been served. Please rate each dish below and add your remarks!',
    status_cancelled_badge: 'Cancelled',
    status_cancelled_title: 'Order was Cancelled',
    status_cancelled_desc: 'You cancelled this order before the kitchen confirmed it. No charge.',
    btn_place_new_order: 'Place New Order',
    status_declined_badge: 'Declined',
    status_declined_title: 'Kitchen Could Not Accept Order',
    status_declined_desc: 'One or more dishes are sold out. Please ask waitstaff for recommendations.',
    btn_choose_different: 'Choose Different Dishes',
    step_progress_title: 'Order Progress',
    step_sent: 'Sent',
    step_cooking: 'Cooking',
    step_ontheway: 'On the Way',
    step_served: 'Served',
    receipt_table_items: 'Table #{table} Items',
    cooked_and_ready: 'Cooked & Ready',
    preparing_status: 'Preparing',
    special_note_label: 'Special Note: ',
    rate_dish_title: 'Rate Each Dish & Add Remarks',
    rate_dish_subtitle: 'How did you enjoy each food item? Share your remarks!',
    remark_for_dish: 'Remark for {dish} (e.g. Delicious, crisp, flavorful)...',
    overall_meal_rating: 'Overall Meal Rating:',
    overall_comment_placeholder: 'Overall comment or note for the kitchen team...',
    btn_submit_reviews: 'Submit Dish Ratings & Remarks',
    btn_update_reviews: 'Update Dish Reviews',
    review_submitted_thanks: '✓ Thank you! Your ratings & remarks were saved and shared with the kitchen.',
    btn_order_more: 'Order More Drinks or Dishes (Table #{table})',
    cancel_modal_title: 'Cancel Your Order?',
    cancel_modal_desc: 'Are you sure you want to cancel Table #{table}\'s order? Once cancelled, you will need to place a new order.',
    btn_keep_order: 'No, Keep',
    btn_yes_cancel: 'Yes, Cancel',
    cancelling_text: 'Cancelling...',
    cancel_error_default: 'Failed to cancel order. Please notify waitstaff.',

    each: 'each'
  },
  hi: {
    // Website Navbar
    brand_tag: 'मल्टी-टेनेंट',
    btn_dashboard: 'डैशबोर्ड',
    btn_sign_out: 'लॉग आउट',
    btn_login: 'लॉगिन',
    btn_restaurant_login: 'रेस्टोरेंट लॉगिन',
    btn_register: 'रजिस्टर करें',
    btn_register_restaurant: 'रेस्टोरेंट रजिस्टर करें',
    supabase_connected: 'सुपाबेस कनेक्टेड',
    local_sync_ready: 'लोकल सिंक तैयार',

    // Website Hero & Sections
    hero_badge: 'मल्टी-टेनेंट क्यूआर टेबल ऑर्डरिंग और किचन ऑटोमेशन',
    hero_title_1: 'हर रेस्टोरेंट के लिए',
    hero_title_2: 'स्मार्ट टेबल ऑर्डरिंग, तुरंत शुरू करें।',
    hero_subtitle: 'ग्राहक बिना कोई ऐप डाउनलोड किए टेबल का क्यूआर कोड स्कैन करके 60 सेकंड में ऑर्डर करते हैं। किचन स्क्रीन पर तुरंत रिंग बजती है। प्रत्येक रेस्टोरेंट के लिए सुरक्षित डेटा अलगाव।',
    auth_manager: 'प्रमाणित प्रबंधक',
    signed_in_as: 'लॉग इन हैं:',
    btn_open_dashboard: 'रेस्टोरेंट डैशबोर्ड खोलें',
    kds_title: 'किचन डिस्प्ले स्क्रीन (KDS)',
    kds_desc: 'लाइव ऑर्डर, साउंड चाइम और भोजन तैयारी की स्थिति।',
    btn_open_kds: 'किचन स्क्रीन खोलें',
    menu_title: 'मेनू और एआई स्कैनर',
    menu_desc: 'मेनू फोटो स्कैन करें और 1-क्लिक में सोल्ड आउट स्टॉक स्विच करें।',
    btn_manage_dishes: 'व्यंजन प्रबंधित करें',
    tables_title: 'टेबल क्यूआर कोड प्रिंट करें',
    tables_desc: 'टेबल 1 से N तक के लिए स्टैंड कार्ड प्रिंट करें।',
    btn_print_qrs: 'क्यूआर कोड प्रिंट करें',
    preview_menu_title: 'ग्राहक मेनू का पूर्वावलोकन',
    preview_menu_desc: 'देखें कि स्कैन करने पर ग्राहकों को आपका मेनू कैसा दिखता है।',
    btn_view_table1: 'टेबल #1 मेनू देखें',
    auth_enforced: 'सुरक्षा सत्यापन आवश्यक',
    portal_protected_title: 'रेस्टोरेंट मैनेजर पोर्टल सुरक्षित है',
    portal_protected_desc: 'लाइव किचन स्क्रीन, स्टॉक मैनेजर और क्यूआर कार्ड एक्सेस करने के लिए मैनेजर लॉगिन जरूरी है।',
    btn_sign_in_access: 'साइन इन करें',
    btn_register_new: 'नया रेस्टोरेंट रजिस्टर करें',
    diner_no_login_note: 'टेबल क्यूआर कोड से ऑर्डर करने वाले ग्राहकों को लॉगिन की आवश्यकता नहीं है।',

    // Website Features
    why_choose_title: 'रेस्टोरेंट TableBite क्यों चुनते हैं?',
    why_choose_subtitle: 'कम लागत, तेज़ किचन सर्विस और ग्राहकों के लिए बिना किसी रुकावट के बनाया गया।',
    feat1_title: 'ग्राहकों के लिए शून्य ऐप डाउनलोड',
    feat1_desc: 'ग्राहक सीधे मोबाइल कैमरे से टेबल का क्यूआर स्कैन करते हैं। बिना ऐप इंस्टॉल किए सफारी या क्रोम में तुरंत मेनू खुल जाता है।',
    feat2_title: 'सख्त मल्टी-टेनेंट सुरक्षा',
    feat2_desc: 'हर रेस्टोरेंट का अपना अलग डेटा, कस्टम यूआरएल, व्यंजन और किचन स्क्रीन है। कोई अन्य रेस्टोरेंट इसे नहीं देख सकता।',
    feat3_title: 'रियल-टाइम किचन ऑडियो चाइम',
    feat3_desc: 'ग्राहक के मोबाइल से ऑर्डर होते ही किचन में तुरंत अलर्ट घंटी बजती है और टाइमर शुरू होता है।',
    footer_text: 'TableBite • मल्टी-टेनेंट क्यूआर रेस्टोरेंट ऑर्डरिंग SaaS • Next.js एवं Supabase द्वारा संचालित',

    // Customer Menu Page
    opening_menu: 'मेनू खोला जा रहा है...',
    restaurant_menu: 'रेस्टोरेंट मेनू',
    scan_and_dine: 'स्कैन और डाइन अनुभव',
    select_table: 'टेबल चुनें',
    table_number: 'टेबल #',
    active_order_banner: 'टेबल #{table} पर आपका ऑर्डर सक्रिय है!',
    btn_track_order: 'ऑर्डर ट्रैक करें →',
    search_placeholder: 'खाना, ड्रिंक्स, मीठा खोजें...',
    veg_label: 'शाकाहारी',
    all_items: 'सभी व्यंजन',
    no_items_found: 'आपकी खोज के अनुसार कोई व्यंजन नहीं मिला',
    no_items_desc: 'सर्च या वेज फ़िल्टर हटाकर दोबारा प्रयास करें।',
    sold_out: 'समाप्त (Sold Out)',
    btn_add: 'जोड़ें',
    btn_view_cart: 'कार्ट देखें',
    table_order: 'टेबल #{table} का ऑर्डर',
    order_summary: 'आपका ऑर्डर सारांश',
    cooking_note_placeholder: 'रसोई के लिए निर्देश (उदा. कम तीखा, बिना प्याज)...',
    diner_details_title: 'ग्राहक विवरण (वैकल्पिक)',
    name_placeholder: 'आपका नाम (उदा. राहुल)',
    phone_placeholder: 'फ़ोन नंबर (वैकल्पिक)',
    chef_notes_placeholder: 'शेफ के लिए विशेष निर्देश...',
    cancel_policy_note: 'किचन द्वारा स्वीकार किए जाने तक आप इसे कभी भी रद्द कर सकते हैं। भोजन के बाद टेबल या काउंटर पर भुगतान करें।',
    total_bill: 'कुल बिल',
    btn_place_order: 'ऑर्डर किचन को भेजें (टेबल #{table})',
    select_table_modal_title: 'टेबल नंबर चुनें',
    select_table_modal_desc: 'अपनी टेबल पर लिखे स्टैंड नंबर का चयन करें।',
    btn_continue_table: 'टेबल #{table} पर जारी रखें',
    alert_select_table: 'कृपया पहले अपनी टेबल चुनें।',
    alert_order_failed: 'ऑर्डर भेजने में विफल। कृपया पुनः प्रयास करें या स्टाफ को सूचित करें।',

    // Customer Order Tracking
    syncing_kitchen: 'किचन से सिंक हो रहा है...',
    order_not_found: 'ऑर्डर नहीं मिला',
    order_expired_desc: 'यह ऑर्डर लोड नहीं हो सका या समाप्त हो गया है।',
    btn_back_to_menu: 'मेनू',
    order_hash: 'ऑर्डर #',
    status_pending_badge: 'किचन की पुष्टि की प्रतीक्षा में',
    status_pending_title: 'ऑर्डर किचन को भेज दिया गया!',
    status_pending_desc: 'आपका ऑर्डर टेबल #{table} के किचन टर्मिनल पर पहुंच गया है।',
    btn_cancel_order_now: 'ऑर्डर रद्द करें',
    free_cancel_subtext: 'किचन द्वारा "स्वीकार" करने तक निःशुल्क रद्दीकरण।',
    status_cooking_badge: 'चूल्हे पर पक रहा है',
    status_confirmed_badge: 'ऑर्डर कन्फर्म हो गया',
    status_cooking_title: 'शेफ आपका खाना बना रहे हैं! 🍳',
    status_cooking_desc: 'किचन कर्मचारियों ने आपका ऑर्डर स्वीकार कर लिया है और खाना बन रहा है। कृपया आराम से बैठें!',
    cancellation_locked: 'खाना पक रहा है (रद्दीकरण बंद)',
    status_ontheway_badge: 'खाना तैयार • रास्ते में है!',
    status_ontheway_title: 'टेबल #{table} पर आ रहा है! 🚀',
    status_ontheway_desc: 'आपके व्यंजन पक कर तैयार हैं! स्टाफ इसे आपकी टेबल पर ला रहा है।',
    status_served_badge: 'टेबल #{table} पर परोसा गया',
    status_served_title: 'स्वादिष्ट भोजन का आनंद लें! 🍽️',
    status_served_desc: 'आपके व्यंजन टेबल पर परोस दिए गए हैं। कृपया व्यंजनों को रेटिंग दें और अपनी टिप्पणी जोड़ें!',
    status_cancelled_badge: 'रद्द किया गया',
    status_cancelled_title: 'ऑर्डर रद्द कर दिया गया',
    status_cancelled_desc: 'आपने किचन कन्फर्म करने से पहले ऑर्डर रद्द कर दिया। कोई शुल्क नहीं।',
    btn_place_new_order: 'नया ऑर्डर दें',
    status_declined_badge: 'अस्वीकृत',
    status_declined_title: 'किचन ऑर्डर स्वीकार नहीं कर सका',
    status_declined_desc: 'एक या अधिक व्यंजन समाप्त हो चुके हैं। कृपया वेटर से सलाह लें।',
    btn_choose_different: 'अन्य व्यंजन चुनें',
    step_progress_title: 'ऑर्डर की प्रगति',
    step_sent: 'भेजा गया',
    step_cooking: 'पक रहा है',
    step_ontheway: 'रास्ते में',
    step_served: 'परोसा गया',
    receipt_table_items: 'टेबल #{table} के व्यंजन',
    cooked_and_ready: 'तैयार',
    preparing_status: 'तैयारी में',
    special_note_label: 'विशेष निर्देश: ',
    rate_dish_title: 'प्रत्येक व्यंजन को रेटिंग और टिप्पणी दें',
    rate_dish_subtitle: 'आपको खाना कैसा लगा? अपने विचार साझा करें!',
    remark_for_dish: '{dish} के लिए टिप्पणी (उदा. स्वादिष्ट, कुरकुरा, लाजवाब)...',
    overall_meal_rating: 'समग्र भोजन रेटिंग:',
    overall_comment_placeholder: 'रसोई टीम के लिए सुझाव या टिप्पणी...',
    btn_submit_reviews: 'रेटिंग और टिप्पणी सबमिट करें',
    btn_update_reviews: 'रेटिंग अपडेट करें',
    review_submitted_thanks: '✓ धन्यवाद! आपकी रेटिंग और टिप्पणी किचन टीम को भेज दी गई है।',
    btn_order_more: 'और व्यंजन या ड्रिंक्स मंगाएं (टेबल #{table})',
    cancel_modal_title: 'क्या आप ऑर्डर रद्द करना चाहते हैं?',
    cancel_modal_desc: 'क्या आप वाकई टेबल #{table} का ऑर्डर रद्द करना चाहते हैं? रद्द करने के बाद आपको नया ऑर्डर देना होगा।',
    btn_keep_order: 'नहीं, रहने दें',
    btn_yes_cancel: 'हाँ, रद्द करें',
    cancelling_text: 'रद्द किया जा रहा है...',
    cancel_error_default: 'ऑर्डर रद्द करने में विफल। कृपया स्टाफ को बताएं।',

    each: 'प्रत्येक'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: translations.en,
  isHindi: false,
});

const STORAGE_KEY = 'tablebite_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === 'hi' || saved === 'en') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // ignore
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'hi' || e.newValue === 'en')) {
        setLanguageState(e.newValue);
        document.documentElement.lang = e.newValue;
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new Event('languagechange'));
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    const handleCustomEvent = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved === 'hi' || saved === 'en') {
          setLanguageState(saved);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('languagechange', handleCustomEvent);
    return () => window.removeEventListener('languagechange', handleCustomEvent);
  }, []);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    isHindi: language === 'hi',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Universal interactive Language Switcher Component
 * Supports both dark theme (website) and light theme (customer pages)
 */
export function LanguageSwitcher({ 
  theme = 'dark',
  size = 'md'
}: { 
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md';
}) {
  const { language, setLanguage } = useLanguage();

  const isDark = theme === 'dark';
  const isSm = size === 'sm';

  return (
    <div 
      className={`inline-flex items-center p-0.5 rounded-xl border transition-all ${
        isDark 
          ? 'bg-stone-900 border-stone-800 text-stone-300' 
          : 'bg-stone-100 border-stone-200 text-stone-700'
      }`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 rounded-lg font-black transition-all active:scale-95 ${
          isSm ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${
          language === 'en'
            ? isDark
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-white text-stone-950 shadow-xs border border-stone-200'
            : isDark
              ? 'text-stone-400 hover:text-stone-200'
              : 'text-stone-500 hover:text-stone-800'
        }`}
        title="Switch to English"
      >
        <span>English</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`flex items-center gap-1 rounded-lg font-black transition-all active:scale-95 ${
          isSm ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${
          language === 'hi'
            ? isDark
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-white text-stone-950 shadow-xs border border-stone-200'
            : isDark
              ? 'text-stone-400 hover:text-stone-200'
              : 'text-stone-500 hover:text-stone-800'
        }`}
        title="हिन्दी में बदलें (Switch to Hindi)"
      >
        <span>हिन्दी</span>
      </button>
    </div>
  );
}
