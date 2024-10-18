import React from 'react';

const tokenomicsData = [
  { name: "Public Sale", value: 20, color: "#4CAF50" },
  { name: "Team", value: 15, color: "#2196F3" },
  { name: "Marketing", value: 10, color: "#FFC107" },
  { name: "Development", value: 25, color: "#9C27B0" },
  { name: "Reserve", value: 30, color: "#FF5722" },
];

function Tokenomics() {
  const total = tokenomicsData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="py-16 bg-[#16213e]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Tokenomics</h2>
        <div className="flex flex-col md:flex-row justify-center items-center">
          <div className="w-full md:w-1/2 mb-8 md:mb-0">
            <svg viewBox="0 0 100 100" className="w-full max-w-sm mx-auto">
              {tokenomicsData.map((item, index) => {
                const startAngle = currentAngle;
                const sliceAngle = (item.value / total) * 360;
                currentAngle += sliceAngle;
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * currentAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * currentAngle) / 180);
                const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                return (
                  <path
                    key={index}
                    d={`M50 50 L${x1} ${y1} A50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                  />
                );
              })}
              <circle cx="50" cy="50" r="25" fill="#16213e" />
            </svg>
          </div>
          <div className="w-full md:w-1/2">
            {tokenomicsData.map((item, index) => (
              <div key={index} className="flex items-center mb-4">
                <div className="w-4 h-4 mr-3" style={{ backgroundColor: item.color }}></div>
                <span className="text-white">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tokenomics;