import { AppDataSource } from './src/data-source';

async function addTestExampleImage() {
  try {
    await AppDataSource.initialize();

    // 更新淘宝平台的第一条截图配置
    const result = await AppDataSource.query(`
      UPDATE platform_image_requirements
      SET
        "exampleImagePath" = $1,
        "pathHint" = $2
      WHERE id IN (
        SELECT id FROM platform_image_requirements
        WHERE "platformId" = (SELECT id FROM platforms WHERE code = 'taobao')
        ORDER BY "sortOrder"
        LIMIT 1
      )
      RETURNING id, label;
    `, [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7npLrot6bkuLvpobXmiKrlm548L3RleHQ+PC9zdmc+',
      '我的淘宝 > 账号设置 > 账号信息'
    ]);

    console.log('✅ 测试数据已添加:', result);

    // 验证
    const check = await AppDataSource.query(`
      SELECT key, label, LEFT("exampleImagePath", 50) as example_preview, "pathHint"
      FROM platform_image_requirements
      WHERE "platformId" = (SELECT id FROM platforms WHERE code = 'taobao')
      ORDER BY "sortOrder";
    `);

    console.log('\n当前淘宝平台的截图配置:');
    console.table(check);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

addTestExampleImage();
