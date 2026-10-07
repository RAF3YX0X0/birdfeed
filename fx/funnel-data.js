// Page-specific versions of the 3D sales funnel. Industry pages share one
// template (social media → customers) with their own words and example
// numbers; email, ads and landing-page services get funnels of their own.
// All numbers are illustrative and labelled as such on the page.

// One blue for every stage (the 3D tiers are off-white until they're active);
// color3d is the 2D fallback's tier colour.
const PALETTE = Array.from({ length: 5 }, () => ({ color: '#0066FF', color3d: '#E9E9E4' }));

const withColors = (stages) => stages.map((s, i) => ({ ...PALETTE[i], ...s }));

// ---- industries -------------------------------------------------------------
function industry(p) {
  const stages = withColors([
    {
      key: 'Awareness', title: 'They see you', num: p.nums[0], unit: p.units[0],
      text: `Your ${p.content} show up in the feeds of ${p.audience} who haven’t heard of you yet.`,
      we: 'Regular on-brand posts, short videos and local targeting.',
    },
    {
      key: 'Interest', title: 'They like what they see', num: p.nums[1], unit: p.units[1],
      text: `They stop scrolling to like, comment on, save and share your ${p.short}.`,
      we: 'Scroll-stopping content, and replies to every comment and message.',
    },
    {
      key: 'Consideration', title: 'They check you out', num: p.nums[2], unit: p.units[2],
      text: p.consider,
      we: 'A clear bio and links, story highlights and fast replies to messages.',
    },
    {
      key: 'Conversion', title: p.buyTitle, num: p.nums[3], unit: p.units[3],
      text: p.buy,
      we: 'Offers, retargeting ads and one-tap booking or contact links.',
    },
    {
      key: 'Loyalty', title: 'They come back and tell friends', num: p.nums[4], unit: p.units[4],
      text: p.loyal,
      we: 'Review requests, customer spotlights and content that keeps you top of mind.',
    },
  ]);
  return {
    stages,
    copy: {
      eyebrow: `// how social media fills ${p.fills}`,
      title: `From scroll <em>to ${p.goal}.</em>`,
      lede: `Every post moves ${p.people} one step closer to ${p.closer}. Here’s the journey, in plain English.`,
      note: `Illustrative example for a local ${p.biz}; your numbers depend on your area and budget.`,
      cta: 'See what’s possible for you →',
    },
  };
}

