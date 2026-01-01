import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
    SensitiveWord,
    SensitiveWordLog,
    SensitiveWordType,
    SensitiveLevel,
    CreateSensitiveWordDto,
    BatchImportDto,
    CheckTextDto,
    SensitiveWordFilterDto,
} from './sensitive-word.entity';

@Injectable()
export class SensitiveWordsService implements OnModuleInit {
    // 内存中的敏感词缓存
    private wordCache: Map<string, SensitiveWord> = new Map();
    // 是否已初始化
    private initialized = false;

    constructor(
        @InjectRepository(SensitiveWord)
        private wordRepository: Repository<SensitiveWord>,
        @InjectRepository(SensitiveWordLog)
        private logRepository: Repository<SensitiveWordLog>,
    ) { }

    async onModuleInit() {
        await this.loadWordsToCache();
    }

    /**
     * 加载敏感词到缓存
     */
    async loadWordsToCache(): Promise<void> {
        const words = await this.wordRepository.find({
            where: { isActive: true }
        });

        this.wordCache.clear();
        for (const word of words) {
            this.wordCache.set(word.word.toLowerCase(), word);
        }
        this.initialized = true;
        console.log(`[SensitiveWords] 已加载 ${words.length} 个敏感词`);
    }

    /**
     * 刷新缓存
     */
    async refreshCache(): Promise<void> {
        await this.loadWordsToCache();
    }

    // ============ 敏感词检测 ============

    /**
     * 检测文本中的敏感词
     */
    async checkText(dto: CheckTextDto, ip?: string): Promise<{
        hasSensitive: boolean;
        matchedWords: string[];
        maxLevel: SensitiveLevel;
        blocked: boolean;
        processedText: string;
    }> {
        const { text, scene, userId } = dto;
        const textLower = text.toLowerCase();

        const matchedWords: string[] = [];
        let maxLevel = SensitiveLevel.LOW;
        const matchedWordObjects: SensitiveWord[] = [];

        // 遍历所有敏感词进行匹配
        for (const [word, wordObj] of this.wordCache) {
            if (textLower.includes(word)) {
                matchedWords.push(wordObj.word);
                matchedWordObjects.push(wordObj);
                if (wordObj.level > maxLevel) {
                    maxLevel = wordObj.level;
                }
            }
        }

        const hasSensitive = matchedWords.length > 0;
        const blocked = maxLevel === SensitiveLevel.HIGH;

        // 处理文本（替换敏感词）
        let processedText = text;
        if (hasSensitive && !blocked) {
            for (const wordObj of matchedWordObjects) {
                const replacement = wordObj.replacement || '*'.repeat(wordObj.word.length);
                const regex = new RegExp(this.escapeRegex(wordObj.word), 'gi');
                processedText = processedText.replace(regex, replacement);
            }
        }

        // 记录日志
        if (hasSensitive) {
            await this.logRepository.save(this.logRepository.create({
                userId,
                scene,
                originalText: text.substring(0, 1000),  // 限制长度
                matchedWords,
                maxLevel,
                blocked,
                processedText: blocked ? undefined : processedText.substring(0, 1000),
                ip,
            } as any));

            // 更新命中次数
            for (const wordObj of matchedWordObjects) {
                await this.wordRepository.increment({ id: wordObj.id }, 'hitCount', 1);
            }
        }

        return {
            hasSensitive,
            matchedWords,
            maxLevel,
            blocked,
            processedText,
        };
    }

