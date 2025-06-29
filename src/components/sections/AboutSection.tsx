import React, { useEffect, useState } from 'react';

const About: React.FC = (): React.JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className={`text-center transition-all duration-800 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral mb-4">
            About <span className="text-primary">Me</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 px-5 items-center mb-16">
          {/* Profile Photo */}
          <div>
            <img src="/assets/wahyulogo2.png" alt="" />
          </div>

          {/* Introduction Text */}
          <div className='text-center flex flex-row align-middle items-center justify-center text-slate-600 text-sm'>
            <span>Dunia ini terlalu luas untuk saya pahami semuanya, tapi itu justru yang membuatnya menarik. Saya menikmati setiap proses belajar, karena bagi saya mengembangkan diri adalah cara paling jujur untuk bertumbuh</span>
          </div>

          <span className='p-5'>
            <a href="https://www.linkedin.com/in/wahyu-tri-cahyono-2824052b7" className="p-2 btn btn-primary flex flex-row">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-white"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 
              5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 
              19h-3v-10h3v10zm-1.5-11.268c-.966 
              0-1.75-.784-1.75-1.75s.784-1.75 
              1.75-1.75 1.75.784 1.75 1.75-.784 
              1.75-1.75 1.75zm13.5 
              11.268h-3v-5.604c0-1.337-.026-3.063-1.867-3.063-1.868 
              0-2.154 1.46-2.154 
              2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 
              1.381-1.563 2.841-1.563 3.039 0 3.6 
              2.001 3.6 4.604v5.592z"/>
            </svg>
                Connect With Me
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;