const INDUSTRIES = {
  'social-media-management-for-restaurants': {
    goal: 'reservation', biz: 'restaurant', fills: 'your tables', people: 'hungry locals', closer: 'booking a table',
    audience: 'hungry locals', content: 'dishes, reels and specials', short: 'food posts',
    consider: 'They look at your menu, read your reviews or check your opening hours.',
    buyTitle: 'They book a table', buy: 'They reserve a table, order delivery or simply walk in.',
    loyal: 'Happy diners come back, tag you in their photos and bring friends, who start the journey all over again.',
    nums: [12000, 1500, 400, 120, 45],
    units: ['locals see your dishes', 'like, save or follow', 'check your menu or hours', 'book or order', 'become regulars'],
  },
  'social-media-management-for-dentists': {
    goal: 'appointment', biz: 'dental practice', fills: 'your chairs', people: 'local families', closer: 'booking a visit',
    audience: 'families nearby', content: 'smile makeovers, tips and team posts', short: 'posts',
    consider: 'They read your reviews, look at your treatments or message you with a question.',
    buyTitle: 'They book an appointment', buy: 'They book a check-up or consultation online or by phone.',
    loyal: 'Happy patients come back for check-ups, leave reviews and refer their family.',
    nums: [8000, 900, 220, 35, 14],
    units: ['locals see your posts', 'like, comment or follow', 'check your treatments or reviews', 'book an appointment', 'return and refer family'],
  },
  'social-media-management-for-gyms': {
    goal: 'membership', biz: 'gym', fills: 'your classes', people: 'would-be members', closer: 'joining',
    audience: 'people nearby who want to get fit', content: 'workouts, transformations and class videos', short: 'workout posts',
    consider: 'They check your classes, prices and trainers, or send you a message.',
    buyTitle: 'They join', buy: 'They sign up for a trial class or a membership.',
    loyal: 'Members stay longer, post their progress and bring workout buddies along.',
    nums: [10000, 1300, 350, 60, 25],
    units: ['people see your posts', 'like, save or follow', 'check classes or prices', 'start a trial or membership', 'stay and bring a friend'],
  },
  'social-media-management-for-law-firms': {
    goal: 'consultation', biz: 'law firm', fills: 'your calendar', people: 'future clients', closer: 'booking a consultation',
    audience: 'people nearby with a legal question', content: 'plain-English legal tips and case wins', short: 'posts',
    consider: 'They read your articles, look at your practice areas and check your reviews.',
    buyTitle: 'They book a consultation', buy: 'They call or fill in a form to book a consultation.',
    loyal: 'Satisfied clients come back when they need help again and refer friends and family.',
    nums: [6000, 500, 150, 20, 8],
    units: ['people see your posts', 'engage or follow', 'read about your services', 'book a consultation', 'refer someone'],
  },
  'social-media-management-for-medical': {
    goal: 'appointment', biz: 'clinic', fills: 'your appointment book', people: 'local patients', closer: 'booking a visit',
    audience: 'patients in your area', content: 'health tips, doctor introductions and clinic news', short: 'posts',
    consider: 'They look at your services and doctors, and check your reviews.',
    buyTitle: 'They book a visit', buy: 'They book an appointment online or by phone.',
    loyal: 'Patients come back for follow-ups, leave reviews and recommend you to others.',
    nums: [9000, 1000, 260, 40, 18],
    units: ['locals see your posts', 'like, comment or follow', 'check your services or doctors', 'book a visit', 'return and recommend you'],
  },
  'social-media-management-for-real-estate': {
    goal: 'showing', biz: 'agency', fills: 'your pipeline', people: 'buyers and sellers', closer: 'working with you',
    audience: 'buyers and sellers in your area', content: 'listings, tours and market updates', short: 'listings',
    consider: 'They browse your listings, watch your tours or send you a message.',
    buyTitle: 'They book a showing', buy: 'They book a viewing, or a valuation for the home they want to sell.',
    loyal: 'Happy clients leave reviews and send friends your way when they move.',
    nums: [15000, 1400, 300, 30, 10],
    units: ['people see your listings', 'like, save or share', 'browse listings or message you', 'book a showing or valuation', 'refer a friend'],
  },
  'social-media-management-for-salons': {
    goal: 'booked chair', biz: 'salon', fills: 'your chairs', people: 'new clients', closer: 'booking in',
    audience: 'people nearby', content: 'transformations, reels and before-and-afters', short: 'looks',
    consider: 'They look through your work, prices and reviews, or send you a message.',
    buyTitle: 'They book in', buy: 'They book an appointment online.',
    loyal: 'Clients rebook, tag you in their selfies and bring their friends.',
    nums: [9000, 1400, 350, 80, 40],
    units: ['locals see your work', 'like, save or follow', 'check your prices or reviews', 'book an appointment', 'rebook and bring friends'],
  },
  'social-media-management-for-car-dealerships': {
    goal: 'test drive', biz: 'dealership', fills: 'your showroom', people: 'car shoppers', closer: 'visiting your lot',
    audience: 'car shoppers in your area', content: 'walkarounds, deals and customer stories', short: 'videos',
    consider: 'They browse your inventory, compare prices or send you a message.',
    buyTitle: 'They book a test drive', buy: 'They visit, take a test drive and buy.',
    loyal: 'Buyers come back for servicing, leave reviews and send friends your way.',
    nums: [20000, 1800, 450, 40, 12],
    units: ['shoppers see your posts', 'like, comment or follow', 'browse your inventory', 'book a test drive', 'return and refer friends'],
  },
  'social-media-management-for-coaches': {
    goal: 'client', biz: 'coaching business', fills: 'your program', people: 'the right people', closer: 'working with you',
    audience: 'people looking for help with their goals', content: 'tips, stories and client wins', short: 'posts',
    consider: 'They read your posts, watch your videos and look at your programs.',
    buyTitle: 'They book a call', buy: 'They book a discovery call and sign up.',
    loyal: 'Clients renew, share their results and refer others to you.',
    nums: [7000, 900, 200, 25, 10],
    units: ['people see your posts', 'like, comment or follow', 'look at your programs', 'book a call and sign up', 'renew and refer others'],
  },
  'social-media-management-for-ecommerce': {
    goal: 'checkout', biz: 'online store', fills: 'your cart', people: 'shoppers', closer: 'checking out',
    audience: 'shoppers who’d love your products', content: 'product reels, reviews and creator videos', short: 'product posts',
    consider: 'They tap your product links, browse your shop and read reviews.',
    buyTitle: 'They buy', buy: 'They add to cart and check out.',
    loyal: 'Customers reorder, post unboxings and share their discount codes with friends.',
    nums: [25000, 2500, 800, 60, 20],
    units: ['shoppers see your products', 'like, save or share', 'visit your shop', 'buy', 'reorder and share'],
  },
  'home-services': {
    goal: 'booked job', biz: 'home-service business', fills: 'your calendar', people: 'homeowners', closer: 'booking you',
    audience: 'homeowners nearby', content: 'before-and-afters, tips and reviews', short: 'posts',
    consider: 'They check your services, reviews and service area, or give you a call.',
    buyTitle: 'They book a job', buy: 'They request a quote or book a visit.',
    loyal: 'Happy homeowners call you again, leave reviews and recommend you to the neighbours.',
    nums: [8000, 700, 200, 30, 12],
    units: ['homeowners see your posts', 'like, comment or follow', 'check your services or reviews', 'book a job', 'rebook and recommend you'],
  },
};

