import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWeatherByCity, getForecastByCity, saveFavoriteCity } from './api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

const weatherIcons = {
  "Clear": "bi bi-brightness-high",
  "Clouds": "bi bi-cloud",
  "Rain": "bi bi-cloud-rain",
  "Snow": "bi bi-snow",
  "Thunderstorm": "bi bi-cloud-lightning",
  // Add more conditions as needed
};

const App = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [favoriteCities, setFavoriteCities] = useState([]);
  const [unit, setUnit] = useState('metric');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [windSpeed, setWindSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const [cloudgenLoaded, setCloudgenLoaded] = useState(false);
  const [cloudCoverage, setCloudCoverage] = useState(0);
  const [weatherDescription, setWeatherDescription] = useState('');
  const cloudsRef = useRef([]);
  const animationRef = useRef(null);
  const [isRaining, setIsRaining] = useState(false);
  const raindropsRef = useRef([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavoriteCities(favorites);
  }, []);

  useEffect(() => {
    if (city) {
      handleSearch();
    }
  }, [unit]);  // Re-run the search when the unit changes

  useEffect(() => {
    const checkCloudgen = setInterval(() => {
      if (window.$cloudgen) {
        setCloudgenLoaded(true);
        clearInterval(checkCloudgen);
      }
    }, 100);

    return () => clearInterval(checkCloudgen);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawWeather(ctx);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Start animation
    animateClouds();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      drawWeather(ctx);
    }
  }, [weatherDescription, cloudCoverage]);

  useEffect(() => {
    // Update isRaining whenever weatherDescription changes
    setIsRaining(weatherDescription.toLowerCase().includes('rain'));
    
    // Clear existing raindrops if it's not raining
    if (!weatherDescription.toLowerCase().includes('rain')) {
      raindropsRef.current = [];
    }
  }, [weatherDescription]);

  useEffect(() => {
    if (isRaining && raindropsRef.current.length === 0) {
      // If it's raining but we have no raindrops, create some
      const canvas = canvasRef.current;
      for (let i = 0; i < 100; i++) {
        raindropsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 2,
          speed: Math.random() * 3 + 2
        });
      }
    } else if (!isRaining) {
      // If it's not raining, clear all raindrops
      raindropsRef.current = [];
    }
  }, [isRaining]);

  const drawWeather = (ctx) => {
    if (!ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply hazy effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw sun
    const sunRadius = 25;
    const sunX = canvas.width - sunRadius - 50;
    const sunY = sunRadius + 50;
    
    // Create a radial gradient for the sun's haze
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
    sunGradient.addColorStop(0, 'rgba(251, 144, 98, 0.8)');
    sunGradient.addColorStop(0.3, 'rgba(251, 144, 98, 0.4)');
    sunGradient.addColorStop(1, 'rgba(251, 144, 98, 0)');

    // Draw the sun's haze
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = sunGradient;
    ctx.fill();

    // Draw the sun itself
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgb(251, 144, 98)';
    ctx.shadowColor = 'rgba(251, 144, 98, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // Apply blur based on cloud coverage
    ctx.filter = `blur(${cloudCoverage * 15}px)`;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.filter = 'none';
    ctx.shadowBlur = 0;

    // Generate clouds if needed
    if (weatherDescription.toLowerCase().includes('clouds') && cloudsRef.current.length === 0) {
      const cloudCount = Math.floor(cloudCoverage * 7) + 2; // 2 to 9 clouds
      cloudsRef.current = Array(cloudCount).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        width: Math.random() * 200 + 150,
        height: Math.random() * 40 + 30,
        speed: Math.random() * 0.3 + 0.1
      }));
    }

    // Draw clouds
    cloudsRef.current.forEach(cloud => drawCloud(ctx, cloud));

    // Draw raindrops if it's raining
    if (isRaining) {
      drawRain(ctx);
    }
  };

  const drawCloud = (ctx, cloud) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, 2 * Math.PI);
    
    // Create a radial gradient for softer edges
    const gradient = ctx.createRadialGradient(
      cloud.x, cloud.y, 0,
      cloud.x, cloud.y, cloud.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 30;
    
    // Apply a strong blur effect
    ctx.filter = 'blur(20px)';
    
    ctx.fill();
    ctx.restore();
  };

  const drawRain = (ctx) => {
    const canvas = canvasRef.current;
    
    // Calculate rain angle based on wind speed
    const maxAngle = Math.PI / 6; // 30 degrees
    const windFactor = Math.min(windSpeed / 10, 1); // Normalize wind speed, max at 10 m/s
    const rainAngle = maxAngle * windFactor;

    // Create new raindrops only if it's raining
    if (isRaining && Math.random() < 0.3) {
      raindropsRef.current.push({
        x: Math.random() * canvas.width,
        y: 0,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 3 + 2
      });
    }

    // Update and draw raindrops
    raindropsRef.current = raindropsRef.current.filter(drop => {
      drop.y += drop.speed;
      drop.x += drop.speed * Math.tan(rainAngle);
      drop.size -= 0.015;

      if (drop.size > 0 && drop.x < canvas.width && drop.y < canvas.height) {
        // Draw the raindrop
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        const endX = drop.x + Math.sin(rainAngle) * drop.size * 3;
        const endY = drop.y + Math.cos(rainAngle) * drop.size * 3;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.lineWidth = drop.size / 1.5;
        ctx.stroke();
        return true; // Keep this raindrop
      }
      return false; // Remove this raindrop
    });
  };

  const animateClouds = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    cloudsRef.current = cloudsRef.current.map(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > canvas.width + cloud.width / 2) {
        cloud.x = -cloud.width / 2;
      }
      return cloud;
    });

    drawWeather(ctx);
    animationRef.current = requestAnimationFrame(animateClouds);
  };

  const animateWeather = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      // If canvas is not ready, try again in the next frame
      animationRef.current = requestAnimationFrame(animateWeather);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    // Animate clouds
    cloudsRef.current = cloudsRef.current.map(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > canvas.width + cloud.width / 2) {
        cloud.x = -cloud.width / 2;
      }
      return cloud;
    });

    drawWeather(ctx);
    animationRef.current = requestAnimationFrame(animateWeather);
  }, []);

  useEffect(() => {
    // Start animation
    animateWeather();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateWeather]);

  const handleFavoriteClick = (favCity) => {
    setCity(favCity);
    handleSearch(favCity);
  };

  const handleSearch = async (searchCity = city) => {
    setIsLoading(true);
    try {
      const weatherResponse = await getWeatherByCity(searchCity, unit);
      const forecastResponse = await getForecastByCity(searchCity, unit);
      
      setWeatherData(weatherResponse);
      setForecastData(forecastResponse);
      
      const newWeatherDescription = weatherResponse.weather[0].description;
      setWeatherDescription(newWeatherDescription);
      
      setWindSpeed(weatherResponse.wind.speed);
      
      // Calculate cloud coverage based on weather description
      const cloudiness = weatherResponse.clouds.all / 100;
      setCloudCoverage(cloudiness);
      
      // Immediately update isRaining
      const newIsRaining = newWeatherDescription.toLowerCase().includes('rain');
      setIsRaining(newIsRaining);
      
      // Clear existing raindrops
      raindropsRef.current = [];
      
      // If it's raining, immediately create some raindrops
      if (newIsRaining) {
        const canvas = canvasRef.current;
        for (let i = 0; i < 100; i++) {
          raindropsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 2,
            speed: Math.random() * 3 + 2
          });
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavorites = () => {
    if (city && !favorites.includes(city)) {
      const newFavorites = [...favorites, city];
      setFavorites(newFavorites);
      saveFavoriteCity(city);
    }
  };

  const toggleUnit = () => {
    setUnit(prevUnit => prevUnit === 'metric' ? 'imperial' : 'metric');
  };

  const renderClouds = () => {
    const cloudCount = 5;
    const baseSpeed = 100; // Base speed in seconds
    const speedFactor = windSpeed / 10; // Adjust this factor as needed
    const animationDuration = baseSpeed / speedFactor;

    return Array.from({ length: cloudCount }).map((_, index) => (
      <div
        key={index}
        className="cloud"
        style={{
          top: `${Math.random() * 50}%`,
          left: `-20%`,
          width: `${50 + Math.random() * 100}px`,
          height: `${25 + Math.random() * 50}px`,
          opacity: 0.7 + Math.random() * 0.3,
          animation: `moveCloud ${animationDuration}s linear infinite`,
          animationDelay: `${(index / cloudCount) * animationDuration}s`
        }}
      ></div>
    ));
  };

  const renderWeatherAnimation = () => {
    switch (weatherCondition) {
      case 'Clear':
        return <div className="sun"></div>;
      case 'Clouds':
        return renderClouds();
      case 'Rain':
        return (
          <>
            {renderClouds()}
            <div className="rain-container">
              {Array.from({ length: 100 }).map((_, index) => (
                <div 
                  className="raindrop" 
                  key={index} 
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    animationDuration: `${0.5 + Math.random()}s`,
                    animationDelay: `${Math.random()}s`
                  }}
                ></div>
              ))}
            </div>
          </>
        );
      case 'Snow':
        return (
          <>
            {renderClouds()}
            <div className="snow-container">
              {Array.from({ length: 50 }).map((_, index) => (
                <div 
                  className="snowflake" 
                  key={index} 
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    animationDuration: `${5 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                >
                  ❄
                </div>
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Function to determine background gradient based on weather condition
  const getBackgroundGradient = () => {
    if (weatherDescription.toLowerCase().includes('clear')) {
      return 'linear-gradient(to bottom, #003366, #1a6db6)';
    } else if (weatherDescription.toLowerCase().includes('clouds')) {
      return 'linear-gradient(to bottom, #4b6cb7, #182848)';
    } else if (weatherDescription.toLowerCase().includes('rain')) {
      return 'linear-gradient(to bottom, #616161, #9bc5c3)';
    } else if (weatherDescription.toLowerCase().includes('snow')) {
      return 'linear-gradient(to bottom, #83a4d4, #b6fbff)';
    } else {
      return 'linear-gradient(to bottom, #2c3e50, #4ca1af)'; // Default gradient
    }
  };

  return (
    <div className="App" style={{
      minHeight: '100vh',
      backgroundImage: getBackgroundGradient(),
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-image 1s ease-in-out',
    }}>
      <canvas ref={canvasRef} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}} />
      <div className="container mt-5" style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 className="text-center" style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Weather Dashboard</h1>

        <div className="input-group mb-3">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter city" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
          />
          <button className="btn btn-primary" onClick={() => handleSearch()} disabled={isLoading}>
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              'Search'
            )}
          </button>
          <button className="btn btn-secondary" onClick={toggleUnit} disabled={isLoading}>
            Toggle to {unit === 'metric' ? 'Fahrenheit' : 'Celsius'}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {weatherData && (
              <div className="weather-info card p-3 mt-3">
                <h2 className="card-title">{weatherData.name}</h2>
                <i className={`${weatherIcons[weatherData.weather[0].main]} icon-large`} />
                <p className="mb-2">Temperature: {weatherData.main.temp} {unit === 'metric' ? '°C' : '°F'}</p>
                <p className="mb-2">Feels Like: {weatherData.main.feels_like} {unit === 'metric' ? '°C' : '°F'}</p>
                <p className="mb-2">Humidity: {weatherData.main.humidity}%</p>
                <p className="mb-2">Wind Speed: {weatherData.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</p>
                <p className="mb-2">Weather: {weatherData.weather[0].description}</p>
                <button onClick={addToFavorites} className="btn btn-primary">
                  Add to Favorites
                </button>
              </div>
            )}

            {forecastData && (
              <div className="forecast mt-4">
                <h3>5-Day Forecast</h3>
                <div className="row row-cols-1 row-cols-md-5 g-3">
                  {forecastData.list.filter((item, index) => index % 8 === 0).map((item, index) => (
                    <div key={index} className="col">
                      <div className="card p-3 h-100 text-center">
                        <p>{new Date(item.dt_txt).toLocaleDateString()}</p>
                        <i className={`${weatherIcons[item.weather[0].main]} icon-small`} />
                        <p>Temp: {item.main.temp} {unit === 'metric' ? '°C' : '°F'}</p>
                        <p>{item.weather[0].description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4">
          <h3>Favorite Cities</h3>
          <ul className="list-group">
            {favoriteCities.map((favCity, index) => (
              <li 
                key={index} 
                className="list-group-item list-group-item-action" 
                onClick={() => handleFavoriteClick(favCity)}
                style={{ cursor: 'pointer' }}
              >
                {favCity}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
