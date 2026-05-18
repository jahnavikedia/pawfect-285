import { db } from "../lib/db";

type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  tagline: string;
  description: string;
  image_url: string;
  accent: string;
};

const ACCENTS = [
  "#fde68a", "#bbf7d0", "#fecaca", "#bfdbfe", "#ddd6fe",
  "#fbcfe8", "#fed7aa", "#a7f3d0", "#c7d2fe", "#fef08a",
];

const pick = <T,>(arr: T[], i: number): T => arr[i % arr.length];

function img(keyword: string, lock: number): string {
  return `https://loremflickr.com/600/600/${keyword}?lock=${lock}`;
}

// --- DOGS --------------------------------------------------------------
const DOGS: Array<Omit<Pet, "id" | "image_url" | "accent" | "species">> = [
  { name: "Biscuit",  breed: "Golden Retriever",  age: "3 yrs", tagline: "Will fetch your heart and your slippers.",  description: "A sun-bleached goofball who has never met a tennis ball he didn't adore. House-trained and a champion napper on warm laundry." },
  { name: "Mochi",    breed: "Shiba Inu",         age: "2 yrs", tagline: "Tiny floof, enormous opinions.",            description: "Independent, smart, and convinced he owns the couch. Prefers earning treats to being handed them — make him work for it." },
  { name: "Pepper",   breed: "Border Collie",     age: "4 yrs", tagline: "Has a PhD in herding the kids.",             description: "Endlessly clever, endlessly busy. Needs a job: agility, frisbee, or just a backyard with a frisbee-shaped purpose." },
  { name: "Toast",    breed: "Corgi mix",         age: "5 yrs", tagline: "Short king with a long heart.",              description: "Loaf-shaped, loaf-energy, but he'll spring up for a snack or a stroller walk. Good with cats and skeptical of vacuums." },
  { name: "Banjo",    breed: "Beagle",            age: "6 yrs", tagline: "Nose to the ground, tail to the sky.",       description: "Howls along to ambulances and harmonicas. Loves long sniffs in the park more than any treat you can offer." },
  { name: "Luna",     breed: "Husky",             age: "3 yrs", tagline: "Vocally opinionated. Stunningly photogenic.", description: "She will tell you about her day in three different octaves. Needs daily runs, a fenced yard, and a strong-willed human." },
  { name: "Otis",     breed: "Bulldog",           age: "7 yrs", tagline: "Snore champion of the tri-state area.",      description: "Wheezy, lovable, low-energy. Perfect for apartment life and someone who finds snoring romantic." },
  { name: "Hazel",    breed: "Dachshund",         age: "4 yrs", tagline: "Long dog, longer grudges.",                  description: "Brave to a fault. Will bark at a Roomba, a leaf, or her own reflection. Bonds hard with one person." },
  { name: "Rufus",    breed: "German Shepherd",   age: "5 yrs", tagline: "Loyal to the bone. Literally.",              description: "Trained in basic obedience, fantastic on leash, and will follow you to the bathroom because he's worried you'll get lost." },
  { name: "Pickle",   breed: "French Bulldog",    age: "2 yrs", tagline: "Bat-eared, gremlin-energy.",                 description: "Tiny tank with a giant personality. Sleeps 18 hours a day; the other 6 are pure chaos and kisses." },
  { name: "Scout",    breed: "Labrador Retriever",age: "1 yr",  tagline: "Eats first, asks questions never.",          description: "Puppy energy, puppy curiosity, puppy zoomies. Will need training, patience, and a tolerance for chewed shoes." },
  { name: "Daisy",    breed: "Cocker Spaniel",    age: "8 yrs", tagline: "Senior soul, soft ears, softer eyes.",       description: "Past her zoomie years and into her professional-cuddler era. Great for a quiet home with sunny rugs." },
  { name: "Bandit",   breed: "Australian Shepherd", age: "3 yrs", tagline: "Eyes like marbles, brain like a chess master.", description: "Will solve your puzzles and create new ones. Best in a household that hikes, runs, or does dog sports." },
  { name: "Pumpkin",  breed: "Pomeranian",        age: "4 yrs", tagline: "Three pounds of fluff and rage.",            description: "Bossy, regal, convinced she's a large dog. Bonds tightly with one person; mistrusts everyone else for at least a week." },
  { name: "Diego",    breed: "Chihuahua",         age: "9 yrs", tagline: "Senior gentleman seeks lap.",                description: "Sweet old man who just wants to be warm. Needs a calm home, soft food, and someone to share their sweater with." },
  { name: "Rocky",    breed: "Boxer",             age: "2 yrs", tagline: "Boings first, asks questions later.",         description: "All limbs and enthusiasm. Loves kids, hates closed doors, lives for face-licks. Active home required." },
  { name: "Olive",    breed: "Italian Greyhound", age: "5 yrs", tagline: "Delicate noodle. Surprisingly fast.",        description: "Shivers in any weather under 70°F. Prefers heated blankets, gentle people, and zooming in short bursts." },
  { name: "Tank",     breed: "Pit Bull mix",      age: "4 yrs", tagline: "Big head. Bigger smile.",                    description: "A wiggle-bodied love-bug who flunked out of being intimidating. Excellent with adults; supervised with small kids." },
  { name: "Marshmallow", breed: "Samoyed",        age: "3 yrs", tagline: "Walking cloud, permanent smile.",            description: "Sheds enough to knit a second dog every spring. Friendly with everyone — including the mail carrier she's known for 12 minutes." },
  { name: "Cricket",  breed: "Jack Russell",      age: "6 yrs", tagline: "Battery: never dies.",                       description: "Built like a coiled spring. Loves digging, fetching, and judging your work-from-home posture." },
  { name: "Sadie",    breed: "Vizsla",            age: "2 yrs", tagline: "Velcro dog seeks velcro human.",             description: "Will be touching some part of you at all times. Athletic, affectionate, and prone to dramatic sighs." },
  { name: "Bruno",    breed: "Saint Bernard",     age: "5 yrs", tagline: "Drool included at no extra charge.",         description: "Gentle giant. Great with kids and patient with everything except hot weather. Bring towels." },
  { name: "Pixie",    breed: "Maltese",           age: "10 yrs",tagline: "Tiny, silky, set in her ways.",              description: "Wants soft beds, soft food, and soft voices. Has retired from puppyhood and will not be coming back." },
  { name: "Cooper",   breed: "Goldendoodle",      age: "1 yr",  tagline: "Living mop with a heart of gold.",            description: "Curly, clumsy, allergy-friendly. Needs grooming, structure, and approximately 47 walks a day." },
  { name: "Nala",     breed: "Rhodesian Ridgeback", age: "4 yrs", tagline: "Regal hunter, surprisingly couch-shaped.",  description: "Strong, calm, and dignified. Needs an experienced owner and a yard big enough to make her feel like she owns it." },
  { name: "Waffle",   breed: "Cavalier King Charles", age: "5 yrs", tagline: "All ears, all heart.",                   description: "Wants nothing more than to be on a lap. Any lap. Yours, the neighbor's, a stranger's at a café." },
  { name: "Atlas",    breed: "Great Dane",        age: "3 yrs", tagline: "Pony-sized. Pup-hearted.",                   description: "Believes he is a lap dog. Disagrees with all evidence to the contrary. Will sit on you and not understand why you're complaining." },
  { name: "Penny",    breed: "Mini Schnauzer",    age: "7 yrs", tagline: "Beard game: unmatched.",                     description: "Polite, alert, opinionated about strangers. Loves a routine and a window with a view of the sidewalk." },
  { name: "Bear",     breed: "Newfoundland",      age: "4 yrs", tagline: "Living rug. Surprisingly aquatic.",          description: "Massive, mellow, magnificent. Drools enthusiastically and will absolutely jump in any pool, pond, or puddle." },
  { name: "Ziggy",    breed: "Whippet",           age: "3 yrs", tagline: "Couch potato with race-car gears.",          description: "Sleeps 22 hours a day, then runs 35 mph for the other two. Sensitive soul; prefers gentle homes." },
  { name: "Coco",     breed: "Mixed breed",       age: "6 yrs", tagline: "Heinz 57, 100% sweetheart.",                 description: "Came from a shelter in West Texas. Loves slow walks, soft pets, and the people who let her on the bed." },
  { name: "Ranger",   breed: "Belgian Malinois",  age: "2 yrs", tagline: "Pro athlete looking for a coach.",           description: "Working-line drive. Brilliant, intense, and absolutely not for first-time owners. Needs a job — every single day." },
  { name: "Lulu",     breed: "Shih Tzu",          age: "8 yrs", tagline: "Diva. Refuses to walk in rain.",             description: "Will be carried, thank you. Loves brushing, bowls of warm food, and people who appreciate her hairstyle." },
  { name: "Finn",     breed: "Bernese Mountain Dog", age: "2 yrs", tagline: "Tuxedo coat, golden heart.",              description: "Big, calm, sheds for a living. Great with kids; needs a cool climate and lots of brushing." },
  { name: "Mango",    breed: "Yorkie",            age: "5 yrs", tagline: "Pocket-sized terror in the best way.",        description: "Two pounds of attitude, six pounds of love. Needs a calm home where she can be the only small dog in charge." },
];

