/**
 * 缓存服务使用示例
 */
import CacheService from './cache';

// 示例1: 存储和获取字符串
function exampleString() {
  // 存储字符串
  CacheService.set('username', '张三');
  // 获取字符串
  const username = CacheService.get<string>('username');
  console.log('用户名:', username);
}

// 示例2: 存储和获取对象
function exampleObject() {
  // 存储对象
  const userInfo = {
    id: 1,
    name: '李四',
    age: 30
  };
  CacheService.set('userInfo', userInfo);
  // 获取对象
  const cachedUserInfo = CacheService.get<{id: number, name: string, age: number}>('userInfo');
  console.log('用户信息:', cachedUserInfo);
}

// 示例3: 带过期时间的缓存
function exampleWithExpire() {
  // 存储带过期时间的缓存(5秒后过期)
  CacheService.set('tempData', '这是临时数据', 5000);
  console.log('临时数据(存储时):', CacheService.get<string>('tempData'));

  // 6秒后再次获取
  setTimeout(() => {
    console.log('临时数据(6秒后):', CacheService.get<string>('tempData'));
  }, 6000);
}

// 示例4: 删除和检查缓存
function exampleRemoveAndHas() {
  CacheService.set('testKey', '测试值');
  console.log('是否存在testKey:', CacheService.has('testKey'));
  CacheService.remove('testKey');
  console.log('删除后是否存在testKey:', CacheService.has('testKey'));
}

// 示例5: 清除所有缓存
function exampleClear() {
  CacheService.set('key1', '值1');
  CacheService.set('key2', '值2');
  console.log('清除前key1:', CacheService.get<string>('key1'));
  console.log('清除前key2:', CacheService.get<string>('key2'));
  CacheService.clear();
  console.log('清除后key1:', CacheService.get<string>('key1'));
  console.log('清除后key2:', CacheService.get<string>('key2'));
}

// 执行所有示例
function runAllExamples() {
  console.log('===== 缓存服务示例开始 =====');
  exampleString();
  exampleObject();
  exampleWithExpire();
  exampleRemoveAndHas();
  exampleClear();
  console.log('===== 缓存服务示例结束 =====');
}

export default runAllExamples;