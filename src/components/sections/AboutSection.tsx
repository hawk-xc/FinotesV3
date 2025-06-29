import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Heart, Code, Coffee, Palette } from 'lucide-react';

const About: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const skills = [
    { icon: Code, name: 'Development', color: 'text-blue-500' },
    { icon: Palette, name: 'Design', color: 'text-purple-500' },
    { icon: Coffee, name: 'Problem Solving', color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className={`text-center mb-16 transition-all duration-800 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral mb-4">
            About <span className="text-primary">Me</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Profile Photo */}
          <div className={`flex justify-center md:justify-end transition-all duration-1000 delay-200 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/5212320/pexels-photo-5212320.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                  alt="Profile"
                  className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 rounded-full ring-4 ring-primary ring-opacity-20 group-hover:ring-opacity-40 transition-all duration-300"></div>
              </div>
            </div>
          </div>

          {/* Introduction Text */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="card-body">
                <h2 className="card-title text-2xl md:text-3xl text-neutral mb-4">
                  Hello, I'm <span className="text-primary">Alex</span>
                </h2>
                
                <p className="text-lg text-secondary leading-relaxed mb-4">
                  I'm a passionate full-stack developer with a love for creating beautiful, 
                  functional, and user-centered digital experiences. With over 5 years of 
                  experience in web development, I specialize in modern technologies and 
                  clean, maintainable code.
                </p>
                
                <p className="text-lg text-secondary leading-relaxed mb-6">
                  When I'm not coding, you'll find me exploring new technologies, 
                  contributing to open-source projects, or enjoying a good cup of coffee 
                  while sketching out my next big idea.
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="badge badge-primary badge-lg">React</div>
                  <div className="badge badge-secondary badge-lg">TypeScript</div>
                  <div className="badge badge-accent badge-lg">Node.js</div>
                  <div className="badge badge-success badge-lg">Tailwind CSS</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="btn btn-primary group hover:scale-105 transition-transform duration-200">
                    <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    Get In Touch
                  </button>
                  <button className="btn btn-outline hover:scale-105 transition-transform duration-200">
                    <MapPin className="w-4 h-4" />
                    San Francisco, CA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h3 className="text-2xl md:text-3xl font-bold text-center text-neutral mb-8">
            What I <span className="text-primary">Love</span> Doing
          </h3>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <div 
                key={skill.name}
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                style={{ animationDelay: `${800 + index * 200}ms` }}
              >
                <div className="card-body items-center text-center">
                  <skill.icon className={`w-12 h-12 ${skill.color} mb-4 group-hover:scale-110 transition-transform duration-200`} />
                  <h4 className="card-title text-lg text-neutral">{skill.name}</h4>
                  <p className="text-secondary">
                    {skill.name === 'Development' && 'Building robust applications with modern technologies'}
                    {skill.name === 'Design' && 'Creating intuitive and beautiful user interfaces'}
                    {skill.name === 'Problem Solving' && 'Finding elegant solutions to complex challenges'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Section */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl">
            <div className="card-body">
              <Heart className="w-8 h-8 mx-auto mb-4 animate-pulse" />
              <blockquote className="text-xl md:text-2xl font-medium italic">
                "Code is like humor. When you have to explain it, it's bad."
              </blockquote>
              <p className="text-primary-content/80 mt-4">- Cory House</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;