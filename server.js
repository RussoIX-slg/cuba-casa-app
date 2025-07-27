import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Cuba Casa API is running!',
    timestamp: new Date().toISOString()
  });
});

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

// Serve main page
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cuba Casa - Property Map</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .header { 
          position: absolute; 
          top: 20px; 
          left: 20px; 
          z-index: 1000; 
          background: white; 
          padding: 15px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 { 
          margin: 0; 
          color: #c41e3a; 
          font-size: 24px; 
        }
        .header p { 
          margin: 5px 0 0 0; 
          color: #666; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 Cuba Casa</h1>
        <p>Mapa de Propiedades en Cuba</p>
      </div>
      <div id="map"></div>
      
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Initialize map
        const map = L.map('map').setView([23.1136, -82.3666], 7);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Load properties
        fetch('/api/properties')
          .then(response => response.json())
          .then(properties => {
            properties.forEach(property => {
              L.marker([property.lat, property.lng])
                .addTo(map)
                .bindPopup(\`
                  <div>
                    <h3>\${property.title}</h3>
                    <p><strong>Dirección:</strong> \${property.address}</p>
                    <p><strong>Precio:</strong> \${property.price}</p>
                  </div>
                \`);
            });
          })
          .catch(error => console.error('Error loading properties:', error));
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Cuba Casa server running on port \${PORT}\`);
});