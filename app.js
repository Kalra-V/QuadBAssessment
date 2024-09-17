const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

const app = express();


mongoose.connect('mongodb://localhost:27017/hodlinfo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));


const tickerSchema = new mongoose.Schema({
  name: String,
  last_traded_price: String,
  buy: String,
  sell: String,
  volume: String,
  base_unit: String,
});

const Ticker = mongoose.model('Ticker', tickerSchema);


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


app.get('/fetch-data', async (req, res) => {
  try {
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
    const tickers = response.data;

    const tickerData = Object.keys(tickers).slice(0, 10).map((key) => {
      const { last, buy, sell, volume, base_unit } = tickers[key];
      return { name: key, last_traded_price: last, buy, sell, volume, base_unit };
    });
    console.log(tickerData);
    // Clear previous data and store new data in MongoDB
    await Ticker.deleteMany({});
    await Ticker.insertMany(tickerData);
    res.send('Data fetched and stored in MongoDB');
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

// Fetch data from MongoDB and render it on the frontend
app.get('/', async (req, res) => {
  try {
    const tickers = await Ticker.find({});
    res.render('index', { tickers });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
