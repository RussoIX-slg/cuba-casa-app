import ContactForm from "@/components/ContactForm";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Contact() {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      content: "123 React Street, Web City, WC 12345",
      color: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+1 (555) 123-4567",
      color: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      icon: Mail,
      title: "Email",
      content: "hello@reacttemplate.com",
      color: "bg-amber-100",
      iconColor: "text-amber-600"
    }
  ];

  return (
    <div className="animate-fade-in">
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Get In Touch
            </h1>
            <p className="text-xl text-slate-600">
              Ready to start your next project? Let's discuss your requirements.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
            
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start">
                      <div className={`w-10 h-10 ${info.color} rounded-lg flex items-center justify-center mr-4`}>
                        <IconComponent className={info.iconColor} size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{info.title}</h3>
                        <p className="text-slate-600">{info.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
