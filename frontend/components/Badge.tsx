import React from 'react';

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }) => {
  // Using the specific style requested: bg-[#EFECEC], text-[#252525], border-[#252525]
  return (
    <span className="px-2 py-0.5 bg-[#EFECEC] text-[#252525] border border-[#252525] text-[10px] font-bold uppercase tracking-wide">
      {text}
    </span>
  );
};

export default Badge;