// --- CATS --------------------------------------------------------------
const CATS: Array<Omit<Pet, "id" | "image_url" | "accent" | "species">> = [
  { name: "Miso",       breed: "Domestic Shorthair", age: "2 yrs", tagline: "Smol black cat, large vibes.",            description: "Plays fetch with bottle caps. Sits on your laptop at 3pm sharp. Will headbutt you awake at dawn." },
  { name: "Marshmallow",breed: "Ragdoll",            age: "4 yrs", tagline: "Goes limp when you pick her up.",          description: "Floppy, sweet, talks in chirps. Believes every guest came specifically to admire her." },
  { name: "Salem",      breed: "Bombay",             age: "5 yrs", tagline: "Tiny panther, full of opinions.",          description: "Sleek and dramatic. Loves heights, mirrors, and being the protagonist of every room." },
  { name: "Pickles",    breed: "Maine Coon",         age: "3 yrs", tagline: "Cat-sized cat. Plus more cat.",            description: "Big floof, bigger purr. Loves water faucets, sits like a person, supervises Zoom calls." },
  { name: "Bean",       breed: "Domestic Shorthair", age: "6 mo",  tagline: "Kitten energy: ON.",                       description: "Zoomies, biscuit-making, and absolutely no concept of bedtime. Adopt with sibling for sanity." },
  { name: "Olive",      breed: "Russian Blue",       age: "6 yrs", tagline: "Reserved, regal, deeply loving (eventually).", description: "Will hide for the first week and then become your shadow. Quiet home preferred, no small kids." },
  { name: "Tofu",       breed: "Siamese",            age: "3 yrs", tagline: "Has a podcast about her day.",             description: "Chatty, clingy, intense eye contact. Wants to be in your business at all times." },
  { name: "Captain",    breed: "Tuxedo",             age: "8 yrs", tagline: "Senior gentleman, dressed for dinner.",    description: "Distinguished and mellow. Loves sunbeams, slow scritches, and judging your dating choices." },
  { name: "Pumpkin",    breed: "Orange Tabby",       age: "4 yrs", tagline: "Orange cat: a single shared brain cell.",  description: "Headbutts walls. Knocks cups off tables for no reason. Loves with his whole, slightly empty head." },
  { name: "Cleo",       breed: "Sphynx",             age: "5 yrs", tagline: "Nude. Warm. Needs sweaters.",              description: "Bald and beautiful. Needs weekly baths and a heated bed. Affectionate to a fault." },
  { name: "Mittens",    breed: "Polydactyl",         age: "2 yrs", tagline: "Extra toes, extra love.",                  description: "Seven toes per front paw. Excellent climber. Will open doors you wish she wouldn't." },
  { name: "Loki",       breed: "Bengal",             age: "3 yrs", tagline: "Wild-looking, wilder-acting.",             description: "Spotted, athletic, needs stimulation or your curtains pay the price. Best for experienced cat people." },
  { name: "Pip",        breed: "Calico",             age: "5 yrs", tagline: "Tortie attitude in patchwork colors.",     description: "Loves one person fiercely and tolerates the rest. Best as an only cat in a calm home." },
  { name: "Smudge",     breed: "British Shorthair",  age: "4 yrs", tagline: "Plush teddy. Slightly unimpressed.",       description: "Solid, sweet, and very loaf-shaped. Prefers being near you rather than on you." },
  { name: "Mooncake",   breed: "Persian",            age: "6 yrs", tagline: "Flat face, flat affect, deep love.",       description: "Needs daily brushing and a quiet home. Will quietly worship you from her favorite chair." },
  { name: "Felix",      breed: "Domestic Shorthair", age: "1 yr",  tagline: "Stripes, sprints, and shenanigans.",       description: "Recently graduated from kittenhood. Plays hard, sleeps harder, wakes you up for snacks." },
  { name: "Boba",       breed: "Scottish Fold",      age: "3 yrs", tagline: "Round ears, round eyes, round body.",      description: "Mellow and friendly. Will sit like a person in the weirdest places." },
  { name: "Jellybean",  breed: "Tortoiseshell",      age: "7 yrs", tagline: "Tortitude. Accept it.",                    description: "Sassy, demanding, deeply loving on her own schedule. Will hiss at you and then sleep on your face." },
  { name: "Noodle",     breed: "Oriental Shorthair", age: "4 yrs", tagline: "Long limbs, longer monologues.",           description: "Talks. A lot. Athletic, social, needs a cat tree and a podcast audience." },
  { name: "Pearl",      breed: "Turkish Angora",     age: "5 yrs", tagline: "White fluff, mismatched eyes.",            description: "Elegant and active. Loves climbing, water bowls, and being the prettiest one at the party." },
  { name: "Goblin",     breed: "Domestic Shorthair", age: "2 yrs", tagline: "Lives under the couch by choice.",         description: "Shy at first, devoted forever. Needs a patient adopter and a few good hiding spots." },
  { name: "Sushi",      breed: "Burmese",            age: "3 yrs", tagline: "Loves people more than cats do.",          description: "Acts like a dog. Greets you at the door, plays fetch, follows you everywhere." },
  { name: "Cinnabon",   breed: "Ragamuffin",         age: "8 yrs", tagline: "Cinnamon roll in cat form.",               description: "Gentle, fluffy, completely chill. Perfect for a calm household with soft furniture." },
  { name: "Vlad",       breed: "Black Domestic Longhair", age: "6 yrs", tagline: "Eternal night, occasional fetch.",   description: "Looks mysterious; behaves like a goofball. Loves windowsills and crinkly toys." },
  { name: "Hibiscus",   breed: "Tortoiseshell",      age: "4 yrs", tagline: "Will tell you when she's had enough.",     description: "Affectionate on her terms. Best for cat-experienced adopters who know how to read a tail flick." },
  { name: "Doughnut",   breed: "Munchkin",           age: "3 yrs", tagline: "Tiny legs, big mood.",                     description: "Cannot reach the counter, will not stop trying. Sweet, silly, sociable." },
  { name: "Echo",       breed: "Siamese mix",        age: "5 yrs", tagline: "Sings opera at 5am.",                      description: "Loud, loving, and incapable of being ignored. Needs an adopter who finds chatter charming." },
  { name: "Dim Sum",    breed: "Japanese Bobtail",   age: "2 yrs", tagline: "Cottontail. Full chaos.",                  description: "Energetic and playful. Talks with chirps. Adopt with a sibling or a lot of toys." },
  { name: "Gravy",      breed: "Domestic Longhair",  age: "9 yrs", tagline: "Senior love bug, beige and warm.",         description: "Slow blinks, soft purrs, will sleep on your chest. Looking for a retirement home with sunbeams." },
  { name: "Persephone", breed: "Norwegian Forest Cat", age: "4 yrs", tagline: "Goddess of the cat tree.",               description: "Enormous floof. Independent but loyal. Wants high perches and respectful humans." },
];

