export default function About() {
  const technologies = [
    { name: "React 18", icon: "⚛️" },
    { name: "React Router", icon: "🛣️" },
    { name: "Tailwind CSS", icon: "🎨" },
    { name: "Responsive Design", icon: "📱" }
  ];

  return (
    <div className="animate-fade-in">
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              About This Template
            </h1>
            <p className="text-xl text-slate-600">
              Learn about the technologies and principles behind this React template
            </p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-slate-50 p-8 rounded-xl mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Built with Modern Technologies</h2>
              <p className="text-slate-600 mb-4">
                This template showcases modern React development practices including functional components, 
                hooks, context API, and React Router for navigation.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {technologies.map((tech, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-2xl mr-3">{tech.icon}</span>
                    <span className="font-semibold">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Development Principles</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  This template follows React best practices and modern development patterns:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Component-based architecture for reusability</li>
                  <li>React hooks for state management</li>
                  <li>TypeScript for type safety</li>
                  <li>Responsive design with mobile-first approach</li>
                  <li>Clean, maintainable code structure</li>
                  <li>Performance optimizations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
