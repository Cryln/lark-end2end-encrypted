// 算法配置类型定义
export type AlgorithmConfig = {
  name: string;
  supported: boolean;
  description: string;
};

export type SupportedAlgorithmConfig = AlgorithmConfig & {
  generateOptions: {
    name: string;
    [key: string]: any;
  };
};