// --- RABBITS -----------------------------------------------------------
const RABBITS: Array<Omit<Pet, "id" | "image_url" | "accent" | "species">> = [
  { name: "Clover",   breed: "Holland Lop",     age: "2 yrs", tagline: "Floppy ears, zoomy feet.",                description: "Loves hay forts and supervised carrot snacks. Litter-trained and bonded with his bowl." },
  { name: "Thistle",  breed: "Mini Rex",        age: "3 yrs", tagline: "Velvet coat, velvet soul.",                description: "Plush and quiet. Likes head scritches and very strong opinions about cilantro." },
  { name: "Hopscotch",breed: "Netherland Dwarf",age: "1 yr",  tagline: "Pocket-sized binkie machine.",             description: "Small, energetic, and prone to joy-leaps. Needs lots of safe floor time." },
  { name: "Muffin",   breed: "Lionhead",        age: "4 yrs", tagline: "Tiny lion, tinier roar.",                  description: "Mane of fluff, heart of marshmallow. Needs daily brushing and very respectful introductions." },
  { name: "Sage",     breed: "Flemish Giant",   age: "3 yrs", tagline: "House-rabbit, dog-sized.",                 description: "Calm, enormous, eats like a horse. Loves nose pets and afternoon naps in the kitchen." },
  { name: "Pip",      breed: "Dutch",           age: "2 yrs", tagline: "Tuxedo bunny seeks plus-one.",             description: "Black-and-white markings, sweet temperament. Bonded with another bunny — adopt as a pair." },
  { name: "Acorn",    breed: "English Angora",  age: "5 yrs", tagline: "Walking pom-pom, full-time grooming gig.", description: "Stunning long fur. Requires daily grooming. Quiet, gentle, loves a calm reader-companion." },
  { name: "Juniper",  breed: "Mini Lop",        age: "2 yrs", tagline: "Will bink for blueberries.",               description: "Confident, sociable, and willing to negotiate via foot-thump. Loves a tunnel." },
  { name: "Truffle",  breed: "Rex",             age: "6 yrs", tagline: "Senior bun, soft as butter.",              description: "Past her zoomies, into her snuggles. Needs a calm, gentle home with low shelves." },
  { name: "Marbles",  breed: "Harlequin",       age: "1 yr",  tagline: "Patchwork bunny, full of beans.",          description: "Young and curious. Will absolutely chew your laptop cable if you let her." },
  { name: "Pebble",   breed: "American Fuzzy Lop", age: "3 yrs", tagline: "Fuzzy ears, fuzzier feelings.",         description: "Affectionate but shy at first. Best in a quiet home with patient humans." },
  { name: "Fern",     breed: "Mixed",           age: "4 yrs", tagline: "Adoption-shelf classic, deeply underrated.", description: "Sweet, mellow, would love a pair-bonded partner and unlimited timothy hay." },
];

