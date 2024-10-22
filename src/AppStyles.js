import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: Arial, sans-serif;
  }

  .App {
    min-height: 100vh;
    background-image: url('https://source.unsplash.com/1600x900/?nature,landscape');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }

  .container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .card {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
  }

  .list-group-item {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    transition: all 0.3s ease;
  }

  .list-group-item:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: translateX(5px);
  }

  h1, h2, h3, p {
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .icon-large {
    font-size: 3rem;
    margin-bottom: 15px;
  }

  .icon-small {
    font-size: 2rem;
    margin-bottom: 10px;
  }
`;
