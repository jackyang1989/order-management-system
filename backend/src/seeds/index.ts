import { DataSource } from 'typeorm';
import { seedHelpArticles } from './help-articles.seed';

/**
 * 运行所有种子数据
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('开始初始化种子数据...');

  await seedHelpArticles(dataSource);

  console.log('种子数据初始化完成');
}