// --- BIRDS -------------------------------------------------------------
const BIRDS: Array<Omit<Pet, "id" | "image_url" | "accent" | "species">> = [
  { name: "Kiwi",     breed: "Parakeet",        age: "2 yrs", tagline: "Chirps along to the radio.",               description: "Bright green and yellow. Loves millet, mirrors, and his reflection's life choices." },
  { name: "Mango",    breed: "Sun Conure",      age: "5 yrs", tagline: "Sunset feathers, sunrise volume.",         description: "Loud, social, brilliant. Needs an adopter who works from home and loves a good shriek." },
  { name: "Echo",     breed: "African Grey",    age: "12 yrs",tagline: "Vocabulary: 200 words and growing.",        description: "Mimics microwave beeps, the dog, and your therapist's voice. Lifetime commitment — these birds live 50+ years." },
  { name: "Tofu",     breed: "Cockatiel",       age: "4 yrs", tagline: "Whistles the Andy Griffith theme.",         description: "Gentle and bonded. Loves shoulder rides and head scratches. Will sing at sunrise." },
  { name: "Pomelo",   breed: "Lovebird",        age: "3 yrs", tagline: "Tiny, fierce, bonded to her sibling.",     description: "Adopt as a pair — these two are inseparable. Curious, busy, and prone to chewing important documents." },
  { name: "Sir Pip",  breed: "Budgie",          age: "1 yr",  tagline: "Knight of the millet realm.",              description: "Young and trainable. Loves swings, bells, and conversations with the bathroom mirror." },
  { name: "Olive",    breed: "Quaker Parrot",   age: "6 yrs", tagline: "Green, chatty, opinionated.",              description: "Loves apples, hates closed doors. Can learn 40+ words. Needs daily out-of-cage time." },
  { name: "Snickerdoodle", breed: "Cockatoo",   age: "8 yrs", tagline: "Drama queen with a crest.",                description: "Magnificent and demanding. Requires experienced adopters — these birds bond intensely and grieve when ignored." },
  { name: "Sprout",   breed: "Finch",           age: "2 yrs", tagline: "Best admired, not handled.",               description: "Hands-off pet. Lovely song. Adopt with a flock-mate; finches are happiest in pairs." },
  { name: "Marigold", breed: "Canary",          age: "3 yrs", tagline: "Solo artist, golden voice.",                description: "Quiet, beautiful, sings for the joy of it. Best in a calm home without other birds." },
];

