import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

const weatherAPI = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  params: {
    appid: API_KEY,
  }
});

export const saveFavoriteCity = (city) => {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
};

export const getWeatherByCity = async (city, unit) => {
  try {
    const response = await weatherAPI.get('/weather', {
      params: { q: city, units: unit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const getForecastByCity = async (city, unit) => {
  try {
    const response = await weatherAPI.get('/forecast', {
      params: { q: city, units: unit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
};

