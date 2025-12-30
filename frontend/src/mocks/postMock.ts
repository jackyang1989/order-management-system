// 创建 Mock 仓库：严禁在 page.tsx 中定义大段 JSON
export const mockPosts = [
    {
        id: '1',
        title: '示例订单 #1',
        content: '这是一个模拟的订单详情内容。',
        status: 'PENDING',
        createdAt: '2023-01-01T10:00:00Z'
    },
    {
        id: '2',
        title: '示例订单 #2',
        content: '这是另一个模拟订单。',
        status: 'COMPLETED',
        createdAt: '2023-01-02T11:00:00Z'
    }
];