// --- SMALL ANIMALS -----------------------------------------------------
const SMALLS: Array<Omit<Pet, "id" | "image_url" | "accent" | "species"> & { species: string }> = [
  { species: "Hamster",     name: "Cheese Puff", breed: "Syrian",        age: "1 yr", tagline: "Hoards. Schemes. Wheels.", description: "Solo nocturnal queen. Watch her cheek-stuff her dinner and then run a marathon at midnight." },
  { species: "Hamster",     name: "Crumb",       breed: "Roborovski",    age: "1 yr", tagline: "Fastest small thing alive.", description: "Blink-and-miss-her energy. Tiny, fast, hands-off pet best for observation." },
  { species: "Guinea Pig",  name: "Sir Wiggles", breed: "American",      age: "2 yrs", tagline: "Wheeks for parsley like it's gold.", description: "Bonded with his cage-mate. Adopt as a pair. Loves cucumber, fresh hay, and being talked to." },
  { species: "Guinea Pig",  name: "Lady Popcorn",breed: "Abyssinian",    age: "3 yrs", tagline: "Popcorns when she's happy.", description: "Bouncy, chatty, charming. Comes with her bonded sister — they cannot be separated." },
  { species: "Ferret",      name: "Banzai",      breed: "Standard",      age: "2 yrs", tagline: "Sock thief, full-time mischief.", description: "Will steal anything not bolted down. Needs hours of supervised play and a ferret-proofed home." },
  { species: "Hedgehog",    name: "Mr. Quills",  breed: "African Pygmy", age: "3 yrs", tagline: "Spiky exterior, soft heart (eventually).", description: "Slow to trust, worth the wait. Nocturnal, needs heat lamp and specific diet." },
  { species: "Rat",         name: "Algernon",    breed: "Fancy Rat",     age: "1 yr", tagline: "Smarter than your dog. Don't argue.", description: "Adopt as a pair — these guys need rat friends. Affectionate, clever, and will learn their names." },
  { species: "Chinchilla",  name: "Dust Bunny",  breed: "Standard Grey", age: "4 yrs", tagline: "Soft as a cloud, fast as a bullet.", description: "Needs a tall cage, dust baths, and a cool room. Hands-off mostly, but bonds with patient humans." },
];

