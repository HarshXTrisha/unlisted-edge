exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('companies').del();
  
  // Inserts seed entries
  await knex('companies').insert([
    {
      id: 1,
      symbol: 'BYJU',
      name: "BYJU'S - Think and Learn",
      description: 'Leading EdTech platform providing personalized learning experiences',
      sector: 'Education Technology',
      industry: 'Online Education',
      current_price: 850.00,
      market_cap: 22000000000,
      total_shares: 25882353,
      available_shares: 5000000,
      is_active: true
    },
    {
      id: 2,
      symbol: 'SWIGGY',
      name: 'Swiggy Limited',
      description: 'Food delivery and quick commerce platform',
      sector: 'Consumer Services',
      industry: 'Food Delivery',
      current_price: 420.00,
      market_cap: 8400000000,
      total_shares: 20000000,
      available_shares: 3000000,
      is_active: true
    },
    {
      id: 3,
      symbol: 'OYO',
      name: 'OYO Hotels & Homes',
      description: 'Hospitality chain of leased and franchised hotels',
      sector: 'Consumer Services',
      industry: 'Hospitality',
      current_price: 65.00,
      market_cap: 4550000000,
      total_shares: 70000000,
      available_shares: 10000000,
      is_active: true
    },
    {
      id: 4,
      symbol: 'DREAM11',
      name: 'Dream11 Fantasy Sports',
      description: 'Fantasy sports platform and gaming company',
      sector: 'Technology',
      industry: 'Gaming & Sports',
      current_price: 1200.00,
      market_cap: 8000000000,
      total_shares: 6666667,
      available_shares: 1500000,
      is_active: true
    },
    {
      id: 5,
      symbol: 'RAZORPAY',
      name: 'Razorpay Software',
      description: 'Digital payments and financial services platform',
      sector: 'Financial Services',
      industry: 'Fintech',
      current_price: 2500.00,
      market_cap: 7500000000,
      total_shares: 3000000,
      available_shares: 800000,
      is_active: true
    },
    {
      id: 6,
      symbol: 'ZOMATO_PRE',
      name: 'Zomato Media (Pre-IPO)',
      description: 'Food delivery and restaurant discovery platform',
      sector: 'Consumer Services',
      industry: 'Food Delivery',
      current_price: 45.00,
      market_cap: 3600000000,
      total_shares: 80000000,
      available_shares: 15000000,
      is_active: true
    },
    {
      id: 7,
      symbol: 'MEESHO',
      name: 'Meesho Inc',
      description: 'Social commerce platform enabling reseller network',
      sector: 'E-commerce',
      industry: 'Social Commerce',
      current_price: 180.00,
      market_cap: 4320000000,
      total_shares: 24000000,
      available_shares: 5000000,
      is_active: true
    },
    {
      id: 8,
      symbol: 'CRED',
      name: 'CRED Technologies',
      description: 'Credit card bill payment and rewards platform',
      sector: 'Financial Services',
      industry: 'Fintech',
      current_price: 950.00,
      market_cap: 6650000000,
      total_shares: 7000000,
      available_shares: 1200000,
      is_active: true
    },
    {
      id: 9,
      symbol: 'PHARMEASY',
      name: 'PharmEasy Healthcare',
      description: 'Online pharmacy and healthcare platform',
      sector: 'Healthcare',
      industry: 'Digital Health',
      current_price: 320.00,
      market_cap: 4800000000,
      total_shares: 15000000,
      available_shares: 3500000,
      is_active: true
    },
    {
      id: 10,
      symbol: 'UNACADEMY',
      name: 'Unacademy Group',
      description: 'Online learning platform for competitive exams',
      sector: 'Education Technology',
      industry: 'Online Education',
      current_price: 280.00,
      market_cap: 3360000000,
      total_shares: 12000000,
      available_shares: 2800000,
      is_active: true
    }
  ]);
};