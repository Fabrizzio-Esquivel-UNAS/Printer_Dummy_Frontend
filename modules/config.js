// === MODULE: Configuration ===
// Configuración global y constantes de la aplicación

const REQUEST_FILES = {
    restaurant: 'Requests/dataOrderRestaurant.json',
    notaVenta: 'Requests/dataNotadeVenta.json',
    factura: 'Requests/dataFactura.json',
    boleta: 'Requests/dataBoleta.json'
};

// API Configuration
let API_URL = '';

// Current Platform Detection
let currentPlatform = 'unknown'; // 'windows', 'android', 'ios'
