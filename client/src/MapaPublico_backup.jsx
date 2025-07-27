import { useEffect, useRef, useState } from "react";
import L from "leaflet";

export default function MapaPublico({ user }) {
  const [propiedades, setPropiedades] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [marcadorDragable, setMarcadorDragable] = useState(null);
  const [mostrarFormularioPropiedad, setMostrarFormularioPropiedad] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const [ubicacionMarcador, setUbicacionMarcador] = useState({ lat: 23.1136, lng: -82.3666 });
  const [nuevaPropiedad, setNuevaPropiedad] = useState({ title: "", description: "", price: "", images: [""] });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Load properties
  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await fetch("/api/properties");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPropiedades(data || []);
      } catch (err) {
        console.error("Error cargando propiedades:", err);
        setPropiedades([]);
      }
    };
    cargar();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([23.1136, -82.3666], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add draggable marker for authenticated users
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !user) {
      if (marcadorDragable) {
        marcadorDragable.remove();
        setMarcadorDragable(null);
      }
      return;
    }

    // Remove existing marker
    if (marcadorDragable) {
      marcadorDragable.remove();
    }

    // Create pin-shaped marker
    const pinIcon = L.divIcon({
      html: `<div style="
        width: 20px;
        height: 30px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 3px;
          left: 3px;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>`,
      className: 'custom-div-icon',
      iconSize: [20, 30],
      iconAnchor: [10, 30]
    });

    const centerMarker = L.marker([23.1136, -82.3666], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    // Handle drag events
    centerMarker.on('drag', (e) => {
      const position = e.target.getLatLng();
      setUbicacionMarcador({ lat: position.lat, lng: position.lng });
    });

    centerMarker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      setUbicacionMarcador({ lat: position.lat, lng: position.lng });
    });

    setMarcadorDragable(centerMarker);

    return () => {
      if (centerMarker) {
        centerMarker.remove();
      }
    };
  }, [user]);

  // Update property markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing property markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer.options.draggable) {
        map.removeLayer(layer);
      }
    });

    // Add red markers for properties
    propiedades.forEach(prop => {
      if (prop.lat && prop.lng) {
        const redIcon = L.divIcon({
          html: `<div style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 50%; font-size: 14px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">🏠</div>`,
          className: 'custom-property-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([parseFloat(prop.lat), parseFloat(prop.lng)], {
          icon: redIcon,
          draggable: false
        }).addTo(map);

        const popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 250px; padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px; font-weight: bold;">${prop.title}</h3>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">${prop.description}</p>
            <p style="margin: 8px 0 0 0; color: #059669; font-size: 16px; font-weight: bold;">${prop.price}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });
  }, [propiedades]);

  const confirmarUbicacion = () => {
    setUbicacionSeleccionada(ubicacionMarcador);
  };

  const resetearUbicacion = () => {
    setUbicacionSeleccionada(null);
  };

  const crearPropiedad = async () => {
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nuevaPropiedad.title,
          description: nuevaPropiedad.description,
          price: nuevaPropiedad.price,
          lat: ubicacionSeleccionada.lat,
          lng: ubicacionSeleccionada.lng,
          images: nuevaPropiedad.images.filter(img => img.trim())
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form and reload properties
      setNuevaPropiedad({ title: "", description: "", price: "", images: [""] });
      setMostrarFormularioPropiedad(false);
      setUbicacionSeleccionada(null);

      // Reload properties
      const reloadResponse = await fetch("/api/properties");
      if (reloadResponse.ok) {
        const updatedProps = await reloadResponse.json();
        setPropiedades(updatedProps || []);
      }

    } catch (error) {
      console.error("Error creando propiedad:", error);
      alert("Error al crear la propiedad");
    }
  };

  return (
    <div className="mt-4">
      {/* Instructions for authenticated users */}
      {user && !ubicacionSeleccionada && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">🎯 Crear Propiedad</h3>
          <p className="text-green-700 text-sm mb-3">
            1. Arrastra el pin verde a la ubicación exacta donde quieres crear tu propiedad<br/>
            2. Haz clic en "Confirmar ubicación" para establecer el punto donde aparecerá el marcador rojo
          </p>
          
          <div className="flex items-center gap-3 bg-white p-3 rounded border">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">
                📍 Ubicación del pin:
              </span>
              <p className="text-sm text-gray-600">
                Lat: {ubicacionMarcador.lat.toFixed(4)}, Lng: {ubicacionMarcador.lng.toFixed(4)}
              </p>
            </div>
            <button 
              onClick={confirmarUbicacion}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition-colors"
            >
              ✅ Confirmar ubicación
            </button>
          </div>
        </div>
      )}

      {/* Add property button */}
      {user && ubicacionSeleccionada && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
          <div className="flex-1">
            <h3 className="font-semibold text-green-800">📍 Ubicación Confirmada</h3>
            <p className="text-green-700 text-sm">
              El marcador rojo aparecerá en: Lat: {ubicacionSeleccionada.lat.toFixed(4)}, Lng: {ubicacionSeleccionada.lng.toFixed(4)}
            </p>
          </div>
          <button 
            onClick={resetearUbicacion}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors mr-2"
          >
            🔄 Cambiar ubicación
          </button>
          <button 
            onClick={() => setMostrarFormularioPropiedad(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all"
          >
            ➕ Crear Propiedad Aquí
          </button>
        </div>
      )}

      <div ref={mapRef} style={{ height: "80vh", width: "100%" }} />

      {/* Property creation form */}
      {mostrarFormularioPropiedad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Crear Nueva Propiedad</h3>
            
            <input
              type="text"
              placeholder="Título"
              value={nuevaPropiedad.title}
              onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, title: e.target.value})}
              className="w-full p-2 border rounded mb-3"
            />
            
            <textarea
              placeholder="Descripción"
              value={nuevaPropiedad.description}
              onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, description: e.target.value})}
              className="w-full p-2 border rounded mb-3 h-20"
            />
            
            <input
              type="text"
              placeholder="Precio"
              value={nuevaPropiedad.price}
              onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, price: e.target.value})}
              className="w-full p-2 border rounded mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFormularioPropiedad(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={crearPropiedad}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}