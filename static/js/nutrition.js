/**
 * FitAI Pulse - AI Nutrition & Multi-Plan Macro Engine
 * Generates Multiple Diet Blueprints across 6 Styles & 7-Day Rotations
 */

(function () {
    'use strict';

    let macroChart = null;
    let loggedWaterMl = 1500;
    const DAILY_WATER_GOAL_ML = 2800;

    let activeDietStyle = 'high-protein';
    let activeVariationIndex = 0; // 0 = Plan A, 1 = Plan B, 2 = Plan C
    let activeDay = 1; // 1 to 7
    let isSideBySideActive = false;

    // Audio chime for completion
    function playSuccessChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.setValueAtTime(587.33, now); // D5
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.2);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
            gain2.gain.setValueAtTime(0.18, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.45);
        } catch (e) {
            console.warn('Audio note:', e);
        }
    }

    // Comprehensive Database of Multi-Plan Diet Blueprints
    // 6 Styles x 3 Plan Variations x 7 Daily Meal Sets
    const DIET_BLUEPRINTS = {
        'high-protein': {
            name: "High-Protein Hypertrophy",
            variations: [
                {
                    label: "Plan A: Hypertrophy & Recomp",
                    badge: "STRENGTH BUILD",
                    calories: 2150,
                    proteinPct: 35,
                    carbsPct: 40,
                    fatsPct: 25,
                    proteinGrams: 188,
                    carbsGrams: 215,
                    fatsGrams: 60,
                    days: {
                        1: {
                            breakfast: { name: "Egg White Veggie Scramble & Rolled Oats", cal: 480, pro: "38g", desc: "4 egg whites + 1 whole egg with spinach, mushrooms, 1 slice sourdough, and 60g oats with fresh berries." },
                            lunch: { name: "Grilled Herb Chicken Breast & Quinoa Bowl", cal: 620, pro: "52g", desc: "200g lean chicken breast, 1 cup cooked tri-color quinoa, roasted zucchini, and 1 tbsp extra virgin olive oil." },
                            snack: { name: "Whey Isolate Shake & Raw Almonds", cal: 310, pro: "32g", desc: "1 scoop pure whey isolate with almond milk, 20g raw almonds, and 1 green apple." },
                            dinner: { name: "Pan-Seared Atlantic Salmon & Sweet Potato", cal: 580, pro: "46g", desc: "180g Atlantic salmon fillet, 180g roasted sweet potato cubes, and steamed asparagus spears with lemon." }
                        },
                        2: {
                            breakfast: { name: "Greek Yogurt Power Bowl & Chia Seeds", cal: 460, pro: "40g", desc: "250g Greek yogurt (0% fat), 1 scoop vanilla whey, 15g chia seeds, and sliced banana." },
                            lunch: { name: "Lean Ground Turkey & Jasmine Rice", cal: 640, pro: "50g", desc: "190g extra-lean turkey breast mince with taco seasoning, 1 cup jasmine rice, and black beans." },
                            snack: { name: "Cottage Cheese & Rice Cakes", cal: 280, pro: "28g", desc: "200g low-fat cottage cheese, 2 brown rice cakes, and a sprinkle of cinnamon." },
                            dinner: { name: "Grilled Sirloin Steak & Roasted Broccoli", cal: 610, pro: "52g", desc: "180g grass-fed sirloin steak, large bowl of roasted garlic broccoli, and baby red potatoes." }
                        },
                        3: {
                            breakfast: { name: "Protein French Toast & Berries", cal: 490, pro: "36g", desc: "3 slices egg-white dipped whole wheat toast, sugar-free syrup, 1 scoop whey, and strawberries." },
                            lunch: { name: "Seared Tuna Steak & Brown Rice Medley", cal: 600, pro: "54g", desc: "200g yellowfin tuna steak, sesame drizzle, 1 cup brown rice, and steamed green beans." },
                            snack: { name: "Hard Boiled Eggs & Protein Bar", cal: 320, pro: "30g", desc: "2 whole organic eggs, 1 high-protein low-sugar bar, and cucumber slices." },
                            dinner: { name: "Lemon Pepper Chicken & Baked Yam", cal: 570, pro: "48g", desc: "190g chicken breast strips, 1 medium baked yam, and mixed Mediterranean greens." }
                        },
                        4: {
                            breakfast: { name: "Overnight Protein Oats with Peanut Butter", cal: 510, pro: "38g", desc: "70g rolled oats, 1 scoop chocolate whey, 1 tbsp natural peanut butter, and almond milk." },
                            lunch: { name: "Bison Patty Burger (No Bun) & Sweet Potato Wedges", cal: 650, pro: "52g", desc: "180g lean bison patty with tomato and lettuce wraps, plus 160g oven-baked sweet potato wedges." },
                            snack: { name: "Greek Yogurt & Walnuts", cal: 290, pro: "26g", desc: "200g plain Greek yogurt with 15g raw walnut halves and raw organic honey." },
                            dinner: { name: "White Fish Cod with Herb Couscous", cal: 540, pro: "46g", desc: "220g wild cod fillet baked with herbs, 1 cup whole wheat couscous, and roasted bell peppers." }
                        },
                        5: {
                            breakfast: { name: "Steak & Eggs Breakfast Hash", cal: 520, pro: "44g", desc: "100g lean flank steak strips, 2 sunny-side eggs, diced bell peppers, and 1 slice seeded bread." },
                            lunch: { name: "Chipotle-Style Chicken Burrito Bowl", cal: 630, pro: "50g", desc: "180g grilled adobo chicken, pinto beans, salsa fresca, cilantro-lime brown rice, and lettuce." },
                            snack: { name: "Protein Smoothie with Spinach & Blueberries", cal: 290, pro: "30g", desc: "Whey isolate, baby spinach, 1/2 cup blueberries, and flaxseeds blended in coconut water." },
                            dinner: { name: "Grilled Jumbo Shrimp & Garlic Asparagus", cal: 520, pro: "48g", desc: "220g wild shrimp sautéed in garlic olive oil, 1 cup steamed quinoa, and asparagus." }
                        },
                        6: {
                            breakfast: { name: "Smoked Salmon & Poached Egg Toast", cal: 470, pro: "36g", desc: "80g wild smoked salmon, 2 poached eggs, mashed avocado, and 1 slice artisanal rye bread." },
                            lunch: { name: "Grilled Chicken Pesto Wrap", cal: 640, pro: "48g", desc: "Whole grain tortilla wrap with 180g sliced grilled chicken, 1 tbsp basil pesto, and arugula." },
                            snack: { name: "Edamame & Beef Jerky", cal: 310, pro: "34g", desc: "1 cup steamed edamame pods with sea salt, and 40g lean artisanal beef jerky." },
                            dinner: { name: "Grass-Fed Beef Meatballs & Zucchini Noodles", cal: 560, pro: "48g", desc: "180g lean beef meatballs in marinara sauce over spiralized zucchini noodles and parmesan." }
                        },
                        7: {
                            breakfast: { name: "Sunday Power Omelet & Citrus Fruit", cal: 500, pro: "42g", desc: "3 eggs + 2 egg whites, diced lean turkey bacon, baby kale, feta, and 1 whole ruby grapefruit." },
                            lunch: { name: "Roast Turkey Breast & Mashed Cauliflower", cal: 590, pro: "52g", desc: "200g slow-roasted turkey breast with rosemary gravy, garlic mashed cauliflower, and carrots." },
                            snack: { name: "Casein Protein Pudding", cal: 270, pro: "32g", desc: "Slow-digesting casein protein mixed thick with almond milk and cacao nibs." },
                            dinner: { name: "Baked Halibut with Mediterranean Herb Medley", cal: 560, pro: "46g", desc: "200g wild halibut, kalamata olives, cherry tomatoes, capers, and roasted baby potatoes." }
                        }
                    }
                },
                {
                    label: "Plan B: Accelerated Fat Shred",
                    badge: "CALORIE DEFICIT",
                    calories: 1850,
                    proteinPct: 40,
                    carbsPct: 25,
                    fatsPct: 35,
                    proteinGrams: 185,
                    carbsGrams: 115,
                    fatsGrams: 72,
                    days: {
                        1: {
                            breakfast: { name: "Spinach Egg White Frittata with Avocado", cal: 410, pro: "36g", desc: "5 egg whites, 1 whole egg, baby spinach, 1/3 avocado, and sliced cherry tomatoes." },
                            lunch: { name: "Herb Roasted Chicken Salad & Walnut Vinaigrette", cal: 530, pro: "48g", desc: "200g chicken breast, mixed dark greens, cucumbers, 15g walnuts, and apple cider vinaigrette." },
                            snack: { name: "Whey Protein Shake & Celery with Almond Butter", cal: 260, pro: "28g", desc: "1 scoop whey isolate with water, 2 celery stalks with 1 tbsp raw almond butter." },
                            dinner: { name: "Pan-Seared Sea Bass & Sautéed Bok Choy", cal: 480, pro: "45g", desc: "210g Chilean sea bass, ginger garlic bok choy, and grilled zucchini rounds." }
                        },
                        2: {
                            breakfast: { name: "Smoked Turkey Omelet & Sliced Cucumber", cal: 390, pro: "38g", desc: "4 egg whites, 2 slices nitrate-free turkey breast, bell peppers, and crisp cucumber slices." },
                            lunch: { name: "Grilled Salmon over Arugula Salad", cal: 540, pro: "46g", desc: "180g wild salmon fillet, wild baby arugula, olive oil drizzle, and shaved parmesan." },
                            snack: { name: "Low-Fat Cottage Cheese & Pumpkin Seeds", cal: 240, pro: "26g", desc: "180g low fat cottage cheese with 10g roasted pumpkin seeds." },
                            dinner: { name: "Lean Grass-Fed Beef Strips & Green Beans", cal: 510, pro: "48g", desc: "180g sirloin steak strips stir-fried in avocado oil with fresh garlic green beans." }
                        },
                        3: {
                            breakfast: { name: "Chia Protein Pudding with Strawberries", cal: 380, pro: "32g", desc: "25g chia seeds, 1 scoop vanilla protein, unsweetened almond milk, and 4 fresh strawberries." },
                            lunch: { name: "Turkey Burger Patties with Asparagus", cal: 520, pro: "50g", desc: "Two 90g lean turkey patties, grilled asparagus spears, and yellow mustard." },
                            snack: { name: "Boiled Eggs & Sea Salt Edamame", cal: 270, pro: "24g", desc: "2 hard-boiled eggs with sea salt and 1/2 cup steamed edamame." },
                            dinner: { name: "Blackened Cod & Sautéed Kale", cal: 470, pro: "46g", desc: "220g cod fillet blackened with cajun spices, sautéed baby kale in garlic oil." }
                        },
                        4: {
                            breakfast: { name: "Avocado Egg Scramble & Radishes", cal: 420, pro: "34g", desc: "3 whole eggs scrambled with cilantro, 1/4 avocado, and sliced pickled radishes." },
                            lunch: { name: "Lemon Garlic Chicken Breast & Cauliflower Rice", cal: 510, pro: "52g", desc: "200g chicken breast marinated in lemon garlic herbs with 1.5 cups riced cauliflower." },
                            snack: { name: "Whey Isolate & 10 Macadamia Nuts", cal: 260, pro: "26g", desc: "1 scoop isolate whey with iced water and 10 raw crunchy macadamia nuts." },
                            dinner: { name: "Grilled Pork Tenderloin & Roasted Broccoli", cal: 490, pro: "46g", desc: "180g lean pork tenderloin medallion with roasted garlic broccoli." }
                        },
                        5: {
                            breakfast: { name: "Greek Yogurt Bowl with Flaxseed", cal: 390, pro: "38g", desc: "220g 0% Greek yogurt, 1 scoop unflavored collagen/whey, and 15g ground flaxseeds." },
                            lunch: { name: "Canned Albacore Tuna Salad in Romaine Boats", cal: 520, pro: "50g", desc: "2 cans tuna in olive oil mixed with celery and Dijon, served in romaine lettuce leaves." },
                            snack: { name: "Beef Jerky & Cucumbers", cal: 230, pro: "26g", desc: "35g high-protein lean jerky with sliced cucumber sticks." },
                            dinner: { name: "Baked Salmon & Sautéed Spinach", cal: 530, pro: "46g", desc: "190g Atlantic salmon baked with dill, garlic sautéed baby spinach with olive oil." }
                        },
                        6: {
                            breakfast: { name: "Mushroom & Herb Egg White Omelet", cal: 380, pro: "36g", desc: "4 egg whites + 1 whole egg, cremini mushrooms, chives, and 1 slice turkey bacon." },
                            lunch: { name: "Grilled Chicken Caesar (Low-Carb Dressing)", cal: 530, pro: "50g", desc: "190g grilled chicken, romaine lettuce, parmesan shavings, and light yogurt-based Caesar." },
                            snack: { name: "String Cheese & Almonds", cal: 250, pro: "20g", desc: "2 part-skim mozzarella string cheeses and 15 raw almonds." },
                            dinner: { name: "Steak Fajita Bowl (No Tortilla)", cal: 500, pro: "46g", desc: "170g grilled flank steak with charred peppers, onions, and salsa verde." }
                        },
                        7: {
                            breakfast: { name: "Poached Eggs & Sliced Turkey Breast", cal: 410, pro: "38g", desc: "2 poached organic eggs, 80g roasted deli turkey, and roasted tomato halves." },
                            lunch: { name: "Pan-Seared Trout with Lemon Butter Greens", cal: 520, pro: "48g", desc: "200g rainbow trout fillet pan-seared with 1 tsp grass-fed butter, asparagus." },
                            snack: { name: "Whey Protein Shake & Chia Seeds", cal: 250, pro: "28g", desc: "1 scoop vanilla isolate with water and 10g soaked chia seeds." },
                            dinner: { name: "Roasted Turkey Breast with Garlic Green Beans", cal: 480, pro: "46g", desc: "190g sliced turkey breast with roasted garlic green beans and mushrooms." }
                        }
                    }
                },
                {
                    label: "Plan C: Balanced Clean Fuel",
                    badge: "ENERGY & ENDURANCE",
                    calories: 2250,
                    proteinPct: 25,
                    carbsPct: 50,
                    fatsPct: 25,
                    proteinGrams: 140,
                    carbsGrams: 280,
                    fatsGrams: 62,
                    days: {
                        1: {
                            breakfast: { name: "Banana Oatmeal Porridge & Scrambled Eggs", cal: 520, pro: "30g", desc: "80g rolled oats cooked with banana slices, honey, cinnamon, and 2 scrambled eggs." },
                            lunch: { name: "Brown Rice Chicken Bowl with Sweet Corn", cal: 680, pro: "42g", desc: "160g chicken breast, 1.5 cups brown basmati rice, sweet corn, black beans, and pico de gallo." },
                            snack: { name: "Apple with Peanut Butter & Granola Bar", cal: 340, pro: "14g", desc: "1 crisp Fuji apple with 1 tbsp natural peanut butter and 1 whole-grain oat bar." },
                            dinner: { name: "Baked Salmon, Roasted Potatoes & Peas", cal: 630, pro: "40g", desc: "160g baked salmon fillet, 200g roasted baby yellow potatoes, and sweet green peas." }
                        },
                        2: {
                            breakfast: { name: "Berry Crunch Yogurt Bowl with Honey", cal: 510, pro: "28g", desc: "200g low-fat yogurt, 40g organic granola, blueberries, and raw honey drizzle." },
                            lunch: { name: "Whole Wheat Pasta with Lean Meat Sauce", cal: 700, pro: "45g", desc: "120g whole grain penne, 150g extra-lean minced beef, and tomato basil marinara." },
                            snack: { name: "Banana & Rice Cakes with Honey", cal: 320, pro: "12g", desc: "1 ripe banana, 2 brown rice cakes with 1 tsp honey and almond butter." },
                            dinner: { name: "Teriyaki Glazed Chicken with Jasmine Rice", cal: 640, pro: "42g", desc: "170g grilled chicken thigh in teriyaki sauce, 1.5 cups steamed jasmine rice, and broccoli." }
                        },
                        3: {
                            breakfast: { name: "Whole Grain Bagel with Cream Cheese & Eggs", cal: 530, pro: "32g", desc: "1 whole grain bagel with light cream cheese, and 2 scrambled eggs on the side." },
                            lunch: { name: "Quinoa Bowl with Roasted Veggies & Turkey", cal: 670, pro: "42g", desc: "160g sliced turkey breast, 1.5 cups cooked quinoa, butternut squash, and olive oil." },
                            snack: { name: "Fruit Salad & Mixed Nuts", cal: 330, pro: "12g", desc: "Bowl of watermelon, kiwi, and grapes with 20g mixed cashews and almonds." },
                            dinner: { name: "Seared Cod with Herbed Couscous & Carrots", cal: 620, pro: "38g", desc: "200g Atlantic cod fillet, 1.5 cups herbed couscous, and roasted glazed carrots." }
                        },
                        4: {
                            breakfast: { name: "Blueberry Protein Pancakes with Maple Syrup", cal: 520, pro: "32g", desc: "Oat flour pancakes with fresh blueberries, 1 scoop vanilla whey, and pure maple syrup." },
                            lunch: { name: "Grilled Chicken Rice Pilaf with Cranberries", cal: 690, pro: "44g", desc: "170g grilled chicken breast over wild rice pilaf with dried cranberries and almonds." },
                            snack: { name: "Pretzels with Hummus & Baby Carrots", cal: 310, pro: "12g", desc: "40g salted pretzels, 3 tbsp garlic hummus, and sweet baby carrots." },
                            dinner: { name: "Flank Steak with Roasted Sweet Potatoes", cal: 640, pro: "42g", desc: "160g marinated flank steak, 220g roasted sweet potatoes, and steamed green beans." }
                        },
                        5: {
                            breakfast: { name: "Egg Sandwich on Brioche with Fruit", cal: 510, pro: "28g", desc: "2 eggs cooked over medium on toasted brioche bun with spinach, plus 1 whole orange." },
                            lunch: { name: "Salmon Poke Bowl with Sushi Rice", cal: 710, pro: "40g", desc: "150g fresh salmon cubes, 1.5 cups sushi rice, cucumber, edamame, seaweed salad, and ponzu." },
                            snack: { name: "Trail Mix with Dark Chocolate Chips", cal: 340, pro: "14g", desc: "40g custom mix of raisins, almonds, sunflower seeds, and dark chocolate drops." },
                            dinner: { name: "Lemon Herb Roast Chicken with Polenta", cal: 630, pro: "42g", desc: "180g roasted chicken breast served over creamy garlic corn polenta and zucchini." }
                        },
                        6: {
                            breakfast: { name: "Overnight Muesli with Apples & Almond Milk", cal: 500, pro: "24g", desc: "Swiss muesli soaked overnight with grated apple, cinnamon, and 1 boiled egg." },
                            lunch: { name: "Turkey Meatball Subs on Whole Wheat Roll", cal: 690, pro: "46g", desc: "170g lean turkey meatballs with marinara and melted mozzarella on whole grain roll." },
                            snack: { name: "Smoothie with Pineapple, Mango & Whey", cal: 330, pro: "26g", desc: "Tropical fruit smoothie with 1 scoop vanilla whey in coconut water." },
                            dinner: { name: "Baked Tilapia with Spanish Saffron Rice", cal: 620, pro: "38g", desc: "210g baked tilapia fillet with 1.5 cups saffron rice and charred cherry tomatoes." }
                        },
                        7: {
                            breakfast: { name: "Sunday Waffles with Strawberries & Scramble", cal: 530, pro: "28g", desc: "2 whole grain waffles with fresh strawberries, maple drizzle, and 2 scrambled eggs." },
                            lunch: { name: "Sirloin Beef Burrito Bowl with Rice & Beans", cal: 710, pro: "44g", desc: "160g sirloin steak, 1 cup cilantro rice, 1/2 cup black beans, sweet corn, and guacamole." },
                            snack: { name: "Pita Chips with Guacamole & Grapes", cal: 320, pro: "10g", desc: "Baked whole wheat pita chips with fresh guacamole and seedless red grapes." },
                            dinner: { name: "Roast Pork Medallions with Apple Glaze & Rice", cal: 640, pro: "40g", desc: "180g roasted pork medallions with apple chutney glaze, jasmine rice, and broccoli." }
                        }
                    }
                }
            ]
        },
        'plant-based': {
            name: "Plant-Based & Vegetarian High-Protein",
            variations: [
                {
                    label: "Plan A: Clean Vegan Power",
                    badge: "PLANT PROTEIN",
                    calories: 2050,
                    proteinPct: 30,
                    carbsPct: 45,
                    fatsPct: 25,
                    proteinGrams: 154,
                    carbsGrams: 230,
                    fatsGrams: 57,
                    days: {
                        1: {
                            breakfast: { name: "Tofu Scramble with Turmeric & Sourdough", cal: 460, pro: "32g", desc: "200g firm tofu scrambled with turmeric, nutritional yeast, spinach, and 2 slices toasted sourdough." },
                            lunch: { name: "Tempeh Grain Bowl with Tahini Drizzle", cal: 620, pro: "42g", desc: "180g marinated baked tempeh, 1 cup cooked quinoa, massaged kale, roasted beets, and lemon tahini." },
                            snack: { name: "Pea Protein Shake with Almond Butter", cal: 290, pro: "28g", desc: "1 scoop organic pea & rice protein isolate with oat milk and 1 tbsp natural almond butter." },
                            dinner: { name: "Red Lentil & Chickpea Curry with Basmati", cal: 580, pro: "36g", desc: "Spiced red lentil dal with chickpeas, fresh ginger, spinach, and 1 cup steamed brown basmati rice." }
                        },
                        2: {
                            breakfast: { name: "Protein Oatmeal with Hemp Seeds & Berries", cal: 470, pro: "34g", desc: "70g rolled oats cooked with 1 scoop vegan protein powder, 20g hemp seeds, and blueberries." },
                            lunch: { name: "Edamame & Tofu Soba Noodle Salad", cal: 610, pro: "40g", desc: "150g baked tofu, 1 cup shelled edamame, 100g buckwheat soba noodles, and sesame ginger dressing." },
                            snack: { name: "Roasted Spiced Chickpeas & Apple", cal: 280, pro: "16g", desc: "1 cup crunchy oven-roasted paprika chickpeas with 1 crisp Honeycrisp apple." },
                            dinner: { name: "Black Bean & Seitan Chili with Avocado", cal: 590, pro: "44g", desc: "High-protein seitan chunks simmered with black beans, fire-roasted tomatoes, and sliced avocado." }
                        },
                        3: {
                            breakfast: { name: "Chia Seed & Soy Milk Pudding with Walnuts", cal: 450, pro: "28g", desc: "30g chia seeds in high-protein soy milk, raw walnuts, and sliced ripe banana." },
                            lunch: { name: "Mediterranean Falafel & Hummus Protein Wrap", cal: 630, pro: "36g", desc: "4 baked falafels, 3 tbsp hummus, cucumber, tomato, and tahini in a whole wheat wrap." },
                            snack: { name: "Vegan Protein Bar & Almonds", cal: 290, pro: "22g", desc: "1 organic plant-based protein bar with 15g raw almonds." },
                            dinner: { name: "Tofu & Broccoli Stir-Fry with Brown Rice", cal: 570, pro: "38g", desc: "200g crispy air-fried tofu, broccoli crowns, snap peas, coconut aminos, and brown rice." }
                        },
                        4: {
                            breakfast: { name: "Avocado & White Bean Toast with Hemp", cal: 460, pro: "28g", desc: "Mashed cannellini beans and avocado on sourdough toast topped with hemp hearts and chili flakes." },
                            lunch: { name: "Lentil Shepherd's Pie with Sweet Potato Mash", cal: 620, pro: "38g", desc: "Savory brown lentils, peas, and carrots topped with golden baked sweet potato mash." },
                            snack: { name: "Soy Protein Smoothie with Spinach", cal: 280, pro: "30g", desc: "Soy isolate, baby kale, banana, and flaxseeds blended in almond milk." },
                            dinner: { name: "Tempeh Fajita Skillet with Corn Tortillas", cal: 580, pro: "40g", desc: "180g tempeh strips charred with bell peppers and onions, served with 3 warm corn tortillas." }
                        },
                        5: {
                            breakfast: { name: "Buckwheat Protein Pancakes with Berries", cal: 480, pro: "32g", desc: "Buckwheat pancakes boosted with vanilla pea protein, fresh strawberries, and maple syrup." },
                            lunch: { name: "Quinoa Buddha Bowl with Roasted Chickpeas", cal: 610, pro: "36g", desc: "1.5 cups cooked quinoa, spicy roasted chickpeas, shredded red cabbage, and lemon garlic tahini." },
                            snack: { name: "Edamame Pods with Sea Salt", cal: 250, pro: "22g", desc: "1.5 cups warm steamed edamame pods sprinkled with coarse Himalayan pink salt." },
                            dinner: { name: "Spicy Tofu Tikka with Roti", cal: 580, pro: "38g", desc: "Marinated baked tofu tikka cubes in rich tomato gravy, served with 2 whole wheat rotis." }
                        },
                        6: {
                            breakfast: { name: "Green Spirulina & Plant Protein Smoothie", cal: 440, pro: "32g", desc: "Spinach, frozen banana, 1 tsp organic spirulina, and 1 scoop vegan protein powder." },
                            lunch: { name: "High-Protein Lentil Burger on Brioche", cal: 640, pro: "38g", desc: "Home-style lentil and walnut patty with caramelized onions, lettuce, and avocado on bun." },
                            snack: { name: "Pumpkin Seeds & Dark Chocolate Cacao Nibs", cal: 280, pro: "16g", desc: "30g raw pumpkin seeds mixed with 15g pure 85% dark chocolate cacao nibs." },
                            dinner: { name: "Chickpea & Sweet Potato Moroccan Tagine", cal: 570, pro: "34g", desc: "Moroccan-spiced chickpeas, sweet potato chunks, apricots, and whole wheat couscous." }
                        },
                        7: {
                            breakfast: { name: "Sunday Tofu Benedict with Cashew Hollandaise", cal: 470, pro: "30g", desc: "Grilled tofu slices on whole grain English muffin, steamed spinach, and rich cashew cream sauce." },
                            lunch: { name: "Smoky Tempeh BLT with Avocado Salad", cal: 630, pro: "40g", desc: "Maple-tamari glazed tempeh bacon strips on sprouted grain bread with lettuce and tomato." },
                            snack: { name: "Pea Protein Shake with Blueberries", cal: 280, pro: "28g", desc: "1 scoop plant protein blended smooth with frozen wild blueberries and chia seeds." },
                            dinner: { name: "Creamy Coconut Dal with Jasmine Rice", cal: 580, pro: "34g", desc: "Yellow moong dal cooked with light coconut milk, curry leaves, mustard seeds, and rice." }
                        }
                    }
                },
                {
                    label: "Plan B: Vegetarian Dairy & Eggs",
                    badge: "VEGETARIAN RECOMP",
                    calories: 2100,
                    proteinPct: 32,
                    carbsPct: 43,
                    fatsPct: 25,
                    proteinGrams: 168,
                    carbsGrams: 225,
                    fatsGrams: 58,
                    days: {
                        1: {
                            breakfast: { name: "Scrambled Eggs with Paneer & Toast", cal: 480, pro: "36g", desc: "3 eggs + 80g crumbled low-fat paneer, spinach, and 2 slices toasted whole grain bread." },
                            lunch: { name: "Grilled Paneer & Quinoa Salad", cal: 630, pro: "42g", desc: "150g grilled paneer cubes, mixed greens, quinoa, cucumber, and olive oil vinaigrette." },
                            snack: { name: "Greek Yogurt with Honey & Walnuts", cal: 310, pro: "28g", desc: "220g 0% Greek yogurt, 15g walnuts, and raw honey drizzle." },
                            dinner: { name: "Black Bean & Cheddar Enchiladas", cal: 580, pro: "38g", desc: "Black beans and peppers wrapped in corn tortillas, topped with enchilada sauce and cheese." }
                        },
                        2: {
                            breakfast: { name: "Protein Power Oatmeal with Whey", cal: 490, pro: "38g", desc: "Rolled oats, 1 scoop whey protein, sliced banana, and 1 tbsp natural peanut butter." },
                            lunch: { name: "Egg Salad Wrap with Avocado", cal: 610, pro: "36g", desc: "3 hard-boiled eggs mashed with Greek yogurt and mustard, wrapped in whole wheat flatbread." },
                            snack: { name: "Cottage Cheese & Pineapple Chunks", cal: 280, pro: "26g", desc: "200g low-fat cottage cheese with sweet juicy pineapple pieces." },
                            dinner: { name: "Lentil Dal Makhani with Brown Basmati", cal: 610, pro: "38g", desc: "Protein-rich black lentils simmered with light cream and spices, served with brown rice." }
                        },
                        3: {
                            breakfast: { name: "Greek Omelet with Feta & Olives", cal: 470, pro: "34g", desc: "3 eggs, 40g Greek feta cheese, kalamata olives, cherry tomatoes, and 1 slice toast." },
                            lunch: { name: "Tofu & Edamame Poke Bowl", cal: 620, pro: "44g", desc: "150g teriyaki tofu, 1 cup edamame, sushi rice, avocado, and nori strips." },
                            snack: { name: "Whey Protein Shake & Rice Cake", cal: 260, pro: "28g", desc: "1 scoop isolate whey with cold water and 1 brown rice cake with almond butter." },
                            dinner: { name: "Spinach Paneer (Palak Paneer) with Roti", cal: 600, pro: "40g", desc: "160g paneer cubes in iron-rich pureed spinach gravy, served with 2 whole wheat rotis." }
                        },
                        4: {
                            breakfast: { name: "Overnight Oats with Greek Yogurt & Chia", cal: 480, pro: "36g", desc: "Oats, 150g Greek yogurt, chia seeds, almond milk, and mixed berries." },
                            lunch: { name: "Chickpea & Halloumi Mediterranean Salad", cal: 630, pro: "38g", desc: "Grilled halloumi cheese slices, seasoned chickpeas, cherry tomatoes, and lemon dressing." },
                            snack: { name: "Hard Boiled Eggs & Apple Slices", cal: 290, pro: "18g", desc: "2 organic boiled eggs and 1 crisp Gala apple." },
                            dinner: { name: "Vegetarian Chili with Kidney Beans & Cheddar", cal: 590, pro: "42g", desc: "Kidney beans, pinto beans, crushed tomatoes, cumin, topped with sharp cheddar." }
                        },
                        5: {
                            breakfast: { name: "Protein Waffles with Greek Yogurt Topping", cal: 490, pro: "34g", desc: "2 protein waffles topped with 100g vanilla Greek yogurt and strawberries." },
                            lunch: { name: "Tempeh & Brown Rice Teriyaki Bowl", cal: 620, pro: "40g", desc: "180g glazed tempeh cubes, 1.5 cups brown rice, steamed broccoli, and sesame seeds." },
                            snack: { name: "String Cheese & Roasted Almonds", cal: 270, pro: "20g", desc: "2 mozzarella string cheeses with 20g crunchy roasted almonds." },
                            dinner: { name: "Mushroom & Ricotta Stuffed Shells", cal: 580, pro: "36g", desc: "Whole grain pasta shells stuffed with seasoned ricotta, spinach, and marinara." }
                        },
                        6: {
                            breakfast: { name: "Avocado Toast with 2 Sunny Eggs", cal: 470, pro: "26g", desc: "1/2 avocado smashed on artisanal sourdough with 2 eggs sunny side up." },
                            lunch: { name: "Soya Chunks Biryani with Raita", cal: 640, pro: "46g", desc: "60g high-protein soya chunks cooked with fragrant basmati spices and cucumber raita." },
                            snack: { name: "Whey Protein Pudding & Dark Chocolate", cal: 280, pro: "28g", desc: "Chocolate whey mixed with Greek yogurt and 10g dark chocolate chips." },
                            dinner: { name: "Vegetable Bean Burrito Bowl with Guacamole", cal: 600, pro: "38g", desc: "Brown rice, spiced black beans, roasted corn, fajita veggies, and fresh guacamole." }
                        },
                        7: {
                            breakfast: { name: "Sunday Shakshuka with Feta & Crusty Bread", cal: 480, pro: "32g", desc: "3 eggs poached in spiced tomato, bell pepper and onion sauce, topped with crumbled feta." },
                            lunch: { name: "Quinoa Veggie Burger & Sweet Potato Wedges", cal: 630, pro: "36g", desc: "Black bean quinoa patty with chipotle sauce and baked sweet potato wedges." },
                            snack: { name: "Cottage Cheese Bowl with Blueberries", cal: 270, pro: "26g", desc: "200g cottage cheese with fresh blueberries and a dash of cinnamon." },
                            dinner: { name: "Paneer Butter Masala (Light) with Jeera Rice", cal: 620, pro: "40g", desc: "150g paneer in cashew-tomato gravy made with light yogurt, served with jeera rice." }
                        }
                    }
                },
                {
                    label: "Plan C: High-Fiber Vegan Endurance",
                    badge: "FIBER & COMPLEX CARBS",
                    calories: 2200,
                    proteinPct: 25,
                    carbsPct: 52,
                    fatsPct: 23,
                    proteinGrams: 138,
                    carbsGrams: 286,
                    fatsGrams: 56,
                    days: {
                        1: {
                            breakfast: { name: "Big Bowl Overnight Muesli with Soy Milk", cal: 520, pro: "26g", desc: "Rolled oats, pumpkin seeds, raisins, grated apple, and 1 scoop pea protein." },
                            lunch: { name: "Sweet Potato, Black Bean & Brown Rice Bowl", cal: 680, pro: "38g", desc: "Roasted sweet potato, spiced black beans, 1.5 cups brown rice, cilantro, and avocado." },
                            snack: { name: "Banana with Peanut Butter & Pretzels", cal: 330, pro: "14g", desc: "1 large ripe banana with 1 tbsp peanut butter and salted mini pretzels." },
                            dinner: { name: "Lentil Bolognese over Whole Grain Penne", cal: 640, pro: "42g", desc: "Slow-simmered green lentil ragu over 120g whole grain penne with nutritional yeast." }
                        },
                        2: {
                            breakfast: { name: "Peanut Butter Banana Toast with Hemp", cal: 500, pro: "24g", desc: "2 slices sprouted grain toast, natural peanut butter, banana slices, and hemp hearts." },
                            lunch: { name: "Chickpea Quinoa Tabbouleh Bowl", cal: 670, pro: "36g", desc: "1.5 cups quinoa, chickpeas, heaps of fresh parsley, mint, cucumber, and lemon dressing." },
                            snack: { name: "Trail Mix with Dried Cranberries & Cashews", cal: 340, pro: "12g", desc: "45g raw energy mix with cashews, almonds, and cranberries." },
                            dinner: { name: "Tofu Pad Thai with Crushed Peanuts", cal: 650, pro: "40g", desc: "Rice noodles, 180g firm tofu, bean sprouts, scallions, and tangy tamarind sauce." }
                        },
                        3: {
                            breakfast: { name: "Tropical Spirulina Smoothie Bowl", cal: 490, pro: "28g", desc: "Mango, pineapple, plant protein, spirulina topped with chia seeds and granola." },
                            lunch: { name: "Spiced Bean & Rice Burrito Wrap", cal: 690, pro: "38g", desc: "Large whole wheat tortilla packed with pinto beans, brown rice, peppers, and salsa." },
                            snack: { name: "Hummus with Whole Grain Crackers", cal: 310, pro: "14g", desc: "4 tbsp garlic hummus with multi-seed artisan crackers and celery." },
                            dinner: { name: "Sweet Corn & Black Bean Enchilada Bake", cal: 630, pro: "36g", desc: "Layered corn tortillas with beans, roasted corn, enchilada sauce, and cashew cheese." }
                        },
                        4: {
                            breakfast: { name: "Berry Crunch Oatmeal with Chia", cal: 510, pro: "26g", desc: "80g rolled oats cooked with almond milk, blueberries, chia seeds, and maple syrup." },
                            lunch: { name: "Tempeh Reuben on Rye Bread", cal: 680, pro: "42g", desc: "Marinated smoky tempeh, sauerkraut, vegan Russian dressing on toasted rye." },
                            snack: { name: "Fresh Fruit Bowl & Pumpkin Seeds", cal: 320, pro: "14g", desc: "Kiwi, orange, and watermelon chunks with 20g crunchy pumpkin seeds." },
                            dinner: { name: "Yellow Split Pea Dal with Basmati Rice", cal: 620, pro: "38g", desc: "Spiced yellow dal with turmeric, cumin, tomatoes, and 1.5 cups basmati rice." }
                        },
                        5: {
                            breakfast: { name: "Apple Cinnamon Baked Oatmeal", cal: 500, pro: "26g", desc: "Warm baked oats with diced apples, cinnamon, walnuts, and splash of soy milk." },
                            lunch: { name: "Mediterranean Couscous Salad with Chickpeas", cal: 670, pro: "34g", desc: "Israeli pearl couscous, roasted bell peppers, chickpeas, kalamata olives, and lemon." },
                            snack: { name: "Plant Protein Shake & Rice Cake", cal: 310, pro: "26g", desc: "Vanilla pea protein shake and 2 rice cakes with sunflower seed butter." },
                            dinner: { name: "Vegetable Japanese Curry with Tofu", cal: 650, pro: "38g", desc: "Japanese mild curry roux with potatoes, carrots, 160g tofu over steamed rice." }
                        },
                        6: {
                            breakfast: { name: "Chia Flaxseed Pudding with Raspberries", cal: 480, pro: "24g", desc: "Chia and ground flax in oat milk, topped with fresh raspberries and walnuts." },
                            lunch: { name: "Lentil Soup with Crusty Sourdough", cal: 660, pro: "38g", desc: "Thick hearty green lentil soup with carrots and celery, and 2 slices sourdough." },
                            snack: { name: "Dates Stuffed with Almond Butter", cal: 340, pro: "10g", desc: "3 Medjool dates filled with crunchy almond butter and flaky sea salt." },
                            dinner: { name: "Stir-Fried Rice Noodles with Edamame & Veggies", cal: 640, pro: "36g", desc: "Flat rice noodles with 1 cup edamame, bok choy, carrots, and sesame oil." }
                        },
                        7: {
                            breakfast: { name: "Sunday Buckwheat Waffles with Maple Syrup", cal: 520, pro: "24g", desc: "2 whole grain buckwheat waffles topped with banana slices and warm pure maple syrup." },
                            lunch: { name: "Roasted Vegetable & Seitan Grain Bowl", cal: 700, pro: "46g", desc: "High-protein seitan slices over farro grain with roasted zucchini and tahini." },
                            snack: { name: "Edamame & Green Tea", cal: 260, pro: "20g", desc: "Steamed edamame in pods with sea salt and a hot cup of antioxidant green tea." },
                            dinner: { name: "Moroccan Chickpea Stew with Couscous", cal: 630, pro: "34g", desc: "Slow cooked chickpeas with cumin, coriander, tomatoes, and fluffy couscous." }
                        }
                    }
                }
            ]
        },
        'keto': {
            name: "Keto & Low-Carb Ketogenic",
            variations: [
                {
                    label: "Plan A: Strict Ketogenic (<30g Net Carbs)",
                    badge: "KETOSIS FUEL",
                    calories: 2000,
                    proteinPct: 30,
                    carbsPct: 5,
                    fatsPct: 65,
                    proteinGrams: 150,
                    carbsGrams: 25,
                    fatsGrams: 144,
                    days: {
                        1: {
                            breakfast: { name: "Avocado & Bacon 3-Egg Scramble", cal: 530, pro: "34g", desc: "3 pasture-raised eggs scrambled in grass-fed butter, 2 slices thick-cut bacon, and 1/2 sliced ripe avocado." },
                            lunch: { name: "Grilled Chicken & Bacon Cobb Salad", cal: 640, pro: "48g", desc: "180g chicken breast, mixed greens, hard-boiled egg, blue cheese crumbles, bacon, and olive oil dressing." },
                            snack: { name: "Macadamia Nuts & String Cheese", cal: 290, pro: "12g", desc: "30g buttery raw macadamia nuts and 1 whole-milk mozzarella cheese stick." },
                            dinner: { name: "Herb Butter Salmon & Grilled Asparagus", cal: 540, pro: "42g", desc: "200g wild salmon fillet pan-seared with 1 tbsp garlic herb butter and grilled asparagus." }
                        },
                        2: {
                            breakfast: { name: "Keto Coffee & Sausage Egg Cups", cal: 510, pro: "32g", desc: "2 baked egg and pork sausage muffins with cheddar, plus bulletproof coffee with MCT oil." },
                            lunch: { name: "Bacon Guacamole Bunless Burger", cal: 660, pro: "46g", desc: "200g ground beef patty wrapped in butter lettuce with cheddar, bacon, and fresh guacamole." },
                            snack: { name: "Pork Rinds & French Onion Dip", cal: 260, pro: "18g", desc: "Crispy artisan pork rinds with sour cream and chive dip." },
                            dinner: { name: "Ribeye Steak with Garlic Butter Mushrooms", cal: 570, pro: "46g", desc: "200g seared ribeye steak topped with herb butter and sautéed cremini mushrooms." }
                        },
                        3: {
                            breakfast: { name: "Smoked Salmon & Cream Cheese Roll-ups", cal: 490, pro: "36g", desc: "100g smoked salmon rolled with full-fat cream cheese, capers, and cucumber spears." },
                            lunch: { name: "Tuna Salad Stuffed Avocados", cal: 630, pro: "44g", desc: "2 whole avocado halves filled with albacore tuna mixed with avocado mayo and celery." },
                            snack: { name: "Walnuts & Dark Chocolate (90%)", cal: 280, pro: "8g", desc: "25g raw walnuts and 2 squares of 90% Lindt dark chocolate." },
                            dinner: { name: "Chicken Thighs with Creamy Pesto Spinach", cal: 590, pro: "46g", desc: "2 crispy-skin chicken thighs baked with basil pesto cream sauce and baby spinach." }
                        },
                        4: {
                            breakfast: { name: "Spinach, Feta & Sausage Omelet", cal: 520, pro: "36g", desc: "3 eggs folded with crumbled feta, Italian sausage, and fresh spinach in olive oil." },
                            lunch: { name: "Steak Caesar Salad (Zero Croutons)", cal: 650, pro: "48g", desc: "180g sliced flank steak, crisp romaine, parmesan crisps, and full-fat creamy Caesar." },
                            snack: { name: "Hard Boiled Eggs & Mayo", cal: 260, pro: "14g", desc: "2 organic eggs sprinkled with smoked paprika and 1 tbsp olive oil mayo." },
                            dinner: { name: "Pork Chops with Garlic Butter Green Beans", cal: 560, pro: "44g", desc: "200g bone-in pork chop pan-seared with rosemary butter, tender green beans." }
                        },
                        5: {
                            breakfast: { name: "Keto Coconut Pancakes with Butter", cal: 490, pro: "24g", desc: "Coconut flour & egg pancakes topped with grass-fed salted butter and sugar-free syrup." },
                            lunch: { name: "Shrimp & Avocado Salad with Lime Dressing", cal: 610, pro: "42g", desc: "200g sautéed jumbo shrimp over butter lettuce, diced avocado, and cilantro lime olive oil." },
                            snack: { name: "Pecan Halves & Cheddar Cubes", cal: 300, pro: "12g", desc: "25g raw pecan halves and 30g aged sharp cheddar cubes." },
                            dinner: { name: "Baked Halibut with Hollandaise Sauce", cal: 580, pro: "44g", desc: "200g halibut fillet baked with rich buttery lemon hollandaise and asparagus." }
                        },
                        6: {
                            breakfast: { name: "Corned Beef Hash with 2 Fried Eggs", cal: 540, pro: "38g", desc: "Shredded brisket hash made with diced radishes instead of potatoes, with 2 fried eggs." },
                            lunch: { name: "Turkey Club Lettuce Wraps with Bacon", cal: 640, pro: "46g", desc: "Deli turkey, bacon, cheddar, and mayo rolled inside crisp iceberg lettuce." },
                            snack: { name: "Keto Chocolate Collagen Shake", cal: 270, pro: "26g", desc: "Collagen peptides, unsweetened almond milk, cacao powder, and MCT oil." },
                            dinner: { name: "Herb Roasted Duck Breast with Zucchini", cal: 580, pro: "42g", desc: "180g crispy duck breast served with zucchini ribbons sautéed in duck fat." }
                        },
                        7: {
                            breakfast: { name: "Sunday Keto Benedict on Portobello Cap", cal: 510, pro: "32g", desc: "Grilled portobello mushroom cap with bacon, poached eggs, and creamy hollandaise." },
                            lunch: { name: "Salmon Patties with Dill Aioli", cal: 650, pro: "46g", desc: "Crispy pan-fried wild salmon patties with homemade lemon dill aioli and arugula." },
                            snack: { name: "Kalamata Olives & Salami Slices", cal: 280, pro: "14g", desc: "10 rich kalamata olives with 40g artisanal Genoa salami." },
                            dinner: { name: "Beef Tenderloin with Gorgonzola Crust", cal: 590, pro: "48g", desc: "190g beef tenderloin steak topped with melted gorgonzola cheese and broccolini." }
                        }
                    }
                },
                {
                    label: "Plan B: Moderate Low-Carb (<75g Carbs)",
                    badge: "LEAN METABOLIC",
                    calories: 2050,
                    proteinPct: 35,
                    carbsPct: 15,
                    fatsPct: 50,
                    proteinGrams: 179,
                    carbsGrams: 77,
                    fatsGrams: 114,
                    days: {
                        1: {
                            breakfast: { name: "3-Egg Omelet with Avocado & Berries", cal: 480, pro: "34g", desc: "3 eggs with bell peppers, 1/3 avocado, and 1/2 cup fresh raspberries on the side." },
                            lunch: { name: "Grilled Chicken & Quinoa Salad (Light Grain)", cal: 620, pro: "50g", desc: "200g chicken breast, 1/2 cup cooked quinoa, olive oil vinaigrette, cucumber, and feta." },
                            snack: { name: "Greek Yogurt with Chia Seeds & Almonds", cal: 290, pro: "28g", desc: "200g Greek yogurt 2% fat, 10g chia seeds, and 15g sliced almonds." },
                            dinner: { name: "Pan-Seared Salmon & Roasted Butternut Squash", cal: 580, pro: "44g", desc: "180g Atlantic salmon with 100g roasted butternut squash cubes and steamed broccoli." }
                        },
                        2: {
                            breakfast: { name: "Protein Smoothie with Peanut Butter & Spinach", cal: 460, pro: "38g", desc: "1 scoop whey isolate, almond milk, baby spinach, 1 tbsp peanut butter, and 1/2 green banana." },
                            lunch: { name: "Lean Sirloin Steak with Cauliflower Mash", cal: 640, pro: "52g", desc: "190g sirloin steak with garlic butter, smooth cauliflower mash, and grilled green beans." },
                            snack: { name: "Hard Boiled Eggs & Carrot Sticks", cal: 260, pro: "18g", desc: "2 pasture-raised hard-boiled eggs with crisp carrot sticks." },
                            dinner: { name: "Lemon Thyme Chicken Breast with Sweet Potato", cal: 580, pro: "48g", desc: "190g chicken breast with 100g roasted sweet potato rounds and mixed greens." }
                        },
                        3: {
                            breakfast: { name: "Smoked Turkey & Swiss Egg Scramble", cal: 470, pro: "38g", desc: "3 eggs, 60g smoked turkey breast, 30g Swiss cheese, and sliced tomatoes." },
                            lunch: { name: "Tuna Salad in Whole Grain Wrap (Low Carb)", cal: 610, pro: "46g", desc: "1 can albacore tuna with avocado mayo in a low-carb flax tortilla with lettuce." },
                            snack: { name: "Cottage Cheese & Blueberries", cal: 270, pro: "26g", desc: "200g low-fat cottage cheese with 1/2 cup wild blueberries." },
                            dinner: { name: "Seared Cod with Warm Mediterranean Salsa", cal: 560, pro: "44g", desc: "220g cod fillet topped with warm olive, caper, and tomato salsa over asparagus." }
                        },
                        4: {
                            breakfast: { name: "Chia Seed Bowl with Almond Milk & Protein", cal: 460, pro: "32g", desc: "25g chia seeds, 1 scoop vanilla whey, unsweetened almond milk, and blackberries." },
                            lunch: { name: "Chipotle Chicken Bowl (No Rice, Extra Peppers)", cal: 630, pro: "52g", desc: "200g adobo chicken, fajita peppers, pinto beans, guacamole, and lettuce." },
                            snack: { name: "Beef Jerky & Walnuts", cal: 280, pro: "24g", desc: "35g artisanal beef jerky with 15g raw walnut halves." },
                            dinner: { name: "Pork Tenderloin Medallions with Green Salad", cal: 570, pro: "46g", desc: "190g pork tenderloin, honey mustard glaze, and large avocado salad." }
                        },
                        5: {
                            breakfast: { name: "Poached Eggs on Sautéed Kale & Mushrooms", cal: 450, pro: "30g", desc: "2 poached eggs over generous garlicky sautéed kale, cremini mushrooms, and olive oil." },
                            lunch: { name: "Salmon Salad with Pumpkin Seeds", cal: 640, pro: "48g", desc: "180g canned wild red salmon over baby greens, cucumber, and 20g pumpkin seeds." },
                            snack: { name: "String Cheese & Apple", cal: 250, pro: "16g", desc: "2 string cheeses and 1/2 crisp green apple." },
                            dinner: { name: "Grilled Shrimp Skewers with Greek Salad", cal: 560, pro: "46g", desc: "220g jumbo shrimp, cucumbers, tomatoes, kalamata olives, and feta block." }
                        },
                        6: {
                            breakfast: { name: "Scrambled Eggs with Prosciutto & Melon", cal: 480, pro: "32g", desc: "3 scrambled eggs, 2 slices prosciutto, and 1 slice sweet cantaloupe melon." },
                            lunch: { name: "Ground Turkey Lettuce Tacos with Salsa", cal: 620, pro: "48g", desc: "190g spiced turkey mince, salsa fresca, avocado slices inside butter lettuce cups." },
                            snack: { name: "Whey Isolate with Cold Brew Coffee", cal: 260, pro: "28g", desc: "1 scoop chocolate whey shaken into unsweetened cold brew coffee with splash of cream." },
                            dinner: { name: "Herb Roasted Halibut with Roasted Cauliflower", cal: 570, pro: "44g", desc: "200g halibut fillet baked with herbs and lemon over cumin roasted cauliflower." }
                        },
                        7: {
                            breakfast: { name: "Sunday Steak & Egg Breakfast", cal: 510, pro: "44g", desc: "120g lean sirloin steak, 2 sunny eggs, and grilled vine tomatoes." },
                            lunch: { name: "Roast Chicken Salad with Avocado & Walnuts", cal: 640, pro: "50g", desc: "190g chicken breast, mixed greens, 1/2 avocado, walnuts, and balsamic vinegar." },
                            snack: { name: "Greek Yogurt with Cinnamon", cal: 260, pro: "26g", desc: "200g Greek yogurt with pure cinnamon and a few chopped almonds." },
                            dinner: { name: "Baked Trout with Lemon Asparagus", cal: 570, pro: "46g", desc: "210g rainbow trout fillet baked with fresh dill and roasted garlic asparagus." }
                        }
                    }
                },
                {
                    label: "Plan C: Cyclical Low-Carb & Refeed",
                    badge: "CYCLICAL KETO",
                    calories: 2150,
                    proteinPct: 32,
                    carbsPct: 20,
                    fatsPct: 48,
                    proteinGrams: 172,
                    carbsGrams: 108,
                    fatsGrams: 115,
                    days: {
                        1: {
                            breakfast: { name: "Avocado & Egg Breakfast Skillet", cal: 490, pro: "34g", desc: "3 eggs, 1/2 avocado, diced bell peppers, and olive oil drizzle." },
                            lunch: { name: "Turkey & Bacon Salad with Blue Cheese", cal: 630, pro: "48g", desc: "180g roasted turkey, crisp bacon, mixed greens, tomatoes, and blue cheese dressing." },
                            snack: { name: "Whey Shake & Macadamia Nuts", cal: 290, pro: "28g", desc: "1 scoop whey isolate with water and 15g raw macadamias." },
                            dinner: { name: "Grilled Ribeye with Charred Green Beans", cal: 620, pro: "46g", desc: "190g ribeye steak with compound herb butter and tender green beans." }
                        },
                        2: {
                            breakfast: { name: "Keto Smoothie with MCT & Collagen", cal: 480, pro: "32g", desc: "Collagen peptides, MCT oil, unsweetened almond milk, spinach, and blueberries." },
                            lunch: { name: "Salmon Salad Bowls with Lemon Dressing", cal: 640, pro: "46g", desc: "180g Atlantic salmon, crisp cucumbers, radishes, and lemon olive oil dressing." },
                            snack: { name: "Hard Boiled Eggs with Sea Salt", cal: 260, pro: "16g", desc: "2 organic eggs sprinkled with coarse Celtic sea salt." },
                            dinner: { name: "Pan-Roasted Chicken Thighs with Asparagus", cal: 600, pro: "48g", desc: "2 crispy skin chicken thighs with roasted garlic asparagus spears." }
                        },
                        3: {
                            breakfast: { name: "Smoked Salmon Omelet with Chives", cal: 490, pro: "38g", desc: "3 eggs, 80g wild smoked salmon, and chopped fresh garden chives." },
                            lunch: { name: "Bacon Guacamole Bunless Burger", cal: 660, pro: "48g", desc: "190g beef burger wrapped in lettuce with guacamole and aged cheddar." },
                            snack: { name: "Walnuts & Cheddar Cheese", cal: 290, pro: "14g", desc: "25g raw walnuts and 30g aged sharp white cheddar." },
                            dinner: { name: "Seared Cod with Tomato Caper Sauce", cal: 570, pro: "46g", desc: "220g cod fillet simmered with tomatoes, capers, and olive oil." }
                        },
                        4: {
                            breakfast: { name: "Chia Flaxseed Pudding with Berries", cal: 470, pro: "28g", desc: "Chia seeds soaked in almond milk with 1/2 cup raspberries and walnuts." },
                            lunch: { name: "Grilled Chicken Pesto Salad", cal: 630, pro: "50g", desc: "190g chicken breast, fresh basil pesto, arugula, and cherry tomatoes." },
                            snack: { name: "Greek Yogurt with Almonds", cal: 280, pro: "26g", desc: "200g 0% Greek yogurt with 15g sliced almonds." },
                            dinner: { name: "Pork Tenderloin with Roasted Broccoli", cal: 580, pro: "46g", desc: "190g roasted pork tenderloin with garlic roasted broccoli crowns." }
                        },
                        5: {
                            breakfast: { name: "Spinach & Feta Egg Scramble", cal: 480, pro: "34g", desc: "3 eggs, 40g Greek feta, spinach, and olive oil." },
                            lunch: { name: "Albacore Tuna Salad in Romaine Boats", cal: 620, pro: "48g", desc: "1.5 cans tuna with olive oil mayo, celery, inside crisp romaine leaves." },
                            snack: { name: "Beef Jerky & Pumpkin Seeds", cal: 280, pro: "24g", desc: "35g high-protein beef jerky and 15g roasted pumpkin seeds." },
                            dinner: { name: "Herb Roasted Duck with Sautéed Greens", cal: 600, pro: "44g", desc: "180g roasted duck breast with baby spinach sautéed in olive oil." }
                        },
                        6: {
                            breakfast: { name: "Poached Eggs & Turkey Bacon Toast (Refeed Day)", cal: 520, pro: "36g", desc: "2 poached eggs, 2 slices turkey bacon, and 1 slice artisanal sourdough toast." },
                            lunch: { name: "Grilled Sirloin with Sweet Potato Rounds", cal: 660, pro: "52g", desc: "190g sirloin steak with 140g baked sweet potato rounds and greens." },
                            snack: { name: "Apple Slices with Almond Butter", cal: 290, pro: "12g", desc: "1 crisp apple with 1 tbsp natural almond butter." },
                            dinner: { name: "Baked Salmon with Wild Jasmine Rice", cal: 620, pro: "46g", desc: "180g Atlantic salmon, 1 cup cooked jasmine rice, and steamed asparagus." }
                        },
                        7: {
                            breakfast: { name: "Sunday Scramble with Sausage & Fruit", cal: 500, pro: "36g", desc: "3 eggs, 1 country sausage link, and 1 cup fresh cantaloupe slices." },
                            lunch: { name: "Roast Turkey Breast & Roasted Butternut", cal: 640, pro: "50g", desc: "200g sliced roasted turkey, roasted butternut squash, and green beans." },
                            snack: { name: "Protein Shake & Dark Chocolate", cal: 280, pro: "26g", desc: "1 scoop vanilla whey in water with 15g 85% dark chocolate." },
                            dinner: { name: "Baked Trout with Garlic Butter Green Beans", cal: 580, pro: "46g", desc: "210g rainbow trout with fresh dill and roasted garlic green beans." }
                        }
                    }
                }
            ]
        },
        'mediterranean': {
            name: "Mediterranean Longevity Diet",
            variations: [
                {
                    label: "Plan A: Aegean Sea Fish & Olive Oil",
                    badge: "HEART HEALTH",
                    calories: 2150,
                    proteinPct: 28,
                    carbsPct: 44,
                    fatsPct: 28,
                    proteinGrams: 150,
                    carbsGrams: 236,
                    fatsGrams: 67,
                    days: {
                        1: {
                            breakfast: { name: "Greek Scrambled Eggs with Feta & Tomatoes", cal: 480, pro: "34g", desc: "3 eggs, 40g barrel-aged feta, ripe diced tomatoes, oregano, and whole wheat pita." },
                            lunch: { name: "Grilled Sea Bass & Mediterranean Quinoa", cal: 640, pro: "48g", desc: "200g wild sea bass fillet, olive oil, lemon, 1 cup cooked quinoa, and cucumber salad." },
                            snack: { name: "Greek Yogurt with Thyme Honey & Walnuts", cal: 310, pro: "26g", desc: "220g authentic Greek yogurt, 15g walnuts, and raw Greek mountain honey." },
                            dinner: { name: "Lemon Herb Chicken Souvlaki & Tzatziki", cal: 590, pro: "48g", desc: "190g chicken breast skewers, homemade cucumber garlic tzatziki, and roasted peppers." }
                        },
                        2: {
                            breakfast: { name: "Avocado & Poached Egg Toast with Za'atar", cal: 470, pro: "26g", desc: "Mashed avocado on sourdough toast, 2 poached eggs, and aromatic za'atar spice." },
                            lunch: { name: "Mediterranean Lentil Salad with Grilled Shrimp", cal: 630, pro: "46g", desc: "180g grilled shrimp over french green lentils, cherry tomatoes, and red wine vinaigrette." },
                            snack: { name: "Kalamata Olives & Whole Wheat Pita Triangles", cal: 290, pro: "12g", desc: "12 rich kalamata olives, toasted pita triangles, and garlic hummus." },
                            dinner: { name: "Baked Halibut with Capers & Baby Potatoes", cal: 610, pro: "44g", desc: "210g halibut fillet baked with capers, cherry tomatoes, and herb roasted potatoes." }
                        },
                        3: {
                            breakfast: { name: "Fig & Goat Cheese Toast with Walnuts", cal: 480, pro: "24g", desc: "Fresh mission figs, 40g creamy goat cheese, honey, and crushed walnuts on whole grain toast." },
                            lunch: { name: "Grilled Chicken Greek Salad with Farro", cal: 650, pro: "48g", desc: "190g chicken breast, farro grains, cucumbers, kalamata olives, feta, and extra virgin olive oil." },
                            snack: { name: "Roasted Almonds & Dried Apricots", cal: 300, pro: "12g", desc: "25g raw Spanish almonds and 4 organic sun-dried apricots." },
                            dinner: { name: "Cioppino Mediterranean Seafood Stew", cal: 580, pro: "48g", desc: "Cod, shrimp, and mussels simmered in a rich tomato white wine herb broth with crusty bread." }
                        },
                        4: {
                            breakfast: { name: "Shakshuka with Soft Poached Eggs", cal: 490, pro: "30g", desc: "3 eggs poached in spicy bell pepper and tomato stew, with warm whole wheat pita." },
                            lunch: { name: "Tuna Niçoise Salad with Olive Oil", cal: 640, pro: "46g", desc: "Albacore tuna, hard-boiled egg, baby potatoes, green beans, olives, and dijon vinaigrette." },
                            snack: { name: "Fresh Pomegranate & Greek Yogurt", cal: 280, pro: "24g", desc: "200g Greek yogurt topped with antioxidant-rich ruby pomegranate arils." },
                            dinner: { name: "Slow-Braised Rosemary Lamb with Couscous", cal: 610, pro: "44g", desc: "170g lean braised lamb shoulder, root vegetables, and 1 cup fluffy couscous." }
                        },
                        5: {
                            breakfast: { name: "Smoked Salmon & Ricotta Whole Grain Toast", cal: 480, pro: "32g", desc: "80g wild salmon, fresh sheep's milk ricotta, lemon zest, and dill on toasted multigrain." },
                            lunch: { name: "Chickpea & Calamari Mediterranean Medley", cal: 620, pro: "46g", desc: "200g grilled calamari tossed with spiced chickpeas, arugula, and lemon garlic oil." },
                            snack: { name: "Mixed Mediterranean Nuts & Dark Chocolate", cal: 310, pro: "12g", desc: "Cashews, pistachios, almonds, and 1 square 85% dark chocolate." },
                            dinner: { name: "Herb Roasted Trout with Artichoke Hearts", cal: 590, pro: "46g", desc: "210g rainbow trout fillet roasted with marinated artichoke hearts and cherry tomatoes." }
                        },
                        6: {
                            breakfast: { name: "Oatmeal with Honey, Almonds & Fresh Peaches", cal: 470, pro: "22g", desc: "70g rolled oats cooked in almond milk, fresh peach slices, honey, and 2 boiled eggs." },
                            lunch: { name: "Moroccan Spiced Chicken & Vegetable Couscous", cal: 650, pro: "48g", desc: "190g chicken breast roasted with cumin, coriander, carrots, zucchini, over couscous." },
                            snack: { name: "Tzatziki Dip with Cucumber & Bell Pepper", cal: 260, pro: "18g", desc: "Authentic cucumber garlic yogurt tzatziki with crisp vegetable crudités." },
                            dinner: { name: "Baked Salmon in Foil with Kalamata Tapenade", cal: 610, pro: "44g", desc: "180g Atlantic salmon baked with olive tapenade, steamed greens, and sweet potato." }
                        },
                        7: {
                            breakfast: { name: "Sunday Mediterranean Frittata with Greens", cal: 490, pro: "34g", desc: "3 eggs + 2 egg whites, Swiss chard, leeks, crumbled feta, and rustic bread." },
                            lunch: { name: "Grilled Octopus & White Bean Salad", cal: 640, pro: "48g", desc: "180g charred octopus, tender cannellini beans, red onion, parsley, and olive oil." },
                            snack: { name: "Cottage Cheese with Berries & Pistachios", cal: 290, pro: "26g", desc: "200g cottage cheese with fresh blackberries and raw shelled pistachios." },
                            dinner: { name: "Herb-Crusted Sea Bream with Roasted Veggies", cal: 600, pro: "46g", desc: "210g sea bream fillet with roasted bell peppers, red onions, and lemon potatoes." }
                        }
                    }
                },
                {
                    label: "Plan B: Tuscan Whole Grain & Lean Poultry",
                    badge: "CLEAN WHOLE FOODS",
                    calories: 2100,
                    proteinPct: 30,
                    carbsPct: 45,
                    fatsPct: 25,
                    proteinGrams: 158,
                    carbsGrams: 236,
                    fatsGrams: 58,
                    days: {
                        1: {
                            breakfast: { name: "Tuscan White Bean & Egg Toast", cal: 470, pro: "32g", desc: "Cannellini beans simmered with rosemary and garlic, topped with 2 poached eggs on sourdough." },
                            lunch: { name: "Pollo alla Griglia & Farro Salad", cal: 630, pro: "50g", desc: "190g grilled chicken cutlet, farro, arugula, cherry tomatoes, and shaved parmesan." },
                            snack: { name: "Greek Yogurt & Walnuts", cal: 290, pro: "26g", desc: "200g Greek yogurt with raw walnuts and a drizzle of honey." },
                            dinner: { name: "Baked Salmon with Polenta & Asparagus", cal: 600, pro: "44g", desc: "180g salmon fillet over creamy corn polenta and grilled lemon asparagus." }
                        },
                        2: {
                            breakfast: { name: "Oatmeal with Almond Butter & Strawberries", cal: 480, pro: "28g", desc: "Rolled oats with 1 tbsp almond butter, scoop of vanilla whey, and fresh strawberries." },
                            lunch: { name: "Turkey Meatballs in San Marzano Marinara", cal: 640, pro: "48g", desc: "180g lean turkey meatballs over whole wheat linguine with authentic tomato basil sauce." },
                            snack: { name: "Apple & Pecan Halves", cal: 280, pro: "10g", desc: "1 crisp apple with 20g raw pecan halves." },
                            dinner: { name: "Seared Cod with Lemon Caper Couscous", cal: 580, pro: "46g", desc: "220g Atlantic cod fillet with whole grain couscous and roasted green beans." }
                        },
                        3: {
                            breakfast: { name: "Scrambled Eggs with Prosciutto & Arugula", cal: 490, pro: "36g", desc: "3 eggs, 2 slices prosciutto, wild arugula, and 1 slice multigrain toast." },
                            lunch: { name: "Tuna & White Bean Salad with Crusty Bread", cal: 630, pro: "48g", desc: "Albacore tuna, cannellini beans, red onion, parsley, and extra virgin olive oil." },
                            snack: { name: "Part-Skim Mozzarella & Cherry Tomatoes", cal: 260, pro: "18g", desc: "Fresh mozzarella bocconcini with sweet cherry tomatoes and fresh basil." },
                            dinner: { name: "Grilled Chicken with Roasted Ratatouille", cal: 590, pro: "48g", desc: "190g chicken breast served with roasted eggplant, zucchini, bell peppers, and rice." }
                        },
                        4: {
                            breakfast: { name: "Chia Seed Pudding with Peaches", cal: 460, pro: "26g", desc: "Chia seeds in almond milk with sliced fresh yellow peaches and raw almonds." },
                            lunch: { name: "Mediterranean Turkey Burger on Ciabatta", cal: 650, pro: "48g", desc: "Lean turkey patty with feta, roasted red peppers, and spinach on whole grain ciabatta." },
                            snack: { name: "Pistachios & Dark Chocolate", cal: 280, pro: "12g", desc: "25g roasted pistachios and 1 square dark chocolate." },
                            dinner: { name: "Pan-Seared Sea Bass with Roasted Fennel", cal: 580, pro: "44g", desc: "200g sea bass with caramelized roasted fennel and baby yellow potatoes." }
                        },
                        5: {
                            breakfast: { name: "Buckwheat Pancakes with Blueberry Compote", cal: 480, pro: "28g", desc: "Warm buckwheat pancakes with warm blueberries and 2 scrambled eggs." },
                            lunch: { name: "Quinoa Salad with Grilled Calamari", cal: 630, pro: "46g", desc: "Tender calamari over tri-color quinoa, kalamata olives, and fresh lemon dressing." },
                            snack: { name: "Greek Yogurt with Cinnamon & Honey", cal: 270, pro: "24g", desc: "200g Greek yogurt with pure Ceylon cinnamon and raw honey." },
                            dinner: { name: "Roast Pork Tenderloin with Rosemary Potatoes", cal: 590, pro: "46g", desc: "180g tenderloin medallions with roasted rosemary potatoes and green beans." }
                        },
                        6: {
                            breakfast: { name: "Avocado & Egg Toast with Red Pepper Flakes", cal: 470, pro: "26g", desc: "Creamy avocado mash on artisan bread with 2 sunny eggs and crushed pepper." },
                            lunch: { name: "Grilled Chicken Souvlaki with Brown Rice", cal: 650, pro: "50g", desc: "Chicken skewers, 1.5 cups brown rice, diced cucumber tomato salad, and tzatziki." },
                            snack: { name: "Roasted Almonds & Dried Figs", cal: 290, pro: "12g", desc: "25g raw almonds and 3 sweet dried Adriatic figs." },
                            dinner: { name: "Baked Salmon Fillet with Herbed Couscous", cal: 600, pro: "46g", desc: "180g salmon baked with fresh dill, served with couscous and roasted broccoli." }
                        },
                        7: {
                            breakfast: { name: "Sunday Shakshuka with Multigrain Bread", cal: 490, pro: "32g", desc: "3 poached eggs in rich tomato pepper sauce with crusty multigrain bread." },
                            lunch: { name: "Roast Turkey Breast & Roasted Vegetables", cal: 640, pro: "52g", desc: "200g sliced roast turkey with roasted carrots, parsnips, and quinoa." },
                            snack: { name: "Cottage Cheese with Berries", cal: 260, pro: "24g", desc: "180g cottage cheese with fresh blackberries." },
                            dinner: { name: "Baked Halibut with Lemon Herb Dressing", cal: 580, pro: "46g", desc: "210g halibut fillet with steamed green beans and sweet potato." }
                        }
                    }
                },
                {
                    label: "Plan C: High-Antioxidant Longevity",
                    badge: "CELLULAR HEALTH",
                    calories: 2150,
                    proteinPct: 25,
                    carbsPct: 48,
                    fatsPct: 27,
                    proteinGrams: 134,
                    carbsGrams: 258,
                    fatsGrams: 64,
                    days: {
                        1: {
                            breakfast: { name: "Pomegranate Blueberry Oatmeal with Walnuts", cal: 490, pro: "24g", desc: "Oats with ruby pomegranate seeds, wild blueberries, walnuts, and 2 boiled eggs." },
                            lunch: { name: "Wild Salmon Niçoise Salad with Olive Oil", cal: 650, pro: "44g", desc: "180g wild salmon, boiled baby potatoes, green beans, olives, and extra virgin olive oil." },
                            snack: { name: "Dark Chocolate & Raw Almonds", cal: 300, pro: "12g", desc: "20g 85% dark chocolate and 20g raw almonds." },
                            dinner: { name: "Lentil Vegetable Soup with Sourdough", cal: 600, pro: "38g", desc: "Slow-simmered antioxidant-rich green lentil stew with carrots and crusty bread." }
                        },
                        2: {
                            breakfast: { name: "Greek Yogurt Bowl with Figs & Chia", cal: 480, pro: "30g", desc: "Greek yogurt, fresh sliced figs, chia seeds, and raw honey." },
                            lunch: { name: "Grilled Chicken & Tabbouleh Bowl", cal: 660, pro: "48g", desc: "180g chicken breast over bulgur wheat tabbouleh with generous parsley and mint." },
                            snack: { name: "Hummus & Carrot Sticks", cal: 270, pro: "12g", desc: "4 tbsp garlic hummus with sweet baby carrot sticks." },
                            dinner: { name: "Seared Sea Bass with Roasted Beets & Greens", cal: 610, pro: "42g", desc: "200g sea bass fillet with sweet roasted beet wedges and steamed spinach." }
                        },
                        3: {
                            breakfast: { name: "Poached Eggs on Spinach with Multigrain", cal: 470, pro: "28g", desc: "2 poached eggs over generous sautéed baby spinach and 2 slices multigrain toast." },
                            lunch: { name: "Farro & Chickpea Mediterranean Bowl", cal: 650, pro: "36g", desc: "1.5 cups farro, roasted spiced chickpeas, kalamata olives, and olive oil dressing." },
                            snack: { name: "Walnuts & Green Tea", cal: 280, pro: "10g", desc: "30g raw walnut halves with hot Japanese green tea." },
                            dinner: { name: "Herb Roast Cod with Sweet Potatoes & Peas", cal: 600, pro: "44g", desc: "220g cod fillet, roasted sweet potato wedges, and sweet green peas." }
                        },
                        4: {
                            breakfast: { name: "Berry Smoothie Bowl with Hemp & Flax", cal: 480, pro: "26g", desc: "Blueberries, blackberries, acai, hemp seeds, and flaxseed meal." },
                            lunch: { name: "Turkey Breast Wrap with Avocado & Greens", cal: 640, pro: "46g", desc: "Sliced turkey breast, avocado, baby spinach, and mustard in whole wheat tortilla." },
                            snack: { name: "Greek Yogurt with Fresh Strawberries", cal: 260, pro: "22g", desc: "180g Greek yogurt with fresh ripe strawberries." },
                            dinner: { name: "Baked Halibut with Mediterranean Ratatouille", cal: 610, pro: "44g", desc: "210g halibut fillet over slow-roasted eggplant, zucchini, and peppers." }
                        },
                        5: {
                            breakfast: { name: "Avocado & Smoked Salmon Rye Toast", cal: 490, pro: "30g", desc: "Mashed avocado, 80g wild smoked salmon, and capers on toasted artisan rye." },
                            lunch: { name: "Grilled Shrimp & Brown Rice Pilaf", cal: 660, pro: "46g", desc: "220g jumbo shrimp, brown rice with dried cranberries, and steamed broccoli." },
                            snack: { name: "Roasted Pumpkin Seeds & Apple", cal: 290, pro: "14g", desc: "25g pumpkin seeds with 1 fresh green apple." },
                            dinner: { name: "Chicken Cacciatore with Whole Wheat Pasta", cal: 600, pro: "46g", desc: "180g chicken breast simmered with bell peppers, mushrooms, and tomatoes." }
                        },
                        6: {
                            breakfast: { name: "Apple Walnut Oatmeal with Cinnamon", cal: 480, pro: "22g", desc: "Rolled oats, grated apple, walnuts, cinnamon, and 2 boiled eggs." },
                            lunch: { name: "Mediterranean Tuna Salad with White Beans", cal: 650, pro: "46g", desc: "Tuna, cannellini beans, red onion, parsley, and olive oil." },
                            snack: { name: "Trail Mix with Dark Chocolate Drops", cal: 300, pro: "12g", desc: "Almonds, cashews, raisins, and dark chocolate chips." },
                            dinner: { name: "Baked Salmon with Lemon Herb Quinoa", cal: 610, pro: "44g", desc: "180g salmon fillet, 1 cup cooked quinoa, and grilled asparagus." }
                        },
                        7: {
                            breakfast: { name: "Sunday Shakshuka with Feta & Bread", cal: 490, pro: "32g", desc: "3 eggs poached in spiced tomato sauce with feta and sourdough bread." },
                            lunch: { name: "Roast Turkey with Sweet Potato & Green Beans", cal: 650, pro: "50g", desc: "200g roast turkey, sweet potato cubes, and garlic green beans." },
                            snack: { name: "Greek Yogurt with Honey & Berries", cal: 270, pro: "24g", desc: "200g Greek yogurt with blueberries and honey." },
                            dinner: { name: "Herb Roasted Sea Bream with Baby Potatoes", cal: 610, pro: "44g", desc: "210g sea bream with roasted baby potatoes and zucchini." }
                        }
                    }
                }
            ]
        },
        'quick-prep': {
            name: "15-Minute Athlete Quick-Prep",
            variations: [
                {
                    label: "Plan A: Express 10-Min Muscle Fuel",
                    badge: "UNDER 15 MINS",
                    calories: 2150,
                    proteinPct: 35,
                    carbsPct: 40,
                    fatsPct: 25,
                    proteinGrams: 188,
                    carbsGrams: 215,
                    fatsGrams: 60,
                    days: {
                        1: {
                            breakfast: { name: "5-Min High-Protein Microwave Oats", cal: 480, pro: "38g", desc: "70g quick oats + 1 scoop whey + 1 cup milk microwaved 90 seconds, topped with banana & peanut butter." },
                            lunch: { name: "Rotisserie Chicken & Microwave Jasmine Rice", cal: 640, pro: "52g", desc: "180g pre-shredded rotisserie chicken breast, ready-to-heat jasmine rice pouch, and steamed microwave broccoli." },
                            snack: { name: "Canned Tuna & Avocado Wrap", cal: 320, pro: "34g", desc: "1 can albacore tuna mixed with 1/3 mashed avocado rolled into a whole wheat tortilla (prep: 3 mins)." },
                            dinner: { name: "Air-Fryer Salmon Fillet & Sweet Potato", cal: 590, pro: "48g", desc: "Salmon fillet seasoned with lemon pepper cooked 10 mins in air fryer, with pre-cooked sweet potato." }
                        },
                        2: {
                            breakfast: { name: "Greek Yogurt Berry Parfait (3 Mins)", cal: 460, pro: "40g", desc: "250g 0% Greek yogurt layered with 40g granola, frozen berries, and a scoop of whey." },
                            lunch: { name: "Deli Turkey & Provolone Flatbread (5 Mins)", cal: 630, pro: "48g", desc: "180g lean sliced turkey, 2 slices provolone, mustard, and spinach in a toasted flatbread." },
                            snack: { name: "Ready Protein Shake & Banana", cal: 290, pro: "30g", desc: "RTD protein shake with 1 large ripe banana." },
                            dinner: { name: "Air-Fryer Lean Beef Burger (No Prep)", cal: 620, pro: "50g", desc: "Pre-formed lean beef patty air-fried 9 mins, served with baked potato and mixed greens." }
                        },
                        3: {
                            breakfast: { name: "Microwave Scrambled Eggs on Toast (4 Mins)", cal: 480, pro: "36g", desc: "3 eggs whisked with splash of milk microwaved 2 mins, served on 2 slices toasted seeded bread." },
                            lunch: { name: "Canned Salmon & Quinoa Salad Bowl (5 Mins)", cal: 620, pro: "46g", desc: "Can of wild red salmon tossed with microwave quinoa pouch, cherry tomatoes, and olive oil." },
                            snack: { name: "Cottage Cheese & Rice Cakes", cal: 280, pro: "26g", desc: "200g cottage cheese with 2 brown rice cakes and cinnamon." },
                            dinner: { name: "Rotisserie Chicken Quesadilla (8 Mins)", cal: 610, pro: "48g", desc: "Shredded chicken and reduced-fat cheddar toasted in a skillet inside a whole wheat tortilla." }
                        },
                        4: {
                            breakfast: { name: "Overnight Oats (Prepped Night Before)", cal: 500, pro: "38g", desc: "Grab-and-go jar of oats, chocolate whey, chia seeds, and almond milk with peanut butter." },
                            lunch: { name: "Air-Fryer Chicken Tenders & Rice Pouch", cal: 640, pro: "52g", desc: "Pre-seasoned chicken breast tenderloins air-fried 10 mins with steamed brown rice pouch." },
                            snack: { name: "Hard Boiled Eggs & Protein Bar", cal: 310, pro: "30g", desc: "2 pre-boiled eggs and 1 low-sugar protein bar." },
                            dinner: { name: "Quick 10-Min Shrimp Stir-Fry", cal: 580, pro: "46g", desc: "Frozen peeled shrimp sautéed 5 mins with frozen stir-fry vegetable blend and soy aminos." }
                        },
                        5: {
                            breakfast: { name: "Nut Butter Banana Protein Smoothie (2 Mins)", cal: 490, pro: "36g", desc: "Whey isolate, peanut butter, banana, oats, and ice blended together in 60 seconds." },
                            lunch: { name: "Roast Beef & Horseradish Wrap (5 Mins)", cal: 630, pro: "48g", desc: "180g deli roast beef, horseradish mustard, arugula, and Swiss cheese in a spinach wrap." },
                            snack: { name: "Edamame & Mixed Nuts", cal: 280, pro: "20g", desc: "Microwave steamer bag of edamame with 20g salted almonds." },
                            dinner: { name: "Sheet Pan Salmon & Asparagus (12 Mins)", cal: 600, pro: "46g", desc: "Salmon fillet and thin asparagus spears baked at 400°F for 12 minutes with lemon." }
                        },
                        6: {
                            breakfast: { name: "Instant Egg White & Cheddar Bagel (4 Mins)", cal: 480, pro: "34g", desc: "Liquid egg whites scrambled in microwave, assembled on toasted whole grain bagel with cheddar." },
                            lunch: { name: "Chipotle-Style Chicken Burrito Bowl (Prep: 5 Mins)", cal: 650, pro: "50g", desc: "Canned black beans, microwave cilantro rice, shredded rotisserie chicken, and salsa." },
                            snack: { name: "Greek Yogurt & Honey with Granola", cal: 290, pro: "26g", desc: "200g Greek yogurt with honey and 25g crunchy granola." },
                            dinner: { name: "Air-Fryer Pork Chops & Steamed Green Beans", cal: 600, pro: "48g", desc: "Lean pork chop cooked 11 mins in air fryer with microwave steamer green beans." }
                        },
                        7: {
                            breakfast: { name: "Sunday 10-Min French Toast", cal: 490, pro: "34g", desc: "Egg white dipped bread pan-toasted with whey protein syrup and sliced strawberries." },
                            lunch: { name: "Tuna Pasta Salad (Quick Cold Prep)", cal: 640, pro: "48g", desc: "Pre-cooked whole wheat pasta, canned albacore tuna, Greek yogurt mayo, and peas." },
                            snack: { name: "Beef Jerky & Apple Slices", cal: 280, pro: "24g", desc: "High-protein artisanal jerky with sliced Honeycrisp apple." },
                            dinner: { name: "10-Min Seared Cod with Microwave Rice", cal: 580, pro: "46g", desc: "Cod fillet pan-seared 3 mins per side, served over steamed basmati rice and lemon." }
                        }
                    }
                },
                {
                    label: "Plan B: Student & Busy Professional",
                    badge: "BUDGET & SPEED",
                    calories: 2000,
                    proteinPct: 32,
                    carbsPct: 43,
                    fatsPct: 25,
                    proteinGrams: 160,
                    carbsGrams: 215,
                    fatsGrams: 55,
                    days: {
                        1: {
                            breakfast: { name: "Microwave PB Protein Oatmeal", cal: 460, pro: "34g", desc: "Rolled oats, 1 scoop whey, 1 tbsp peanut butter, and sliced banana." },
                            lunch: { name: "Canned Tuna Rice Bowl with Soy Sauce", cal: 610, pro: "48g", desc: "1.5 cans tuna, microwave jasmine rice, sesame oil, and sriracha." },
                            snack: { name: "Greek Yogurt & Honey", cal: 270, pro: "24g", desc: "200g plain Greek yogurt with 1 tbsp raw honey." },
                            dinner: { name: "Rotisserie Chicken with Sweet Potato", cal: 580, pro: "48g", desc: "Shredded rotisserie breast, microwaved sweet potato, and frozen green beans." }
                        },
                        2: {
                            breakfast: { name: "3-Minute Whey Protein Shake & Bagel", cal: 480, pro: "36g", desc: "1 scoop whey in milk with toasted whole grain bagel." },
                            lunch: { name: "Egg Salad Wrap (2 Mins)", cal: 600, pro: "40g", desc: "Pre-boiled eggs mashed with light mayo inside a large tortilla." },
                            snack: { name: "Cottage Cheese & Peaches", cal: 260, pro: "24g", desc: "Low fat cottage cheese with sliced canned peaches in water." },
                            dinner: { name: "Air-Fryer Turkey Burgers with Salad", cal: 590, pro: "46g", desc: "Pre-made turkey patties air-fried 10 mins with bagged salad kit." }
                        },
                        3: {
                            breakfast: { name: "Overnight Oats with Chia", cal: 470, pro: "32g", desc: "Oats, protein powder, milk, and chia seeds chilled in fridge." },
                            lunch: { name: "Deli Turkey & Hummus Wrap", cal: 610, pro: "44g", desc: "Sliced turkey breast, hummus, cucumber in whole wheat wrap." },
                            snack: { name: "Hard Boiled Eggs & Crackers", cal: 270, pro: "18g", desc: "2 boiled eggs and multigrain crackers." },
                            dinner: { name: "Quick 10-Min Pan-Seared Salmon & Rice", cal: 600, pro: "46g", desc: "Salmon fillet pan-seared in 7 mins with microwave brown rice." }
                        },
                        4: {
                            breakfast: { name: "Scrambled Eggs in Microwave with Cheese", cal: 460, pro: "32g", desc: "3 eggs scrambled in mug with shredded cheddar and toast." },
                            lunch: { name: "Canned Chicken Burrito Bowl", cal: 620, pro: "48g", desc: "Canned chicken breast, canned black beans, salsa, and rice." },
                            snack: { name: "String Cheese & Banana", cal: 250, pro: "16g", desc: "2 string cheeses with 1 ripe banana." },
                            dinner: { name: "Air-Fryer Chicken Thighs with Frozen Broccoli", cal: 610, pro: "46g", desc: "2 chicken thighs air-fried 12 mins with steamed broccoli." }
                        },
                        5: {
                            breakfast: { name: "Protein Berry Smoothie", cal: 450, pro: "34g", desc: "Frozen berry blend, whey isolate, and almond milk blended." },
                            lunch: { name: "Roast Beef & Mustard Sandwich", cal: 620, pro: "46g", desc: "Deli roast beef, yellow mustard, lettuce on sourdough." },
                            snack: { name: "Greek Yogurt with Granola", cal: 270, pro: "24g", desc: "Greek yogurt with 20g crunchy granola." },
                            dinner: { name: "Tuna Melt on Whole Wheat (7 Mins)", cal: 590, pro: "46g", desc: "Canned tuna with melted cheddar on toasted bread with side salad." }
                        },
                        6: {
                            breakfast: { name: "Microwave Oats with Peanut Butter", cal: 470, pro: "32g", desc: "Oats cooked with peanut butter, protein powder, and milk." },
                            lunch: { name: "Rotisserie Chicken Quesadilla", cal: 620, pro: "48g", desc: "Chicken and cheese melted in tortilla on skillet in 5 mins." },
                            snack: { name: "Protein Bar & Apple", cal: 280, pro: "22g", desc: "1 high protein bar with green apple." },
                            dinner: { name: "Air-Fryer Cod Fillet with Potatoes", cal: 580, pro: "44g", desc: "Cod fillet air-fried 8 mins with pre-steamed baby potatoes." }
                        },
                        7: {
                            breakfast: { name: "Quick Sunday French Toast", cal: 480, pro: "30g", desc: "Egg dipped whole grain bread with syrup and 2 boiled eggs." },
                            lunch: { name: "Chicken & Quinoa Microwave Bowl", cal: 630, pro: "48g", desc: "Rotisserie chicken with quinoa pouch and salsa." },
                            snack: { name: "Cottage Cheese & Blueberries", cal: 260, pro: "24g", desc: "Cottage cheese with fresh blueberries." },
                            dinner: { name: "Air-Fryer Steak Bites & Rice", cal: 610, pro: "48g", desc: "Sirloin cubes air-fried 6 mins with jasmine rice." }
                        }
                    }
                },
                {
                    label: "Plan C: High-Metabolic Meal Prep",
                    badge: "BATCH PREP",
                    calories: 2200,
                    proteinPct: 35,
                    carbsPct: 40,
                    fatsPct: 25,
                    proteinGrams: 192,
                    carbsGrams: 220,
                    fatsGrams: 61,
                    days: {
                        1: {
                            breakfast: { name: "Meal-Prepped Egg Muffins & Oats", cal: 490, pro: "38g", desc: "2 pre-baked bacon egg muffins with quick oatmeal and berries." },
                            lunch: { name: "Batch Prepped Chicken, Rice & Green Beans", cal: 650, pro: "52g", desc: "190g meal-prepped grilled chicken breast, 1.5 cups jasmine rice, and green beans." },
                            snack: { name: "Whey Protein & Almonds", cal: 300, pro: "30g", desc: "1 scoop whey in water with 20g raw almonds." },
                            dinner: { name: "Batch Prepped Lean Beef Chili with Cheddar", cal: 620, pro: "50g", desc: "Extra lean ground beef and kidney bean chili with melted cheddar." }
                        },
                        2: {
                            breakfast: { name: "Overnight Protein Oats with Peanut Butter", cal: 500, pro: "38g", desc: "Batch prepped oats jar with chocolate protein and peanut butter." },
                            lunch: { name: "Meal-Prepped Ground Turkey & Sweet Potatoes", cal: 640, pro: "50g", desc: "180g lean turkey mince with roasted sweet potato cubes." },
                            snack: { name: "Greek Yogurt & Berries", cal: 280, pro: "26g", desc: "200g Greek yogurt with mixed frozen berries." },
                            dinner: { name: "Baked Salmon & Quinoa (Reheated 2 Mins)", cal: 610, pro: "46g", desc: "180g pre-baked salmon fillet with quinoa and broccoli." }
                        },
                        3: {
                            breakfast: { name: "Scrambled Eggs with Ham on English Muffin", cal: 480, pro: "36g", desc: "2 eggs + egg whites with lean ham on whole wheat English muffin." },
                            lunch: { name: "Batch Prepped Chicken Breast & Jasmine Rice", cal: 650, pro: "52g", desc: "Herb grilled chicken breast with seasoned jasmine rice." },
                            snack: { name: "Hard Boiled Eggs & Protein Shake", cal: 320, pro: "34g", desc: "2 boiled eggs with 1 scoop vanilla whey in water." },
                            dinner: { name: "Meal-Prepped Sirloin Steak & Asparagus", cal: 620, pro: "50g", desc: "Pre-sliced sirloin steak with roasted garlic asparagus." }
                        },
                        4: {
                            breakfast: { name: "Prepped Frittata Slice with Toast", cal: 490, pro: "36g", desc: "Slice of spinach mushroom frittata with 1 slice sourdough toast." },
                            lunch: { name: "Batch Chili with Brown Rice", cal: 660, pro: "52g", desc: "Lean beef chili served over brown rice with salsa." },
                            snack: { name: "Cottage Cheese & Pineapple", cal: 270, pro: "26g", desc: "Low-fat cottage cheese with sweet pineapple." },
                            dinner: { name: "Batch Prepped Herb Salmon & Sweet Potato", cal: 610, pro: "46g", desc: "Salmon fillet with baked sweet potato and broccoli." }
                        },
                        5: {
                            breakfast: { name: "Overnight Oats with Chia & Honey", cal: 490, pro: "36g", desc: "Oats soaked in milk with vanilla whey, chia seeds, and honey." },
                            lunch: { name: "Prepped Turkey Burger with Roasted Potatoes", cal: 640, pro: "48g", desc: "Turkey burger patty with roasted baby potato wedges." },
                            snack: { name: "Edamame & Beef Jerky", cal: 310, pro: "32g", desc: "Microwaved edamame pods with lean artisanal jerky." },
                            dinner: { name: "Grilled Chicken & Quinoa Medley", cal: 610, pro: "50g", desc: "Grilled chicken strips over quinoa and roasted zucchini." }
                        },
                        6: {
                            breakfast: { name: "Pre-Baked Egg Muffin & Sliced Banana", cal: 480, pro: "34g", desc: "2 egg and turkey bacon muffins with 1 ripe banana." },
                            lunch: { name: "Batch Prepped Shredded Beef & Rice Bowl", cal: 660, pro: "52g", desc: "Slow cooker shredded beef over jasmine rice and black beans." },
                            snack: { name: "Greek Yogurt & Walnuts", cal: 280, pro: "24g", desc: "Greek yogurt with crushed walnuts and cinnamon." },
                            dinner: { name: "Air-Fryer Salmon with Green Beans", cal: 610, pro: "46g", desc: "Salmon fillet cooked fresh in 10 mins with steamed green beans." }
                        },
                        7: {
                            breakfast: { name: "Sunday Protein Pancakes (Batch Prep for Week)", cal: 510, pro: "36g", desc: "Batch of protein pancakes made with oat flour and whey, topped with berries." },
                            lunch: { name: "Roast Turkey Breast with Brown Rice", cal: 650, pro: "52g", desc: "Sliced roasted turkey with brown rice and mixed vegetables." },
                            snack: { name: "Protein Bar & Apple", cal: 290, pro: "24g", desc: "High protein bar with crisp green apple." },
                            dinner: { name: "Lean Beef Meatballs & Pasta", cal: 620, pro: "50g", desc: "Prepped lean beef meatballs in marinara over whole wheat penne." }
                        }
                    }
                }
            ]
        },
        'asian-balanced': {
            name: "Indian & Asian Balanced Macro",
            variations: [
                {
                    label: "Plan A: High-Protein Desi Power",
                    badge: "INDIAN MACROS",
                    calories: 2150,
                    proteinPct: 32,
                    carbsPct: 45,
                    fatsPct: 23,
                    proteinGrams: 172,
                    carbsGrams: 242,
                    fatsGrams: 55,
                    days: {
                        1: {
                            breakfast: { name: "Masala Egg Bhurji & Multigrain Roti", cal: 480, pro: "36g", desc: "4 eggs (2 whole + 2 whites) scrambled with onions, tomatoes, green chilies, with 2 multigrain rotis." },
                            lunch: { name: "Tandoori Chicken Breast & Jeera Brown Rice", cal: 640, pro: "54g", desc: "200g tandoori marinated chicken breast, 1.5 cups jeera brown basmati rice, and cooling cucumber raita." },
                            snack: { name: "Roasted Masala Makhana & Whey Shake", cal: 300, pro: "30g", desc: "30g crispy spiced roasted foxnuts (makhana) with 1 scoop whey isolate." },
                            dinner: { name: "Yellow Moong Dal Tadka with Grilled Paneer", cal: 590, pro: "44g", desc: "1.5 cups protein-packed moong dal, 100g low-fat grilled paneer cubes, and 1 whole wheat phulka." }
                        },
                        2: {
                            breakfast: { name: "Paneer & Spinach Besan Chilla (2 Pieces)", cal: 470, pro: "34g", desc: "High-protein gram flour (besan) pancakes stuffed with grated low-fat paneer, spinach, and mint chutney." },
                            lunch: { name: "Chicken Tikka Curry (Light) & Brown Rice", cal: 650, pro: "52g", desc: "190g chicken tikka simmered in yogurt-tomato gravy, brown basmati rice, and onion salad." },
                            snack: { name: "Boiled Chana Chaat with Lemon", cal: 280, pro: "16g", desc: "Boiled black chickpeas tossed with chopped onions, tomatoes, chaat masala, and lemon." },
                            dinner: { name: "Egg Curry with 2 Whole Wheat Rotis", cal: 580, pro: "40g", desc: "3 boiled eggs simmered in spicy onion-tomato masala gravy, served with 2 warm rotis." }
                        },
                        3: {
                            breakfast: { name: "Moong Dal Dosa (Pesarattu) with Curd", cal: 480, pro: "30g", desc: "2 green gram crepes (pesarattu) filled with onions and ginger, served with 1 cup low-fat curd." },
                            lunch: { name: "Fish Tikka with Mint Raita & Quinoa Pulao", cal: 630, pro: "50g", desc: "200g white fish fillet marinated in ajwain and lemon, cooked over stove, with quinoa pulao." },
                            snack: { name: "Roasted Kala Chana & Spiced Buttermilk (Chaas)", cal: 260, pro: "20g", desc: "Crunchy roasted black chickpeas with a chilled glass of cumin mint chaas." },
                            dinner: { name: "Soya Chunks Curry with Whole Wheat Roti", cal: 600, pro: "48g", desc: "60g high-protein soya chunks cooked in hearty homestyle curry, served with 2 rotis." }
                        },
                        4: {
                            breakfast: { name: "Oats Upma with Boiled Eggs", cal: 470, pro: "32g", desc: "Savory vegetable rolled oats upma with mustard seeds, curry leaves, and 2 boiled eggs." },
                            lunch: { name: "Kadai Chicken with 2 Multigrain Rotis", cal: 640, pro: "52g", desc: "190g boneless chicken breast tossed with bell peppers and freshly ground kadai spices, with rotis." },
                            snack: { name: "Sprouted Moong Salad with Pomegranate", cal: 280, pro: "18g", desc: "Sprouted green moong beans tossed with lime, green chilies, and ruby pomegranate seeds." },
                            dinner: { name: "Palak Paneer with Brown Rice", cal: 590, pro: "42g", desc: "120g low-fat paneer in garlic spinach gravy, served with 1 cup brown basmati rice." }
                        },
                        5: {
                            breakfast: { name: "Paneer Paratha (Oil-Free Tawa) & Curd", cal: 490, pro: "34g", desc: "1 large whole wheat paratha stuffed with 100g spiced paneer, served with 150g probiotic curd." },
                            lunch: { name: "Hyderabadi Chicken Biryani (Low-Oil) & Raita", cal: 660, pro: "50g", desc: "180g lean chicken breast dum-cooked with long grain basmati rice, saffron, and cucumber raita." },
                            snack: { name: "Masala Whey Shake with Cardamom", cal: 270, pro: "30g", desc: "1 scoop vanilla whey blended with crushed cardamom, almond milk, and ice." },
                            dinner: { name: "Rajma Masala (Red Kidney Beans) & Brown Rice", cal: 600, pro: "38g", desc: "Traditional slow-cooked Punjabi rajma in rich ginger-tomato gravy with brown rice." }
                        },
                        6: {
                            breakfast: { name: "Boiled Egg Sandwich with Mint Chutney", cal: 480, pro: "34g", desc: "3 sliced hard-boiled eggs with spicy coriander mint chutney on 2 slices multigrain bread." },
                            lunch: { name: "Grilled Salmon in Bengali Mustard Sauce (Shorshe)", cal: 650, pro: "48g", desc: "180g Atlantic salmon cooked in zesty mustard and green chili sauce, served with steamed rice." },
                            snack: { name: "Roasted Peanuts & Chaas", cal: 290, pro: "16g", desc: "30g unsalted roasted peanuts with a large glass of chilled salted chaas." },
                            dinner: { name: "Chicken Keema Matar with Phulkas", cal: 610, pro: "50g", desc: "180g minced chicken breast cooked with sweet green peas and garam masala, with 2 phulkas." }
                        },
                        7: {
                            breakfast: { name: "Sunday Masala Omelet Pav / Toast", cal: 490, pro: "36g", desc: "3-egg masala omelet with onions, tomatoes, and cilantro, served with 2 toasted multigrain pavs." },
                            lunch: { name: "Mutton Sukka (Lean) with Dal & Rice", cal: 670, pro: "52g", desc: "160g lean goat meat dry-roasted with southern spices, served with comforting yellow dal and rice." },
                            snack: { name: "Paneer Cubes with Chaat Masala", cal: 280, pro: "22g", desc: "100g fresh paneer cubes tossed with chaat masala and lemon juice." },
                            dinner: { name: "Dal Makhani (Light Yogurt Based) & Rotis", cal: 590, pro: "40g", desc: "Black urad dal slow simmered without heavy butter, served with 2 whole wheat rotis." }
                        }
                    }
                },
                {
                    label: "Plan B: Asian Wok & Clean Protein",
                    badge: "ASIAN WOK FUSION",
                    calories: 2100,
                    proteinPct: 34,
                    carbsPct: 42,
                    fatsPct: 24,
                    proteinGrams: 178,
                    carbsGrams: 220,
                    fatsGrams: 56,
                    days: {
                        1: {
                            breakfast: { name: "Asian Egg Scramble with Green Scallions", cal: 470, pro: "34g", desc: "3 eggs scrambled with sesame oil, scallions, tamari, and 2 slices toasted sesame bread." },
                            lunch: { name: "Teriyaki Chicken Breast & Jasmine Rice", cal: 640, pro: "52g", desc: "190g chicken breast glazed with low-sugar teriyaki, steamed jasmine rice, and broccoli." },
                            snack: { name: "Steamed Edamame & Green Tea", cal: 260, pro: "22g", desc: "1.5 cups edamame in pods with sea salt and hot jasmine tea." },
                            dinner: { name: "Vietnamese Lemongrass Beef Bowl (Bun Bo)", cal: 600, pro: "48g", desc: "180g lean beef strips marinated in lemongrass over thin rice noodles with herbs and bean sprouts." }
                        },
                        2: {
                            breakfast: { name: "Savory Tofu & Mushroom Congee", cal: 460, pro: "28g", desc: "Silky rice porridge cooked with ginger, topped with 150g seasoned tofu cubes and green onions." },
                            lunch: { name: "Thai Basil Chicken (Pad Krapow) with Rice", cal: 650, pro: "52g", desc: "190g minced chicken breast stir-fried with holy basil, garlic, chilies, jasmine rice, and 1 fried egg." },
                            snack: { name: "Whey Protein Matcha Shake", cal: 270, pro: "28g", desc: "1 scoop vanilla whey whisked into pure Japanese ceremonial matcha and almond milk." },
                            dinner: { name: "Steamed Ginger Soy White Fish & Bok Choy", cal: 580, pro: "46g", desc: "220g cod fillet steamed with fresh ginger, scallions, light soy, and tender baby bok choy." }
                        },
                        3: {
                            breakfast: { name: "Korean Egg Toast with Cabbage & Turkey", cal: 480, pro: "34g", desc: "Shredded cabbage and egg patty with sliced turkey breast inside toasted brioche." },
                            lunch: { name: "Korean Beef Bulgogi Bowl with Kimchi", cal: 660, pro: "50g", desc: "180g lean beef flank marinated in pear soy marinade, steamed rice, and spicy probiotic kimchi." },
                            snack: { name: "Seaweed Snacks & Boiled Eggs", cal: 250, pro: "16g", desc: "2 packages roasted nori seaweed sheets with 2 hard-boiled eggs." },
                            dinner: { name: "Chicken Pho Noodle Soup with Herbs", cal: 590, pro: "48g", desc: "Aromatic star anise broth with 180g chicken breast, rice noodles, basil, and lime." }
                        },
                        4: {
                            breakfast: { name: "Chinese Steamed Egg Custard with Shrimp", cal: 450, pro: "32g", desc: "Silky steamed eggs topped with tender baby shrimp, scallions, and a dash of sesame oil." },
                            lunch: { name: "Kung Pao Chicken (Light Peanuts) & Rice", cal: 640, pro: "50g", desc: "190g chicken breast with dry red peppers, zucchini, celery, and steamed jasmine rice." },
                            snack: { name: "Edamame & Rice Crackers", cal: 270, pro: "18g", desc: "Steamed edamame with savory Japanese nori rice crackers." },
                            dinner: { name: "Miso Glazed Salmon with Soba Noodles", cal: 610, pro: "46g", desc: "180g Atlantic salmon baked with sweet miso glaze over chilled buckwheat soba noodles." }
                        },
                        5: {
                            breakfast: { name: "Scrambled Eggs with Kimchi & Toast", cal: 470, pro: "32g", desc: "3 eggs scrambled with spicy fermented kimchi, melted cheddar, and sourdough toast." },
                            lunch: { name: "Singapore Style Chicken Rice (Steamed)", cal: 650, pro: "52g", desc: "200g poached chicken breast over fragrant chicken broth rice with chili ginger sauce." },
                            snack: { name: "Whey Shake with Coconut Water", cal: 260, pro: "26g", desc: "1 scoop unflavored or vanilla whey mixed into chilled fresh coconut water." },
                            dinner: { name: "Stir-Fried Prawns with Snow Peas & Garlic", cal: 580, pro: "46g", desc: "220g jumbo prawns stir-fried in a hot wok with crisp snow peas and brown rice." }
                        },
                        6: {
                            breakfast: { name: "Tamagoyaki (Japanese Rolled Omelet)", cal: 460, pro: "30g", desc: "3-egg dashi rolled omelet served with 1 cup steamed rice and a cup of miso soup." },
                            lunch: { name: "Chicken Katsu (Baked, Panko Crusted) & Rice", cal: 660, pro: "50g", desc: "190g lean chicken breast baked extra crispy with panko breadcrumbs, tonkatsu sauce, and rice." },
                            snack: { name: "Roasted Edamame & Roasted Seaweed", cal: 270, pro: "22g", desc: "Crunchy wasabi roasted edamame beans and nori snacks." },
                            dinner: { name: "Beef & Broccoli Stir Fry with Jasmine Rice", cal: 610, pro: "48g", desc: "180g flank steak strips with broccoli florets in savory oyster garlic sauce." }
                        },
                        7: {
                            breakfast: { name: "Sunday Dim Sum Style Egg & Shrimp Dumplings", cal: 480, pro: "34g", desc: "Steamed shrimp & chive dumplings with 2 boiled eggs and hot jasmine tea." },
                            lunch: { name: "Chicken Yakitori Skewers with Brown Rice", cal: 650, pro: "52g", desc: "Grilled chicken thigh skewers with scallions, tare glaze, and steamed brown rice." },
                            snack: { name: "Greek Yogurt with Mango Cubes", cal: 270, pro: "24g", desc: "200g Greek yogurt with sweet ripe Alphonso mango cubes." },
                            dinner: { name: "Red Curry White Fish with Bamboo Shoots", cal: 600, pro: "46g", desc: "210g cod fillet simmered in light coconut red curry with bell peppers and jasmine rice." }
                        }
                    }
                },
                {
                    label: "Plan C: Vegetarian Soya & Paneer Focus",
                    badge: "VEG PROTEIN",
                    calories: 2150,
                    proteinPct: 30,
                    carbsPct: 46,
                    fatsPct: 24,
                    proteinGrams: 161,
                    carbsGrams: 247,
                    fatsGrams: 57,
                    days: {
                        1: {
                            breakfast: { name: "Besan Chilla with Paneer Stuffing", cal: 470, pro: "32g", desc: "2 gram flour pancakes stuffed with 80g grated paneer, onions, and green chutney." },
                            lunch: { name: "Soya Chunks Matar Pulao with Raita", cal: 650, pro: "48g", desc: "60g high-protein soya chunks cooked with basmati rice, green peas, and cooling cucumber curd." },
                            snack: { name: "Roasted Makhana & Chaas", cal: 270, pro: "14g", desc: "Spiced roasted foxnuts with a tall glass of spiced buttermilk." },
                            dinner: { name: "Tofu Tikka Masala with 2 Whole Wheat Rotis", cal: 600, pro: "42g", desc: "200g marinated baked tofu in rich tomato gravy, served with 2 warm phulkas." }
                        },
                        2: {
                            breakfast: { name: "Paneer Bhurji on Toast", cal: 480, pro: "34g", desc: "140g crumbled fresh paneer sautéed with onions and tomatoes, on 2 slices multigrain toast." },
                            lunch: { name: "Panchmel Dal (5 Lentil Blend) with Rice", cal: 640, pro: "40g", desc: "A blend of 5 nutritious Indian lentils with ginger tadka, served with brown rice." },
                            snack: { name: "Sprouted Moong Salad", cal: 280, pro: "18g", desc: "Sprouted moong beans with lime juice, chaat masala, and cucumber." },
                            dinner: { name: "Palak Soya Curry with 2 Rotis", cal: 590, pro: "46g", desc: "Soya chunks cooked in smooth spinach gravy, served with 2 whole wheat rotis." }
                        },
                        3: {
                            breakfast: { name: "Moong Dal Idli with Sambar & Coconut Chutney", cal: 470, pro: "28g", desc: "3 steamed green gram idlis with lentil vegetable sambar and fresh coconut chutney." },
                            lunch: { name: "Paneer Biryani with Raita", cal: 660, pro: "44g", desc: "150g grilled paneer cubes dum-cooked with aromatic spices and basmati rice." },
                            snack: { name: "Roasted Kala Chana", cal: 270, pro: "18g", desc: "Crispy roasted black chickpeas with rock salt." },
                            dinner: { name: "Rajma (Red Kidney Beans) with Jeera Rice", cal: 600, pro: "38g", desc: "Slow cooked kidney beans in thick Punjabi gravy with cumin rice." }
                        },
                        4: {
                            breakfast: { name: "Oats & Paneer Cheela", cal: 480, pro: "32g", desc: "Oat and chickpea flour savory crepe stuffed with low fat paneer and cilantro." },
                            lunch: { name: "Soya Keema with Multigrain Pav", cal: 640, pro: "48g", desc: "Granulated soya chunks cooked like spicy keema, served with 2 toasted multigrain pavs." },
                            snack: { name: "Whey Protein Shake with Cardamom", cal: 270, pro: "28g", desc: "Whey isolate shaken with cold milk and ground green cardamom." },
                            dinner: { name: "Lauki Chana Dal with 2 Rotis", cal: 590, pro: "36g", desc: "Chana dal cooked with bottle gourd and ginger, served with 2 rotis." }
                        },
                        5: {
                            breakfast: { name: "Spicy Tofu Scramble with Roti", cal: 470, pro: "32g", desc: "200g tofu scrambled with turmeric, cumin, tomatoes, and 2 rotis." },
                            lunch: { name: "Chole (Chickpea Curry) with Brown Rice", cal: 650, pro: "40g", desc: "Pindi chole cooked with tea-infused dark spices, served with brown basmati rice." },
                            snack: { name: "Paneer Cubes with Chaat Masala", cal: 280, pro: "22g", desc: "100g fresh paneer cubes sprinkled with chaat masala." },
                            dinner: { name: "Methi Paneer with Phulkas", cal: 600, pro: "42g", desc: "Paneer cubes cooked with fresh fenugreek leaves and mild spices, with 2 phulkas." }
                        },
                        6: {
                            breakfast: { name: "Sambar Vada (Air-Fried) & Curd", cal: 480, pro: "26g", desc: "2 air-fried lentil medu vadas dipped in hot sambar with 1 cup fresh curd." },
                            lunch: { name: "Soya & Vegetable Pulao with Boondi Raita", cal: 650, pro: "46g", desc: "Basmati rice cooked with soya chunks, carrots, beans, and boondi raita." },
                            snack: { name: "Roasted Peanuts with Chaat Masala", cal: 290, pro: "14g", desc: "Unsalted roasted peanuts with lemon and spices." },
                            dinner: { name: "Black Urad Dal Tadka with 2 Rotis", cal: 600, pro: "38g", desc: "Hearty black gram dal with garlic tadka, served with 2 phulkas." }
                        },
                        7: {
                            breakfast: { name: "Sunday Paneer Paratha & Curd", cal: 490, pro: "34g", desc: "Whole wheat paratha stuffed with spicy paneer, served with bowl of probiotic curd." },
                            lunch: { name: "Kadhi Pakora with Steamed Rice", cal: 650, pro: "36g", desc: "Gram flour yogurt kadhi with fenugreek pakoras over steamed basmati rice." },
                            snack: { name: "Spiced Buttermilk & Roasted Makhana", cal: 270, pro: "14g", desc: "Cold spiced chaas with crunchy roasted makhana." },
                            dinner: { name: "Paneer Tikka with Yellow Moong Dal & Roti", cal: 610, pro: "44g", desc: "120g grilled paneer tikka with comforting moong dal and 1 roti." }
                        }
                    }
                }
            ]
        }
    };

    // Initialize Macro Donut Chart
    function initMacroChart() {
        const ctx = document.getElementById('macroDonutChart');
        if (!ctx) return;

        macroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein (35%)', 'Carbohydrates (40%)', 'Fats (25%)'],
                datasets: [{
                    data: [35, 40, 25],
                    backgroundColor: ['#06b6d4', '#f59e0b', '#f43f5e'],
                    borderWidth: 2,
                    borderColor: 'rgba(15, 23, 42, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Update Macro Chart Data
    function updateMacroChart(pro, carbs, fats) {
        if (!macroChart) return;
        macroChart.data.labels = [`Protein (${pro}%)`, `Carbs (${carbs}%)`, `Fats (${fats}%)`];
        macroChart.data.datasets[0].data = [pro, carbs, fats];
        macroChart.update();

        const pEl = document.getElementById('chartProteinPct');
        const cEl = document.getElementById('chartCarbsPct');
        const fEl = document.getElementById('chartFatsPct');
        if (pEl) pEl.textContent = `${pro}%`;
        if (cEl) cEl.textContent = `${carbs}%`;
        if (fEl) fEl.textContent = `${fats}%`;
    }

    // Get Active Variation Data
    function getActiveVariation() {
        const style = DIET_BLUEPRINTS[activeDietStyle] || DIET_BLUEPRINTS['high-protein'];
        const variation = style.variations[activeVariationIndex] || style.variations[0];
        return { style, variation };
    }

    // Render Meals on Right Panel
    function renderCurrentMealPlan() {
        const { style, variation } = getActiveVariation();
        const dayMeals = variation.days[activeDay] || variation.days[1];

        // Update titles and badge
        const planTitle = document.getElementById('currentPlanTitle');
        const planSubtitle = document.getElementById('currentPlanSubtitle');
        const chartBadge = document.getElementById('chartPlanBadge');

        const dayNames = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };
        const dayName = dayNames[activeDay] || `Day ${activeDay}`;

        if (planTitle) {
            planTitle.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles me-2 text-warning"></i>${variation.label} &bull; ${dayName}`;
        }
        if (planSubtitle) {
            planSubtitle.textContent = `${style.name} • ~${variation.calories} kcal • ${variation.proteinGrams}g Protein • ${variation.carbsGrams}g Carbs • ${variation.fatsGrams}g Fats`;
        }
        if (chartBadge) {
            chartBadge.textContent = variation.badge || `Variation ${activeVariationIndex + 1}`;
        }

        // Update Top Metric Cards
        const calTarget = document.getElementById('nutriCalorieTarget');
        const proTarget = document.getElementById('nutriProteinTarget');
        const carbsFats = document.getElementById('nutriCarbsFats');

        if (calTarget) calTarget.innerHTML = `${variation.calories.toLocaleString()} <span class="fs-6 text-secondary">kcal</span>`;
        if (proTarget) proTarget.textContent = `${variation.proteinGrams}g`;
        if (carbsFats) carbsFats.textContent = `${variation.carbsGrams}g / ${variation.fatsGrams}g`;

        // Update Donut Chart
        updateMacroChart(variation.proteinPct, variation.carbsPct, variation.fatsPct);

        // Render 4 Meals (Breakfast, Lunch, Snack, Dinner)
        const container = document.getElementById('mealsContainer');
        if (!container) return;

        container.innerHTML = `
            <!-- Breakfast -->
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100 shadow-sm" style="border-color: var(--border-glass) !important; background: rgba(16,185,129,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-success-subtle text-success fw-bold">BREAKFAST &bull; ~${dayMeals.breakfast.cal} kcal</span>
                        <span class="small text-info fw-bold">${dayMeals.breakfast.pro} Protein</span>
                    </div>
                    <div class="fw-bold fs-6 text-white">${dayMeals.breakfast.name}</div>
                    <div class="small text-secondary mt-1" style="line-height: 1.45;">${dayMeals.breakfast.desc}</div>
                </div>
            </div>

            <!-- Lunch -->
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100 shadow-sm" style="border-color: var(--border-glass) !important; background: rgba(6,182,212,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-info-subtle text-info fw-bold">LUNCH &bull; ~${dayMeals.lunch.cal} kcal</span>
                        <span class="small text-info fw-bold">${dayMeals.lunch.pro} Protein</span>
                    </div>
                    <div class="fw-bold fs-6 text-white">${dayMeals.lunch.name}</div>
                    <div class="small text-secondary mt-1" style="line-height: 1.45;">${dayMeals.lunch.desc}</div>
                </div>
            </div>

            <!-- Snack -->
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100 shadow-sm" style="border-color: var(--border-glass) !important; background: rgba(245,158,11,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-warning-subtle text-warning fw-bold">POWER SNACK &bull; ~${dayMeals.snack.cal} kcal</span>
                        <span class="small text-info fw-bold">${dayMeals.snack.pro} Protein</span>
                    </div>
                    <div class="fw-bold fs-6 text-white">${dayMeals.snack.name}</div>
                    <div class="small text-secondary mt-1" style="line-height: 1.45;">${dayMeals.snack.desc}</div>
                </div>
            </div>

            <!-- Dinner -->
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100 shadow-sm" style="border-color: var(--border-glass) !important; background: rgba(99,102,241,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-primary-subtle text-primary fw-bold">DINNER &bull; ~${dayMeals.dinner.cal} kcal</span>
                        <span class="small text-info fw-bold">${dayMeals.dinner.pro} Protein</span>
                    </div>
                    <div class="fw-bold fs-6 text-white">${dayMeals.dinner.name}</div>
                    <div class="small text-secondary mt-1" style="line-height: 1.45;">${dayMeals.dinner.desc}</div>
                </div>
            </div>
        `;
    }

    // Render Side-by-Side Comparison of all 3 variations for the current style & day
    function renderSideBySideComparison() {
        const row = document.getElementById('sideBySideCompareRow');
        if (!row) return;

        const style = DIET_BLUEPRINTS[activeDietStyle] || DIET_BLUEPRINTS['high-protein'];
        const dayNames = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };
        const dayName = dayNames[activeDay] || `Day ${activeDay}`;

        row.innerHTML = style.variations.map((v, idx) => {
            const meals = v.days[activeDay] || v.days[1];
            const isSelected = (idx === activeVariationIndex);
            const borderStyle = isSelected ? 'border: 2px solid var(--accent-cyan) !important;' : 'border-color: var(--border-glass) !important;';

            return `
                <div class="col-lg-4">
                    <div class="glass-card p-4 h-100 position-relative" style="${borderStyle}">
                        ${isSelected ? '<span class="badge bg-info text-dark position-absolute top-0 end-0 m-3"><i class="fa-solid fa-check me-1"></i>Active Selection</span>' : ''}
                        
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge-soft-emerald">${v.badge}</span>
                            <span class="small text-secondary">${dayName}</span>
                        </div>
                        <h5 class="fw-bold mb-1">${v.label}</h5>
                        <div class="fs-4 fw-bold font-mono-metric text-danger mb-2">${v.calories.toLocaleString()} <span class="fs-6 text-secondary">kcal</span></div>

                        <div class="d-flex gap-2 mb-3">
                            <span class="badge bg-primary px-2 py-1">${v.proteinGrams}g Pro (${v.proteinPct}%)</span>
                            <span class="badge bg-warning text-dark px-2 py-1">${v.carbsGrams}g Carbs (${v.carbsPct}%)</span>
                            <span class="badge bg-danger px-2 py-1">${v.fatsGrams}g Fat (${v.fatsPct}%)</span>
                        </div>

                        <div class="small fw-bold text-secondary text-uppercase mb-2 border-top pt-2">Full Day Meals:</div>
                        
                        <div class="p-2 rounded mb-2" style="background: rgba(16,185,129,0.06);">
                            <div class="fw-bold small text-success"><i class="fa-solid fa-sun me-1"></i>Breakfast (~${meals.breakfast.cal} kcal):</div>
                            <div class="small text-white text-truncate">${meals.breakfast.name}</div>
                        </div>

                        <div class="p-2 rounded mb-2" style="background: rgba(6,182,212,0.06);">
                            <div class="fw-bold small text-info"><i class="fa-solid fa-utensils me-1"></i>Lunch (~${meals.lunch.cal} kcal):</div>
                            <div class="small text-white text-truncate">${meals.lunch.name}</div>
                        </div>

                        <div class="p-2 rounded mb-2" style="background: rgba(245,158,11,0.06);">
                            <div class="fw-bold small text-warning"><i class="fa-solid fa-bolt me-1"></i>Snack (~${meals.snack.cal} kcal):</div>
                            <div class="small text-white text-truncate">${meals.snack.name}</div>
                        </div>

                        <div class="p-2 rounded mb-3" style="background: rgba(99,102,241,0.06);">
                            <div class="fw-bold small text-primary"><i class="fa-solid fa-moon me-1"></i>Dinner (~${meals.dinner.cal} kcal):</div>
                            <div class="small text-white text-truncate">${meals.dinner.name}</div>
                        </div>

                        <button class="btn ${isSelected ? 'btn-brand' : 'btn-glass text-cyan border-cyan'} w-100 py-1 small btn-select-compare-plan" data-plan-index="${idx}">
                            ${isSelected ? '<i class="fa-solid fa-check me-1"></i>Active Plan' : '<i class="fa-solid fa-hand-pointer me-1"></i>Choose This Plan'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners to choose plan buttons
        row.querySelectorAll('.btn-select-compare-plan').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-plan-index'), 10);
                activeVariationIndex = idx;

                // Sync planVariationTabs
                const tabs = document.querySelectorAll('#planVariationTabs button');
                tabs.forEach((t, i) => {
                    if (i === idx) t.classList.add('active');
                    else t.classList.remove('active');
                });

                renderCurrentMealPlan();
                renderSideBySideComparison();
            });
        });
    }

    // Log Daily Meals (+kcal) to SQLite activity history
    async function logDailyMealsToTracker() {
        const { variation } = getActiveVariation();
        const btn = document.getElementById('btnLogDailyMeals');

        if (btn) {
            btn.setAttribute('disabled', 'true');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Syncing to Log...';
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    activity_date: todayStr,
                    workout_type: `Nutrition: ${variation.label} (Day ${activeDay})`,
                    workout_duration: 0,
                    calories_burned: 0,
                    steps: 0,
                    water_intake: 0.5,
                    sleep_duration: 7.5
                })
            });

            const data = await response.json();
            if (data.success) {
                playSuccessChime();
                const toastEl = document.getElementById('nutriToast');
                const toastMsg = document.getElementById('nutriToastMessage');
                if (toastMsg) {
                    toastMsg.textContent = `Logged! ${variation.label} synced (~${variation.calories} kcal, ${variation.proteinGrams}g Protein) to your activity log!`;
                }
                if (toastEl && window.bootstrap) {
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }
                if (btn) {
                    btn.innerHTML = '<i class="fa-solid fa-circle-check text-success me-1"></i>Meals Logged to Dashboard!';
                }
            } else {
                alert('Logging failed: ' + (data.error || 'Server error'));
                if (btn) {
                    btn.removeAttribute('disabled');
                    btn.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i>Log Meals to Tracker';
                }
            }
        } catch (e) {
            console.error('Error logging meals:', e);
            alert('Could not sync meals to backend.');
            if (btn) {
                btn.removeAttribute('disabled');
                btn.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i>Log Meals to Tracker';
            }
        }
    }

    // Add Water Intake
    async function addWaterIntake() {
        loggedWaterMl += 250;
        const liters = (loggedWaterMl / 1000).toFixed(1);
        const waterDisplay = document.getElementById('nutriCurrentWater');
        if (waterDisplay) waterDisplay.textContent = `/ ${liters}L logged`;

        const percent = Math.min(100, Math.round((loggedWaterMl / DAILY_WATER_GOAL_ML) * 100));
        const percentEl = document.getElementById('nutriWaterPercent');
        if (percentEl) {
            percentEl.innerHTML = `<i class="fa-solid fa-check me-1"></i>${percent}% of daily baseline`;
        }

        const toastEl = document.getElementById('nutriToast');
        const toastMsg = document.getElementById('nutriToastMessage');
        if (toastMsg) toastMsg.textContent = `Hydration updated! Logged ${liters}L of water today (+250ml)`;
        if (toastEl && window.bootstrap) {
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        try {
            await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    activity_date: new Date().toISOString().split('T')[0],
                    water_intake: 0.25,
                    workout_type: 'Other',
                    workout_duration: 0,
                    calories_burned: 0,
                    steps: 0,
                    sleep_duration: 7.5
                })
            });
        } catch (e) {
            console.warn('Water sync note:', e);
        }
    }

    // Initialize UI Listeners
    function initListeners() {
        // Diet Archetype Pills
        const dietChips = document.querySelectorAll('#dietStyleSelector [data-diet]');
        dietChips.forEach(chip => {
            chip.addEventListener('click', () => {
                dietChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                activeDietStyle = chip.getAttribute('data-diet') || 'high-protein';
                activeVariationIndex = 0; // reset to Plan A
                
                // Sync variation tabs button text
                const style = DIET_BLUEPRINTS[activeDietStyle];
                const varButtons = document.querySelectorAll('#planVariationTabs button');
                if (style && varButtons.length >= 3) {
                    varButtons[0].innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>${style.variations[0].label}`;
                    varButtons[1].innerHTML = `<i class="fa-solid fa-bolt me-1"></i>${style.variations[1].label}`;
                    varButtons[2].innerHTML = `<i class="fa-solid fa-heart-pulse me-1"></i>${style.variations[2].label}`;
                    varButtons.forEach((b, i) => {
                        if (i === 0) b.classList.add('active');
                        else b.classList.remove('active');
                    });
                }

                renderCurrentMealPlan();
                if (isSideBySideActive) renderSideBySideComparison();
            });
        });

        // Plan Variation Tabs
        const varButtons = document.querySelectorAll('#planVariationTabs button');
        varButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                varButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                activeVariationIndex = parseInt(btn.getAttribute('data-variation'), 10) || 0;
                renderCurrentMealPlan();
                if (isSideBySideActive) renderSideBySideComparison();
            });
        });

        // 7-Day Rotation Tabs
        const dayButtons = document.querySelectorAll('#dayRotationTabs button');
        dayButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                dayButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                activeDay = parseInt(btn.getAttribute('data-day'), 10) || 1;
                renderCurrentMealPlan();
                if (isSideBySideActive) renderSideBySideComparison();
            });
        });

        // Generate 3 Variations Button
        const btnGen = document.getElementById('btnGenerateAllPlans');
        if (btnGen) {
            btnGen.addEventListener('click', () => {
                btnGen.setAttribute('disabled', 'true');
                btnGen.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Synthesizing Blueprints...';

                setTimeout(() => {
                    playSuccessChime();
                    btnGen.removeAttribute('disabled');
                    btnGen.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles me-1"></i>Generate 3 AI Variations';

                    // Switch to random variation for visual feedback
                    activeVariationIndex = (activeVariationIndex + 1) % 3;
                    const tabs = document.querySelectorAll('#planVariationTabs button');
                    tabs.forEach((t, i) => {
                        if (i === activeVariationIndex) t.classList.add('active');
                        else t.classList.remove('active');
                    });

                    renderCurrentMealPlan();
                    if (isSideBySideActive) renderSideBySideComparison();

                    const toastEl = document.getElementById('nutriToast');
                    const toastMsg = document.getElementById('nutriToastMessage');
                    if (toastMsg) {
                        toastMsg.textContent = '✨ Generated 3 custom AI meal variations for the entire week!';
                    }
                    if (toastEl && window.bootstrap) {
                        const toast = new bootstrap.Toast(toastEl);
                        toast.show();
                    }
                }, 450);
            });
        }

        // Toggle Side-by-Side Comparison
        const btnSideBySide = document.getElementById('btnToggleSideBySide');
        const sideBySideRow = document.getElementById('sideBySideCompareRow');
        const sideBySideLabel = document.getElementById('sideBySideBtnLabel');

        if (btnSideBySide && sideBySideRow) {
            btnSideBySide.addEventListener('click', () => {
                isSideBySideActive = !isSideBySideActive;
                if (isSideBySideActive) {
                    sideBySideRow.classList.remove('d-none');
                    if (sideBySideLabel) sideBySideLabel.textContent = 'Hide Comparison';
                    renderSideBySideComparison();
                    sideBySideRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    sideBySideRow.classList.add('d-none');
                    if (sideBySideLabel) sideBySideLabel.textContent = 'Compare Side-by-Side';
                }
            });
        }

        // Regenerate current day button
        const btnRefresh = document.getElementById('btnRefreshMeals');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                activeDay = (activeDay % 7) + 1;
                const dayButtons = document.querySelectorAll('#dayRotationTabs button');
                dayButtons.forEach((b, i) => {
                    if (i === activeDay - 1) b.classList.add('active');
                    else b.classList.remove('active');
                });
                renderCurrentMealPlan();
                if (isSideBySideActive) renderSideBySideComparison();
            });
        }

        // Log daily meals to tracker
        const btnLogMeals = document.getElementById('btnLogDailyMeals');
        if (btnLogMeals) {
            btnLogMeals.addEventListener('click', logDailyMealsToTracker);
        }

        // Water logger
        const btnLogWater = document.getElementById('btnLogDailyWater');
        if (btnLogWater) {
            btnLogWater.addEventListener('click', addWaterIntake);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMacroChart();
        initListeners();
        renderCurrentMealPlan();
    });

})();
