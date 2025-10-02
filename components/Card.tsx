import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, icon }) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
      <div className="flex items-center gap-4 mb-5">
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default Card;