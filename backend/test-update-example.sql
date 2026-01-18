-- 更新淘宝平台的第一条截图配置，添加测试数据
UPDATE platform_image_requirements
SET
  "exampleImagePath" = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7npLrot6bkuLvpobXmiKrlm548L3RleHQ+PC9zdmc+',
  "pathHint" = '我的淘宝 > 账号设置 > 账号信息'
WHERE id IN (
  SELECT id FROM platform_image_requirements
  WHERE "platformId" = (SELECT id FROM platforms WHERE code = 'taobao')
  ORDER BY "sortOrder"
  LIMIT 1
);
