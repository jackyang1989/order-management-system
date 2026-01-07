# Task Hall 400 Fix Notes

## 根因
前端把 UI 筛选字段直接透传到 NestJS `/tasks`，ValidationPipe 开启 `forbidNonWhitelisted`，请求中包含未声明字段会报 `property <field> should not exist`，导致 400。

## 后端允许的 query 白名单
来源：`backend/src/tasks/task.entity.ts` 中 `TaskFilterDto`
- `status?: number`
- `taskType?: number`
- `search?: string`
- `minCommission?: number`
- `maxCommission?: number`

## 修复措施
- 在 `taskService.fetchTaskHall` 内通过 `pickAllowedTaskQuery` 仅拼接上述白名单字段，其他字段一律不入 query。
- `/tasks` 页面仅把允许的字段传给 service，其他筛选（若有）在前端列表结果上本地过滤。
- 真实接口优先；mock 仅在 `NEXT_PUBLIC_USE_MOCK_TASKS=true` 且请求失败时兜底，默认关闭，不改变跳转路径。

## 验收步骤（3 步）
1) 打开 http://localhost:6005/tasks ，确认 Network 请求 `GET http://localhost:6006/tasks` 返回 200/2xx，无 `property xxx should not exist` 报错。
2) 无数据时出现空态；接口报错时出现页面内错误提示和“重试”按钮；有数据正常渲染列表。
3) 若需要验证兜底，在本地设置 `NEXT_PUBLIC_USE_MOCK_TASKS=true` 并禁用后端，页面显示“演示数据”提示且仍可渲染列表（恢复真实接口时关闭该开关）。