    /**
     * 快速检测（不记录日志）
     */
    quickCheck(text: string): boolean {
        const textLower = text.toLowerCase();
        for (const word of this.wordCache.keys()) {
            if (textLower.includes(word)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 过滤文本（替换敏感词为*）
     */
    filterText(text: string): string {
        let result = text;
        for (const [word, wordObj] of this.wordCache) {
            if (text.toLowerCase().includes(word)) {
                const replacement = wordObj.replacement || '*'.repeat(wordObj.word.length);
                const regex = new RegExp(this.escapeRegex(wordObj.word), 'gi');
                result = result.replace(regex, replacement);
            }
        }
        return result;
    }

    /**
     * 转义正则特殊字符
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ============ 敏感词管理 ============

    /**
     * 添加敏感词
     */
    async createWord(dto: CreateSensitiveWordDto): Promise<SensitiveWord> {
        const word = this.wordRepository.create(dto);
        const saved = await this.wordRepository.save(word);

        // 更新缓存
        if (saved.isActive) {
            this.wordCache.set(saved.word.toLowerCase(), saved);
        }

        return saved;
    }

    /**
     * 批量导入
     */
    async batchImport(dto: BatchImportDto): Promise<{ imported: number; skipped: number }> {
        const words = dto.words.split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0);

        let imported = 0;
        let skipped = 0;

        for (const word of words) {
            try {
                const exists = await this.wordRepository.findOne({ where: { word } });
                if (exists) {
                    skipped++;
                    continue;
                }

                await this.createWord({
                    word,
                    type: dto.type || SensitiveWordType.CUSTOM,
                    level: dto.level || SensitiveLevel.MEDIUM,
                });
                imported++;
            } catch {
                skipped++;
            }
        }

        return { imported, skipped };
    }

    /**
     * 获取敏感词列表
     */
    async findAll(filter?: SensitiveWordFilterDto): Promise<{
        data: SensitiveWord[];
        total: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.wordRepository.createQueryBuilder('w');

        if (filter?.type !== undefined) {
            queryBuilder.andWhere('w.type = :type', { type: filter.type });
        }
        if (filter?.level !== undefined) {
            queryBuilder.andWhere('w.level = :level', { level: filter.level });
        }
        if (filter?.keyword) {
            queryBuilder.andWhere('w.word LIKE :keyword', { keyword: `%${filter.keyword}%` });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('w.hitCount', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 获取敏感词详情
     */
    async findOne(id: string): Promise<SensitiveWord | null> {
        return this.wordRepository.findOne({ where: { id } });
    }

    /**
     * 更新敏感词
     */
    async updateWord(id: string, dto: Partial<CreateSensitiveWordDto>): Promise<SensitiveWord | null> {
        const word = await this.findOne(id);
        if (!word) return null;

        const oldWord = word.word.toLowerCase();
        Object.assign(word, dto);
        const saved = await this.wordRepository.save(word);

        // 更新缓存
        this.wordCache.delete(oldWord);
        if (saved.isActive) {
            this.wordCache.set(saved.word.toLowerCase(), saved);
        }

        return saved;
    }

    /**
     * 删除敏感词
     */
    async deleteWord(id: string): Promise<boolean> {
        const word = await this.findOne(id);
        if (!word) return false;

        await this.wordRepository.delete(id);
        this.wordCache.delete(word.word.toLowerCase());

        return true;
    }

    /**
     * 切换启用状态
     */
    async toggleActive(id: string): Promise<SensitiveWord | null> {
        const word = await this.findOne(id);
        if (!word) return null;

        word.isActive = !word.isActive;
        const saved = await this.wordRepository.save(word);

        // 更新缓存
        if (saved.isActive) {
            this.wordCache.set(saved.word.toLowerCase(), saved);
        } else {
            this.wordCache.delete(saved.word.toLowerCase());
        }

        return saved;
    }

    // ============ 统计和日志 ============

    /**
     * 获取检测日志
     */
    async getLogs(
        page: number = 1,
        limit: number = 20,
        scene?: string
    ): Promise<{ data: SensitiveWordLog[]; total: number }> {
        const queryBuilder = this.logRepository.createQueryBuilder('l');

        if (scene) {
            queryBuilder.where('l.scene = :scene', { scene });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('l.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 获取统计数据
     */
    async getStats(): Promise<{
        totalWords: number;
        activeWords: number;
        todayBlocked: number;
        topHitWords: Array<{ word: string; hitCount: number }>;
    }> {
        const totalWords = await this.wordRepository.count();
        const activeWords = await this.wordRepository.count({ where: { isActive: true } });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBlocked = await this.logRepository.count({
            where: { blocked: true }
        });

        const topHitWords = await this.wordRepository.find({
            where: { isActive: true },
            order: { hitCount: 'DESC' },
            take: 10,
            select: ['word', 'hitCount']
        });

        return {
            totalWords,
            activeWords,
            todayBlocked,
            topHitWords: topHitWords.map(w => ({ word: w.word, hitCount: w.hitCount })),
        };
    }

    /**
     * 初始化默认敏感词
     */
    async initDefaultWords(): Promise<void> {
        const defaultWords = [
            { word: '诈骗', type: SensitiveWordType.FRAUD, level: SensitiveLevel.HIGH },
            { word: '骗子', type: SensitiveWordType.FRAUD, level: SensitiveLevel.HIGH },
            { word: '刷单', type: SensitiveWordType.FRAUD, level: SensitiveLevel.MEDIUM },
            { word: '传销', type: SensitiveWordType.FRAUD, level: SensitiveLevel.HIGH },
            { word: '赌博', type: SensitiveWordType.GAMBLING, level: SensitiveLevel.HIGH },
            { word: '博彩', type: SensitiveWordType.GAMBLING, level: SensitiveLevel.HIGH },
        ];

        for (const w of defaultWords) {
            const exists = await this.wordRepository.findOne({ where: { word: w.word } });
            if (!exists) {
                await this.wordRepository.save(this.wordRepository.create(w));
            }
        }

        await this.refreshCache();
    }
}