// --- REPTILES ----------------------------------------------------------
const REPTILES: Array<Omit<Pet, "id" | "image_url" | "accent" | "species"> & { species: string; keyword?: string }> = [
  { species: "Reptile", keyword: "bearded-dragon",   name: "Sir Spike",    breed: "Bearded Dragon",   age: "4 yrs",  tagline: "Tiny dinosaur, big personality.", description: "Loves a shoulder ride, a heat lamp, and the occasional dubia roach. Recognizes his name." },
  { species: "Reptile", keyword: "leopard-gecko",    name: "Bumblebee",    breed: "Leopard Gecko",    age: "3 yrs",  tagline: "Smile that ends crime sprees.",   description: "Easy-care reptile, perfect for first-timers. Crepuscular and gentle." },
  { species: "Reptile", keyword: "ball-python",      name: "Noodle",       breed: "Ball Python",      age: "6 yrs",  tagline: "Polite. Patient. Slightly noodly.", description: "Calm temperament, easy to handle. Eats once every 1–2 weeks. Lives a long time — plan for it." },
  { species: "Reptile", keyword: "corn-snake",       name: "Penne",        breed: "Corn Snake",       age: "2 yrs",  tagline: "Pasta-named, beginner-friendly.", description: "Active, curious, and a great starter snake. Loves climbing branches in his enclosure." },
  { species: "Reptile", keyword: "tortoise",         name: "Sir Plodsworth",breed: "Russian Tortoise",age: "15 yrs", tagline: "Slow and steady. Forever.",        description: "Will outlive most of your life decisions. Needs UV light, leafy greens, and floor space." },
  { species: "Reptile", keyword: "blue-tongue-skink",name: "Periwinkle",   breed: "Blue-Tongue Skink",age: "5 yrs",  tagline: "Sticks her tongue out at danger.", description: "Docile, smart, and surprisingly interactive. Loves to be hand-fed strawberries." },
  { species: "Reptile", keyword: "crested-gecko",    name: "Mango",        breed: "Crested Gecko",    age: "2 yrs",  tagline: "No heat lamp. Just vibes.",        description: "Low-maintenance, gentle, and adorable. Sticks to walls. Eats fruit slurry like a champion." },
  { species: "Reptile", keyword: "chameleon",        name: "Pixel",        breed: "Veiled Chameleon", age: "3 yrs",  tagline: "Color-shifting drama queen.",       description: "Best admired, not handled. Needs precise humidity, UV, and zero stress. Experienced keepers only." },
];

