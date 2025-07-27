import { useEffect, useState } from "react";
import EditorPropiedad from "./EditorPropiedad";

export default function PanelPropiedades({ user }) {
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const cargarPropiedades = async () => {
    try {
      const response = await fetch('/api/properties', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Filter properties for current user
      const userProperties = data.filter(prop => prop.user_id === user?.id);
      setMisPropiedades(userProperties);
    } catch (error) {
      console.error("Error cargando propiedades:", error);
      setMisPropiedades([]);
    }
  };

  const agregarPropiedad = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: titulo,
          description: descripcion,
          price: precio,
          lat: "23.1136",
          lng: "-82.3666",
          user_id: user.id,
          images: [],
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setTitulo("");
      setDescripcion("");
      setPrecio("");
      cargarPropiedades();
    } catch (error) {
      alert("Error al agregar propiedad: " + error.message);
    }
  };

  const eliminarPropiedad = async (id) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      cargarPropiedades();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  useEffect(() => {
    if (user) {
      cargarPropiedades();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Add New Property Section */}
      <div className="border p-4 rounded shadow bg-white">
        <h2 className="text-xl font-bold mb-4 text-green-700">➕ Agregar Nueva Propiedad</h2>
        <p className="text-gray-600 text-sm mb-4">
          Completa los datos básicos o arrastra el marcador verde en el mapa para seleccionar una ubicación específica.
        </p>
        
        <form onSubmit={agregarPropiedad} className="flex flex-col gap-3">
          <input 
            className="border p-3 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            placeholder="Título de la propiedad" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)} 
            required
          />
          <input 
            className="border p-3 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            placeholder="Precio (ej: $50,000)" 
            value={precio} 
            onChange={(e) => setPrecio(e.target.value)} 
            required
          />
          <textarea 
            className="border p-3 rounded h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            placeholder="Descripción de la propiedad" 
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
            required
          />
          <button 
            type="submit" 
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold transition-colors"
          >
            ✅ Crear Propiedad
          </button>
        </form>
      </div>

      {/* Existing Properties Section */}
      <div className="border p-4 rounded shadow bg-white">
        <h2 className="text-xl font-bold mb-4 text-blue-700">🏠 Mis Propiedades ({misPropiedades.length})</h2>
        
        {misPropiedades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No has publicado propiedades aún.</p>
            <p className="text-sm text-gray-400">Usa el formulario de arriba para crear tu primera propiedad.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {misPropiedades.map((prop) => (
              <li key={prop.id} className="border p-2 rounded shadow bg-white">
                <h3 className="font-semibold">{prop.title}</h3>
                <p>{prop.description}</p>
                <p className="text-green-700 font-bold">{prop.price}</p>

                {prop.images && prop.images.length > 0 && (
                  <img src={prop.images[0]} alt="preview" className="w-full max-w-xs my-2 rounded" />
                )}

                <EditorPropiedad propiedad={prop} onActualizada={cargarPropiedades} />

                <button onClick={() => eliminarPropiedad(prop.id)} className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                  Eliminar propiedad
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}