// ---- service funnels ----------------------------------------------------------
const EMAIL = {
  copy: {
    eyebrow: '// how email turns into sales',
    title: 'From inbox <em>to income.</em>',
    lede: 'Every email moves subscribers one step closer to buying. Here’s the journey, in plain English.',
    note: 'Illustrative example for a list of 10,000 subscribers; your numbers depend on your list and offer.',
    cta: 'See what’s possible for your list →',
  },
  stages: withColors([
    { key: 'Delivered', title: 'It lands in their inbox', num: 10000, unit: 'subscribers receive it',
      text: 'Your email arrives in the main inbox, not spam, at the right moment.',
      we: 'Clean design and code that inboxes and spam filters trust.' },
    { key: 'Opened', title: 'They open it', num: 4000, unit: 'open it',
      text: 'A subject line and preview text that make them curious enough to open.',
      we: 'Tested subject lines and preview text.' },
    { key: 'Clicked', title: 'They click', num: 350, unit: 'click through',
      text: 'The design and one clear button make them want to see more.',
      we: 'Designs built around one clear call to action.' },
    { key: 'Purchased', title: 'They buy', num: 60, unit: 'buy',
      text: 'They land on the right product and check out.',
      we: 'Links straight to the product, with offers and urgency where it fits.' },
    { key: 'Repeat', title: 'They buy again', num: 25, unit: 'come back for more',
      text: 'Welcome, thank-you and win-back emails bring them back without you lifting a finger.',
      we: 'Automated flows for welcomes, abandoned carts and win-backs.' },
  ]),
};

function ads(search) {
  return {
    copy: {
      eyebrow: '// how ads turn into sales',
      title: 'From ad <em>to customer.</em>',
      lede: 'Every ad dollar should move people one step closer to buying. Here’s the journey, in plain English.',
      note: 'Illustrative example for a small monthly budget; your numbers depend on your offer, industry and spend.',
      cta: 'See what’s possible for your budget →',
    },
    stages: withColors([
      search
        ? { key: 'Seen', title: 'They search, and see you', num: 50000, unit: 'see your ad',
            text: 'Your ad shows up when people search for exactly what you sell.',
            we: 'Keyword research, so you only pay for searches that matter.' }
        : { key: 'Seen', title: 'They see your ad', num: 50000, unit: 'see your ad',
            text: 'Your ad appears in front of people who match your ideal customer.',
            we: 'Audience research and targeting that finds the right people.' },
      { key: 'Clicked', title: 'They click', num: 1000, unit: 'click',
        text: 'A scroll-stopping creative and a clear offer make them tap.',
        we: 'Fresh ad creatives and copy, tested every week.' },
      { key: 'Visited', title: 'They land on your page', num: 800, unit: 'reach your page',
        text: 'They arrive on a fast page that matches the ad they clicked.',
        we: 'Landing pages that continue the ad’s promise.' },
      { key: 'Converted', title: 'They buy or sign up', num: 40, unit: 'buy or become leads',
        text: 'A simple checkout or short form turns the visit into a sale or a lead.',
        we: 'Conversion tracking, so budget goes to what actually sells.' },
      { key: 'Retargeted', title: 'The rest come back', num: 15, unit: 'return through retargeting',
        text: 'People who didn’t buy the first time see a reminder later, and many come back.',
        we: 'Retargeting and follow-up ads.' },
    ]),
  };
}

const LANDING = {
  copy: {
    eyebrow: '// how a landing page turns into sales',
    title: 'From click <em>to customer.</em>',
    lede: 'A good page moves every visitor one step closer to saying yes. Here’s the journey, in plain English.',
    note: 'Illustrative example for 1,000 visitors; your numbers depend on your traffic and offer.',
    cta: 'See what’s possible for your page →',
  },
  stages: withColors([
    { key: 'Arrive', title: 'They arrive', num: 1000, unit: 'visitors land on the page',
      text: 'Visitors land from an ad, an email or a social post.',
      we: 'A fast page that matches where they came from.' },
    { key: 'Read', title: 'They keep reading', num: 600, unit: 'scroll past the first screen',
      text: 'A clear headline tells them within seconds they’re in the right place.',
      we: 'Copy written to hook them in the first five seconds.' },
    { key: 'Trust', title: 'They trust you', num: 300, unit: 'reach your reviews and proof',
      text: 'Reviews, results and guarantees answer their doubts.',
      we: 'Proof placed exactly where doubts come up.' },
    { key: 'Act', title: 'They take action', num: 60, unit: 'fill in the form or buy',
      text: 'One clear button and a short form make it easy to say yes.',
      we: 'Simple forms and a single call to action.' },
    { key: 'Customer', title: 'They become customers', num: 25, unit: 'become customers',
      text: 'Your team follows up while they’re still interested.',
      we: 'Tracking, so you know which pages bring in customers.' },
  ]),
};

const SERVICES = {
  'email-design': EMAIL,
  'meta-ads-management': ads(false),
  'google-ads-management': ads(true),
  'ppc-services': ads(true),
  'landing-pages': LANDING,
};

// Funnel config for the current page, or null.
export function funnelFor(pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  if (INDUSTRIES[slug]) return industry(INDUSTRIES[slug]);
  if (SERVICES[slug]) return SERVICES[slug];
  return null;
}

