import { Button } from "@/components/ui/button";
import { Rocket, Smartphone, Settings } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Rocket,
      title: "Modern Architecture",
      description: "Built with React 18, hooks, and modern JavaScript patterns for optimal performance.",
      color: "bg-blue-600"
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Fully responsive layout that works perfectly on all devices and screen sizes.",
      color: "bg-emerald-500"
    },
    {
      icon: Settings,
      title: "Easy to Customize",
      description: "Clean, well-documented code that's easy to understand and modify.",
      color: "bg-amber-500"
    }
  ];

  const stats = [
    { value: "50+", label: "Components", color: "text-blue-600" },
    { value: "100%", label: "Responsive", color: "text-emerald-500" },
    { value: "10k+", label: "Downloads", color: "text-amber-500" },
    { value: "5★", label: "Rating", color: "text-red-500" }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              Modern React <span className="text-blue-200">Template</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto animate-slide-up">
              A comprehensive React application template with modern best practices, routing, and responsive design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transform transition-all duration-200"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Key Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to build modern web applications with React
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-slate-50 p-8 rounded-xl hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-xl custom-shadow">
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Download the template and start building your next React application today.
          </p>
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transform transition-all duration-200"
          >
            Download Template
          </Button>
        </div>
      </section>
    </div>
  );
}
