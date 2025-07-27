import { Button } from "@/components/ui/button";
import { Code, Smartphone, TrendingUp } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: Code,
      title: "Web Development",
      description: "Custom web applications built with modern frameworks and best practices.",
      price: "$99/hr",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "React Native applications for iOS and Android platforms.",
      price: "$149/hr",
      color: "bg-emerald-100",
      iconColor: "text-emerald-600",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      icon: TrendingUp,
      title: "Consulting",
      description: "Technical consulting and architecture review services.",
      price: "$199/hr",
      color: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonColor: "bg-amber-600 hover:bg-amber-700"
    }
  ];

  return (
    <div className="animate-fade-in">
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Our Services
            </h1>
            <p className="text-xl text-slate-600">
              Comprehensive solutions for modern web development
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-16 h-16 ${service.color} rounded-lg flex items-center justify-center mb-6`}>
                    <IconComponent className={service.iconColor} size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">{service.title}</h3>
                  <p className="text-slate-600 mb-6">{service.description}</p>
                  <div className={`text-2xl font-bold ${service.iconColor} mb-4`}>{service.price}</div>
                  <Button className={`w-full ${service.buttonColor}`}>
                    Choose Plan
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
