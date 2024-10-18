import React from 'react';

const roadmapData = [
  { phase: "Phase 1", title: "Project Launch", description: "Lorem ipsum is simply dummy text" },
  { phase: "Phase 2", title: "Platform Development", description: "Lorem ipsum is simply dummy text" },
  { phase: "Phase 3", title: "Token Listing", description: "Lorem ipsum is simply dummy text" },
  { phase: "Phase 4", title: "Ecosystem Expansion", description: "Lorem ipsum is simply dummy text" },
];

function Roadmap() {
  return (
    <div className="py-16 bg-[#16213e]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Roadmap</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 w-1 bg-green-500 h-full transform md:-translate-x-1/2"></div>
          
          {/* Roadmap items */}
          {roadmapData.map((item, index) => (
            <div key={index} className={`relative mb-12 md:mb-20 ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'} md:w-1/2 md:pl-0`}>
              <div className={`flex items-center mb-4 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2 md:-translate-x-1/2"></div>
                
                {/* Content */}
                <div className={`bg-[#1e2a3a] p-6 rounded-lg shadow-lg ml-12 md:ml-0 ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}>
                  <h3 className="text-green-500 font-bold text-xl mb-2">{item.phase}</h3>
                  <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Roadmap;