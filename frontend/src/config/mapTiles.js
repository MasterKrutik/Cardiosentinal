export const MAP_TILE_CONFIG = {
  // CARTO Voyager: High contrast, English place labels & map background
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  // CARTO Dark Matter: Dark theme matching CardioSentinel UI
  darkUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
  subdomains: 'abcd'
};

export default MAP_TILE_CONFIG;
