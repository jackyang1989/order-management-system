import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformImageRequirements1768707488442 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建平台截图配置表
        await queryRunner.query(`
            CREATE TABLE platform_image_requirements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "platformId" UUID NOT NULL,
                key VARCHAR(50) NOT NULL,
                label VARCHAR(100) NOT NULL,
                "exampleImagePath" VARCHAR(500),
                "pathHint" TEXT,
                required BOOLEAN DEFAULT true,
                "sortOrder" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                CONSTRAINT fk_platform FOREIGN KEY ("platformId") REFERENCES platforms(id) ON DELETE CASCADE
            )
        `);

        // 为每个现有平台初始化2条默认截图配置
        await queryRunner.query(`
            INSERT INTO platform_image_requirements ("platformId", key, label, required, "sortOrder")
            SELECT
                p.id,
                'profileImg' as key,
                '账号主页截图' as label,
                true as required,
                1 as "sortOrder"
            FROM platforms p
        `);

        await queryRunner.query(`
            INSERT INTO platform_image_requirements ("platformId", key, label, required, "sortOrder")
            SELECT
                p.id,
                'authImg' as key,
                '实名认证截图' as label,
                true as required,
                2 as "sortOrder"
            FROM platforms p
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE platform_image_requirements`);
    }

}