function buildPets(): Pet[] {
  const all: Pet[] = [];
  let id = 1;

  const addRow = (
    species: string,
    keyword: string,
    row: Omit<Pet, "id" | "image_url" | "accent" | "species">,
  ) => {
    all.push({
      id,
      species,
      name: row.name,
      breed: row.breed,
      age: row.age,
      tagline: row.tagline,
      description: row.description,
      image_url: img(keyword, id),
      accent: pick(ACCENTS, id),
    });
    id++;
  };

  for (const r of DOGS)    addRow("Dog",       "dog,puppy",        r);
  for (const r of CATS)    addRow("Cat",       "cat,kitten",       r);
  for (const r of RABBITS) addRow("Rabbit",    "rabbit,bunny",     r);
  for (const r of BIRDS)   addRow("Bird",      `bird,${r.breed.toLowerCase().replace(/\s+/g, "-")}`, r);
  for (const r of SMALLS)  addRow(r.species,   `${r.species.toLowerCase().replace(/\s+/g, "-")},pet`, r);
  for (const r of REPTILES)addRow(r.species,   r.keyword ?? "reptile,lizard", r);

  return all;
}

function main() {
  const pets = buildPets();
  console.log(`Seeding ${pets.length} pets…`);

  const insert = db.prepare(`
    INSERT INTO pets (id, name, species, breed, age, tagline, description, image_url, accent)
    VALUES (@id, @name, @species, @breed, @age, @tagline, @description, @image_url, @accent)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      species=excluded.species,
      breed=excluded.breed,
      age=excluded.age,
      tagline=excluded.tagline,
      description=excluded.description,
      image_url=excluded.image_url,
      accent=excluded.accent
  `);

  const tx = db.transaction((rows: Pet[]) => {
    for (const r of rows) insert.run(r);
  });
  tx(pets);

  const count = (db.prepare("SELECT COUNT(*) AS n FROM pets").get() as { n: number }).n;
  console.log(`Done. Pets in db: ${count}`);
}

main();
