import { useState } from "react";

export default function EditorPropiedad({ propiedad, onActualizada }) {
  const [titulo, setTitulo] = useState(propiedad.title);
  const [direccion, setDireccion] = useState(propiedad.address || "");
  const [descripcion, setDescripcion] = useState(propiedad.description);
  const [precio, setPrecio] = useState(propiedad.price);
  const [imagenes, setImageenes] = useState(propiedad.images || []);

  // Format number with commas
  const formatearPrecio = (precio) => {
    if (!precio) return precio;
    // Remove any existing commas and non-numeric characters except decimal point
    const cleanPrice = precio.toString().replace(/[^\d.]/g, '');
    // Add commas for thousands
    return cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [tipo, setTipo] = useState(propiedad.type || "");
  const [habitaciones, setHabitaciones] = useState(propiedad.bedrooms || "");
  const [banos, setBanos] = useState(propiedad.bathrooms || "");
  const [area, setArea] = useState(propiedad.area || "");
  const [contacto, setContacto] = useState(propiedad.contact || "");

  const actualizar = async () => {
    try {
      const response = await fetch(`/api/properties/${propiedad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: titulo,
          address: direccion,
          description: descripcion,
          price: precio,
          images: imagenes,
          type: tipo,
          bedrooms: habitaciones,
          bathrooms: banos,
          area: area,
          contact: contacto
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onActualizada();
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  const agregarImagen = () => {
    const nuevaUrl = prompt("Introduce la URL de la imagen:");
    if (nuevaUrl && nuevaUrl.trim()) {
      const nuevas = [...imagenes, nuevaUrl.trim()];
      setImagenes(nuevas);
    }
  };

  const subirArchivos = async (files) => {
    if (files.length === 0) return;
    
    setSubiendoImagenes(true);
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
      const nuevasImagenes = [...imagenes, ...result.urls];
      setImagenes(nuevasImagenes);
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      alert('Error al subir las imágenes: ' + error.message);
    } finally {
      setSubiendoImagenes(false);
    }
  };

  const manejarSeleccionArchivos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      subirArchivos(files);
    }
    e.target.value = ''; // Reset file input
  };

  const eliminarImagen = (url) => {
    const nuevas = imagenes.filter((img) => img !== url);
    setImagenes(nuevas);
  };

  return (
    <div className="border p-4 mt-2 rounded bg-gray-50">
      <h3 className="font-bold mb-3">Editar propiedad</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input 
          className="border p-2 rounded" 
          placeholder="Título"
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
        />
        
        <select
          className="border p-2 rounded"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
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
        className="border p-2 rounded mb-3 w-full" 
        placeholder="Dirección"
        value={direccion} 
        onChange={(e) => setDireccion(e.target.value)} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input 
          className="border p-2 rounded" 
          placeholder="Precio"
          value={precio} 
          onChange={(e) => setPrecio(e.target.value)} 
        />
        
        <input 
          className="border p-2 rounded" 
          placeholder="Habitaciones"
          type="number"
          value={habitaciones} 
          onChange={(e) => setHabitaciones(e.target.value)} 
        />
        
        <input 
          className="border p-2 rounded" 
          placeholder="Baños"
          type="number"
          step="0.5"
          value={banos} 
          onChange={(e) => setBanos(e.target.value)} 
        />
        
        <input 
          className="border p-2 rounded" 
          placeholder="Área en m²"
          type="number"
          value={area} 
          onChange={(e) => setArea(e.target.value)} 
        />
      </div>
      
      <textarea 
        className="border p-2 mb-3 w-full h-20 rounded" 
        placeholder="Descripción"
        value={descripcion} 
        onChange={(e) => setDescripcion(e.target.value)} 
      />
      
      <input 
        className="border p-2 mb-3 w-full rounded" 
        placeholder="Información de contacto"
        value={contacto} 
        onChange={(e) => setContacto(e.target.value)} 
      />

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Imágenes</label>
          <div className="flex gap-2">
            <label className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer">
              📁 Subir desde dispositivo
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={manejarSeleccionArchivos}
                className="hidden"
                disabled={subiendoImagenes}
              />
            </label>
            <button
              onClick={agregarImagen}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              disabled={subiendoImagenes}
            >
              🔗 URL imagen
            </button>
          </div>
        </div>
        
        {subiendoImagenes && (
          <div className="mb-2 text-sm text-blue-600 flex items-center">
            <div className="animate-spin mr-2">⏳</div>
            Subiendo imágenes...
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {imagenes.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24">
              <img src={img} alt="prop" className="w-full h-full object-cover rounded" />
              <button
                onClick={() => eliminarImagen(img)}
                className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={actualizar} className="cuba-button-primary w-full">
        💾 Guardar cambios
      </button>
    </div>
  );
}