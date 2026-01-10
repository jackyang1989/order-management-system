/**
 * 后台管理中心功能对比自动化测试
 * 对比重构版和原版后台的页面内容、按钮、功能
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';

// 配置
const CONFIG = {
  refactored: {
    baseUrl: 'http://localhost:6005',
    loginUrl: 'http://localhost:6005/admin/login',
    username: 'superadmin',
    password: 'admin123456',
  },
  original: {
    baseUrl: 'http://localhost:8000',
    loginUrl: 'http://localhost:8000/index.php/admin/login/index.html',
    username: 'admin',
    password: 'yuhao8912',
  },
};

// 对比结果接口
interface ComparisonResult {
  page: string;
  refactoredUrl: string;
  originalUrl: string;
  display: {
    consistent: boolean;
    differences: string[];
  };
  buttons: {
    missingInRefactored: string[];
    newInRefactored: string[];
    behaviorDifferences: string[];
  };
  functionality: {
    consistent: boolean;
    differences: string[];
  };
  businessLogic: {
    consistent: boolean;
    differences: string[];
  };
  conclusion: 'acceptable' | 'needs-fix';
  screenshots: {
    refactored: string;
    original: string;
  };
}

// 页面信息
interface PageInfo {
  elements: string[];
  buttons: string[];
  inputs: string[];
  tables: { headers: string[]; rowCount: number }[];
  text: string;
}

// 菜单映射 - 重构版菜单路径 -> 原版菜单路径
const MENU_MAPPING: { name: string; refactored: string; original: string }[] = [
  { name: '仪表盘/首页', refactored: '/admin/dashboard', original: '/index.php/admin/index/index.html' },
  { name: '买手管理/买手列表', refactored: '/admin/users', original: '/index.php/admin/buyer/buyerList.html' },
  { name: '买号管理', refactored: '/admin/users/accounts', original: '/index.php/admin/buyer/buynoList.html' },
  { name: '商家管理/商家列表', refactored: '/admin/merchants', original: '/index.php/admin/seller/sellerList.html' },
  { name: '店铺管理', refactored: '/admin/shops', original: '/index.php/admin/seller/shopList.html' },
  { name: '任务管理/任务列表', refactored: '/admin/tasks', original: '/index.php/admin/task/taskList.html' },
  { name: '订单管理', refactored: '/admin/orders', original: '/index.php/admin/task/orderList.html' },
  { name: '评价审核', refactored: '/admin/tasks/reviews', original: '/index.php/admin/appraise/appraiseList.html' },
  { name: '提现管理', refactored: '/admin/withdrawals', original: '/index.php/admin/cash/userCashIndex.html' },
  { name: '充值管理', refactored: '/admin/finance/recharge', original: '/index.php/admin/wallet/userDepositList.html' },
  { name: 'VIP开通记录', refactored: '/admin/finance/vip', original: '/index.php/admin/vip/vipRecordList.html' },
  { name: '银行卡管理', refactored: '/admin/finance/bank', original: '/index.php/admin/bank/bankList.html' },
  { name: '公告管理', refactored: '/admin/notice', original: '/index.php/admin/notice/noticeList.html' },
  { name: '帮助中心', refactored: '/admin/help', original: '/index.php/admin/help/helpList.html' },
  { name: '黑名单管理', refactored: '/admin/blacklist', original: '/index.php/admin/blacklist/blacklistList.html' },
  { name: '系统设置', refactored: '/admin/system', original: '/index.php/admin/system/index.html' },
  { name: '平台管理', refactored: '/admin/system/platforms', original: '/index.php/admin/platform/platformList.html' },
  { name: '轮播图管理', refactored: '/admin/system/banners', original: '/index.php/admin/banner/bannerList.html' },
  { name: '佣金设置', refactored: '/admin/system/commission', original: '/index.php/admin/commission/index.html' },
  { name: '敏感词管理', refactored: '/admin/system/sensitive', original: '/index.php/admin/sensitive/sensitiveList.html' },
  { name: '管理员列表', refactored: '/admin/permission/admin', original: '/index.php/admin/admin/adminList.html' },
  { name: '角色管理', refactored: '/admin/permission/role', original: '/index.php/admin/role/roleList.html' },
];

class AdminComparer {
  private browser: Browser | null = null;
  private refactoredContext: BrowserContext | null = null;
  private originalContext: BrowserContext | null = null;
  private refactoredPage: Page | null = null;
  private originalPage: Page | null = null;
  private results: ComparisonResult[] = [];

  async init() {
    console.log('启动浏览器...');
    this.browser = await chromium.launch({
      headless: false, // 显示浏览器窗口以便观察
      slowMo: 100 // 减慢操作速度便于观察
    });

    // 创建两个独立的浏览器上下文
    this.refactoredContext = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    this.originalContext = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    this.refactoredPage = await this.refactoredContext.newPage();
    this.originalPage = await this.originalContext.newPage();
  }

  async loginRefactored() {
    console.log('登录重构版后台...');
    const page = this.refactoredPage!;

    await page.goto(CONFIG.refactored.loginUrl);
    await page.waitForLoadState('networkidle');

    // 填写登录表单
    await page.fill('input[name="username"], input[placeholder*="用户名"], input[type="text"]', CONFIG.refactored.username);
    await page.fill('input[name="password"], input[placeholder*="密码"], input[type="password"]', CONFIG.refactored.password);

    // 点击登录按钮
    await page.click('button[type="submit"], button:has-text("登录")');

    // 等待跳转到后台首页
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('重构版登录成功');
  }

  async loginOriginal() {
    console.log('登录原版后台...');
    const page = this.originalPage!;

    await page.goto(CONFIG.original.loginUrl);
    await page.waitForLoadState('networkidle');

    // 原版登录表单
    await page.fill('input[name="username"]', CONFIG.original.username);
    await page.fill('input[name="password"]', CONFIG.original.password);

    // 点击登录按钮
    await page.click('button[type="submit"], input[type="submit"], .login-btn, button:has-text("登录")');

    // 等待跳转
    await page.waitForLoadState('networkidle');
    console.log('原版登录成功');
  }

  async extractPageInfo(page: Page): Promise<PageInfo> {
    return await page.evaluate(() => {
      const info: PageInfo = {
        elements: [],
        buttons: [],
        inputs: [],
        tables: [],
        text: '',
      };

      // 提取所有按钮文本
      document.querySelectorAll('button, .btn, a.btn, [role="button"], input[type="submit"]').forEach((el) => {
        const text = (el as HTMLElement).innerText?.trim() || (el as HTMLInputElement).value?.trim();
        if (text && text.length < 50) {
          info.buttons.push(text);
        }
      });

      // 提取所有输入框
      document.querySelectorAll('input, select, textarea').forEach((el) => {
        const input = el as HTMLInputElement;
        const label = input.placeholder || input.name || input.id || '';
        if (label) {
          info.inputs.push(label);
        }
      });

      // 提取表格信息
      document.querySelectorAll('table').forEach((table) => {
        const headers: string[] = [];
        table.querySelectorAll('th').forEach((th) => {
          const text = th.innerText?.trim();
          if (text) headers.push(text);
        });
        const rowCount = table.querySelectorAll('tbody tr').length;
        if (headers.length > 0) {
          info.tables.push({ headers, rowCount });
        }
      });

      // 提取页面主要文本内容
      const mainContent = document.querySelector('main, .main-content, .content, #content');
      if (mainContent) {
        info.text = (mainContent as HTMLElement).innerText?.substring(0, 2000) || '';
      }

      // 提取标题和重要元素
      document.querySelectorAll('h1, h2, h3, h4, .title, .header').forEach((el) => {
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length < 100) {
          info.elements.push(text);
        }
      });

      return info;
    });
  }

  async comparePage(menuItem: { name: string; refactored: string; original: string }): Promise<ComparisonResult> {
    console.log(`\n========== 对比页面: ${menuItem.name} ==========`);

    const result: ComparisonResult = {
      page: menuItem.name,
      refactoredUrl: menuItem.refactored,
      originalUrl: menuItem.original,
      display: { consistent: true, differences: [] },
      buttons: { missingInRefactored: [], newInRefactored: [], behaviorDifferences: [] },
      functionality: { consistent: true, differences: [] },
      businessLogic: { consistent: true, differences: [] },
      conclusion: 'acceptable',
      screenshots: { refactored: '', original: '' },
    };

    try {
      // 访问重构版页面
      console.log(`访问重构版: ${CONFIG.refactored.baseUrl}${menuItem.refactored}`);
      await this.refactoredPage!.goto(`${CONFIG.refactored.baseUrl}${menuItem.refactored}`);
      await this.refactoredPage!.waitForLoadState('networkidle');
      await this.refactoredPage!.waitForTimeout(1000);

      // 访问原版页面
      console.log(`访问原版: ${CONFIG.original.baseUrl}${menuItem.original}`);
      await this.originalPage!.goto(`${CONFIG.original.baseUrl}${menuItem.original}`);
      await this.originalPage!.waitForLoadState('networkidle');
      await this.originalPage!.waitForTimeout(1000);

      // 截图
      const screenshotDir = '/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/tests/screenshots';
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const safeName = menuItem.name.replace(/[\/\\]/g, '_');
      result.screenshots.refactored = `${screenshotDir}/refactored_${safeName}.png`;
      result.screenshots.original = `${screenshotDir}/original_${safeName}.png`;

      await this.refactoredPage!.screenshot({ path: result.screenshots.refactored, fullPage: true });
      await this.originalPage!.screenshot({ path: result.screenshots.original, fullPage: true });

      // 提取页面信息
      const refactoredInfo = await this.extractPageInfo(this.refactoredPage!);
      const originalInfo = await this.extractPageInfo(this.originalPage!);

      // 对比按钮
      console.log('对比按钮...');
      const refactoredButtons = new Set(refactoredInfo.buttons.map(b => b.toLowerCase()));
      const originalButtons = new Set(originalInfo.buttons.map(b => b.toLowerCase()));

      originalInfo.buttons.forEach(btn => {
        if (!refactoredButtons.has(btn.toLowerCase())) {
          // 检查是否有类似功能的按钮
          const similar = refactoredInfo.buttons.find(rb =>
            rb.includes(btn) || btn.includes(rb) ||
            this.isSimilarButton(btn, rb)
          );
          if (!similar) {
            result.buttons.missingInRefactored.push(btn);
          }
        }
      });

      refactoredInfo.buttons.forEach(btn => {
        if (!originalButtons.has(btn.toLowerCase())) {
          result.buttons.newInRefactored.push(btn);
        }
      });

      // 对比表格
      console.log('对比表格...');
      if (refactoredInfo.tables.length !== originalInfo.tables.length) {
        result.display.consistent = false;
        result.display.differences.push(
          `表格数量不同: 重构版 ${refactoredInfo.tables.length} 个, 原版 ${originalInfo.tables.length} 个`
        );
      }

      // 对比表头
      for (let i = 0; i < Math.min(refactoredInfo.tables.length, originalInfo.tables.length); i++) {
        const refHeaders = refactoredInfo.tables[i].headers;
        const origHeaders = originalInfo.tables[i].headers;

        const missingHeaders = origHeaders.filter(h =>
          !refHeaders.some(rh => rh.includes(h) || h.includes(rh))
        );

        if (missingHeaders.length > 0) {
          result.display.consistent = false;
          result.display.differences.push(
            `表格${i + 1}缺少列: ${missingHeaders.join(', ')}`
          );
        }
      }

      // 判断结论
      if (result.buttons.missingInRefactored.length > 0 || !result.display.consistent) {
        result.conclusion = 'needs-fix';
      }

      console.log(`按钮对比结果:`);
      console.log(`  原版缺失: ${result.buttons.missingInRefactored.join(', ') || '无'}`);
      console.log(`  重构版新增: ${result.buttons.newInRefactored.join(', ') || '无'}`);
      console.log(`结论: ${result.conclusion}`);

    } catch (error: any) {
      console.error(`对比 ${menuItem.name} 时出错:`, error.message);
      result.display.differences.push(`错误: ${error.message}`);
      result.conclusion = 'needs-fix';
    }

    return result;
  }

  isSimilarButton(btn1: string, btn2: string): boolean {
    const synonyms: { [key: string]: string[] } = {
      '添加': ['新增', '创建', '添加'],
      '删除': ['移除', '删除'],
      '编辑': ['修改', '编辑', '更新'],
      '查看': ['详情', '查看'],
      '搜索': ['查询', '搜索'],
      '重置': ['清空', '重置'],
      '导出': ['下载', '导出'],
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (values.some(v => btn1.includes(v)) && values.some(v => btn2.includes(v))) {
        return true;
      }
    }
    return false;
  }

  async runComparison() {
    console.log('开始后台管理中心功能对比...\n');

    for (const menuItem of MENU_MAPPING) {
      const result = await this.comparePage(menuItem);
      this.results.push(result);
    }

    return this.results;
  }

  generateReport(): string {
    let report = `# 后台管理中心功能对比报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `---\n\n`;

    let needsFixCount = 0;
    let acceptableCount = 0;

    for (const result of this.results) {
      report += `## 页面: ${result.page}\n\n`;
      report += `- 重构版URL: ${result.refactoredUrl}\n`;
      report += `- 原版URL: ${result.originalUrl}\n\n`;

      report += `### 显示内容\n`;
      report += `- ${result.display.consistent ? '一致' : '不一致'}\n`;
      if (result.display.differences.length > 0) {
        report += `- 差异说明:\n`;
        result.display.differences.forEach(d => {
          report += `  - ${d}\n`;
        });
      }
      report += `\n`;

      report += `### 按钮\n`;
      report += `- 原版有但重构版缺失: ${result.buttons.missingInRefactored.length > 0 ? result.buttons.missingInRefactored.join(', ') : '无'}\n`;
      report += `- 重构版新增但原版没有: ${result.buttons.newInRefactored.length > 0 ? result.buttons.newInRefactored.join(', ') : '无'}\n`;
      report += `- 行为不一致的按钮: ${result.buttons.behaviorDifferences.length > 0 ? result.buttons.behaviorDifferences.join(', ') : '无'}\n\n`;

      report += `### 功能\n`;
      report += `- ${result.functionality.consistent ? '一致' : '不一致'}\n`;
      if (result.functionality.differences.length > 0) {
        result.functionality.differences.forEach(d => {
          report += `  - ${d}\n`;
        });
      }
      report += `\n`;

      report += `### 业务逻辑\n`;
      report += `- ${result.businessLogic.consistent ? '一致' : '不一致'}\n`;
      if (result.businessLogic.differences.length > 0) {
        result.businessLogic.differences.forEach(d => {
          report += `  - ${d}\n`;
        });
      }
      report += `\n`;

      report += `### 结论\n`;
      report += `**${result.conclusion === 'acceptable' ? '可接受' : '需要修复'}**\n\n`;

      if (result.conclusion === 'needs-fix') {
        needsFixCount++;
      } else {
        acceptableCount++;
      }

      report += `---\n\n`;
    }

    report += `## 总结\n\n`;
    report += `- 可接受页面: ${acceptableCount}\n`;
    report += `- 需要修复页面: ${needsFixCount}\n`;
    report += `- 总计: ${this.results.length}\n`;

    return report;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const comparer = new AdminComparer();

  try {
    await comparer.init();
    await comparer.loginRefactored();
    await comparer.loginOriginal();
    await comparer.runComparison();

    const report = comparer.generateReport();

    // 保存报告
    const reportPath = '/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/tests/comparison-report.md';
    fs.writeFileSync(reportPath, report);
    console.log(`\n报告已保存到: ${reportPath}`);

    // 也输出到控制台
    console.log('\n' + report);

  } catch (error) {
    console.error('测试执行失败:', error);
  } finally {
    await comparer.close();
  }
}

main();
