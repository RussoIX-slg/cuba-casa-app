const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Cuba Casa API is running!',
    timestamp: new Date().toISOString()
  });
});

// Properties API
app.get('/api/properties', (req, res) => {
  res.json([
    {
      id: 1,
      title: "Casa en La Habana",
      address: "Centro Habana",
      price: "$50,000",
      lat: 23.1136,
      lng: -82.3666
    },
    {
      id: 2, 
      title: "Apartamento en Vedado",
      address: "El Vedado",
      price: "$75,000",
      lat: 23.1319,
      lng: -82.3831
    }
  ]);
});

// Main page
app.get('*', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuba Casa - Mapa de Propiedades</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
    
    .header {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-left: 4px solid #c41e3a;
    }
    
    .header h1 {
      color: #c41e3a;
      font-size: 28px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
    
    #map {
      height: 100vh;
      width: 100%;
    }
    
    .leaflet-popup-content h3 {
      color: #c41e3a;
      margin-bottom: 10px;
    }
    
    .leaflet-popup-content p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏠 Cuba Casa</h1>
    <p>Encuentra propiedades en Cuba</p>
  </div>
  
  <div id="map"></div>
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialize map centered on Cuba
    const map = L.map('map').setView([23.1136, -82.3666], 7);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Custom marker icon
    const houseIcon = L.divIcon({
      html: '🏠',
      iconSize: [30, 30],
      className: 'custom-marker'
    });
    
    // Load and display properties
    fetch('/api/properties')
      .then(response => response.json())
      .then(properties => {
        console.log('Propiedades cargadas:', properties.length);
        
        properties.forEach(property => {
          L.marker([property.lat, property.lng], {icon: houseIcon})
            .addTo(map)
            .bindPopup(\`
              <div style="min-width: 200px;">
                <h3>\${property.title}</h3>
                <p><strong>📍 Dirección:</strong> \${property.address}</p>
                <p><strong>💰 Precio:</strong> \${property.price}</p>
                <p style="margin-top: 10px; font-size: 12px; color: #888;">
                  Haz clic para más detalles
                </p>
              </div>
            \`);
        });
      })
      .catch(error => {
        console.error('Error cargando propiedades:', error);
      });
  </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Cuba Casa server running on port ' + PORT);
  console.log('Visit: http://localhost:' + PORT);
});