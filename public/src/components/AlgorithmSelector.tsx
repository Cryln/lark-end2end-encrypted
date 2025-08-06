import { SUPPORTED_ALGORITHMS } from '../constants/algorithms';

interface AlgorithmSelectorProps {
  value: string;
  onChange: (algorithm: string) => void;
}

/**
 * 算法选择器组件
 * @param value - 当前选中的算法
 * @param onChange - 算法变更时的回调函数
 */
const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="algorithm" className="text-white font-medium">算法:</label>
      <select
        id="algorithm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white"
      >
        {Object.entries(SUPPORTED_ALGORITHMS).map(([key, algo]) => (
          <option key={key} value={key}>
            {algo.name} ({algo.supported ? '支持' : '浏览器不支持'})
          </option>
        ))}
      </select>
    </div>
  );
};

export default AlgorithmSelector;