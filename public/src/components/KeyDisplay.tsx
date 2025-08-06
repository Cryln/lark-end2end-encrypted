import React from 'react';

interface KeyDisplayProps {
  label: string;
  value: string;
  id: string;
}

/**
 * 密钥显示组件
 * @param label - 标签文本
 * @param value - 密钥值
 * @param id - HTML元素ID
 */
const KeyDisplay: React.FC<KeyDisplayProps> = ({ label, value, id }) => {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="block text-sm text-white/80 mb-1">{label}:</label>
      <textarea
        id={id}
        value={value}
        readOnly
        className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white h-[80px] overflow-auto"
        placeholder={`生成的${label.toLowerCase()}将显示在这里...`}
      ></textarea>
    </div>
  );
};

export default KeyDisplay;