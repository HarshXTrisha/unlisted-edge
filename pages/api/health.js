// API route for Vercel
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Unlisted Trading Platform API is running on Vercel',
    timestamp: new Date().toISOString()
  });
}