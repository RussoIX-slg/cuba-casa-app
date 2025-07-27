import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import EditorPropiedad from "./EditorPropiedad";

export default function MapaPublico({ user }) {
  const [propiedades, setPropiedades] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [propiedadEnEdicion, setPropiedadEnEdicion] = useState(null);

  const [marcadorDragable, setMarcadorDragable] = useState(null);
  const [mostrarFormularioPropiedad, setMostrarFormularioPropiedad] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const [ubicacionMarcador, setUbicacionMarcador] = useState({ lat: 22.4069, lng: -79.9673 });
  const [nuevaPropiedad, setNuevaPropiedad] = useState({ 
    title: "", 
    address: "",
    description: "", 
    price: "", 
    images: [""],
    bedrooms: "",
    bathrooms: "",
    area: "",
    type: "",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: ""
  });
  const [subiendoImagenesCreacion, setSubiendoImagenesCreacion] = useState(false);
  const [visorFotos, setVisorFotos] = useState({ visible: false, fotos: [], indiceActual: 0, tituloPropiedad: '' });
  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Load properties - this component serves dual purpose
  useEffect(() => {
    const cargar = async () => {
      try {
        let url = "/api/properties";
        // If user is logged in, show only their properties (owner mode)
        // If user is not logged in, show all properties (public mode)
        if (user) {
          url += `?userId=${user.id}`;
        }
        
        const response = await fetch(url, { credentials: 'include' });
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
  }, [user]); // Depend on user so it reloads when login/logout happens

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([22.4069, -79.9673], 9);
    
    // Set bounds to limit the map to Cuba and surrounding islands
    const cubaBounds = L.latLngBounds(
      [19.8, -85.0], // Southwest corner (bottom-left)
      [23.5, -74.0]  // Northeast corner (top-right)
    );
    
    map.setMaxBounds(cubaBounds);
    map.setMinZoom(6);
    map.setMaxZoom(18);
    
    // Base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    });
    

    
    // Add default layer
    osmLayer.addTo(map);
    
    // Layer control
    const baseLayers = {
      "Mapa": osmLayer,
      "Satelital": satelliteLayer
    };
    
    L.control.layers(baseLayers).addTo(map);
    
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

    const centerMarker = L.marker([22.4069, -79.9673], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    // Keep marker centered when map moves (unless being dragged)
    let isDragging = false;
    
    const updateMarkerPosition = () => {
      if (!isDragging && map && centerMarker) {
        const center = map.getCenter();
        centerMarker.setLatLng(center);
        setUbicacionMarcador({ lat: center.lat, lng: center.lng });
      }
    };

    // Handle drag events
    centerMarker.on('dragstart', () => {
      isDragging = true;
    });

    centerMarker.on('drag', (e) => {
      const position = e.target.getLatLng();
      setUbicacionMarcador({ lat: position.lat, lng: position.lng });
    });

    centerMarker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      setUbicacionMarcador({ lat: position.lat, lng: position.lng });
      
      // Re-enable auto-centering after a delay
      setTimeout(() => {
        isDragging = false;
      }, 2000); // 2 seconds delay before re-enabling auto-center
    });

    // Listen for map movement events to keep marker centered
    map.on('moveend', updateMarkerPosition);
    map.on('zoomend', updateMarkerPosition);
    
    // Initial position update
    updateMarkerPosition();

    setMarcadorDragable(centerMarker);

    return () => {
      if (centerMarker) {
        centerMarker.remove();
      }
    };
  }, [user]);

  // Make editing functions global when user is authenticated (owner mode)
  useEffect(() => {
    if (user) {
      window.editarPropiedad = (id) => {
        const propiedad = propiedades.find(p => p.id === id);
        if (propiedad) {
          setPropiedadEnEdicion(propiedad);
        }
      };
      
      window.eliminarPropiedad = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) {
          try {
            const response = await fetch(`/api/properties/${id}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Reload properties after deletion
            const reloadResponse = await fetch("/api/properties", { credentials: 'include' });
            if (reloadResponse.ok) {
              const updatedProps = await reloadResponse.json();
              setPropiedades(updatedProps || []);
            }

            alert('Propiedad eliminada exitosamente');
          } catch (error) {
            console.error("Error eliminando propiedad:", error);
            alert("Error al eliminar la propiedad");
          }
        }
      };
    }

    // Define global function for photo viewer
    window.abrirVisorFotos = (fotos, indiceInicial, tituloPropiedad) => {
      const fotosArray = Array.isArray(fotos) ? fotos : JSON.parse(fotos);
      const fotosValidas = fotosArray.filter(foto => foto && foto.trim() !== '');
      if (fotosValidas.length === 0) return;
      
      setVisorFotos({
        visible: true,
        fotos: fotosValidas,
        indiceActual: indiceInicial || 0,
        tituloPropiedad: tituloPropiedad || ''
      });
    };
    
    return () => {
      if (user) {
        delete window.editarPropiedad;
        delete window.eliminarPropiedad;
      }
      delete window.abrirVisorFotos;
    };
  }, [propiedades, user]);

  // Update property markers with clustering and dynamic sizing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Only clear and recreate if there are actual changes to properties OR user authentication changed
    // Store current property IDs for comparison
    const currentPropertyIds = propiedades.map(p => p.id).sort().join(',');
    const currentUserStatus = user ? `user-${user.id}` : 'no-user';
    
    if (map._lastPropertyIds === currentPropertyIds && 
        map._lastUserStatus === currentUserStatus && 
        map._propertyMarkerCluster) {
      // No changes in properties or user status
      return;
    }
    
    map._lastPropertyIds = currentPropertyIds;
    map._lastUserStatus = currentUserStatus;

    // Clear existing property markers and clusters
    if (map._propertyMarkerCluster) {
      map.removeLayer(map._propertyMarkerCluster);
    }
    
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer.options.draggable) {
        map.removeLayer(layer);
      }
    });

    // Create marker cluster group
    const markerClusterGroup = new L.MarkerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 15,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const properties = cluster.getAllChildMarkers();
        
        // Count unique properties by checking if they have property data and are not draggable
        const uniqueProperties = new Set();
        properties.forEach(marker => {
          if (marker.options && !marker.options.draggable && marker._propertyId) {
            uniqueProperties.add(marker._propertyId);
          }
        });
        
        const displayCount = uniqueProperties.size || count;
        

        
        let clusterSize, fontSize;
        if (displayCount < 5) {
          clusterSize = 35;
          fontSize = 12;
        } else if (displayCount < 15) {
          clusterSize = 45;
          fontSize = 14;
        } else if (displayCount < 50) {
          clusterSize = 55;
          fontSize = 16;
        } else {
          clusterSize = 65;
          fontSize = 18;
        }
        
        return new L.DivIcon({
          html: `<div style="
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${fontSize}px;
            width: ${clusterSize}px;
            height: ${clusterSize}px;
            position: relative;
          ">${displayCount}
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            background: #059669;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">🏠</div>
          </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(clusterSize, clusterSize),
          iconAnchor: [clusterSize/2, clusterSize/2]
        });
      }
    });

    // Function to create dynamic property icon based on zoom level
    const createPropertyIcon = (zoom) => {
      let size, fontSize;
      
      if (zoom <= 8) {
        size = 10;
        fontSize = 6;
      } else if (zoom <= 12) {
        size = 16;
        fontSize = 8;
      } else {
        size = 22;
        fontSize = 10;
      }
      
      return L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border-radius: 50%;
          font-size: ${fontSize}px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          transition: all 0.2s ease;
        ">🏠</div>`,
        className: 'custom-property-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    };


    
    // Add markers to cluster group
    propiedades.forEach(prop => {
      if (prop.lat && prop.lng) {
        const currentZoom = map.getZoom();
        const propertyIcon = createPropertyIcon(currentZoom);
        
        const marker = L.marker([parseFloat(prop.lat), parseFloat(prop.lng)], {
          icon: propertyIcon,
          draggable: false
        });
        
        // Add property ID to marker for unique counting
        marker._propertyId = prop.id;

        // Check if user is authenticated and owns this property (for owner mode)
        const isOwner = user && (prop.user_id === user.id.toString() || prop.user_id === user.id);
        
        // Debug ownership check
        console.log('Ownership check:', {
          hasUser: !!user,
          userId: user?.id,
          userIdType: typeof user?.id,
          propUserId: prop.user_id,
          propUserIdType: typeof prop.user_id,
          isOwner,
          propTitle: prop.title
        });
        
        // Get first image for preview and all valid images
        const validImages = prop.images && Array.isArray(prop.images) 
          ? prop.images.filter(img => img && img.trim())
          : [];
        const firstImage = validImages.length > 0 ? validImages[0] : null;

        const popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 320px; padding: 12px;">
            ${firstImage ? `
              <div style="margin: -12px -12px 12px -12px; position: relative;">
                <img src="${firstImage}" 
                     alt="${prop.title}" 
                     style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px 8px 0 0; cursor: pointer;"
                     onclick="abrirVisorFotos(${JSON.stringify(validImages).replace(/"/g, '&quot;')}, 0, '${prop.title.replace(/'/g, '&#39;')}')"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div style="display: none; width: 100%; height: 180px; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 8px 8px 0 0; align-items: center; justify-content: center; color: #6b7280; font-size: 14px;">
                  📷 Imagen no disponible
                </div>
                ${validImages.length > 1 ? `
                  <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                    +${validImages.length - 1} más
                  </div>
                ` : ''}
              </div>
            ` : ''}
            ${validImages.length > 1 ? `
              <div style="margin: 0 0 12px 0;">
                <div style="display: flex; gap: 6px; overflow-x: auto; padding: 4px 0;">
                  ${validImages.slice(0, 4).map((img, idx) => `
                    <img src="${img}" 
                         alt="Foto ${idx + 1}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${idx === 0 ? '#dc2626' : '#e5e7eb'}; flex-shrink: 0;"
                         onclick="abrirVisorFotos(${JSON.stringify(validImages).replace(/"/g, '&quot;')}, ${idx}, '${prop.title.replace(/'/g, '&#39;')}')"
                         onerror="this.style.display='none';" />
                  `).join('')}
                  ${validImages.length > 4 ? `
                    <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 11px; font-weight: 500; cursor: pointer; border: 2px solid #e5e7eb;"
                         onclick="abrirVisorFotos(${JSON.stringify(validImages).replace(/"/g, '&quot;')}, 4, '${prop.title.replace(/'/g, '&#39;')}')">
                      +${validImages.length - 4}
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px; font-weight: bold;">${prop.title}</h3>
            ${prop.address ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px; font-weight: 500;">📍 ${prop.address}</p>` : ''}
            <p style="margin: 6px 0; color: #374151; font-size: 13px; line-height: 1.4;">${prop.description}</p>
            <div style="margin: 8px 0; padding: 6px 0; border-top: 1px solid #e5e7eb;">
              ${prop.type ? `<p style="margin: 2px 0; font-size: 12px; color: #6b7280;">🏠 Tipo: <strong>${prop.type}</strong></p>` : ''}
              ${prop.bedrooms ? `<p style="margin: 2px 0; font-size: 12px; color: #6b7280;">🛏️ Habitaciones: <strong>${prop.bedrooms}</strong></p>` : ''}
              ${prop.bathrooms ? `<p style="margin: 2px 0; font-size: 12px; color: #6b7280;">🚿 Baños: <strong>${prop.bathrooms}</strong></p>` : ''}
              ${prop.area ? `<p style="margin: 2px 0; font-size: 12px; color: #6b7280;">📐 Área: <strong>${prop.area} m²</strong></p>` : ''}
            </div>
            <p style="margin: 8px 0 0 0; color: #059669; font-size: 18px; font-weight: bold;">💰 ${formatearPrecio(prop.price)}</p>
            ${prop.contact ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #3b82f6; border-top: 1px solid #e5e7eb; padding-top: 6px;">📞 <strong>${prop.contact}</strong></p>` : ''}
            ${isOwner ? `
              <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button onclick="editarPropiedad(${prop.id})" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500;">✏️ Editar</button>
                <button onclick="eliminarPropiedad(${prop.id})" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500;">🗑️ Eliminar</button>
              </div>
            ` : ''}
          </div>
        `;

        // Create popup with larger size to accommodate image
        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'property-popup'
        });
        markerClusterGroup.addLayer(marker);
      }
    });

    // Add cluster group to map
    map.addLayer(markerClusterGroup);

    // Update marker sizes when zoom changes
    const updateMarkerSizes = () => {
      const currentZoom = map.getZoom();
      
      markerClusterGroup.eachLayer((marker) => {
        const newIcon = createPropertyIcon(currentZoom);
        marker.setIcon(newIcon);
      });
    };

    // Listen for zoom events to update marker sizes
    map.on('zoomend', updateMarkerSizes);

    // Store references for cleanup
    map._propertyMarkerCluster = markerClusterGroup;
    map._updateMarkerSizes = updateMarkerSizes;

  }, [propiedades]);

  const confirmarUbicacion = () => {
    setUbicacionSeleccionada(ubicacionMarcador);
  };

  const resetearUbicacion = () => {
    setUbicacionSeleccionada(null);
  };

  const subirArchivosCreacion = async (files) => {
    if (files.length === 0) return;
    
    setSubiendoImagenesCreacion(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error al subir: ${response.status}`);
      }

      const result = await response.json();
      // Filter out empty strings and add new URLs
      const currentImages = nuevaPropiedad.images.filter(img => img.trim());
      const newImages = [...currentImages, ...result.urls];
      setNuevaPropiedad({...nuevaPropiedad, images: newImages});
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      alert('Error al subir las imágenes: ' + error.message);
    } finally {
      setSubiendoImagenesCreacion(false);
    }
  };

  const manejarSeleccionArchivosCreacion = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      subirArchivosCreacion(files);
    }
    e.target.value = ''; // Reset file input
  };



  const buscarUbicacion = async (query) => {
    if (!query.trim()) return;
    
    setBuscando(true);
    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Cuba')}&limit=5&countrycodes=cu&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        
        // Center map on the found location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 12);
        }
        
        // Optional: Show a temporary marker at the searched location
        if (mapInstanceRef.current) {
          // Remove any existing search marker
          if (mapInstanceRef.current._searchMarker) {
            mapInstanceRef.current.removeLayer(mapInstanceRef.current._searchMarker);
          }
          
          // Add new search marker
          const searchIcon = L.divIcon({
            html: `<div style="
              background: #059669;
              color: white;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
            ">📍</div>`,
            className: 'search-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          mapInstanceRef.current._searchMarker = L.marker([lat, lng], {
            icon: searchIcon,
            draggable: false
          }).addTo(mapInstanceRef.current);
          
          // Remove search marker after 5 seconds
          setTimeout(() => {
            if (mapInstanceRef.current && mapInstanceRef.current._searchMarker) {
              mapInstanceRef.current.removeLayer(mapInstanceRef.current._searchMarker);
              mapInstanceRef.current._searchMarker = null;
            }
          }, 5000);
        }
        
      } else {
        alert('No se encontraron resultados para esa búsqueda en Cuba');
      }
    } catch (error) {
      console.error('Error buscando ubicación:', error);
      alert('Error al buscar la ubicación');
    } finally {
      setBuscando(false);
    }
  };

  const manejarBusqueda = (e) => {
    e.preventDefault();
    if (busqueda.trim()) {
      buscarUbicacion(busqueda.trim());
    }
  };

  // Make photo viewer function globally accessible
  useEffect(() => {
    window.abrirVisorFotos = (fotos, indice, titulo) => {
      console.log('Llamando abrirVisorFotos:', { fotos, indice, titulo });
      
      // Handle different types of input for fotos
      let fotosArray;
      if (typeof fotos === 'string') {
        try {
          fotosArray = JSON.parse(fotos);
        } catch (e) {
          fotosArray = [fotos];
        }
      } else if (Array.isArray(fotos)) {
        fotosArray = fotos;
      } else {
        fotosArray = [];
      }
      
      const fotosValidas = fotosArray.filter(img => img && img.trim());
      console.log('Fotos válidas:', fotosValidas);
      
      if (fotosValidas.length > 0) {
        setVisorFotos({
          visible: true,
          fotos: fotosValidas,
          indiceActual: indice || 0,
          tituloPropiedad: titulo || ''
        });
      }
    };

    // Cleanup function to remove global function
    return () => {
      delete window.abrirVisorFotos;
    };
  }, []);

  // Keyboard navigation for photo viewer
  useEffect(() => {
    if (!visorFotos.visible) return;

    const manejarTeclas = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setVisorFotos(prev => ({
            ...prev,
            indiceActual: prev.indiceActual === 0 ? prev.fotos.length - 1 : prev.indiceActual - 1
          }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setVisorFotos(prev => ({
            ...prev,
            indiceActual: (prev.indiceActual + 1) % prev.fotos.length
          }));
          break;
        case 'Escape':
          e.preventDefault();
          setVisorFotos({ visible: false, fotos: [], indiceActual: 0, tituloPropiedad: '' });
          break;
      }
    };

    document.addEventListener('keydown', manejarTeclas);
    return () => document.removeEventListener('keydown', manejarTeclas);
  }, [visorFotos.visible]);



  // Format number with commas
  const formatearPrecio = (precio) => {
    if (!precio) return precio;
    // Remove any existing commas and non-numeric characters except decimal point
    const cleanPrice = precio.toString().replace(/[^\d.]/g, '');
    // Add commas for thousands
    return cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const crearPropiedad = async () => {
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          title: nuevaPropiedad.title,
          address: nuevaPropiedad.address,
          description: nuevaPropiedad.description,
          price: nuevaPropiedad.price,
          lat: ubicacionSeleccionada.lat,
          lng: ubicacionSeleccionada.lng,
          images: nuevaPropiedad.images.filter(img => img.trim()),
          bedrooms: nuevaPropiedad.bedrooms,
          bathrooms: nuevaPropiedad.bathrooms,
          area: nuevaPropiedad.area,
          type: nuevaPropiedad.type,
          contact: `${nuevaPropiedad.sellerName} | ${nuevaPropiedad.sellerEmail} | ${nuevaPropiedad.sellerPhone}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form and reload properties
      setNuevaPropiedad({ 
        title: "", 
        address: "",
        description: "", 
        price: "", 
        images: [""],
        bedrooms: "",
        bathrooms: "",
        area: "",
        type: "",
        sellerName: "",
        sellerEmail: "",
        sellerPhone: ""
      });
      setMostrarFormularioPropiedad(false);
      setUbicacionSeleccionada(null);

      // Reload properties
      const reloadResponse = await fetch("/api/properties", { credentials: 'include' });
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
    <div className="mt-4 relative">
      {/* Search Bar */}
      <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full flex justify-center px-2 sm:px-4">
        <form onSubmit={manejarBusqueda} className="flex items-center bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 w-full max-w-sm sm:max-w-md">
          <input
            type="text"
            placeholder="Buscar zona..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-3 sm:px-4 py-2 w-full rounded-l-lg sm:rounded-l-xl border-none focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm sm:text-base"
            disabled={buscando}
          />
          <button
            type="submit"
            disabled={buscando || !busqueda.trim()}
            className="px-3 sm:px-4 py-2 bg-sky-400 text-white rounded-r-lg sm:rounded-r-xl hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {buscando ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>
      </div>
      {/* Instructions for authenticated users */}
      {user && !ubicacionSeleccionada && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center">
            <button 
              onClick={confirmarUbicacion}
              className="cuba-button-primary px-8 py-4 text-lg font-bold relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #87ceeb 0%, #5dade2 50%, #b3e5fc 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(135, 206, 235, 0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 32px rgba(135, 206, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(135, 206, 235, 0.3)';
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                🏡 Confirmar y Crear Propiedad
              </span>
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
            className="cuba-button-secondary px-6 py-3 text-base font-semibold mr-4"
          >
            🔄 Cambiar ubicación
          </button>
          <button 
            onClick={() => setMostrarFormularioPropiedad(true)}
            className="cuba-button-primary px-8 py-4 text-lg font-bold"
          >
            ➕ Crear Propiedad Aquí
          </button>
        </div>
      )}

      <div ref={mapRef} style={{ height: "70vh", width: "100%" }} className="sm:h-[80vh]" />

      {/* Property editor */}
      {propiedadEnEdicion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar Propiedad</h2>
              <button
                onClick={() => setPropiedadEnEdicion(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <EditorPropiedad
                propiedad={propiedadEnEdicion}
                onActualizada={() => {
                  setPropiedadEnEdicion(null);
                  // Reload properties
                  fetch("/api/properties", { credentials: 'include' })
                    .then(response => response.json())
                    .then(data => setPropiedades(data || []))
                    .catch(error => console.error("Error reloading properties:", error));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property creation form */}
      {mostrarFormularioPropiedad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-green-700">📝 Crear Nueva Propiedad</h3>
              <button
                onClick={() => setMostrarFormularioPropiedad(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Información básica de la propiedad */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">🏠 Información de la Propiedad</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Título de la propiedad *"
                  value={nuevaPropiedad.title}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, title: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                
                <select
                  value={nuevaPropiedad.type}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, type: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Tipo de propiedad</option>
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Local Comercial">Local Comercial</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              
              <input
                type="text"
                placeholder="Dirección completa de la propiedad *"
                value={nuevaPropiedad.address}
                onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, address: e.target.value})}
                className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
              
              <input
                type="text"
                placeholder="Precio (ej: $50,000 USD, 500,000 CUP) *"
                value={nuevaPropiedad.price}
                onChange={(e) => {
                  const formattedPrice = formatearPrecio(e.target.value);
                  setNuevaPropiedad({...nuevaPropiedad, price: formattedPrice});
                }}
                className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
              
              <textarea
                placeholder="Descripción detallada de la propiedad *"
                value={nuevaPropiedad.description}
                onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, description: e.target.value})}
                className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
              
              <div className="grid grid-cols-3 gap-3 mt-3">
                <input
                  type="number"
                  placeholder="Habitaciones"
                  value={nuevaPropiedad.bedrooms}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, bedrooms: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="0"
                />
                
                <input
                  type="number"
                  placeholder="Baños"
                  value={nuevaPropiedad.bathrooms}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, bathrooms: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="0"
                  step="0.5"
                />
                
                <input
                  type="number"
                  placeholder="Área en m²"
                  value={nuevaPropiedad.area}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, area: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="0"
                />
              </div>
            </div>
            
            {/* Datos del vendedor */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">👤 Datos del Vendedor</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevaPropiedad.sellerName}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, sellerName: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <input
                  type="email"
                  placeholder="Email *"
                  value={nuevaPropiedad.sellerEmail}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, sellerEmail: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={nuevaPropiedad.sellerPhone}
                  onChange={(e) => setNuevaPropiedad({...nuevaPropiedad, sellerPhone: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Fotos de la propiedad */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-700 border-b pb-2">📷 Fotos de la Propiedad (máximo 7)</h4>
                <div className="flex gap-2">
                  <label className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer">
                    📁 Subir desde dispositivo
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={manejarSeleccionArchivosCreacion}
                      className="hidden"
                      disabled={subiendoImagenesCreacion}
                    />
                  </label>
                  {nuevaPropiedad.images.length < 7 && (
                    <button
                      onClick={() => setNuevaPropiedad({...nuevaPropiedad, images: [...nuevaPropiedad.images, ""]})}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-100 px-3 py-1 rounded"
                      disabled={subiendoImagenesCreacion}
                    >
                      🔗 URL
                    </button>
                  )}
                </div>
              </div>
              
              {subiendoImagenesCreacion && (
                <div className="mb-3 text-sm text-blue-600 flex items-center">
                  <div className="animate-spin mr-2">⏳</div>
                  Subiendo imágenes...
                </div>
              )}
              
              {/* Display uploaded images as thumbnails */}
              {nuevaPropiedad.images.filter(img => img.trim()).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Imágenes subidas:</h5>
                  <div className="flex flex-wrap gap-2">
                    {nuevaPropiedad.images.filter(img => img.trim()).map((img, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={img} 
                          alt={`Imagen ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border shadow-sm"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyNUM0NS41MjI4IDI1IDUwIDI5LjQ3NzIgNTAgMzVDNTAgNDAuNTIyOCA0NS41MjI4IDQ1IDQwIDQ1QzM0LjQ3NzIgNDUgMzAgNDAuNTIyOCAzMCAzNUMzMCAyOS40NzcyIDM0LjQ3NzIgMjUgNDAgMjVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA1NUwyNS44NTc5IDQ5LjE0MjFMMzUgNTguMjg0M0w0NC4xNDIxIDQ5LjE0MjFMNjAgNjVINjBWNzBINjBIMjBWNTVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        <button
                          onClick={() => {
                            const newImages = nuevaPropiedad.images.filter((_, i) => i !== nuevaPropiedad.images.indexOf(img));
                            setNuevaPropiedad({...nuevaPropiedad, images: newImages.length > 0 ? newImages : [""]});
                          }}
                          className="absolute -top-1 -right-1 bg-sky-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-sky-500"
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* URL inputs for additional images */}
              {nuevaPropiedad.images.map((img, index) => (
                <div key={index} className={`flex gap-2 mb-2 ${img.trim() && img.startsWith('/uploads/') ? 'hidden' : ''}`}>
                  <span className="flex items-center justify-center w-8 h-10 bg-gray-100 rounded text-sm font-medium">
                    {nuevaPropiedad.images.filter(i => i.trim() && !i.startsWith('/uploads/')).indexOf(img) + nuevaPropiedad.images.filter(i => i.startsWith('/uploads/')).length + 1}
                  </span>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={img}
                    onChange={(e) => {
                      const newImages = [...nuevaPropiedad.images];
                      newImages[index] = e.target.value;
                      setNuevaPropiedad({...nuevaPropiedad, images: newImages});
                    }}
                    className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {nuevaPropiedad.images.length > 1 && (
                    <button
                      onClick={() => {
                        const newImages = nuevaPropiedad.images.filter((_, i) => i !== index);
                        setNuevaPropiedad({...nuevaPropiedad, images: newImages.length > 0 ? newImages : [""]});
                      }}
                      className="px-3 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3 mt-8 pt-4 border-t">
              <button
                onClick={() => setMostrarFormularioPropiedad(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={crearPropiedad}
                className="flex-1 px-6 py-3 bg-sky-400 text-white rounded-lg hover:bg-sky-500 font-semibold transition-colors shadow-md"
                disabled={!nuevaPropiedad.title || !nuevaPropiedad.address || !nuevaPropiedad.description || !nuevaPropiedad.price || !nuevaPropiedad.sellerName || !nuevaPropiedad.sellerEmail || !nuevaPropiedad.sellerPhone}
              >
                ✅ Confirmar y Crear Propiedad
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              * Campos obligatorios. La propiedad aparecerá inmediatamente en el mapa público después de confirmar.
            </p>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {visorFotos.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999]"
             onClick={() => setVisorFotos({ visible: false, fotos: [], indiceActual: 0, tituloPropiedad: '' })}>
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center p-4">
            
            {/* Close button */}
            <button
              onClick={() => setVisorFotos({ visible: false, fotos: [], indiceActual: 0, tituloPropiedad: '' })}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
              style={{ fontSize: '24px' }}
            >
              ✕
            </button>
            
            {/* Property title */}
            <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              <h3 className="font-semibold text-lg">{visorFotos.tituloPropiedad}</h3>
              <p className="text-sm opacity-80">
                {visorFotos.indiceActual + 1} de {visorFotos.fotos.length}
              </p>
            </div>
            
            {/* Previous button */}
            {visorFotos.fotos.length > 1 && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setVisorFotos(prev => ({
                    ...prev,
                    indiceActual: prev.indiceActual === 0 ? prev.fotos.length - 1 : prev.indiceActual - 1
                  }));
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                style={{ fontSize: '24px' }}
              >
                ← 
              </button>
            )}
            
            {/* Next button */}
            {visorFotos.fotos.length > 1 && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setVisorFotos(prev => ({
                    ...prev,
                    indiceActual: (prev.indiceActual + 1) % prev.fotos.length
                  }));
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                style={{ fontSize: '24px' }}
              >
                →
              </button>
            )}
            
            {/* Main image */}
            <img
              src={visorFotos.fotos[visorFotos.indiceActual]}
              alt={`${visorFotos.tituloPropiedad} - Foto ${visorFotos.indiceActual + 1}`}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwQzIyNy42MTQgMTAwIDI1MCA2Ny42MTQyIDI1MCA0MEM0MCAxMjcuNjE0IDY3LjM4NTggMTAwIDEwMCAxMDBDMTcyLjM4NiAxMDAgMjAwIDEyNy42MTQgMjAwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN0cm9rZSBwYXRoPSJNMTAwIDIwMEwxNTAgMTUwTDIyNSAxNzVMMjc1IDEyNUwzNTAgMjAwSDEwMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjwvcGF0aD4KPHRleHQgeD0iMjAwIiB5PSIyNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+Cjwvc3ZnPgo=';
              }}
            />
            
            {/* Thumbnail navigation */}
            {visorFotos.fotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-black bg-opacity-50 p-2 rounded-lg">
                  <div className="flex gap-2 max-w-xs overflow-x-auto">
                    {visorFotos.fotos.map((foto, idx) => (
                      <img
                        key={idx}
                        src={foto}
                        alt={`Miniatura ${idx + 1}`}
                        className={`w-12 h-12 object-cover rounded cursor-pointer transition-all ${
                          idx === visorFotos.indiceActual 
                            ? 'border-2 border-white opacity-100' 
                            : 'border border-gray-400 opacity-60 hover:opacity-80'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setVisorFotos(prev => ({ ...prev, indiceActual: idx }));
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Keyboard navigation instructions */}
            {visorFotos.fotos.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 text-white text-sm opacity-70">
                Usa las flechas ← → o haz clic en los botones para navegar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}