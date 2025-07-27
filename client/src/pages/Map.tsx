import Map from "@/components/Map";

export default function MapPage() {
  const sampleMarkers = [
    {
      position: [40.7128, -74.0060] as [number, number],
      popup: "New York City - The Big Apple"
    },
    {
      position: [40.7589, -73.9851] as [number, number],
      popup: "Times Square - The Crossroads of the World"
    },
    {
      position: [40.6892, -74.0445] as [number, number],
      popup: "Statue of Liberty - Symbol of Freedom"
    }
  ];

  return (
    <div className="animate-fade-in">
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Interactive Map
            </h1>
            <p className="text-xl text-slate-600">
              Explore locations with our interactive map powered by Leaflet
            </p>
          </div>
          
          <div className="grid gap-8">
            {/* Main Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  New York City Landmarks
                </h2>
                <Map 
                  center={[40.7128, -74.0060]}
                  zoom={12}
                  markers={sampleMarkers}
                  className="h-96"
                />
              </div>
            </div>

            {/* Map Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  Map Features
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Interactive zoom and pan
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Custom markers with popups
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    OpenStreetMap tiles
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Responsive design
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  Locations
                </h3>
                <div className="space-y-3">
                  {sampleMarkers.map((marker, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {marker.popup?.split(' - ')[0]}
                        </div>
                        <div className="text-sm text-slate-600">
                          {marker.popup?.split(' - ')[1]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}