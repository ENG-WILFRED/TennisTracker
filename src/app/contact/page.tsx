"use client";

import PageHeader from "@/components/PageHeader";
import { Mail, Phone, MapPin, Clock, User, Award } from "lucide-react";
import { useState } from "react";

export default function ContactPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string; id?: string; name?: string; email?: string }> 
}) {
  return <ContactContent searchParams={searchParams} />;
}

async function ContactContent({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string; id?: string; name?: string; email?: string }> 
}) {
  const params = await searchParams;
  const contactType = params.type || 'club';
  const entityId = params.id;
  const entityName = params.name;
  const entityEmail = params.email;

  const baseContactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "info@tennisclub.com",
      description: "Send us your inquiries"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+254 (0) 123-456-789",
      description: "Call us during business hours"
    },
    {
      icon: MapPin,
      title: "Location",
      content: "Pwani University Tennis Courts",
      description: "Main Campus, Kilifi County"
    },
    {
      icon: Clock,
      title: "Hours",
      content: "Mon - Sun, 6:00 AM - 6:00 PM",
      description: "Courts are open year-round"
    }
  ];

  let pageTitle = "Contact Us";
  let pageDescription = "Get in touch with our tennis club management team";
  let contextInfo = null;

  if (contactType === 'coach' && entityId && entityName) {
    pageTitle = `Contact Coach`;
    pageDescription = `Get in touch with ${entityName}`;
    contextInfo = {
      type: 'coach',
      name: entityName,
      id: entityId,
      email: `coach.${entityId}@tennisclub.com`,
      phone: "+254 (0) 123-456-789 ext. 101"
    };
  } else if (contactType === 'player' && entityId && entityName) {
    pageTitle = `Contact Player`;
    pageDescription = `Get in touch with ${entityName}`;
    contextInfo = {
      type: 'player',
      name: entityName,
      id: entityId,
      email: `player.${entityId}@tennisclub.com`,
      phone: "+254 (0) 123-456-789 ext. 102"
    };
  }

  return (
    <main className="min-h-screen py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 w-full px-4">
      <div className="w-full">
        <PageHeader
          title={pageTitle}
          description={pageDescription}
          navItems={[{ label: "Home", href: "/" }]}
        />

        {/* Context Banner */}
        {contextInfo && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {contextInfo.type === 'coach' ? (
                  <Award className="w-6 h-6" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-sm text-emerald-100 uppercase tracking-wide">
                  {contextInfo.type === 'coach' ? 'Coach' : 'Player'}
                </div>
                <div className="text-2xl font-bold">{contextInfo.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {baseContactInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-600 font-medium mb-1">
                      {item.title === 'Email' && contextInfo ? contextInfo.email : item.content}
                    </p>
                    <p className="text-slate-600 font-medium mb-1">
                      {item.title === 'Phone' && contextInfo ? contextInfo.phone : ''}
                    </p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two Column Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Form Section */}
          <ContactForm contextInfo={contextInfo} />

          {/* Operating Hours / Context Info Section */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white flex flex-col justify-center">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-6">
                  {contextInfo ? 'Availability' : 'Court Operating Hours'}
                </h3>
                <div className="space-y-3 text-emerald-50">
                  {contextInfo ? (
                    <>
                      <div>
                        <p className="font-semibold">Contact Type</p>
                        <p className="capitalize">{contextInfo.type}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Name</p>
                        <p>{contextInfo.name}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Direct Email</p>
                        <p>{contextInfo.email}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Direct Phone</p>
                        <p>{contextInfo.phone}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold">Monday to Friday</p>
                        <p>6:00 AM - 8:00 PM</p>
                      </div>
                      <div>
                        <p className="font-semibold">Saturday & Sunday</p>
                        <p>7:00 AM - 6:00 PM</p>
                      </div>
                      <div>
                        <p className="font-semibold">Public Holidays</p>
                        <p>Closed</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
function ContactForm({ contextInfo }: { contextInfo: any }) {
  const [formData, setFormData] = useState({
    name: '',
    email: contextInfo?.email || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    // Reset form
    setFormData({
      name: '',
      email: contextInfo?.email || '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {contextInfo ? `Message ${contextInfo.name}` : 'Send us a Message'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="How can we help?"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Your message here..."
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </form>
    </div>
  );
}