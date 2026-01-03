--
-- PostgreSQL database dump
--

\restrict nqgdSWo1gbS4ZR4OcJGzX77tzfn2VHguVkQXlWxU78EBA6vYum0zz98GgyW0LqF

-- Dumped from database version 15.15 (Homebrew)
-- Dumped by pg_dump version 15.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: admin_menus_type_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.admin_menus_type_enum AS ENUM (
    'directory',
    'menu',
    'button'
);


ALTER TYPE public.admin_menus_type_enum OWNER TO jianouyang;

--
-- Name: fund_records_action_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.fund_records_action_enum AS ENUM (
    'in',
    'out'
);


ALTER TYPE public.fund_records_action_enum OWNER TO jianouyang;

--
-- Name: fund_records_type_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.fund_records_type_enum AS ENUM (
    'principal',
    'silver'
);


ALTER TYPE public.fund_records_type_enum OWNER TO jianouyang;

--
-- Name: operation_logs_type_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.operation_logs_type_enum AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'import',
    'other'
);


ALTER TYPE public.operation_logs_type_enum OWNER TO jianouyang;

--
-- Name: shops_platform_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.shops_platform_enum AS ENUM (
    'TAOBAO',
    'TMALL',
    'JD',
    'PDD',
    'DOUYIN',
    'OTHER'
);


ALTER TYPE public.shops_platform_enum OWNER TO jianouyang;

--
-- Name: shops_status_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.shops_status_enum AS ENUM (
    '0',
    '1',
    '2',
    '3'
);


ALTER TYPE public.shops_status_enum OWNER TO jianouyang;

--
-- Name: vip_purchases_status_enum; Type: TYPE; Schema: public; Owner: jianouyang
--

CREATE TYPE public.vip_purchases_status_enum AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'refunded'
);


ALTER TYPE public.vip_purchases_status_enum OWNER TO jianouyang;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_menus; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.admin_menus (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    path character varying(100),
    component character varying(100),
    icon character varying(50),
    type public.admin_menus_type_enum DEFAULT 'menu'::public.admin_menus_type_enum NOT NULL,
    permission character varying(50),
    sort integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    "keepAlive" boolean DEFAULT false NOT NULL,
    redirect character varying(200),
    "parentId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    mpath character varying DEFAULT ''::character varying
);


ALTER TABLE public.admin_menus OWNER TO jianouyang;

--
-- Name: admin_operation_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.admin_operation_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "adminId" character varying NOT NULL,
    "adminUsername" character varying(50) NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    content text,
    ip character varying(50),
    "userAgent" character varying(200),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_operation_logs OWNER TO jianouyang;

--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.admin_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(50) NOT NULL,
    module character varying(50),
    description character varying(100),
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_permissions OWNER TO jianouyang;

--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.admin_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(100),
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_roles OWNER TO jianouyang;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    password character varying NOT NULL,
    "realName" character varying(50),
    phone character varying(20),
    email character varying(100),
    "roleId" character varying,
    "roleName" character varying(50) DEFAULT 'admin'::character varying NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    avatar text,
    "lastLoginAt" timestamp without time zone,
    "lastLoginIp" character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO jianouyang;

--
-- Name: bank_cards; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.bank_cards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "bankName" character varying(50) NOT NULL,
    "accountName" character varying(50) NOT NULL,
    "cardNumber" character varying(30) NOT NULL,
    phone character varying(20),
    province character varying(50),
    city character varying(50),
    "branchName" character varying(100),
    "idCard" character varying(20),
    "idCardFrontImage" text,
    "idCardBackImage" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "rejectReason" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bank_cards OWNER TO jianouyang;

--
-- Name: banks; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.banks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    icon text,
    code character varying(20),
    sort integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.banks OWNER TO jianouyang;

--
-- Name: buyer_accounts; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.buyer_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    platform character varying(20) DEFAULT '淘宝'::character varying NOT NULL,
    "accountName" character varying(100) NOT NULL,
    province character varying(50),
    city character varying(50),
    district character varying(50),
    "receiverName" character varying(100),
    "receiverPhone" character varying(20),
    "fullAddress" text,
    "alipayName" character varying(50),
    "idCardImage" text,
    "alipayImage" text,
    "archiveImage" text,
    "ipImage" text,
    star integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "rejectReason" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "monthlyTaskCount" integer DEFAULT 0 NOT NULL,
    "monthlyCountResetDate" date,
    "wangwangProvince" character varying(100),
    "wangwangCity" character varying(100),
    "addressRemark" text,
    "frozenTime" timestamp without time zone,
    "zhimaImage" text,
    "totalTaskCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.buyer_accounts OWNER TO jianouyang;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type integer NOT NULL,
    name character varying(50) NOT NULL,
    icon character varying(100),
    image character varying(255),
    description text,
    sort integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    "parentId" uuid,
    extra jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO jianouyang;

--
-- Name: categories_closure; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.categories_closure (
    id_ancestor uuid NOT NULL,
    id_descendant uuid NOT NULL
);


ALTER TABLE public.categories_closure OWNER TO jianouyang;

--
-- Name: commission_rates; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.commission_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "minPrice" numeric(10,2) NOT NULL,
    "maxPrice" numeric(10,2) NOT NULL,
    "buyerCommission" numeric(10,2) NOT NULL,
    "merchantCommission" numeric(10,2) NOT NULL,
    platform character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.commission_rates OWNER TO jianouyang;

--
-- Name: credit_level_configs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.credit_level_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    level integer NOT NULL,
    name character varying(20) NOT NULL,
    "minScore" integer NOT NULL,
    "maxScore" integer NOT NULL,
    "commissionBonus" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "dailyTaskLimit" integer DEFAULT 0 NOT NULL,
    privileges text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_level_configs OWNER TO jianouyang;

--
-- Name: credit_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.credit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    "changeType" character varying(30) NOT NULL,
    "oldScore" integer NOT NULL,
    change integer NOT NULL,
    "newScore" integer NOT NULL,
    "relatedId" character varying,
    reason text,
    "operatorId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_logs OWNER TO jianouyang;

--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.deliveries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(20),
    logo text,
    phone character varying(20),
    sort integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.deliveries OWNER TO jianouyang;

--
-- Name: delivery_warehouses; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.delivery_warehouses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    logo character varying,
    "contactPhone" character varying,
    website character varying,
    "trackingUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.delivery_warehouses OWNER TO jianouyang;

--
-- Name: file_groups; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.file_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    name character varying(50) NOT NULL,
    "fileCount" integer DEFAULT 0 NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.file_groups OWNER TO jianouyang;

--
-- Name: finance_records; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.finance_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    "moneyType" integer NOT NULL,
    "financeType" integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    "balanceAfter" numeric(12,2) NOT NULL,
    memo text,
    "relatedId" character varying,
    "relatedType" character varying(50),
    "operatorId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.finance_records OWNER TO jianouyang;

--
-- Name: fund_records; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.fund_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type public.fund_records_type_enum DEFAULT 'principal'::public.fund_records_type_enum NOT NULL,
    action public.fund_records_action_enum DEFAULT 'in'::public.fund_records_action_enum NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance numeric(12,2) NOT NULL,
    description text NOT NULL,
    "orderId" character varying,
    "withdrawalId" character varying,
    "relatedUserId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fund_records OWNER TO jianouyang;

--
-- Name: goods; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.goods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sellerId" uuid NOT NULL,
    "shopId" uuid NOT NULL,
    name character varying(200) NOT NULL,
    link text,
    "taobaoId" character varying,
    "verifyCode" character varying(20),
    "pcImg" text,
    "specName" character varying(200),
    "specValue" character varying(100),
    price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    num integer DEFAULT 1 NOT NULL,
    "showPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "goodsKeyId" character varying,
    state integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goods OWNER TO jianouyang;

--
-- Name: goods_keys; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.goods_keys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sellerId" uuid NOT NULL,
    name character varying(100) NOT NULL,
    platform integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goods_keys OWNER TO jianouyang;

--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.invite_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    code character varying(20) NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invite_codes OWNER TO jianouyang;

--
-- Name: invite_reward_configs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.invite_reward_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "inviteType" integer NOT NULL,
    "inviterReward" numeric(10,2) NOT NULL,
    "inviteeReward" numeric(10,2) NOT NULL,
    "minRechargeAmount" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invite_reward_configs OWNER TO jianouyang;

--
-- Name: keyword_details; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.keyword_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "goodsKeyId" uuid NOT NULL,
    keyword character varying(100) NOT NULL,
    terminal integer DEFAULT 1 NOT NULL,
    discount text,
    filter character varying(225),
    sort character varying(100),
    "maxPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "minPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    province character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.keyword_details OWNER TO jianouyang;

--
-- Name: merchant_bank_cards; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.merchant_bank_cards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "merchantId" character varying NOT NULL,
    "bankName" character varying(50) NOT NULL,
    "accountName" character varying(50) NOT NULL,
    "cardNumber" character varying(30) NOT NULL,
    "cardType" integer DEFAULT 1 NOT NULL,
    phone character varying(20),
    province character varying(50),
    city character varying(50),
    "branchName" character varying(100),
    "idCard" character varying(20),
    "taxNumber" character varying(50),
    "licenseImage" text,
    "idCardFrontImage" text,
    "idCardBackImage" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "rejectReason" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.merchant_bank_cards OWNER TO jianouyang;

--
-- Name: merchant_blacklist; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.merchant_blacklist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sellerId" uuid NOT NULL,
    "accountName" character varying(100) NOT NULL,
    type integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    "endTime" timestamp without time zone,
    reason text,
    "adminRemark" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.merchant_blacklist OWNER TO jianouyang;

--
-- Name: merchant_withdrawals; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.merchant_withdrawals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "merchantId" character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "actualAmount" numeric(12,2) NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "bankCardId" character varying,
    "bankName" character varying(50) NOT NULL,
    "accountName" character varying(50) NOT NULL,
    "cardNumber" character varying(30) NOT NULL,
    phone character varying(20),
    remark text,
    "reviewedAt" timestamp without time zone,
    "reviewedBy" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.merchant_withdrawals OWNER TO jianouyang;

--
-- Name: merchants; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.merchants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying NOT NULL,
    password character varying NOT NULL,
    phone character varying NOT NULL,
    qq character varying,
    company_name character varying,
    business_license character varying,
    contact_name character varying,
    balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    frozen_balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    silver numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    vip boolean DEFAULT false NOT NULL,
    vip_expire_at timestamp without time zone,
    status integer DEFAULT 0 NOT NULL,
    pay_password character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.merchants OWNER TO jianouyang;

--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.message_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.message_templates OWNER TO jianouyang;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "senderId" character varying,
    "senderType" integer DEFAULT 0 NOT NULL,
    "receiverId" character varying NOT NULL,
    "receiverType" integer NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "relatedId" character varying,
    "relatedType" character varying(50),
    "readAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO jianouyang;

--
-- Name: notice_reads; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.notice_reads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "noticeId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer DEFAULT 1 NOT NULL,
    "readAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notice_reads OWNER TO jianouyang;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.notices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    target integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "isTop" boolean DEFAULT false NOT NULL,
    "isPopup" boolean DEFAULT false NOT NULL,
    "coverImage" text,
    "adminId" character varying,
    "adminName" character varying(50),
    "publishedAt" timestamp without time zone,
    "expiredAt" timestamp without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notices OWNER TO jianouyang;

--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.operation_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module character varying(50) NOT NULL,
    type public.operation_logs_type_enum DEFAULT 'other'::public.operation_logs_type_enum NOT NULL,
    action character varying(200) NOT NULL,
    "operatorId" character varying(50),
    "operatorName" character varying(50),
    ip character varying(50),
    "userAgent" character varying(200),
    "requestData" text,
    "responseData" text,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    duration integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.operation_logs OWNER TO jianouyang;

--
-- Name: COLUMN operation_logs.module; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.module IS '操作模块';


--
-- Name: COLUMN operation_logs.type; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.type IS '操作类型';


--
-- Name: COLUMN operation_logs.action; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.action IS '操作描述';


--
-- Name: COLUMN operation_logs."operatorId"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."operatorId" IS '操作人ID';


--
-- Name: COLUMN operation_logs."operatorName"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."operatorName" IS '操作人用户名';


--
-- Name: COLUMN operation_logs.ip; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.ip IS 'IP地址';


--
-- Name: COLUMN operation_logs."userAgent"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."userAgent" IS 'User Agent';


--
-- Name: COLUMN operation_logs."requestData"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."requestData" IS '请求参数';


--
-- Name: COLUMN operation_logs."responseData"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."responseData" IS '响应数据';


--
-- Name: COLUMN operation_logs.success; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.success IS '是否成功';


--
-- Name: COLUMN operation_logs."errorMessage"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."errorMessage" IS '错误信息';


--
-- Name: COLUMN operation_logs.duration; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs.duration IS '执行时间(ms)';


--
-- Name: COLUMN operation_logs."createdAt"; Type: COMMENT; Schema: public; Owner: jianouyang
--

COMMENT ON COLUMN public.operation_logs."createdAt" IS '创建时间';


--
-- Name: order_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.order_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderId" character varying NOT NULL,
    "orderNo" character varying(50),
    action character varying(30) NOT NULL,
    "operatorType" integer DEFAULT 0 NOT NULL,
    "operatorId" character varying,
    "operatorName" character varying(50),
    content text,
    "oldStatus" integer,
    "newStatus" integer,
    extra jsonb,
    ip character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_logs OWNER TO jianouyang;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "taskId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "buynoId" character varying NOT NULL,
    "buynoAccount" character varying NOT NULL,
    "taskTitle" character varying NOT NULL,
    platform character varying(20) NOT NULL,
    "productName" character varying NOT NULL,
    "productPrice" numeric(12,2) NOT NULL,
    commission numeric(12,2) NOT NULL,
    "currentStep" integer DEFAULT 1 NOT NULL,
    "totalSteps" integer NOT NULL,
    "stepData" jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "endingTime" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "completedAt" timestamp without time zone,
    "userPrincipal" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "sellerPrincipal" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "prepayAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "finalAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "refundAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "isAdvancePay" boolean DEFAULT false NOT NULL,
    "deliveryState" integer DEFAULT 0 NOT NULL,
    delivery character varying,
    "deliveryNum" character varying,
    "deliveryTime" timestamp without time zone,
    "taobaoOrderNumber" character varying,
    "deliveryRequirement" integer DEFAULT 0 NOT NULL,
    "keywordImg" text,
    "chatImg" text,
    "orderDetailImg" text,
    "highPraiseImg" text,
    "receiveImg" text,
    "isPresale" boolean DEFAULT false NOT NULL,
    "yfPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "wkPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "okYf" boolean DEFAULT false NOT NULL,
    "okWk" boolean DEFAULT false NOT NULL,
    "praiseContent" text,
    "praiseImages" jsonb,
    "praiseVideo" text,
    "highPraiseTime" timestamp without time zone,
    "cancelType" integer,
    "cancelRemarks" text,
    "cancelTime" timestamp without time zone,
    margin numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "marginDiff" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "platformRefundTime" timestamp without time zone,
    "addressName" character varying,
    "addressPhone" character varying,
    address text,
    remark text,
    "rejectReason" text,
    "refundTime" timestamp without time zone,
    "isZp" boolean DEFAULT false NOT NULL,
    "isShengji" integer DEFAULT 2 NOT NULL,
    "silverPrepay" numeric(12,2) DEFAULT '0'::numeric NOT NULL
);


ALTER TABLE public.orders OWNER TO jianouyang;

--
-- Name: payment_callbacks; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.payment_callbacks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "outTradeNo" character varying(100) NOT NULL,
    "tradeNo" character varying(100),
    channel character varying(20) NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "rawData" jsonb,
    signature text,
    "signatureValid" boolean DEFAULT false NOT NULL,
    "errorMsg" text,
    "relatedId" character varying,
    ip character varying(50),
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_callbacks OWNER TO jianouyang;

--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.payment_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderNo" character varying(100) NOT NULL,
    "userId" character varying NOT NULL,
    "userType" character varying(20) NOT NULL,
    channel character varying(20) NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "tradeNo" character varying(100),
    "payUrl" text,
    "qrCode" text,
    "relatedId" character varying,
    "paidAt" timestamp without time zone,
    "expireAt" timestamp without time zone NOT NULL,
    remark text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_orders OWNER TO jianouyang;

--
-- Name: platform_day_stats; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.platform_day_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    "newBuyers" integer DEFAULT 0 NOT NULL,
    "newMerchants" integer DEFAULT 0 NOT NULL,
    "activeBuyers" integer DEFAULT 0 NOT NULL,
    "activeMerchants" integer DEFAULT 0 NOT NULL,
    "newTasks" integer DEFAULT 0 NOT NULL,
    "completedTasks" integer DEFAULT 0 NOT NULL,
    "cancelledTasks" integer DEFAULT 0 NOT NULL,
    "newOrders" integer DEFAULT 0 NOT NULL,
    "completedOrders" integer DEFAULT 0 NOT NULL,
    "refundOrders" integer DEFAULT 0 NOT NULL,
    "totalOrderAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "totalCommission" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "platformRevenue" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "rechargeAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "withdrawAmount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.platform_day_stats OWNER TO jianouyang;

--
-- Name: platforms; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.platforms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    icon character varying,
    color character varying,
    "baseFeeRate" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "extraFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "supportsTkl" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.platforms OWNER TO jianouyang;

--
-- Name: recharge_orders; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.recharge_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderNo" character varying NOT NULL,
    "userId" uuid NOT NULL,
    "userType" integer DEFAULT 2 NOT NULL,
    "packageId" character varying NOT NULL,
    price numeric(10,2) NOT NULL,
    state integer DEFAULT 0 NOT NULL,
    "payUrl" character varying,
    "createTime" bigint NOT NULL,
    "paidTime" bigint,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recharge_orders OWNER TO jianouyang;

--
-- Name: recharges; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.recharges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "orderNumber" character varying NOT NULL,
    "userType" integer NOT NULL,
    "rechargeType" integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    "tradeNo" character varying(50),
    status integer DEFAULT 0 NOT NULL,
    "paymentMethod" character varying(20) DEFAULT 'alipay'::character varying NOT NULL,
    "arrivalTime" timestamp without time zone,
    remark text,
    "operatorId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recharges OWNER TO jianouyang;

--
-- Name: review_task_details; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.review_task_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "reviewTaskId" character varying NOT NULL,
    "goodsId" character varying,
    "goodsName" character varying,
    "reviewType" integer DEFAULT 1 NOT NULL,
    "requiredContent" text,
    "requiredImages" jsonb,
    "submittedContent" text,
    "submittedImages" jsonb,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_task_details OWNER TO jianouyang;

--
-- Name: review_task_praises; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.review_task_praises (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "reviewTaskId" character varying NOT NULL,
    "goodsId" character varying,
    type integer DEFAULT 1 NOT NULL,
    content text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_task_praises OWNER TO jianouyang;

--
-- Name: review_tasks; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.review_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "merchantId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "buynoId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "shopId" character varying,
    "taobaoOrderNumber" character varying,
    "taskNumber" character varying(100) NOT NULL,
    "userTaskId" character varying NOT NULL,
    "sellerTaskId" character varying,
    "payPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    money numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "userMoney" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    yjprice numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    ydprice numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    state integer DEFAULT 0 NOT NULL,
    img text,
    "uploadTime" timestamp without time zone,
    "confirmTime" timestamp without time zone,
    "payTime" timestamp without time zone,
    "examineTime" timestamp without time zone,
    remarks text
);


ALTER TABLE public.review_tasks OWNER TO jianouyang;

--
-- Name: reward_recharges; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.reward_recharges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    uid character varying NOT NULL,
    utype integer NOT NULL,
    "userName" character varying(100),
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "rewardAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "payMethod" integer DEFAULT 1 NOT NULL,
    "orderNo" character varying(100),
    "tradeNo" character varying(100),
    remarks text,
    "paidAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reward_recharges OWNER TO jianouyang;

--
-- Name: sensitive_word_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.sensitive_word_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying,
    scene character varying(50),
    "originalText" text NOT NULL,
    "matchedWords" jsonb NOT NULL,
    "maxLevel" integer NOT NULL,
    blocked boolean DEFAULT false NOT NULL,
    "processedText" text,
    ip character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensitive_word_logs OWNER TO jianouyang;

--
-- Name: sensitive_words; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.sensitive_words (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    word character varying(100) NOT NULL,
    type integer DEFAULT 99 NOT NULL,
    level integer DEFAULT 2 NOT NULL,
    replacement character varying(100),
    "isActive" boolean DEFAULT true NOT NULL,
    "hitCount" integer DEFAULT 0 NOT NULL,
    remark text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensitive_words OWNER TO jianouyang;

--
-- Name: shops; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.shops (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sellerId" uuid NOT NULL,
    platform public.shops_platform_enum DEFAULT 'TAOBAO'::public.shops_platform_enum NOT NULL,
    "shopName" character varying NOT NULL,
    "accountName" character varying NOT NULL,
    "contactName" character varying NOT NULL,
    mobile character varying NOT NULL,
    province character varying,
    city character varying,
    district character varying,
    "detailAddress" character varying,
    url character varying,
    status public.shops_status_enum DEFAULT '0'::public.shops_status_enum NOT NULL,
    "auditRemark" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "needLogistics" boolean DEFAULT true NOT NULL,
    "expressCode" character varying(50)
);


ALTER TABLE public.shops OWNER TO jianouyang;

--
-- Name: sms_codes; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.sms_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(20) NOT NULL,
    code character varying(6) NOT NULL,
    type character varying(20) NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "expireAt" timestamp without time zone NOT NULL,
    ip character varying(50),
    "usedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sms_codes OWNER TO jianouyang;

--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.sms_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(20) NOT NULL,
    type character varying(20) NOT NULL,
    content text NOT NULL,
    provider character varying(50),
    "msgId" character varying(100),
    success boolean DEFAULT false NOT NULL,
    "errorMsg" text,
    ip character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sms_logs OWNER TO jianouyang;

--
-- Name: system_config; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.system_config (
    key character varying NOT NULL,
    value character varying NOT NULL,
    "group" character varying,
    description character varying
);


ALTER TABLE public.system_config OWNER TO jianouyang;

--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.system_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying NOT NULL,
    value text,
    "group" character varying,
    label character varying,
    description character varying,
    "valueType" character varying DEFAULT 'string'::character varying NOT NULL,
    options character varying,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isEditable" boolean DEFAULT true NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_configs OWNER TO jianouyang;

--
-- Name: system_global_config; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.system_global_config (
    id integer NOT NULL,
    "userNum" integer DEFAULT 0 NOT NULL,
    "sellerNum" integer DEFAULT 0 NOT NULL,
    "userVipTime" integer DEFAULT 0 NOT NULL,
    "sellerVipTime" integer DEFAULT 0 NOT NULL,
    "userVip" character varying(100) DEFAULT '45,80,115,130'::character varying NOT NULL,
    "sellerVip" character varying(100) DEFAULT '450,800,1000,1200'::character varying NOT NULL,
    "userMinMoney" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "sellerMinMoney" integer DEFAULT 0 NOT NULL,
    "userMinReward" integer DEFAULT 0 NOT NULL,
    "rewardPrice" numeric(12,2) DEFAULT '1'::numeric NOT NULL,
    "sellerCashFee" numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    "userCashFree" character varying(300) DEFAULT ''::character varying NOT NULL,
    "userFeeMaxPrice" character varying(300) DEFAULT ''::character varying NOT NULL,
    "unionInterval" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "goodsMoreFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "refundServicePrice" numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    "phoneFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "pcFee" numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    "timingPay" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "timingPublish" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "nextDay" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    postage numeric(12,2) DEFAULT '5'::numeric NOT NULL,
    "rePay" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "ysFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    praise numeric(12,2) DEFAULT '2'::numeric NOT NULL,
    "imgPraise" numeric(12,2) DEFAULT '3'::numeric NOT NULL,
    "videoPraise" numeric(12,2) DEFAULT '10'::numeric NOT NULL,
    divided numeric(12,4) DEFAULT 0.6 NOT NULL,
    "msgUsername" character varying(100),
    "msgPassword" character varying(100),
    alipay character varying(100),
    "verifySwitch" integer DEFAULT 0 NOT NULL,
    "limitMobile" text,
    "invitationNum" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_global_config OWNER TO jianouyang;

--
-- Name: system_global_config_id_seq; Type: SEQUENCE; Schema: public; Owner: jianouyang
--

CREATE SEQUENCE public.system_global_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_global_config_id_seq OWNER TO jianouyang;

--
-- Name: system_global_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jianouyang
--

ALTER SEQUENCE public.system_global_config_id_seq OWNED BY public.system_global_config.id;


--
-- Name: task_goods; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.task_goods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "taskId" uuid NOT NULL,
    "goodsId" uuid,
    name character varying(200) NOT NULL,
    "pcImg" text,
    link text,
    "specName" character varying(100),
    "specValue" character varying(100),
    price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    num integer DEFAULT 1 NOT NULL,
    "totalPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_goods OWNER TO jianouyang;

--
-- Name: task_keywords; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.task_keywords (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "taskId" uuid NOT NULL,
    "taskGoodsId" character varying,
    keyword character varying(100) NOT NULL,
    terminal integer DEFAULT 1 NOT NULL,
    discount text,
    filter character varying(225),
    sort character varying(100),
    "maxPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "minPrice" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    province character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_keywords OWNER TO jianouyang;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "taskNumber" character varying NOT NULL,
    "claimedCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "taskType" integer DEFAULT 1 NOT NULL,
    url character varying,
    "mainImage" character varying,
    "shopName" character varying,
    keyword character varying,
    "taoWord" character varying,
    "taobaoId" character varying,
    "qrCode" character varying,
    count integer DEFAULT 1 NOT NULL,
    remark text,
    "merchantId" uuid,
    "goodsPrice" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "goodsMoney" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "shippingFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    margin numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "extraReward" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "baseServiceFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "refundServiceFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isPraise" boolean DEFAULT false NOT NULL,
    "praiseFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isImgPraise" boolean DEFAULT false NOT NULL,
    "imgPraiseFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isVideoPraise" boolean DEFAULT false NOT NULL,
    "videoPraiseFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "totalDeposit" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "totalCommission" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    terminal integer DEFAULT 1 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "completedCount" integer DEFAULT 0 NOT NULL,
    "incompleteCount" integer DEFAULT 0 NOT NULL,
    "taskTimeLimit" integer DEFAULT 24 NOT NULL,
    "unionInterval" integer DEFAULT 0 NOT NULL,
    cycle integer DEFAULT 0 NOT NULL,
    "timingPayFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "timingPublishFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "nextDayFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "phoneFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "goodsMoreFee" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "addReward" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "isPresale" boolean DEFAULT false NOT NULL,
    "yfPrice" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "wkPrice" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "examineTime" timestamp without time zone,
    "payTime" timestamp without time zone,
    "receiptTime" timestamp without time zone,
    "isFreeShipping" boolean DEFAULT true NOT NULL,
    memo text,
    "shopId" character varying,
    "isTimingPublish" boolean DEFAULT false NOT NULL,
    "publishTime" timestamp without time zone,
    title character varying(500) DEFAULT ''::character varying,
    status integer DEFAULT 0 NOT NULL,
    "needHuobi" boolean DEFAULT false NOT NULL,
    "needShoucang" boolean DEFAULT false NOT NULL,
    "needJiagou" boolean DEFAULT false NOT NULL,
    "needJialiao" boolean DEFAULT false NOT NULL,
    "needGuanzhu" boolean DEFAULT false NOT NULL,
    "needLiulan" boolean DEFAULT false NOT NULL,
    "mainBrowseMinutes" integer DEFAULT 8 NOT NULL,
    "subBrowseMinutes" integer DEFAULT 2 NOT NULL,
    "totalBrowseMinutes" integer DEFAULT 15 NOT NULL,
    "huobiKeyword" text,
    "channelImages" text,
    "verifySwitch" boolean DEFAULT false NOT NULL,
    "verifyCode" text
);


ALTER TABLE public.tasks OWNER TO jianouyang;

--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.uploaded_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "originalName" character varying(255) NOT NULL,
    "fileName" character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    url character varying(500) NOT NULL,
    type character varying(20) NOT NULL,
    "mimeType" character varying(100) NOT NULL,
    size bigint NOT NULL,
    storage character varying(20) DEFAULT 'local'::character varying NOT NULL,
    usage character varying(30),
    "uploaderId" character varying,
    "uploaderType" character varying(20),
    "relatedId" character varying,
    "relatedType" character varying(50),
    md5 character varying(64),
    width integer,
    height integer,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.uploaded_files OWNER TO jianouyang;

--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.user_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    name character varying(50) NOT NULL,
    phone character varying(20) NOT NULL,
    province character varying(50),
    city character varying(50),
    district character varying(50),
    address text NOT NULL,
    "postalCode" character varying(20),
    "isDefault" boolean DEFAULT false NOT NULL,
    tag text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_addresses OWNER TO jianouyang;

--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.user_credits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    score integer DEFAULT 100 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "completedOrders" integer DEFAULT 0 NOT NULL,
    "cancelledOrders" integer DEFAULT 0 NOT NULL,
    "refundedOrders" integer DEFAULT 0 NOT NULL,
    "timeoutCount" integer DEFAULT 0 NOT NULL,
    "complaintCount" integer DEFAULT 0 NOT NULL,
    "completionRate" numeric(5,2) DEFAULT '100'::numeric NOT NULL,
    "isBlacklisted" boolean DEFAULT false NOT NULL,
    "blacklistUntil" timestamp without time zone,
    "blacklistReason" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_credits OWNER TO jianouyang;

--
-- Name: user_day_counts; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.user_day_counts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    date date NOT NULL,
    "taskCount" integer DEFAULT 0 NOT NULL,
    "completedCount" integer DEFAULT 0 NOT NULL,
    "cancelledCount" integer DEFAULT 0 NOT NULL,
    "totalAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "commissionEarned" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "commissionPaid" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "rechargeAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "withdrawAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_day_counts OWNER TO jianouyang;

--
-- Name: user_invites; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.user_invites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "inviterId" character varying NOT NULL,
    "inviterType" integer DEFAULT 1 NOT NULL,
    "inviteeId" character varying,
    "inviteePhone" character varying(50),
    "inviteeName" character varying(50),
    "inviteCode" character varying(20) NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "rewardAmount" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "inviteeRewardAmount" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "activatedAt" timestamp without time zone,
    "rewardedAt" timestamp without time zone,
    remark text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_invites OWNER TO jianouyang;

--
-- Name: user_vip_status; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.user_vip_status (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    "expireAt" timestamp without time zone,
    "isExpired" boolean DEFAULT false NOT NULL,
    "totalDays" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_vip_status OWNER TO jianouyang;

--
-- Name: users; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying NOT NULL,
    password character varying NOT NULL,
    phone character varying NOT NULL,
    qq character varying,
    vip boolean DEFAULT false NOT NULL,
    "vipExpireAt" timestamp without time zone,
    balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    silver numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "frozenSilver" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    reward numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "payPassword" character varying,
    "invitationCode" character varying NOT NULL,
    "invitedBy" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "frozenBalance" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "referrerId" character varying,
    "referrerType" integer DEFAULT 0 NOT NULL,
    "referralReward" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "referralRewardToday" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "referralCount" integer DEFAULT 0 NOT NULL,
    "realName" character varying,
    "idCard" character varying,
    "idCardFront" character varying,
    "idCardBack" character varying,
    "verifyStatus" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isBanned" boolean DEFAULT false NOT NULL,
    "banReason" text,
    "lastLoginAt" timestamp without time zone,
    "lastLoginIp" character varying,
    "inviteState" integer DEFAULT 0 NOT NULL,
    "monthlyTaskCount" integer DEFAULT 0 NOT NULL,
    "monthlyTaskCountResetDate" date
);


ALTER TABLE public.users OWNER TO jianouyang;

--
-- Name: vip_level_configs; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.vip_level_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userType" integer NOT NULL,
    level integer NOT NULL,
    name character varying(50) NOT NULL,
    "monthlyPrice" numeric(10,2) NOT NULL,
    "yearlyPrice" numeric(10,2) NOT NULL,
    "commissionRate" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "maxDailyTasks" integer DEFAULT 0 NOT NULL,
    "maxTaskPrice" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "priorityMatching" boolean DEFAULT false NOT NULL,
    "exclusiveTasks" boolean DEFAULT false NOT NULL,
    privileges text,
    "isActive" boolean DEFAULT true NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_level_configs OWNER TO jianouyang;

--
-- Name: vip_levels; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.vip_levels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    level integer NOT NULL,
    type character varying(20) DEFAULT 'buyer'::character varying NOT NULL,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    duration integer DEFAULT 30 NOT NULL,
    icon character varying,
    color character varying,
    "dailyTaskLimit" integer DEFAULT 0 NOT NULL,
    "commissionBonus" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "withdrawFeeDiscount" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "priorityLevel" integer DEFAULT 0 NOT NULL,
    "canReserveTask" boolean DEFAULT false NOT NULL,
    "showVipBadge" boolean DEFAULT false NOT NULL,
    "publishTaskLimit" integer DEFAULT 0 NOT NULL,
    "serviceFeeDiscount" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "priorityReview" boolean DEFAULT false NOT NULL,
    "dedicatedSupport" boolean DEFAULT false NOT NULL,
    "freePromotionDays" integer DEFAULT 0 NOT NULL,
    description text,
    privileges json,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_levels OWNER TO jianouyang;

--
-- Name: vip_packages; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.vip_packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    days integer NOT NULL,
    price numeric(10,2) NOT NULL,
    "discountPrice" numeric(10,2) NOT NULL,
    description text,
    benefits text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_packages OWNER TO jianouyang;

--
-- Name: vip_purchases; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.vip_purchases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "packageId" uuid NOT NULL,
    "packageName" character varying NOT NULL,
    days integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status public.vip_purchases_status_enum DEFAULT 'pending'::public.vip_purchases_status_enum NOT NULL,
    "paymentMethod" character varying,
    "transactionId" character varying,
    "paidAt" timestamp without time zone,
    "vipStartAt" timestamp without time zone NOT NULL,
    "vipEndAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_purchases OWNER TO jianouyang;

--
-- Name: vip_records; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.vip_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    "userType" integer NOT NULL,
    "oldLevel" integer NOT NULL,
    "newLevel" integer NOT NULL,
    "recordType" integer NOT NULL,
    amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    duration integer DEFAULT 0 NOT NULL,
    "expireAt" timestamp without time zone,
    "operatorId" character varying,
    remark text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_records OWNER TO jianouyang;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: jianouyang
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "actualAmount" numeric(12,2) NOT NULL,
    type integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    "bankCardId" character varying,
    "bankName" character varying(50) NOT NULL,
    "accountName" character varying(50) NOT NULL,
    "cardNumber" character varying(30) NOT NULL,
    phone character varying(20),
    remark text,
    "reviewedAt" timestamp without time zone,
    "reviewedBy" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.withdrawals OWNER TO jianouyang;

--
-- Name: system_global_config id; Type: DEFAULT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.system_global_config ALTER COLUMN id SET DEFAULT nextval('public.system_global_config_id_seq'::regclass);


--
-- Data for Name: admin_menus; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.admin_menus (id, name, path, component, icon, type, permission, sort, status, visible, "keepAlive", redirect, "parentId", "createdAt", "updatedAt", mpath) FROM stdin;
\.


--
-- Data for Name: admin_operation_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.admin_operation_logs (id, "adminId", "adminUsername", module, action, content, ip, "userAgent", "createdAt") FROM stdin;
285a6e57-e083-40ad-9f37-0cd4212fd966	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:49:26.025433
54f57f70-55cb-4ddb-9458-07b4b062b760	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:50:11.44841
f0ca5eac-4441-4b7d-bd86-ac7d9a25685b	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:50:59.377936
cb3d15b8-7d0f-4d85-964b-8e1c43faf03c	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:51:51.292184
cba6ba25-abca-4dc9-8b38-45d37c366681	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:52:49.565938
b7982024-a87c-4025-afdd-9e9dccf27adf	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:53:27.770515
04ed55be-6340-468a-9688-30d5f938c8dc	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:54:15.640545
4d59dc54-1578-403d-943e-6ec121c9951f	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-01 23:58:03.099397
952fdae5-1d83-4eab-8aca-e0d2cc084efc	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 00:00:05.915737
fbd8b582-c9e2-49ac-b911-ce0f52ce9a08	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 00:20:07.557545
7fe00924-f0ad-4cd6-b96a-fe88ea40d333	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 07:54:37.683737
7e871271-6372-47b0-a2d6-da21d91d9fea	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 07:55:06.62751
292918a9-437d-47bf-8a0d-0b63c742e7ba	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:04:51.319112
f810a7a5-09b9-4200-9599-4797f67b354a	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:15:57.753214
c8ae21b2-c65d-42bc-a028-e36779804970	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:17:04.408354
b4f521d7-10e1-48b7-afb7-c55f5beb4baa	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:17:25.343942
d23d9ad4-2321-4271-8349-bdb063084204	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:17:58.830619
717c8357-af94-4acf-a129-2051e22dd3b0	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:18:30.554426
30999fea-8cdd-44fa-9420-5d35eb271743	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:18:55.184251
42336a91-d745-461a-a7c2-56313ebb8dd4	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:32:32.025085
42d27bb6-fbe9-4556-8f67-77c9ca1cebde	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 08:41:56.018388
2c8f5241-462d-4f0d-991f-cb85730af7ca	912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	系统	登录	管理员登录 IP: ::1	\N	\N	2026-01-02 11:04:57.787127
\.


--
-- Data for Name: admin_permissions; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.admin_permissions (id, code, name, module, description, sort, "createdAt") FROM stdin;
93fbfbd6-5396-4f81-84cd-194ca392e81e	user:list	用户列表	用户管理	\N	0	2025-12-31 21:39:12.27074
61c69eb0-5ced-4f76-86d2-2bc5139e69a8	user:detail	用户详情	用户管理	\N	0	2025-12-31 21:39:12.274225
04651546-6d3a-489b-b51f-13fc6ecf4342	user:update	修改用户	用户管理	\N	0	2025-12-31 21:39:12.276121
3c30bf3f-cf4b-4de2-b86d-6707dc6ad4f5	user:disable	禁用用户	用户管理	\N	0	2025-12-31 21:39:12.277254
756e1927-255e-45c5-af27-f66e9fc3f966	merchant:list	商家列表	商家管理	\N	0	2025-12-31 21:39:12.278373
2a1660b3-fdfa-467e-8afd-b27a74cd3733	merchant:review	商家审核	商家管理	\N	0	2025-12-31 21:39:12.27953
560f6c3f-d8fe-48c3-a941-cc2c57f6051a	merchant:update	修改商家	商家管理	\N	0	2025-12-31 21:39:12.280685
7424f9c1-199a-4546-95a1-a888b6611f47	task:list	任务列表	任务管理	\N	0	2025-12-31 21:39:12.281801
b1871fa2-a555-42c5-9edb-bd5531949078	task:detail	任务详情	任务管理	\N	0	2025-12-31 21:39:12.282752
b53c0d06-439d-43be-9e59-0057f6429eec	task:update	修改任务	任务管理	\N	0	2025-12-31 21:39:12.283586
abbc91f7-5d05-4e6d-83d6-0bd1391b0951	order:list	订单列表	订单管理	\N	0	2025-12-31 21:39:12.284403
5b2e35c2-6296-4e6f-8ca6-835369dd28e9	order:detail	订单详情	订单管理	\N	0	2025-12-31 21:39:12.285216
1817071a-601c-4815-9c67-7b04b57a8c0b	order:review	订单审核	订单管理	\N	0	2025-12-31 21:39:12.286862
2d9301cb-1b9e-4874-8d9f-146369dcbcaa	buyno:list	买号列表	买号管理	\N	0	2025-12-31 21:39:12.288273
481aacdd-9263-4368-abc4-e53596ee60a5	buyno:review	买号审核	买号管理	\N	0	2025-12-31 21:39:12.289249
70e38d23-7216-4506-bfde-9696ebd87fd2	buyno:star	设置星级	买号管理	\N	0	2025-12-31 21:39:12.290119
05b46025-9e7e-4860-a1ea-3c11596ead30	finance:list	财务流水	财务管理	\N	0	2025-12-31 21:39:12.290979
accad847-c4fa-41fe-8daa-c20c8d18b0b5	finance:recharge	充值管理	财务管理	\N	0	2025-12-31 21:39:12.292196
d39948b1-024a-4ed7-b7bc-28ddb07cab18	finance:withdraw	提现审核	财务管理	\N	0	2025-12-31 21:39:12.293489
b1bb3870-75bf-4b09-a3de-f7b78322ff40	system:admin	管理员管理	系统管理	\N	0	2025-12-31 21:39:12.295314
625216c5-26c0-4ee3-b799-db8ba01d4d54	system:role	角色管理	系统管理	\N	0	2025-12-31 21:39:12.297954
d299ba93-3ccc-4552-aa22-acd765f76883	system:log	操作日志	系统管理	\N	0	2025-12-31 21:39:12.298918
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.admin_roles (id, name, description, permissions, sort, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.admin_users (id, username, password, "realName", phone, email, "roleId", "roleName", status, avatar, "lastLoginAt", "lastLoginIp", "createdAt", "updatedAt") FROM stdin;
ac98fcc4-6f88-4977-a1c2-2166326ee7b2	admin	fe229dee6f2e1c67ed53a2a8b8bd4e97	欧阳	\N	\N	6b84336e-e155-4ff8-99c8-f510d8c24a46	管理员	1	\N	2022-10-06 12:53:35	219.137.95.62	2026-01-01 21:07:01.199544	2026-01-01 21:07:01.199544
912ddec5-748a-47fc-a3c9-f28dd47e49c3	superadmin	$2b$10$jsOla0n.3TpQ3fFBa45LUuiCuuJ5zWnk6rgjgO0.WJDxai93zjpHi	超级管理员	\N	\N	d5b7a555-f662-4fb8-9f63-6e9a8777f9ca	超级管理员	1	\N	2026-01-02 11:04:57.778	::1	2025-12-31 21:39:12.266558	2026-01-02 11:04:57.780304
\.


--
-- Data for Name: bank_cards; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.bank_cards (id, "userId", "bankName", "accountName", "cardNumber", phone, province, city, "branchName", "idCard", "idCardFrontImage", "idCardBackImage", "isDefault", status, "rejectReason", "createdAt", "updatedAt") FROM stdin;
b0c10274-8971-456a-86a7-1b35b4c39b6c	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	建设银行	黄铭梅	6230520110028712078	13697775623	广东省	珠海市	口岸支行	350521198210202563	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/07/b8465dc34bc7d270ef13086dc94e31fc982d785b.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/07/4e59853e4aa04d79c9383b32151bd1ea425c64e9.png	f	1		2022-02-07 05:16:31	2022-02-07 05:28:40
b611cc3a-1f33-4902-8943-9ef6c04d7309	ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	邮政储蓄银行	罗念琼	6217995800032005666	13828611980	广东省	茂名市	广东省信宜市支行	511522198706152229	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/07/62ec2877b5d56e0a66fd763ddb9038db5ff91cc1.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/07/e509098e9f33b27fb0e47aba376458cdc4fa2ec9.jpeg	f	1		2022-02-07 05:27:43	2022-02-07 05:28:44
2f929692-6bf7-4dc5-b6c4-ff711887c434	5dffbb14-f077-4f3b-b637-73b2cacb166d	工商银行	张燕成	6212261604006686628	18364858938	山东省	泰安市	工商银行	370921198908101604	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/08/ad9d619cc5334897d124179c356e1b04214078f4.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/08/b1ecfe00599e21c73b1381e459492e94da818b7a.jpeg	f	1		2022-02-08 05:00:19	2022-02-08 06:20:49
d48733df-4aa9-462d-bc6c-c0881bdbb3b6	7e35fd52-f03f-4bf9-820c-908e05f0ad38	工商银行	张欢	6212261702022486930	17630034099	河南省	郑州市	工商银行	410328199203259662	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/09/ed12b9bc395ee39e4394e0f9a972706c7d2efd40.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/09/cddfbd60458859d6d9e2a32192b89d9037106e39.jpeg	f	1		2022-02-09 02:15:38	2022-02-09 02:16:39
750d7e94-8d2d-4d08-b674-73fe18c7a417	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	中国银行	程利强	6216605000007682771	13831545855	河北省	唐山市	丰润区支行	130206197203140338	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/09/e1a5e8c645ccd184a32eae4f50a474e16b5cfbee.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/09/8c92648526afda263d2cb8b1c975b977f999d171.jpeg	f	1		2022-02-09 09:02:17	2022-02-16 04:53:27
41354404-b5a5-42d8-97a8-706adcfab6ab	ba7e2983-d20d-4728-b546-053f5d629bc6	邮政储蓄银行	吴秀娥	6221886225001290673	15778449980	请选择省	请选择市	中国邮政储蓄银行	452402198805251525	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/11/6b31986d39c0b57655e7023fb5c9f4ef33519fd2.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/11/12593043e6c26f22c7d55df0ed5b795dd68749d3.jpeg	f	1		2022-02-11 10:03:23	2022-02-11 10:04:33
81a87a10-ed65-4f36-b102-eae0cb80ca61	bc47c1f0-494e-491b-9705-9cce41b10df1	农业银行	雷春梅	6230523030012237972	15835820395	山西省	吕梁市	吕梁市交城县支行	142323197602041025	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/11/f740b4ad6dba0e2d98b9ac21174a724bf84faf4f.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/11/13234afce9e77937f80e9508caaa427b1860b280.jpeg	f	1		2022-02-11 10:08:56	2022-02-11 10:22:04
89dd09ee-0fc6-4e52-8dec-8a1fa6c48aa6	4e0cdeaa-00ab-41f2-9fbe-68dacdd9a3e1	建设银行	石贤	6217002640006121524	15671763390	请选择省	请选择市	中国建设银行支行	420222198203198322	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/13/29309c622a6179148417b8b15b8b7cdb1bdb7a05.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/13/278b8172d31976ef856fb01209a39cf0971338c8.jpeg	f	1		2022-02-13 08:51:10	2022-02-13 09:34:31
d96df018-7b83-401f-86ad-d8fbd1c9603e	0265ca48-557f-407a-b8ae-78e866c5aeee	工商银行	李静	6212261609013138349	19861848772	山东省	菏泽市	巨野支行	371724200110036320	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/15/5e52bf046de930fec699500019d76e553746f563.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/15/10583f080fc985550e9c435e97e4416bf692669b.jpeg	f	1		2022-02-15 05:20:22	2022-02-15 05:42:08
4e12200a-f009-492a-ad97-705b6e9128ea	d16f7d34-c687-475d-b830-7c7b0364084e	中信银行	江霞	6217681304282497	13506924286	福建省	泉州市	津淮支行	350521198206012548	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/28/bf13be70a2f7ceebfadaad53366b89ea018b018a.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/02/28/7ecef6515a33a7cd68b6016f3e695eda1cba11b2.jpeg	f	1		2022-02-28 03:34:20	2022-02-28 12:59:37
\.


--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.banks (id, name, icon, code, sort, "isActive", "createdAt") FROM stdin;
020c6ceb-1eb9-4e8e-b0b3-60e87a217373	农业银行	/yinhangicon/nongyeyinhang.png	\N	0	f	2026-01-01 15:29:10.778
0ac88d59-8671-4806-9b9f-c5eefa7e6de6	工商银行	/yinhangicon/gongshangyinhang.png	\N	0	f	2026-01-01 15:29:10.78
51817aa3-c4d8-4500-b05b-4226704dee94	交通银行	/yinhangicon/jiaotongyinhang.png	\N	0	f	2026-01-01 15:29:10.78
b377e515-436c-4852-9b12-3d3f350c2c8d	建设银行	/yinhangicon/jiansheyinhang.png	\N	0	f	2026-01-01 15:29:10.78
462089ce-dabd-450d-9029-8e0265c1bc0b	招商银行	/yinhangicon/zhaoshangyinhang.png	\N	0	f	2026-01-01 15:29:10.78
d5cb34a3-f8d0-4304-9384-cb0c4042b544	中国银行	/yinhangicon/zhongguoyinhang.png	\N	0	f	2026-01-01 15:29:10.78
e1b2e31c-5f62-4ff4-b95e-32c052fce065	邮政储蓄银行	/yinhangicon/youzhengchuxuyinhang.png	\N	0	f	2026-01-01 15:29:10.781
c10ca80d-3a9e-4636-9d2b-8a0dec663c73	上海浦东发展银行	/yinhangicon/shanghaipudongfazhanyinhang.png	\N	0	f	2026-01-01 15:29:10.781
45242aed-8235-445e-9631-4de3693c3de6	上海农村商业银行	/yinhangicon/shncsyyh.png	\N	0	f	2026-01-01 15:29:10.781
1004e1e7-2660-4f84-a05f-10d5cc929374	平安银行	/yinhangicon/pinganyinhang.png	\N	0	f	2026-01-01 15:29:10.781
39345672-f4f8-4561-af37-5e2ca9ea5eff	兴业银行	/yinhangicon/xingyeyinhang.png	\N	0	f	2026-01-01 15:29:10.781
5e53802d-958a-4a9c-b6f0-781630f48718	光大银行	/yinhangicon/guangdayinhang.png	\N	0	f	2026-01-01 15:29:10.781
cf56a503-58be-491e-9541-30b37f65ae3f	民生银行	/yinhangicon/minshengyinhang.png	\N	0	f	2026-01-01 15:29:10.782
4eb41c30-cdc0-419f-ab09-8c2d3837d9e4	中信银行	/yinhangicon/zhongxinyinhang.png	\N	0	f	2026-01-01 15:29:10.782
cf53ce68-db9f-413a-a4fd-839764c61dc3	华夏银行	/yinhangicon/huaxiayinhang.png	\N	0	f	2026-01-01 15:29:10.782
36262604-9000-4ed2-b6b2-e6c5250173f0	广发银行	/yinhangicon/guangfayinhang.png	\N	0	f	2026-01-01 15:29:10.782
7487466d-f301-493a-8182-4fa2ede2013f	浙商银行	/yinhangicon/zheshangyinhang.png	\N	0	f	2026-01-01 15:29:10.782
41029d5b-ca37-4150-b985-d3a0788ba605	徽商银行	/yinhangicon/huishangyinhang.png	\N	0	f	2026-01-01 15:29:10.782
ec1041a6-9679-48e5-b148-6d6eeade7cd9	深圳发展银行	/yinhangicon/shenzhenfazhanyinhang.png	\N	0	f	2026-01-01 15:29:10.782
328db154-f932-45d5-ad3c-48a1c6877a11	桂林银行	/yinhangicon/guilinyinhang.png	\N	0	f	2026-01-01 15:29:10.782
cc1b05e3-b5ee-4266-b1f6-c1e89cd71971	齐鲁银行	/yinhangicon/qiluyinhang.png	\N	0	f	2026-01-01 15:29:10.783
\.


--
-- Data for Name: buyer_accounts; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.buyer_accounts (id, "userId", platform, "accountName", province, city, district, "receiverName", "receiverPhone", "fullAddress", "alipayName", "idCardImage", "alipayImage", "archiveImage", "ipImage", star, status, "rejectReason", "createdAt", "updatedAt", "monthlyTaskCount", "monthlyCountResetDate", "wangwangProvince", "wangwangCity", "addressRemark", "frozenTime", "zhimaImage", "totalTaskCount") FROM stdin;
48babc5f-70a2-42c7-8128-b6ef83830060	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	淘宝	美力觉醒	广东省	广州市	天河区	欧阳	15622252279	广东省-广州市-天河区-员村三横路	欧阳	/uploads/info/2022/01/19/164258201350349.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/16/208f723b5a821b8a62237c130e004e7bbbc9a7d8.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/16/b592ce4db62fece95a01414a0b76d79755a083b4.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/16/521bbd41cd2369bfffc8935ece5994f787fc2bbc.jpeg	2	1		2022-01-19 08:46:53	2026-01-01 15:29:10.789	0	\N	广东省	广州市	员村三横路	\N	\N	0
dedfa96e-5860-4c7c-b417-18fbd7a7210c	22fdf9d5-0e9f-458d-89e5-49f775ceef64	淘宝	悠客慢品	广东省	广州市	天河区	欧阳	15677718525	广东省-广州市-天河区-员村三横路	欧阳	/uploads/info/2022/01/19/1642558177787874.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/17/1c7cc411b0384288c943f00e9a10069870df6e3a.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/17/b14c053d7c3f076609afab54a67a10cd647e8899.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/info/2022/01/17/267ccde4026495b06182612875e0d67182416d5a.jpeg	2	1		2022-01-19 02:09:37	2026-01-01 15:29:10.79	0	\N	广东省	广州市	员村三横路	\N	\N	0
5f872dae-2db7-4d9f-b4a7-0b5b8b7f4e8e	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	淘宝	讨厌巫婆	广东省	珠海市	香洲区	黄铭梅	13326640410	广东省-珠海市-香洲区-拱北昌盛路	黄铭梅	/uploads/info/2022/02/07/1644210777448864.png	/uploads/info/2022/02/07/1644210777815741.png	/uploads/info/2022/02/07/1644210777149206.png	/uploads/info/2022/02/07/1644210777401216.png	2	1		2022-02-07 05:12:57	2026-01-01 15:29:10.79	0	\N	广东省	珠海市	拱北昌盛路	\N	\N	0
13368bd7-9da7-4f5e-8b87-e551d36b61d3	ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	淘宝	玉度宝贝	广东省	茂名市	信宜市	罗小姐	13828611980	广东省-茂名市-信宜市-广东省信宜市东镇街道城北好家居售楼部	李梅娇	/uploads/info/2022/02/07/1644211973524820.png	/uploads/info/2022/02/07/1644211973408475.png	/uploads/info/2022/02/07/1644211973930366.png	/uploads/info/2022/02/07/1644211973246691.jpeg	2	1		2022-02-07 05:32:53	2026-01-01 15:29:10.79	0	\N	广东省	茂名市	广东省信宜市东镇街道城北好家居售楼部	\N	\N	0
101980cd-83c8-4efb-b50c-fe3abee6e4dc	5dffbb14-f077-4f3b-b637-73b2cacb166d	淘宝	zyc家有俩宝	山东省	泰安市	岱岳区	张燕成	18364858938	山东省-泰安市-岱岳区-山东省泰安市岱岳区北集坡街道佳期漫小区1号楼一单元1903	张燕成	/uploads/info/2022/02/08/1644296828700785.jpeg	/uploads/info/2022/02/08/1644296828173184.jpeg	/uploads/info/2022/02/08/1644296828238879.jpeg	/uploads/info/2022/02/08/1644296828832262.jpeg	2	1		2022-02-08 06:19:56	2026-01-01 15:29:10.79	0	\N	山东省	泰安市	山东省泰安市岱岳区北集坡街道佳期漫小区1号楼一单元1903	\N	\N	0
e49bdbb7-2089-461c-ae5a-66a76de1cd3c	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	淘宝	tb810829118	河北省	唐山市	丰润区	程利强	13831545855	河北省-唐山市-丰润区-幸福道48号	程利强	/uploads/info/2022/02/08/1644307010570439.jpeg	/uploads/info/2022/02/08/1644307010446666.jpeg	/uploads/info/2022/02/08/1644307010801919.jpeg	/uploads/info/2022/02/08/1644307010461354.jpeg	1	3	降权，请换号！	2022-02-08 07:56:50	2026-01-01 15:29:10.79	0	\N	河北省	唐山市	幸福道48号	\N	\N	0
ea46c123-63c5-4d53-ae63-ecad29452f65	7e35fd52-f03f-4bf9-820c-908e05f0ad38	淘宝	和煦冬日9662	河南省	郑州市	金水区	张欢	17630034099	河南省-郑州市-金水区-河南省郑州市金水区锦艺金水3005湾	张欢	/uploads/info/2022/02/08/1644318454232818.png	/uploads/info/2022/02/08/1644318454108357.png	/uploads/info/2022/02/08/1644321779539378.png	/uploads/info/2022/02/08/1644318454590340.png	2	1		2022-02-08 12:02:59	2026-01-01 15:29:10.791	0	\N	河南省	郑州市	河南省郑州市金水区锦艺金水3005湾	\N	\N	0
ba1a109e-25fa-4891-8332-c6110ec19450	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	淘宝	tb136487967	河北省	唐山市	丰润区	程利强	13831545855	河北省-唐山市-丰润区-幸福道48号	刘泉生	/uploads/info/2022/02/09/1644391430516994.jpeg	/uploads/info/2022/02/09/1644391430710848.jpeg	/uploads/info/2022/02/09/1644391791270659.jpeg	/uploads/info/2022/02/09/1644391430827626.jpeg	1	0		2022-02-09 07:29:51	2026-01-01 15:29:10.791	0	\N	河北省	唐山市	幸福道48号	\N	\N	0
526095b2-e99b-42a6-9898-6e8e6b770a59	7e35fd52-f03f-4bf9-820c-908e05f0ad38	淘宝	被我是青春的的坟墓	江西省	南昌市	南昌县	柯以	15515887477	江西省-南昌市-南昌县-收货人: 柯以 手机号码: 17379169162 所在地区: 江西省南昌市南昌县南昌县银三角管理委员会 详细地址: 银河城水月湾	党鹏鹏	/uploads/info/2022/02/09/164439554093213.jpeg	/uploads/info/2022/02/09/1644395540860782.jpeg	/uploads/info/2022/02/09/1644395540536473.png	/uploads/info/2022/02/09/1644395540875795.png	1	3	暂时只支持一个号做任务	2022-02-09 08:32:20	2026-01-01 15:29:10.791	0	\N	河南省	郑州市	收货人: 柯以 手机号码: 17379169162 所在地区: 江西省南昌市南昌县南昌县银三角管理委员会 详细地址: 银河城水月湾	\N	\N	0
4901f1ce-107b-437e-9320-ed9d596bc845	5d9d2444-3e89-408c-aa82-ed15a9a5d009	淘宝	zxhong1314	福建省	宁德市	周宁县	郑小红	13860782681	福建省-宁德市-周宁县-狮城镇龙潭新区6巷12号	郑小红	/uploads/info/2022/02/10/1644487892269394.jpeg	/uploads/info/2022/02/10/1644487892622374.jpeg	/uploads/info/2022/02/10/1644487892859955.jpeg	/uploads/info/2022/02/10/16444878926591.jpeg	2	1		2022-02-10 10:11:32	2026-01-01 15:29:10.791	0	\N	福建省	南平市	狮城镇龙潭新区6巷12号	\N	\N	0
17198c03-fc17-4f91-b413-1b18d28efa1b	bc47c1f0-494e-491b-9705-9cce41b10df1	淘宝	tb226904256	山西省	吕梁市	交城县	雷春梅	15835820395	山西省-吕梁市-交城县-夏家营镇义望村	雷春梅	/uploads/info/2022/02/11/1644573105359235.jpeg	/uploads/info/2022/02/11/1644573105217215.jpeg	/uploads/info/2022/02/11/1644573105246687.jpeg	/uploads/info/2022/02/11/1644573105312639.jpeg	2	1		2022-02-11 09:51:45	2026-01-01 15:29:10.791	0	\N	山西省	吕梁市	夏家营镇义望村	\N	\N	0
a5cacc18-3913-42c2-abee-4463c602e18b	ba7e2983-d20d-4728-b546-053f5d629bc6	淘宝	wu2801802	广西壮族自治区	贺州市	平桂区	吴秀娥	13217849980	广西壮族自治区-贺州市-平桂区-公会镇清泉村	吴秀娥	/uploads/info/2022/02/11/1644573186463027.jpeg	/uploads/info/2022/02/11/1644573186591680.jpeg	/uploads/info/2022/02/11/164457355538365.jpeg	/uploads/info/2022/02/11/164457318618492.jpeg	2	1		2022-02-11 09:59:15	2026-01-01 15:29:10.792	0	\N	广西壮族自治区	贺州市	公会镇清泉村	\N	\N	0
36413722-6a75-4caa-ae34-1d72bf733b03	4e0cdeaa-00ab-41f2-9fbe-68dacdd9a3e1	淘宝	66漂亮小姐姐	湖北省	黄石市	阳新县	石贤	15671763390	湖北省-黄石市-阳新县-湖北省黄石市阳新县兴国镇乐东八益寿堂大药房	石贤	/uploads/info/2022/02/13/1644731139686219.jpeg	/uploads/info/2022/02/13/1644731139676301.jpeg	/uploads/info/2022/02/13/1644731139593739.jpeg	/uploads/info/2022/02/13/16447311396059.jpeg	2	1		2022-02-13 05:45:39	2026-01-01 15:29:10.792	0	\N	湖北省	黄石市	湖北省黄石市阳新县兴国镇乐东八益寿堂大药房	\N	\N	0
c12e0783-9f52-4716-8ed4-6c5737ba2d79	0265ca48-557f-407a-b8ae-78e866c5aeee	淘宝	123李李lj	山东省	菏泽市	巨野县	李静	19861848772	山东省-菏泽市-巨野县-山东省菏泽市巨野县永丰街道新城李楼	李静	/uploads/info/2022/02/15/1644902286833022.jpeg	/uploads/info/2022/02/15/1644902286379543.jpeg	/uploads/info/2022/02/15/1644902286960938.jpeg	/uploads/info/2022/02/15/1644902286981700.jpeg	1	3	降权！不符合要求！请更换账号！	2022-02-15 05:18:06	2026-01-01 15:29:10.792	0	\N	山东省	济南市	山东省菏泽市巨野县永丰街道新城李楼	\N	\N	0
4833a894-5f95-438c-914d-0f53e51f8bcd	0265ca48-557f-407a-b8ae-78e866c5aeee	淘宝	t_1500278004085_0831	上海市	上海市	宝山区	李静	16621697020	上海市-上海市-宝山区-上海市宝山区水产路1699号2号楼B座113	庞素娟	/uploads/info/2022/02/15/1644907103760893.jpeg	/uploads/info/2022/02/15/1644907103384946.jpeg	/uploads/info/2022/02/15/1644907103391775.jpeg	/uploads/info/2022/02/15/1644907103119138.jpeg	2	1		2022-02-15 06:38:23	2026-01-01 15:29:10.792	0	\N	上海市	上海市	上海市宝山区水产路1699号2号楼B座113	\N	\N	0
1bfd2696-9018-49ce-b931-22a847eccaca	d16f7d34-c687-475d-b830-7c7b0364084e	淘宝	tb946828147	福建省	泉州市	惠安县	江霞	13506924286	福建省-泉州市-惠安县-黄塘镇尾园村下园139号	陈家友	/uploads/info/2022/02/28/1646016451112272.jpeg	/uploads/info/2022/02/28/1646016451116230.jpeg	/uploads/info/2022/02/28/164601645189923.jpeg	/uploads/info/2022/02/28/164601645154185.jpeg	2	1		2022-02-28 02:47:31	2026-01-01 15:29:10.792	0	\N	福建省	泉州市	黄塘镇尾园村下园139号	\N	\N	0
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.categories (id, type, name, icon, image, description, sort, "isActive", level, "parentId", extra, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories_closure; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.categories_closure (id_ancestor, id_descendant) FROM stdin;
\.


--
-- Data for Name: commission_rates; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.commission_rates (id, "minPrice", "maxPrice", "buyerCommission", "merchantCommission", platform, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: credit_level_configs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.credit_level_configs (id, level, name, "minScore", "maxScore", "commissionBonus", "dailyTaskLimit", privileges, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: credit_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.credit_logs (id, "userId", "userType", "changeType", "oldScore", change, "newScore", "relatedId", reason, "operatorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.deliveries (id, name, code, logo, phone, sort, "isActive", "createdAt", "updatedAt") FROM stdin;
adfad939-bef8-470c-90ae-f8699f1d4331	默认		\N	\N	0	f	2026-01-01 15:29:10.783	2026-01-01 15:29:10.783
\.


--
-- Data for Name: delivery_warehouses; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.delivery_warehouses (id, name, code, logo, "contactPhone", website, "trackingUrl", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: file_groups; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.file_groups (id, "userId", name, "fileCount", sort, "createdAt") FROM stdin;
\.


--
-- Data for Name: finance_records; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.finance_records (id, "userId", "userType", "moneyType", "financeType", amount, "balanceAfter", memo, "relatedId", "relatedType", "operatorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: fund_records; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.fund_records (id, "userId", type, action, amount, balance, description, "orderId", "withdrawalId", "relatedUserId", "createdAt") FROM stdin;
\.


--
-- Data for Name: goods; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.goods (id, "sellerId", "shopId", name, link, "taobaoId", "verifyCode", "pcImg", "specName", "specValue", price, num, "showPrice", "goodsKeyId", state, "createdAt", "updatedAt") FROM stdin;
3f6bb66d-dd0d-4722-889f-e6c9a1efa7b0	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED无痕裸感瑜伽健身裤女高腰提臀收腹高弹力九分运动裤外穿	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=646760584904	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/10ac8e28fae625791ce9b2b9bef3c6d2082f2743.jpeg"]	\N	\N	0.00	1	149.00	\N	1	2022-01-07 12:09:52	2022-01-15 13:44:59
d3d3002a-ebbd-438a-af38-e4f6b811cfd5	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽服女秋冬新款瑜伽裤裸感无缝高腰提臀运动健身裤外穿	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=661556310639	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/53f9ffa609cd1f6a2ac8fcbe3ebdf6f177062fc9.jpeg"]	\N	\N	0.00	1	159.00	\N	1	2022-01-07 12:14:38	2022-01-15 13:43:09
1a76bb5b-e91d-4933-b033-0631408aeb83	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED专业瑜伽服女薄款透气速干运动T恤显瘦高弹力健身短袖上衣	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=649232777277	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/e7393fc4583bf511b97b1259d3ace4a59b9cdcf1.jpeg"]	\N	\N	0.00	1	99.00	\N	1	2022-01-07 12:17:41	2022-02-07 05:54:09
390c2086-65ec-4cdb-aff1-7959a22ee3ae	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED专业瑜伽服女上衣秋冬跑步健身运动透气速干瑜伽T恤女长袖	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=652480305964	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/4153b866a8a2b0df1f08616c84a4d6fab6a41f77.jpeg"]	\N	\N	0.00	1	119.00	\N	1	2022-01-07 12:21:01	2022-01-15 13:42:44
d62d4006-390e-4f53-b6ac-18af660853e5	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽服小背心lulu瑜伽健身运动上衣女性感细带背心含胸垫	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=650165486195	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/d4526597a040b908681490b32950619fa56a72a3.jpeg"]	\N	\N	0.00	1	79.00	\N	1	2022-01-11 12:53:39	2022-01-15 13:47:28
db8d1f88-dbfa-44de-822e-b233022cee97	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽上衣短款性感跑步运动健身服紧身露腰带胸垫长袖T恤女	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dVR1MdF&ft=t&id=652110696504	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/3d7ebbdef3f8ab0a080baf7274ac488460f97113.jpeg"]	\N	\N	0.00	1	119.00	\N	1	2022-01-07 12:26:06	2022-01-15 13:42:08
383ca2f4-bd5b-48c1-a9c7-11f5e011abce	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽裤女外穿冬加绒保暖高腰提臀紧身健身跑步运动打底裤	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0d5Vepfb&ft=t&id=656690613298	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/d2c3b71c87995010cd0ddf06a2bba915071f710d.jpeg"]	\N	\N	0.00	1	159.00	\N	1	2022-01-15 13:56:51	2026-01-01 15:29:10.794
33eaccf0-2e79-4687-93ba-57c92c245520	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED运动内衣女防震跑步lulu瑜伽美背心式无钢圈聚拢健身文胸	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0d5Vepfb&ft=t&id=654322192270	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/022c272e0ee3eb6ae7c812635da69586a21d2409.jpeg"]	\N	\N	0.00	1	109.00	\N	1	2022-01-15 14:04:32	2026-01-01 15:29:10.794
17f782cc-b198-4757-9459-adfec2c3bab3	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽外套女拉链开衫长袖上衣秋冬新款运动外套跑步健身服	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0d5Vepfb&ft=t&id=657461067076	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/ca9b5ca9712307a00da1b376dd5fe7551cfce1e8.jpeg"]	\N	\N	0.00	1	109.00	\N	1	2022-01-15 14:28:51	2026-01-01 15:29:10.794
0d654a3f-6fa1-41a8-9f8e-10179534dac3	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽T恤女夏lulu裸感运动健身短袖上衣宽松速干透气跑步服	https://item.taobao.com/item.htm?spm=a2126o.success.result.1.493e4831Q4CqXj&id=651418700827	\N	\N	["\\/uploads\\/goods\\/2022\\/01\\/15\\/82e9a48d9cfbc7ff876f6c053e4fc0d1289f3859.jpeg"]	\N	\N	0.00	1	109.00	\N	0	2022-01-15 14:39:30	2026-01-01 15:29:10.794
ca0354fb-78b1-44e8-8a47-0664d4725a85	3eb1057e-72d2-4ac6-a192-ca32c1728357	5a624d2a-3e7d-4b67-83ed-390f44278506	瑜伽裤夏天薄款高腰提臀印花速干运动裤女高弹健身训练九分裤外穿	https://mobile.yangkeduo.com/goods.html?id=245406859441&page_from=39&_oc_trace_mark=199&is_spike=0&refer_page_name=mall_page&refer_page_id=10039_1643810158368_qcsxdnwkau&refer_page_sn=10039	\N	\N	["\\/uploads\\/goods\\/2022\\/02\\/02\\/bd07d52002fe7d93f433ce2d54969f8141cc6e87.png"]	\N	\N	0.00	1	99.00	\N	0	2022-02-02 14:07:52	2022-02-02 15:01:19
156f7e0c-3cc5-4a89-be33-ab7261dee0e7	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED孕妇瑜伽裤春秋款裸感瑜伽服高腰运动健身九分裤女打底裤	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dOB2580&ft=t&id=647266093998	\N	\N	["\\/uploads\\/goods\\/2022\\/02\\/28\\/f553fdce7d87f4c96e857ade998aea5d7207e51a.jpeg"]	\N	\N	0.00	1	149.00	\N	1	2022-02-28 02:13:09	2026-01-01 15:29:10.797
4c377de5-6940-4869-9c6b-fae4a9bcc073	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED瑜伽连衣裙lulu宽松休闲速干运动T恤透气健身服女上衣短袖	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.47b33d0dOB2580&ft=t&id=669082055641	\N	\N	["\\/uploads\\/goods\\/2022\\/02\\/28\\/e17c36a6d096858ca3fd6fcf8b6431434272ee55.jpeg"]	\N	\N	0.00	1	129.00	\N	1	2022-02-28 02:17:28	2026-01-01 15:29:10.798
a0118ca6-612e-482f-9f7e-419c63944d1a	3eb1057e-72d2-4ac6-a192-ca32c1728357	75a6423a-1015-408d-84c4-37327b39f730	RELAXED高强度支撑运动内衣大胸防下垂瑜伽背心防震聚拢定型文胸	https://item.taobao.com/item.htm?spm=a21dvs.23580594.0.0.52de3d0d7A5og2&ft=t&id=668482806894	\N	\N	["\\/uploads\\/goods\\/2022\\/06\\/11\\/80c6114ba5e39419eacb1d6b0d71834df701d478.jpeg"]	\N	\N	0.00	1	119.00	\N	1	2022-06-11 03:02:49	2026-01-01 15:29:10.798
\.


--
-- Data for Name: goods_keys; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.goods_keys (id, "sellerId", name, platform, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invite_codes; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.invite_codes (id, "userId", "userType", code, "usedCount", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invite_reward_configs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.invite_reward_configs (id, "inviteType", "inviterReward", "inviteeReward", "minRechargeAmount", "isActive", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: keyword_details; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.keyword_details (id, "goodsKeyId", keyword, terminal, discount, filter, sort, "maxPrice", "minPrice", province, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: merchant_bank_cards; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.merchant_bank_cards (id, "merchantId", "bankName", "accountName", "cardNumber", "cardType", phone, province, city, "branchName", "idCard", "taxNumber", "licenseImage", "idCardFrontImage", "idCardBackImage", "isDefault", status, "rejectReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: merchant_blacklist; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.merchant_blacklist (id, "sellerId", "accountName", type, status, "endTime", reason, "adminRemark", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: merchant_withdrawals; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.merchant_withdrawals (id, "merchantId", amount, fee, "actualAmount", type, status, "bankCardId", "bankName", "accountName", "cardNumber", phone, remark, "reviewedAt", "reviewedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: merchants; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.merchants (id, username, password, phone, qq, company_name, business_license, contact_name, balance, frozen_balance, silver, vip, vip_expire_at, status, pay_password, created_at, updated_at) FROM stdin;
3eb1057e-72d2-4ac6-a192-ca32c1728357	infu	$2b$10$16ymY3/LMcMNG3hVjSzjVu.httqluq7wKWIlzuA4/zRh3RM6KYpCS	18124944249	2562498641	\N	\N	\N	17120.80	0.00	1847.00	t	2022-10-28 16:00:00	1	\N	2021-07-16 04:41:21	2026-01-03 01:02:50.377549
\.


--
-- Data for Name: message_templates; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.message_templates (id, code, name, title, content, type, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.messages (id, "senderId", "senderType", "receiverId", "receiverType", type, title, content, status, "relatedId", "relatedType", "readAt", "createdAt", "updatedAt") FROM stdin;
4a10d1f1-3f77-46e7-b746-f89b9c634407	system	0	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	1	1	您有新的未读公告	您有新买家公告！请查看。	1	1	\N	\N	2022-01-22 06:24:52	2026-01-01 23:54:02.001
fbef981a-9070-4e42-9928-67fb67673979	system	0	22fdf9d5-0e9f-458d-89e5-49f775ceef64	1	1	您有新的未读公告	您有新买家公告！请查看。	0	1	\N	\N	2022-01-22 06:24:52	2026-01-01 23:54:02.002
4899e366-b2e9-424d-a669-147a849a2bb9	system	0	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	1	1	追评任务	您有新的追评任务！请进入任务大厅-任务管理-追评任务-选择待处理追评任务 查看。	1	1	\N	\N	2022-01-24 15:04:27	2026-01-01 23:54:02.003
406135d6-725d-45e4-8b44-1413df07e0be	system	0	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	1	1	追评任务	您有新的追评任务！请进入任务大厅-任务管理-追评任务-选择待处理追评任务 查看。	1	1	\N	\N	2022-02-06 14:40:38	2026-01-01 23:54:02.003
7372d2ff-4016-432b-97e4-cb4f7aca5552	system	0	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.003
15dcfa62-c327-40a0-8792-22fa5b9649f6	system	0	22fdf9d5-0e9f-458d-89e5-49f775ceef64	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.003
fee9bf7c-cb51-459e-92b3-58dd9d2e160c	system	0	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.004
51c5b789-b4ca-42dc-9b30-b98a75e0b5fc	system	0	ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.004
d80dd59a-0874-4e9f-9963-f5976827567e	system	0	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.004
865bac36-9b6d-4c48-911d-3e847aace947	system	0	5dffbb14-f077-4f3b-b637-73b2cacb166d	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.004
4c5f9d08-e079-41f4-bd5d-0ced25271a83	system	0	61ca535e-186e-4656-bea1-e899a1d32968	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.004
b573e138-7d7a-4d05-b94b-129d6269af00	system	0	7e35fd52-f03f-4bf9-820c-908e05f0ad38	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.005
86b88d6e-2c39-4b5c-872d-e17f3d4b91cc	system	0	2a21979e-ae88-450c-851d-cb05e2fb652b	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.005
58a3a6dd-2633-4a6d-93b3-02cd3d105998	system	0	a06630f7-92c0-472e-8652-de4e103b0248	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.005
0f58d17d-48fe-422e-b45b-2cb2cae7210f	system	0	d634c701-17cf-4240-93cd-6cd921763bac	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.005
2ddc1eef-d996-42d6-9566-88dcff41953f	system	0	5d9d2444-3e89-408c-aa82-ed15a9a5d009	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-02-10 02:31:02	2026-01-01 23:54:02.005
d5a9bd0a-1125-48a5-b1fe-1875cd5cadad	system	0	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-06-07 01:11:49	2026-01-01 23:54:02.006
7c9a4045-5b95-4dbb-9a60-482aad6a805c	system	0	22fdf9d5-0e9f-458d-89e5-49f775ceef64	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.006
8d167bdc-8276-4d03-9e06-f9f8e4ae22fa	system	0	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	1	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.006
ff4e9d37-40cd-4e72-bd50-ca25e12f7de7	system	0	ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.006
9cb635b6-ba5b-41ea-aa05-88835d87146f	system	0	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.006
198821fc-1f59-44e9-b0bb-77b0cc43cdab	system	0	5dffbb14-f077-4f3b-b637-73b2cacb166d	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.007
cba30316-9a2c-438b-8afd-e9eaae4a9dec	system	0	61ca535e-186e-4656-bea1-e899a1d32968	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.007
b3e12d86-302e-4fc0-a105-c6663fc797b9	system	0	7e35fd52-f03f-4bf9-820c-908e05f0ad38	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.007
b76a5949-f6e4-4c5c-b93d-07228f04efcf	system	0	2a21979e-ae88-450c-851d-cb05e2fb652b	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.007
a38f9db9-cb73-42cc-a198-d64fa04012ca	system	0	a06630f7-92c0-472e-8652-de4e103b0248	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.008
850ddeed-392e-4daf-a17e-358aac9d88b6	system	0	d634c701-17cf-4240-93cd-6cd921763bac	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.008
b148eb22-0b93-474b-a1aa-91be642eb0ca	system	0	5d9d2444-3e89-408c-aa82-ed15a9a5d009	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.008
81493d93-89a9-42f5-9f03-83ae2682575c	system	0	4e0cdeaa-00ab-41f2-9fbe-68dacdd9a3e1	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.008
1ac7b8e1-b18f-4fc3-bd1f-6bc091af5c69	system	0	9c5dc94a-d7bd-4de1-ac7e-44e850fe242d	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.009
37903ba4-f370-4de0-a1d7-1abfcbc75072	system	0	ba7e2983-d20d-4728-b546-053f5d629bc6	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.009
432b9a59-f90b-49a3-baa8-9ff5eef1a63c	system	0	bc47c1f0-494e-491b-9705-9cce41b10df1	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.009
0f595171-8455-4041-ac51-8190fd699a3f	system	0	527508eb-f21b-4768-81d2-508ab202e351	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.009
8eccd318-10f0-4132-ac16-4f49d37b3aa7	system	0	0265ca48-557f-407a-b8ae-78e866c5aeee	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.009
6dc46009-8dd8-4528-8356-6b882cc1cda5	system	0	03fe250b-050e-4a4e-9f52-40847fb27b04	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.01
c7c8d2bb-d28c-40ed-a3aa-d92cf511a40a	system	0	d16f7d34-c687-475d-b830-7c7b0364084e	1	1	您有新的未读公告	您有新买家公告！请点击右上角按钮进入帮助中心查看。	0	1	\N	\N	2022-06-07 01:11:50	2026-01-01 23:54:02.01
\.


--
-- Data for Name: notice_reads; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.notice_reads (id, "noticeId", "userId", "userType", "readAt") FROM stdin;
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.notices (id, title, content, type, target, status, sort, "isTop", "isPopup", "coverImage", "adminId", "adminName", "publishedAt", "expiredAt", "viewCount", "createdAt", "updatedAt") FROM stdin;
bd8e757d-369d-4218-839f-0b79d3d6062b	提现必看	温馨提示：领取任务需要暂时冻结1礼金，任务完成后返还，所以在礼金提现时请预留1礼金，否则下次无法领取任务。	1	1	1	0	f	f	\N	\N	\N	\N	\N	0	2026-01-01 15:29:10.798	2022-06-07 01:11:49
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.operation_logs (id, module, type, action, "operatorId", "operatorName", ip, "userAgent", "requestData", "responseData", success, "errorMessage", duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: order_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.order_logs (id, "orderId", "orderNo", action, "operatorType", "operatorId", "operatorName", content, "oldStatus", "newStatus", extra, ip, "createdAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.orders (id, "taskId", "userId", "buynoId", "buynoAccount", "taskTitle", platform, "productName", "productPrice", commission, "currentStep", "totalSteps", "stepData", status, "endingTime", "createdAt", "updatedAt", "completedAt", "userPrincipal", "sellerPrincipal", "prepayAmount", "finalAmount", "refundAmount", "isAdvancePay", "deliveryState", delivery, "deliveryNum", "deliveryTime", "taobaoOrderNumber", "deliveryRequirement", "keywordImg", "chatImg", "orderDetailImg", "highPraiseImg", "receiveImg", "isPresale", "yfPrice", "wkPrice", "okYf", "okWk", "praiseContent", "praiseImages", "praiseVideo", "highPraiseTime", "cancelType", "cancelRemarks", "cancelTime", margin, "marginDiff", "platformRefundTime", "addressName", "addressPhone", address, remark, "rejectReason", "refundTime", "isZp", "isShengji", "silverPrepay") FROM stdin;
83dd6230-ffbe-41eb-adef-8f396aba6772	cda82e23-5c21-42a5-b572-c4f9f5fe8ef9	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	48babc5f-70a2-42c7-8128-b6ef83830060	美力觉醒	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	228.00	5.00	1	5	[]	COMPLETED	\N	2022-01-24 04:33:23	2022-01-24 14:26:06	2022-01-24 14:26:06	228.00	228.00	0.00	228.00	0.00	f	2	中通快递	75850287336581	\N	123456321654	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/01/24/a670213f05fe2f06059b2c446d4a84d5df3efb51.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/01/24/fa0d2e4c96c4a95c994080b9b30b5096ecd7baba.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/01/24/20785f725cf0c21196037c234348424527c7ee55.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/01/24/2c312fece7f35769dc1c7a5fe308108439b66b09.jpeg	\N	f	0.00	0.00	f	f	["\\u8d85\\u8212\\u670d\\u7684\\u9762\\u6599\\uff0c\\u6709\\u4fee\\u9970\\u817f\\u578b\\u7684\\u4f5c\\u7528\\uff0c\\u5feb\\u9012\\u901f\\u5ea6\\u6760\\u6760\\u7684","\\u4e0a\\u8eab\\u6548\\u679c\\u597d\\uff0c\\u9762\\u6599\\u8212\\u670d\\u900f\\u6c14\\uff0c\\u5e76\\u4e14\\u901f\\u5e72"]	\N	\N	\N	\N		\N	0.00	0.00	\N	欧阳	15622252279	广东省,广州市,天河区,员村三横路	\N	\N	\N	f	2	0.00
a0d0ee17-c28c-48a3-9a1c-ca808d7ae947	c4efe33e-03df-4fdb-be9d-3070326e3c68	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	48babc5f-70a2-42c7-8128-b6ef83830060	美力觉醒	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	149.00	4.00	1	5	[]	WAITING_RECEIVE	\N	2022-02-04 03:02:22	2022-02-08 02:40:24	2022-02-06 12:46:19	149.00	0.00	0.00	149.00	0.00	f	2	中通快递75850287336581		\N	123456789	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/04/4c80289cc7aab67edcf810e1f1eaf5c8ea8fe7f0.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/04/4d876daefbab9ab896498e1dadc049b59860d0a1.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/04/814e47af8d0f66622aa8700e1b6238dd12fcc9ce.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/06/49d91a2b797788d5f062a04efe5b1589ae82fb03.jpeg	\N	f	0.00	0.00	f	f	["\\u597d\\u8bc4\\u597d\\u8bc4\\u597d\\u8bc4"]	\N	\N	\N	\N		\N	0.00	0.00	\N	欧阳	15622252279	广东省,广州市,天河区,员村三横路	\N	\N	\N	f	2	0.00
b39cad85-1513-4bb0-894e-854403399a43	42711ce6-823c-40ea-bacb-60127a55022e	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	48babc5f-70a2-42c7-8128-b6ef83830060	美力觉醒	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	223.00	5.00	1	5	[]	CANCELLED	\N	2022-02-07 02:38:02	2022-02-07 02:38:02	\N	0.00	0.00	0.00	223.00	0.00	f	0			\N		0					\N	f	0.00	0.00	f	f	["\\u8d85\\u8212\\u670d\\u7684\\u9762\\u6599\\uff0c\\u6709\\u4fee\\u9970\\u817f\\u578b\\u7684\\u4f5c\\u7528\\uff0c\\u5feb\\u9012\\u901f\\u5ea6\\u6760\\u6760\\u7684","\\u4e0a\\u8eab\\u6548\\u679c\\u597d\\uff0c\\u9762\\u6599\\u8212\\u670d\\u900f\\u6c14\\uff0c\\u5e76\\u4e14\\u901f\\u5e72"]	\N	\N	\N	\N	买手自主取消任务	2022-02-07 02:38:44	0.00	0.00	\N	欧阳	15622252279	广东省,广州市,天河区,员村三横路	\N	\N	\N	f	2	0.00
a1976cd1-deb7-4dc3-87cf-8c77eb9e6006	42711ce6-823c-40ea-bacb-60127a55022e	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	5f872dae-2db7-4d9f-b4a7-0b5b8b7f4e8e	讨厌巫婆	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	223.00	5.00	1	5	[]	COMPLETED	\N	2022-02-07 05:31:14	2022-02-11 14:27:40	2022-02-11 14:27:40	223.20	0.00	0.00	223.00	0.00	f	2	申通快递	773146110808058	\N	2453435208012990503	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/76ffbea26ac879979b8b45b57b97b4371c0e0b56.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/45ce6b10d9660db7ab575e7eb373d971752fb67d.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/6f4198c6c64f5e234a4d77ea67337562b2ee9fdf.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/11/af4b1d125502e0318d1c19043c0b88badab1bd74.png	\N	f	0.00	0.00	f	f	["\\u8d85\\u8212\\u670d\\u7684\\u9762\\u6599\\uff0c\\u6709\\u4fee\\u9970\\u817f\\u578b\\u7684\\u4f5c\\u7528\\uff0c\\u5feb\\u9012\\u901f\\u5ea6\\u6760\\u6760\\u7684","\\u4e0a\\u8eab\\u6548\\u679c\\u597d\\uff0c\\u9762\\u6599\\u8212\\u670d\\u900f\\u6c14\\uff0c\\u5e76\\u4e14\\u901f\\u5e72"]	\N	\N	\N	\N		\N	0.00	0.00	\N	黄铭梅	13326640410	广东省,珠海市,香洲区,拱北昌盛路	\N	\N	\N	f	2	0.00
9ba0db05-a379-456d-9634-2daa70d47dcb	fd328a1c-36ad-43f4-9e1b-99ef50943990	ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	13368bd7-9da7-4f5e-8b87-e551d36b61d3	玉度宝贝	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	233.86	5.00	1	5	[]	COMPLETED	\N	2022-02-07 05:54:55	2022-02-11 09:21:39	2022-02-11 09:21:39	250.20	250.20	0.00	233.86	0.00	f	2	申通快递	773146111179197	\N	2453451696769561951	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/4607515f0eddfb8c7679fb97086ebd85a5204058.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/e2cf6205f5a0fcc5558d7913e7e86959297804da.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/07/76ba7a6de7035a89d1f073a741de3e8048e98025.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/11/19c531773c51e707a378889018555b07c9ca7fe9.jpeg	\N	f	0.00	0.00	f	f	["\\u88e4\\u5b50\\u5f88\\u4e0d\\u9519\\uff0c\\u4e0a\\u8eab\\u5f88\\u8212\\u670d\\uff0c\\u4e5f\\u4e0d\\u4f1a\\u6389\\u6863\\u548c\\u5361\\u6863\\uff0c\\u90fd\\u662f\\u521a\\u521a\\u6070\\u5230\\u597d\\u7684\\u90a3\\u79cd\\uff0c\\u5f88\\u63a8\\u8350\\u5165\\u624b","\\u5f88\\u9165\\u670d\\u3002\\u989c\\u8272\\u7f8e\\u4e3d\\u3002\\u505a\\u5de5\\u5f88\\u68d2\\u3002\\u4ef7\\u683c\\u8fd8\\u5b9e\\u60e0\\u3002\\u5ba4\\u5185\\u745c\\u4f3d\\u666e\\u62c9\\u63d0\\u5f88\\u5408\\u9002\\u3002\\u5916\\u51fa\\u5185\\u642d\\u4e5f\\u5f88\\u53ef\\u3002"]	\N	\N	\N	\N		\N	0.00	0.00	\N	罗小姐	13828611980	广东省,茂名市,信宜市,广东省信宜市东镇街道城北好家居售楼部	\N	\N	\N	f	2	0.00
f8530238-bd96-41d3-8de7-30b8a52736d7	a6843070-e534-4505-8303-8f635c66dcc8	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	48babc5f-70a2-42c7-8128-b6ef83830060	美力觉醒	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	241.86	5.00	1	5	[]	CANCELLED	\N	2022-02-08 00:38:04	2022-02-08 07:28:12	\N	241.86	241.86	0.00	241.86	0.00	f	2	立返已返241.86元		\N	123456789	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/566ca994c54003144e325bfb7ddd677bc00472f3.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/6b0b16a8906b81de2b90557d40b4abbeb778a50b.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/3fad8c9a10287e1746c5d36167b7cc02b109b509.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/c748fdaa30af7c86f3c5c2af14fd57ec5c6cff30.jpeg	\N	f	0.00	0.00	f	f	["\\u9762\\u6599\\u5f39\\u6027\\uff1a\\u5f39\\u6027\\u597d\\uff0c\\u4e0d\\u6389\\u6863 \\u539a\\u8584\\u5ea6\\uff1a\\u9002\\u4e2d\\u8212\\u9002 \\u9762\\u6599\\u54c1\\u8d28\\uff1a\\u975e\\u5e38\\u597d","\\u4fee\\u8eab \\u8d85\\u663e\\u7626\\uff0c\\u672c\\u6765\\u4e0d\\u7c97\\u7684\\u8981\\uff0c\\u7a7f\\u4e0a\\u5b83\\u8170\\u81c0\\u6bd4\\u6760\\u6760\\u6ef4\\u3002 \\u5f88\\u559c\\u6b22\\u8896\\u5b50\\u957f\\u957f\\u7684"]	\N	\N	\N	\N		\N	0.00	0.00	\N	欧阳	15622252279	广东省,广州市,天河区,员村三横路	\N	\N	\N	f	2	0.00
97a69fea-67ac-4267-8071-117a2fdaaf1c	c3512472-c92c-4843-be56-33c820b746ed	d0964f8f-94ff-426a-8b04-201e5c0ae5cf	48babc5f-70a2-42c7-8128-b6ef83830060	美力觉醒	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	149.00	4.00	1	5	[]	CANCELLED	\N	2022-02-15 14:40:21	2022-02-15 14:47:33	\N	0.00	0.00	0.00	149.00	0.00	f	0			\N		0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/15/07501fb5b0d47c8e8163a5429baf8b7696624ccd.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/15/07fc842a7d8094f0c7d0d64908ad14a4e6b33b9e.jpeg			\N	f	0.00	0.00	f	f	["\\u7edd\\u5bf9\\u662f\\u6211\\u4e70\\u8fc7\\u6700\\u6700\\u6700\\u597d\\u7a7f\\u7684\\u4e00\\u6761\\u745c\\u4f3d\\u88e4\\uff01\\uff01\\u4e0d\\u663e\\u88c6\\uff0c\\u771f\\u88f8\\u611f\\uff01\\uff01\\u989c\\u8272\\u4e5f\\u597d\\u770b\\uff01\\u7231\\u4e86\\u7231\\u4e86\\uff5e"]	\N	\N	\N	\N	买手自主取消任务	2022-02-16 03:26:45	0.00	0.00	\N	欧阳	15622252279	广东省,广州市,天河区,员村三横路	\N	\N	\N	f	2	0.00
39b294e4-6d65-44b1-ba40-12ec7d1526c7	f418ccca-1eda-4ea5-83dc-8ca7c5909758	5dffbb14-f077-4f3b-b637-73b2cacb166d	101980cd-83c8-4efb-b50c-fe3abee6e4dc	zyc家有俩宝	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	250.20	5.00	1	5	[]	COMPLETED	\N	2022-02-08 06:29:56	2022-02-13 10:44:31	2022-02-13 10:44:31	250.20	0.00	0.00	250.20	0.00	f	2	立返已返250.20元	中通快递75852668445994	\N	2456371333890966414	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/2a6c363bd048e195525bff1cf09a433642a8e305.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/49b0d6db86a812a12ae56d9fcfc76ba8e1cc76fa.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/08/e1073d9e7b7482656dfc75d4b7cc93e19b327953.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/13/6222d911fa68d3da9c861bb66105164e05dd44c4.jpeg	\N	f	0.00	0.00	f	f	["\\u5f88\\u597d\\u770b\\u7684\\u88e4\\u5b50\\uff0c\\u4f1a\\u663e\\u5f97\\u817f\\u578b\\u975e\\u5e38\\u90fd\\u597d\\u770b\\uff0c\\u4e0d\\u6389\\u6863\\uff0c\\u8d28\\u91cf\\u5f88\\u597d\\u505a\\u5de5\\u5f88\\u7cbe\\u7ec6\\uff0c\\u4e0d\\u662f\\u7b2c\\u4e00\\u6b21\\u56de\\u8d2d\\u4e86\\uff0c\\u771f\\u7684\\u597d\\u559c\\u6b22\\u8fd9\\u4e2a\\u88e4\\u5b50","\\u8fd9\\u4e2a\\u4e0a\\u8863\\u662f\\u5e26\\u80f8\\u57ab\\u7684\\u54e6\\uff0c\\u7248\\u578b\\u7279\\u522b\\u597d\\uff0c\\u597d\\u663e\\u8170\\u8eab\\uff0c\\u5728\\u4ed6\\u4eec\\u5bb6\\u4e70\\u4e86\\u4e00\\u5957\\u642d\\u914d\\u8d77\\u6765\\u597d\\u597d\\u770b\\u5440\\u3002"]	\N	\N	\N	\N		\N	0.00	0.00	\N	张燕成	18364858938	山东省,泰安市,岱岳区,山东省泰安市岱岳区北集坡街道佳期漫小区1号楼一单元1903	\N	\N	\N	f	2	0.00
84e79c10-24a5-44d3-b9ae-0c97ecfe665b	ce5a2290-387f-4c34-9c3b-004d81da8e0e	7e35fd52-f03f-4bf9-820c-908e05f0ad38	ea46c123-63c5-4d53-ae63-ecad29452f65	和煦冬日9662	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	241.20	5.00	1	5	[]	COMPLETED	\N	2022-02-09 01:41:40	2022-02-12 07:11:06	2022-02-12 07:11:06	241.20	0.00	0.00	241.20	0.00	f	2	立返已返241.20元	中通75852921230361	\N	2458636347825247173	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/49f0f25cb8240467eb00c65f06c6b3b894718ecc.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/7b07583ead8dc0cbacf017481116b775c7c75d3b.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/ffb7d2c64eb92d591e74fbfb139bb2cacdbff122.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/12/4e425077efdadfc07ad2f8e88837443b93bf43a0.jpeg	\N	f	0.00	0.00	f	f	["\\u7a7f\\u4e0a\\u7279\\u8212\\u670d\\uff0c\\u5173\\u952e\\u662f\\u4e0d\\u4f1a\\u663e\\u5c34\\u5c2c\\uff0c\\u8d28\\u91cf\\u68d2\\u68d2\\u54d2\\uff0c\\u7269\\u6d41\\u4e5f\\u5f88\\u8d5e\\uff0c\\u7b14\\u82af","\\u4e00\\u5982\\u65e2\\u5f80\\u7684\\u559c\\u6b22\\uff0c\\u8d28\\u91cf\\u4e5f\\u662f\\u59cb\\u7ec8\\u5982\\u4e00\\u7684\\u8ba9\\u4eba\\u653e\\u5fc3\\uff01"]	\N	\N	\N	\N		\N	0.00	0.00	\N	张欢	17630034099	河南省,郑州市,金水区,河南省郑州市金水区锦艺金水3005湾	\N	\N	\N	f	2	0.00
db813af7-d024-4cdf-92fe-e91bdd33121f	9b1066d3-f515-4404-bfa3-8127f4997321	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	ba1a109e-25fa-4891-8332-c6110ec19450	tb136487967	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	288.00	5.00	1	5	[]	COMPLETED	\N	2022-02-09 08:11:53	2022-02-13 11:33:38	2022-02-13 11:33:38	286.20	0.00	0.00	288.00	0.00	f	2	立返已返286.20元		\N	2458869662835366449	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/f621f72b3dee74c58cf9985aa42c29d734aef791.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/66721b3fd4744218f851002cbd586dadb31af0fa.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/09/4cb008315c37e988e08794d5d62b68c3110c9456.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/13/83e9ebea1b214960cce992e32ae795df7d20aafd.jpeg	\N	f	0.00	0.00	f	f	["\\u745c\\u4f3d\\u8001\\u5e08\\u6781\\u529b\\u63a8\\u8350\\u7684\\u88e4\\u5b50\\uff0c\\u5f88\\u9002\\u5408\\u505a\\u745c\\u4f3d\\u7684\\u65f6\\u5019\\u7a7f\\uff0c\\u7a7f\\u4e0a\\u8fd8\\u771f\\u7684\\u662f\\u975e\\u5e38\\u7684\\u8212\\u670d\\uff0c\\u9762\\u6599\\u6bd4\\u8f83\\u8f6f\\u7cef\\uff0c\\u5f39\\u529b\\u4e5f\\u5f88\\u5f88\\u5927\\uff0c\\u4e0d\\u6389\\u6863\\u4e0d\\u5377\\u8fb9\\uff0c\\u65e5\\u5e38\\u8fd0\\u52a8\\u90fd\\u53ef\\u4ee5\\u7a7f\\u3002","\\u88f8\\u611f\\u6750\\u8d28\\u975e\\u5e38\\u8212\\u9002\\uff0c\\u6bd4\\u8f83\\u539a\\u5b9e\\u7684legging \\u4e0a\\u8eab\\u6548\\u679c\\u6bd4\\u8f83\\u663e\\u7626\\u6bd4\\u8f83\\u5851\\u5f62 \\u633a\\u597d\\u770b\\u7684\\uff0c\\u5f39\\u529b\\u90fd\\u8fd8\\u53ef\\u4ee5\\uff0c\\u52a0\\u8584\\u7ed2\\u9002\\u5408\\u51ac\\u65e5\\u6237\\u5916\\uff0c\\u5f88\\u4fdd\\u6696\\uff01"]	\N	\N	\N	\N		\N	0.00	0.00	\N	程利强	13831545855	河北省,唐山市,丰润区,幸福道48号	\N	\N	\N	f	2	0.00
5618359b-b83d-46cf-b315-750740ff2fb3	3e5539a7-c613-400b-8732-6697743e2965	bc47c1f0-494e-491b-9705-9cce41b10df1	17198c03-fc17-4f91-b413-1b18d28efa1b	tb226904256	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	228.00	5.00	1	5	[]	CANCELLED	\N	2022-02-11 10:11:00	2022-02-11 10:11:00	\N	0.00	0.00	0.00	228.00	0.00	f	0			\N		0					\N	f	0.00	0.00	f	f	["\\u7a7f\\u4e0a\\u7279\\u8212\\u670d\\uff0c\\u5173\\u952e\\u662f\\u4e0d\\u4f1a\\u663e\\u5c34\\u5c2c\\uff0c\\u8d28\\u91cf\\u68d2\\u68d2\\u54d2\\uff01","\\u8863\\u670d\\u5f88\\u67d4\\u8f6f\\uff0c\\u8d34\\u8eab\\uff0c\\u5f88\\u8212\\u670d\\uff0c\\u745c\\u4f3d\\u7a7f\\u5f88\\u68d2\\uff01"]	\N	\N	\N	\N	买手自主取消任务	2022-02-11 10:34:42	0.00	0.00	\N	雷春梅	15835820395	山西省,吕梁市,交城县,夏家营镇义望村	\N	\N	\N	f	2	0.00
4a770908-134f-4e97-a20c-5e365573ab09	a6843070-e534-4505-8303-8f635c66dcc8	ba7e2983-d20d-4728-b546-053f5d629bc6	a5cacc18-3913-42c2-abee-4463c602e18b	wu2801802	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	241.86	5.00	1	5	[]	COMPLETED	\N	2022-02-11 10:11:05	2022-02-18 09:37:36	2022-02-18 09:37:36	250.20	0.00	0.00	241.86	0.00	f	2	立返已返250.2元	中通75853638040022	\N	2463144410440799335	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/11/bd3374a9dfb5fcfa1d195a4915ba89138840d4e8.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/11/a794ebf39ee75138f199d2b23b35345b8fb32a3c.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/11/8e065dbce36a87335ef1f4fe5f7f408f6c111839.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/18/25721e83a1fd1722a5cd53b3ace488a6ac994366.jpeg	\N	f	0.00	0.00	f	f	["\\u9762\\u6599\\u5f39\\u6027\\uff1a\\u5f39\\u6027\\u597d\\uff0c\\u4e0d\\u6389\\u6863 \\u539a\\u8584\\u5ea6\\uff1a\\u9002\\u4e2d\\u8212\\u9002 \\u9762\\u6599\\u54c1\\u8d28\\uff1a\\u975e\\u5e38\\u597d","\\u4fee\\u8eab \\u8d85\\u663e\\u7626\\uff0c\\u672c\\u6765\\u4e0d\\u7c97\\u7684\\u8981\\uff0c\\u7a7f\\u4e0a\\u5b83\\u8170\\u81c0\\u6bd4\\u6760\\u6760\\u6ef4\\u3002 \\u5f88\\u559c\\u6b22\\u8896\\u5b50\\u957f\\u957f\\u7684"]	\N	\N	\N	\N		\N	0.00	0.00	\N	吴秀娥	13217849980	广西壮族自治区,贺州市,平桂区,公会镇清泉村	\N	\N	\N	f	2	0.00
5f50a7d6-fe77-49a7-a3a5-d0ed4df45abf	3e5539a7-c613-400b-8732-6697743e2965	4e0cdeaa-00ab-41f2-9fbe-68dacdd9a3e1	36413722-6a75-4caa-ae34-1d72bf733b03	66漂亮小姐姐	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	228.00	5.00	1	5	[]	CANCELLED	\N	2022-02-14 00:51:18	2022-02-14 00:51:18	\N	0.00	0.00	0.00	228.00	0.00	f	0			\N		0					\N	f	0.00	0.00	f	f	["\\u7a7f\\u4e0a\\u7279\\u8212\\u670d\\uff0c\\u5173\\u952e\\u662f\\u4e0d\\u4f1a\\u663e\\u5c34\\u5c2c\\uff0c\\u8d28\\u91cf\\u68d2\\u68d2\\u54d2\\uff01","\\u8863\\u670d\\u5f88\\u67d4\\u8f6f\\uff0c\\u8d34\\u8eab\\uff0c\\u5f88\\u8212\\u670d\\uff0c\\u745c\\u4f3d\\u7a7f\\u5f88\\u68d2\\uff01"]	\N	\N	\N	\N	买手自主取消任务	2022-02-14 00:56:42	0.00	0.00	\N	石贤	15671763390	湖北省,黄石市,阳新县,湖北省黄石市阳新县兴国镇乐东八益寿堂大药房	\N	\N	\N	f	2	0.00
175d5531-a426-4d5b-84e6-0e0320a08b1e	f7ade79f-067b-4cca-ab1a-11711ca3527f	0265ca48-557f-407a-b8ae-78e866c5aeee	4833a894-5f95-438c-914d-0f53e51f8bcd	t_1500278004085_0831	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	250.20	5.00	1	5	[]	COMPLETED	\N	2022-02-17 02:15:31	2022-02-20 08:42:22	2022-02-20 08:42:22	258.00	258.00	0.00	250.20	0.00	f	2	中通	75853638040022	\N	2474168547743972703	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/17/bf67f269d4b6e953570ce422192d964f569d0c4b.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/17/bd1f8403b62d07251cd88f141a2079527527c2f9.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/17/716305b95309d36e90de701c7c569fb00e9d8c9e.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/19/9c7f1aeddd25edaaca10756181ef5574dc624321.jpeg	\N	f	0.00	0.00	f	f	["\\u670b\\u53cb\\u7ec3\\u745c\\u4f3d\\u63a8\\u8350\\u7684\\u8fd9\\u4e2a\\u724c\\u5b50\\uff0c\\u8bf4\\u5f88\\u8212\\u670d\\uff0c\\u6211\\u5c31\\u9009\\u4e86\\u8fd9\\u6b3e\\uff0c\\u5230\\u8d27\\u540e\\u8d76\\u7d27\\u7a7f\\u4e0a\\u8bd5\\u4e86\\uff0c\\u786e\\u5b9e\\u5f88\\u8212\\u670d\\uff0c\\u767e\\u642d\\u6b3e","\\u8fd9\\u6b3e\\u745c\\u4f3d\\u670d\\u771f\\u7684\\u592a\\u8d5e\\u5566\\uff01\\u6536\\u8170\\u663e\\u81c0\\uff0c\\u7a81\\u663e\\u5b8c\\u7f8e\\u8eab\\u6750\\u7edd\\u7edd\\u5b50\\uff0c\\u9762\\u6599\\u8212\\u9002\\u900f\\u6c14\\uff0c\\u989c\\u8272\\u767e\\u642d\\uff0c\\u5927\\u7231"]	\N	\N	\N	\N		\N	0.00	0.00	\N	李静	16621697020	上海市,上海市,宝山区,上海市宝山区水产路1699号2号楼B座113	\N	\N	\N	f	2	0.00
32b7f4f6-bc43-4af6-855c-6aef9e8ad659	563a133b-1927-4e86-a330-19455db6c459	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	5f872dae-2db7-4d9f-b4a7-0b5b8b7f4e8e	讨厌巫婆	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	232.20	5.00	1	5	[]	COMPLETED	\N	2022-02-28 02:55:38	2022-03-02 08:40:21	2022-03-02 08:40:21	238.00	238.00	0.00	232.20	0.00	f	2	申通	773149650338241	\N	2493976718123990503	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/28/96a63f08657775583df31bf6877a662420e2314b.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/28/54f072760bc946ce010a647f8c0c09cede5b7b49.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/02/28/820662344dba4e984a2176a7879cba2b6cd9eb92.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/02/6fc5622e452a57510e65857d21da9d3e0e95d809.png	\N	f	0.00	0.00	f	f	["\\u9762\\u6599\\u5f39\\u6027\\uff1a\\u5f39\\u6027\\u597d\\uff0c\\u4e0d\\u6389\\u6863 \\u539a\\u8584\\u5ea6\\uff1a\\u9002\\u4e2d\\u8212\\u9002 \\u9762\\u6599\\u54c1\\u8d28\\uff1a\\u975e\\u5e38\\u597d","\\u8212\\u670d\\u3002\\u8d85\\u7ea7\\u8212\\u670d\\uff0c\\u4e0a\\u8eab\\u6548\\u679c\\u5f88\\u597d\\uff0c\\u7269\\u8d85\\u6240\\u503c"]	\N	\N	\N	\N		\N	0.00	0.00	\N	黄铭梅	13326640410	广东省,珠海市,香洲区,拱北昌盛路	\N	\N	\N	f	2	0.00
07152e2e-7bbf-44e2-834b-2b01c8535b6c	39146fbd-bee3-414b-b35a-fadd37cd1648	d16f7d34-c687-475d-b830-7c7b0364084e	1bfd2696-9018-49ce-b931-22a847eccaca	tb946828147	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	228.00	5.00	1	5	[]	CANCELLED	\N	2022-03-11 00:45:15	2022-03-11 00:45:15	\N	0.00	0.00	0.00	228.00	0.00	f	0			\N		0					\N	f	0.00	0.00	f	f	["\\u7a7f\\u4e0a\\u7279\\u8212\\u670d\\uff0c\\u5173\\u952e\\u662f\\u4e0d\\u4f1a\\u663e\\u5c34\\u5c2c\\uff0c\\u8d28\\u91cf\\u68d2\\u68d2\\u54d2\\uff01","\\u8863\\u670d\\u5f88\\u67d4\\u8f6f\\uff0c\\u8d34\\u8eab\\uff0c\\u5f88\\u8212\\u670d\\uff0c\\u745c\\u4f3d\\u7a7f\\u5f88\\u68d2\\uff01"]	\N	\N	\N	\N	买手自主取消任务	2022-03-11 08:37:01	0.00	0.00	\N	江霞	13506924286	福建省,泉州市,惠安县,黄塘镇尾园村下园139号	\N	\N	\N	f	2	0.00
9a4bd443-b6a0-4316-8da3-d4aa9f62a733	39146fbd-bee3-414b-b35a-fadd37cd1648	d5bbe74d-1d47-4493-a714-1dcb8e89bc41	ba1a109e-25fa-4891-8332-c6110ec19450	tb136487967	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	228.00	5.00	1	5	[]	COMPLETED	\N	2022-03-18 14:56:47	2022-03-28 04:40:07	2022-03-28 04:40:07	228.00	0.00	0.00	228.00	0.00	f	2	立返已返228	顺丰 SF1351447155171	\N	2529487298478366449	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/18/9ee6854c788a2abbacab9b8d201d0e8a58e2ccde.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/18/f64e282e0aad396d519af4ba3629f074f2a9a262.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/18/370ce8a1a1a58257baf683bd6adff241833cd320.jpeg	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/25/6b85022e6821da961fac96b5d59ec48082e5e5dc.jpeg	\N	f	0.00	0.00	f	f	["\\u7a7f\\u4e0a\\u7279\\u8212\\u670d\\uff0c\\u5173\\u952e\\u662f\\u4e0d\\u4f1a\\u663e\\u5c34\\u5c2c\\uff0c\\u8d28\\u91cf\\u68d2\\u68d2\\u54d2\\uff01","\\u8863\\u670d\\u5f88\\u67d4\\u8f6f\\uff0c\\u8d34\\u8eab\\uff0c\\u5f88\\u8212\\u670d\\uff0c\\u745c\\u4f3d\\u7a7f\\u5f88\\u68d2\\uff01"]	\N	\N	\N	\N		\N	0.00	0.00	\N	程利强	13831545855	河北省,唐山市,丰润区,幸福道48号	\N	\N	\N	f	2	0.00
6966ffa8-b19d-4882-b34b-149cace61cff	53f9bff1-0fe5-4e6b-b729-12223c626f6f	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	5f872dae-2db7-4d9f-b4a7-0b5b8b7f4e8e	讨厌巫婆	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	250.20	5.00	1	5	[]	COMPLETED	\N	2022-03-23 11:51:58	2022-04-01 15:57:24	2022-04-01 15:57:24	229.30	0.00	0.00	250.20	0.00	f	2	立返已返229.3元		\N	2536905492920990503	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/23/e0f2336ad05d4f306d72c7e8c18ceb13e6303865.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/23/0d9bc8f93fe238dcc6f9a90d312d95ed1de1c6a5.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/23/8c105bc12de3f8bc99a6aebc13704594f8a106cd.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/03/29/14e68963301dfa7c83bfee99c82a2e5d1aa8f679.png	\N	f	0.00	0.00	f	f	["\\u5f88\\u597d\\u770b\\u7684\\u88e4\\u5b50\\uff0c\\u4f1a\\u663e\\u5f97\\u817f\\u578b\\u975e\\u5e38\\u90fd\\u597d\\u770b\\uff0c\\u4e0d\\u6389\\u6863\\uff0c\\u8d28\\u91cf\\u5f88\\u597d\\u505a\\u5de5\\u5f88\\u7cbe\\u7ec6\\uff0c\\u4e0d\\u662f\\u7b2c\\u4e00\\u6b21\\u56de\\u8d2d\\u4e86\\uff0c\\u771f\\u7684\\u597d\\u559c\\u6b22\\u8fd9\\u4e2a\\u88e4\\u5b50","\\u8fd9\\u4e2a\\u4e0a\\u8863\\u662f\\u5e26\\u80f8\\u57ab\\u7684\\u54e6\\uff0c\\u7248\\u578b\\u7279\\u522b\\u597d\\uff0c\\u597d\\u663e\\u8170\\u8eab\\uff0c\\u5728\\u4ed6\\u4eec\\u5bb6\\u4e70\\u4e86\\u4e00\\u5957\\u642d\\u914d\\u8d77\\u6765\\u597d\\u597d\\u770b\\u5440\\u3002"]	\N	\N	\N	\N		\N	0.00	0.00	\N	黄铭梅	13326640410	广东省,珠海市,香洲区,拱北昌盛路	\N	\N	\N	f	2	0.00
4cb02ce7-db76-45c7-a94b-d9cf8c9801e3	ae31cb17-890f-493f-bbf9-aeae3ddb6dc0	bf96cba1-ad56-4065-a94d-4b51a7cdaf16	5f872dae-2db7-4d9f-b4a7-0b5b8b7f4e8e	讨厌巫婆	RELAXED瑜伽直营店	淘宝	RELAXED瑜伽直营店	258.00	5.00	1	5	[]	COMPLETED	\N	2022-04-24 06:47:15	2022-05-11 12:12:06	2022-05-11 12:12:06	234.30	0.00	0.00	258.00	0.00	f	2	立返已返234.3元		\N	2593950015978990503	0	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/04/24/558e33e09544276e3202d3d76c26b4b58ef507f4.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/04/24/43d6623e2be8887c8338e0f9b7d9f0a422d0909c.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/04/24/39fe1aa42f197f09d493a45e60db5279ba90b20e.png	https://b--d.oss-cn-guangzhou.aliyuncs.com//uploads/task/2022/04/28/6d7b527c4baa9c62cba8f2527bafd72367f20529.png	\N	f	0.00	0.00	f	f	["\\u633a\\u8212\\u670d\\u7684\\u4e00\\u6b3e\\u5b55\\u5987\\u745c\\u4f3d\\u88e4\\uff0c\\u7a7f\\u4e0a\\u633a\\u663e\\u7626\\u7684\\uff0c\\u8fd8\\u662f\\u9ad8\\u8170\\u6258\\u8179\\u8bbe\\u8ba1\\uff0c\\u53ef\\u4ee5\\u5b8c\\u6574\\u7684\\u5305\\u4f4f\\u809a\\u5b50\\uff0c\\u5f88\\u8212\\u670d\\uff0c\\u6ca1\\u4e00\\u70b9\\u7d27\\u7ef7\\u611f\\u3002","\\u7a7f\\u7740\\u5f88\\u5bbd\\u677e\\uff0c\\u900f\\u6c14\\u6027\\u633a\\u597d\\u7684\\uff0c\\u6599\\u5b50\\u4e5f\\u8212\\u670d\\uff0c\\u4ed6\\u5bb6\\u5f88\\u591a\\u6b3e\\u8863\\u670d\\u90fd\\u5165\\u624b\\u4e86\\uff0c\\u503c\\u5f97\\u4fe1\\u8d56\\u3002"]	\N	\N	\N	\N		\N	0.00	0.00	\N	黄铭梅	13326640410	广东省,珠海市,香洲区,拱北昌盛路	\N	\N	\N	f	2	0.00
\.


--
-- Data for Name: payment_callbacks; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.payment_callbacks (id, "outTradeNo", "tradeNo", channel, type, amount, status, "rawData", signature, "signatureValid", "errorMsg", "relatedId", ip, "processedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: payment_orders; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.payment_orders (id, "orderNo", "userId", "userType", channel, type, amount, status, "tradeNo", "payUrl", "qrCode", "relatedId", "paidAt", "expireAt", remark, "createdAt") FROM stdin;
\.


--
-- Data for Name: platform_day_stats; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.platform_day_stats (id, date, "newBuyers", "newMerchants", "activeBuyers", "activeMerchants", "newTasks", "completedTasks", "cancelledTasks", "newOrders", "completedOrders", "refundOrders", "totalOrderAmount", "totalCommission", "platformRevenue", "rechargeAmount", "withdrawAmount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: platforms; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.platforms (id, code, name, icon, color, "baseFeeRate", "extraFee", "isActive", "supportsTkl", "sortOrder", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: recharge_orders; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.recharge_orders (id, "orderNo", "userId", "userType", "packageId", price, state, "payUrl", "createTime", "paidTime", "createdAt") FROM stdin;
\.


--
-- Data for Name: recharges; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.recharges (id, "userId", "orderNumber", "userType", "rechargeType", amount, "tradeNo", status, "paymentMethod", "arrivalTime", remark, "operatorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: review_task_details; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.review_task_details (id, "reviewTaskId", "goodsId", "goodsName", "reviewType", "requiredContent", "requiredImages", "submittedContent", "submittedImages", "isCompleted", "createdAt") FROM stdin;
\.


--
-- Data for Name: review_task_praises; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.review_task_praises (id, "reviewTaskId", "goodsId", type, content, "createdAt") FROM stdin;
\.


--
-- Data for Name: review_tasks; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.review_tasks (id, "merchantId", "userId", "buynoId", "createdAt", "updatedAt", "shopId", "taobaoOrderNumber", "taskNumber", "userTaskId", "sellerTaskId", "payPrice", money, "userMoney", yjprice, ydprice, state, img, "uploadTime", "confirmTime", "payTime", "examineTime", remarks) FROM stdin;
\.


--
-- Data for Name: reward_recharges; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.reward_recharges (id, uid, utype, "userName", amount, "rewardAmount", status, "payMethod", "orderNo", "tradeNo", remarks, "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: sensitive_word_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.sensitive_word_logs (id, "userId", scene, "originalText", "matchedWords", "maxLevel", blocked, "processedText", ip, "createdAt") FROM stdin;
\.


--
-- Data for Name: sensitive_words; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.sensitive_words (id, word, type, level, replacement, "isActive", "hitCount", remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.shops (id, "sellerId", platform, "shopName", "accountName", "contactName", mobile, province, city, district, "detailAddress", url, status, "auditRemark", "createdAt", "updatedAt", "needLogistics", "expressCode") FROM stdin;
75a6423a-1015-408d-84c4-37327b39f730	3eb1057e-72d2-4ac6-a192-ca32c1728357	TAOBAO	RELAXED瑜伽官方直营店	广州立星	欧阳	15677718525	福建省	泉州市	\N	永宁镇前埔工业区A区1号6楼	https://shop144012435.taobao.com/	1	\N	2022-01-07 11:58:20	2022-06-11 02:57:34	t	默认
5a624d2a-3e7d-4b67-83ed-390f44278506	3eb1057e-72d2-4ac6-a192-ca32c1728357	OTHER	英芙旗舰店	英芙旗舰店	英芙	15622252279	广东省	广州市	\N	员村三横路	https://mobile.yangkeduo.com/mall_page.html?mall_id=730304568	1	\N	2022-01-31 06:09:50	2022-01-31 06:10:42	t	默认
\.


--
-- Data for Name: sms_codes; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.sms_codes (id, phone, code, type, status, "expireAt", ip, "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.sms_logs (id, phone, type, content, provider, "msgId", success, "errorMsg", ip, "createdAt") FROM stdin;
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.system_config (key, value, "group", description) FROM stdin;
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.system_configs (id, key, value, "group", label, description, "valueType", options, "sortOrder", "isEditable", "isVisible", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: system_global_config; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.system_global_config (id, "userNum", "sellerNum", "userVipTime", "sellerVipTime", "userVip", "sellerVip", "userMinMoney", "sellerMinMoney", "userMinReward", "rewardPrice", "sellerCashFee", "userCashFree", "userFeeMaxPrice", "unionInterval", "goodsMoreFee", "refundServicePrice", "phoneFee", "pcFee", "timingPay", "timingPublish", "nextDay", postage, "rePay", "ysFee", praise, "imgPraise", "videoPraise", divided, "msgUsername", "msgPassword", alipay, "verifySwitch", "limitMobile", "invitationNum", "updatedAt") FROM stdin;
\.


--
-- Data for Name: task_goods; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.task_goods (id, "taskId", "goodsId", name, "pcImg", link, "specName", "specValue", price, num, "totalPrice", "createdAt") FROM stdin;
\.


--
-- Data for Name: task_keywords; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.task_keywords (id, "taskId", "taskGoodsId", keyword, terminal, discount, filter, sort, "maxPrice", "minPrice", province, "createdAt") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.tasks (id, "taskNumber", "claimedCount", "createdAt", "updatedAt", "taskType", url, "mainImage", "shopName", keyword, "taoWord", "taobaoId", "qrCode", count, remark, "merchantId", "goodsPrice", "goodsMoney", "shippingFee", margin, "extraReward", "baseServiceFee", "refundServiceFee", "isPraise", "praiseFee", "isImgPraise", "imgPraiseFee", "isVideoPraise", "videoPraiseFee", "totalDeposit", "totalCommission", terminal, version, "completedCount", "incompleteCount", "taskTimeLimit", "unionInterval", cycle, "timingPayFee", "timingPublishFee", "nextDayFee", "phoneFee", "goodsMoreFee", "addReward", "isPresale", "yfPrice", "wkPrice", "examineTime", "payTime", "receiptTime", "isFreeShipping", memo, "shopId", "isTimingPublish", "publishTime", title, status, "needHuobi", "needShoucang", "needJiagou", "needJialiao", "needGuanzhu", "needLiulan", "mainBrowseMinutes", "subBrowseMinutes", "totalBrowseMinutes", "huobiKeyword", "channelImages", "verifySwitch", "verifyCode") FROM stdin;
cda82e23-5c21-42a5-b572-c4f9f5fe8ef9	1642998733985377	0	2022-01-24 04:32:13	2026-01-01 23:54:01.978	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	228.00	228.00	0.00	0.00	0.00	5.00	0.00	t	0.00	t	0.00	f	0.00	228.00	8.50	1	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-01-24 04:32:44	2022-01-24 04:32:36	\N	t	请严格安装每一步的说明完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价，领券20下单。	\N	f	2022-01-24 04:32:13		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
c4efe33e-03df-4fdb-be9d-3070326e3c68	1643943040609538	0	2022-02-04 02:50:40	2026-01-01 23:54:01.982	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	149.00	149.00	0.00	0.00	0.00	4.00	0.00	t	0.00	t	0.00	f	0.00	149.00	4.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	0.00	0.00	f	0.00	0.00	2022-02-04 02:58:17	2022-02-04 02:57:48	\N	t		\N	f	2022-02-04 02:50:40		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
42711ce6-823c-40ea-bacb-60127a55022e	1644200874697036	0	2022-02-07 02:27:54	2026-01-01 23:54:01.983	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	223.00	223.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	223.00	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-07 02:28:31	2022-02-07 02:28:11	\N	t	请严格按照要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-07 02:27:54		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
fd328a1c-36ad-43f4-9e1b-99ef50943990	1644202092212551	0	2022-02-07 02:48:12	2026-01-01 23:54:01.984	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	233.86	233.86	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	233.86	8.50	1	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-07 02:48:42	2022-02-07 02:48:33	\N	t	请严格按流程说明完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-07 02:48:12		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
a6843070-e534-4505-8303-8f635c66dcc8	1644213111851763	0	2022-02-07 05:51:51	2026-01-01 23:54:01.984	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	241.86	241.86	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	241.86	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-07 05:52:11	2022-02-07 05:51:55	\N	t	此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-07 05:51:51		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
ce5a2290-387f-4c34-9c3b-004d81da8e0e	1644292280840801	0	2022-02-08 03:51:20	2026-01-01 23:54:01.985	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	241.20	241.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	241.20	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-08 03:51:45	2022-02-08 03:51:33	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-08 03:51:20		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
563a133b-1927-4e86-a330-19455db6c459	1644296379988503	0	2022-02-08 04:59:39	2026-01-01 23:54:01.986	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	232.20	232.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	232.20	8.50	1	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-08 04:59:53	2022-02-08 04:59:43	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-08 04:59:39		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
f418ccca-1eda-4ea5-83dc-8ca7c5909758	1644296832874705	0	2022-02-08 05:07:12	2026-01-01 23:54:01.986	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	250.20	250.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	250.20	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-08 05:09:08	2022-02-08 05:07:43	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-08 05:07:12		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
443aa173-ea81-4bba-8d97-983c449987ad	1644297975739449	0	2022-02-08 05:26:15	2026-01-01 23:54:01.987	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	5		3eb1057e-72d2-4ac6-a192-ca32c1728357	228.00	1140.00	0.00	0.00	0.00	5.00	0.00	f	0.00	f	0.00	f	0.00	1140.00	42.50	1	1	0	5	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-08 05:26:50	2022-02-08 05:26:35	\N	t	请仔细看做单说明按要求完成任务，此任务收货评价时需自由发挥15字以上与商品相关的评语（可参考同行），若有优惠券可以领券下单，已实际支付金额返款。	\N	f	2022-02-08 05:26:15		5	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
3e5539a7-c613-400b-8732-6697743e2965	1644382404612900	0	2022-02-09 04:53:24	2026-01-01 23:54:01.987	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	228.00	228.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	228.00	6.00	2	1	0	1	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-09 04:53:44	2022-02-09 04:53:27	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-09 04:53:24		5	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
f7ade79f-067b-4cca-ab1a-11711ca3527f	1644389217849729	0	2022-02-09 06:46:57	2026-01-01 23:54:01.988	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	250.20	250.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	250.20	8.50	1	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-09 06:47:25	2022-02-09 06:47:05	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-09 06:46:57		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
9b1066d3-f515-4404-bfa3-8127f4997321	1644389923342119	0	2022-02-09 06:58:43	2026-01-01 23:54:01.988	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	288.00	288.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	288.00	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-09 06:59:04	2022-02-09 06:58:46	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-09 06:58:43		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
7add36a3-d748-4d46-8a86-a609c95fb88d	1644749799768364	0	2022-02-13 10:56:39	2026-01-01 23:54:01.988	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	250.20	250.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	250.20	6.00	2	1	0	1	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-13 10:57:10	2022-02-13 10:56:43	\N	t	注意：此任务指定评语，收货时需先登录平台复制指定的评语进行评价。	\N	f	2022-02-13 10:56:39		5	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
c3512472-c92c-4843-be56-33c820b746ed	1644931583300283	0	2022-02-15 13:26:23	2026-01-01 23:54:01.989	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	149.00	149.00	0.00	0.00	0.00	4.00	0.00	t	0.00	t	0.00	f	0.00	149.00	6.50	1	1	0	0	24	0	0	0.00	0.00	0.00	0.00	0.00	0.00	f	0.00	0.00	2022-02-15 13:26:55	2022-02-15 13:26:38	\N	t	注意！注意！此任务指定购买颜色尺码，指定评语和买家秀照片，收货时需先登录平台找到订单点击去收货，在收货评价页面复制指定评语并保存买家秀照片上传淘宝评价。若未按指定内容购买和评价将扣除佣金，请知悉！	\N	f	2022-02-15 13:26:23		3	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
53f9bff1-0fe5-4e6b-b729-12223c626f6f	1645081394939195	0	2022-02-17 07:03:14	2026-01-01 23:54:01.989	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	250.20	250.20	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	250.20	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-17 07:04:18	2022-02-17 07:03:16	\N	t	注意：此任务指定评语，收货时需先登录平台复制指定的评语进行评价。	\N	f	2022-02-17 07:03:14		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
39146fbd-bee3-414b-b35a-fadd37cd1648	1645081418435424	0	2022-02-17 07:03:38	2026-01-01 23:54:01.99	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	228.00	228.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	228.00	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-17 07:04:22	2022-02-17 07:03:41	\N	t	请仔细看做单说明按要求完成任务，此任务指定评语，收货评价时需复制平台提供的评语进行评价。	\N	f	2022-02-17 07:03:38		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
ae31cb17-890f-493f-bbf9-aeae3ddb6dc0	1646015167186802	0	2022-02-28 02:26:07	2026-01-01 23:54:01.99	1	\N	\N	RELAXED瑜伽直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	258.00	258.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	258.00	6.00	2	1	1	0	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-02-28 02:26:33	2022-02-28 02:26:15	\N	t	注意：此任务指定评语，收货时需先登录平台复制指定的评语进行评价。	\N	f	2022-02-28 02:26:07		6	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
4d3493af-97a0-4a55-a4bc-447e6bc9c95d	1654916950716721	0	2022-06-11 03:09:10	2026-01-01 23:54:01.99	1	\N	\N	RELAXED瑜伽官方直营店	\N		\N	\N	1		3eb1057e-72d2-4ac6-a192-ca32c1728357	278.00	278.00	0.00	0.00	0.00	5.00	0.00	t	0.00	f	0.00	f	0.00	278.00	6.00	2	1	0	1	24	0	0	0.00	0.00	0.00	0.00	1.00	0.00	f	0.00	0.00	2022-06-11 03:09:29	2022-06-11 03:09:15	\N	t	领券下单，订单根据提示备注关键词，按实际支付返款	\N	f	2022-06-11 03:09:10		3	f	f	f	f	f	f	8	2	15	\N	\N	f	\N
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.uploaded_files (id, "originalName", "fileName", path, url, type, "mimeType", size, storage, usage, "uploaderId", "uploaderType", "relatedId", "relatedType", md5, width, height, "isDeleted", "createdAt") FROM stdin;
\.


--
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.user_addresses (id, "userId", name, phone, province, city, district, address, "postalCode", "isDefault", tag, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.user_credits (id, "userId", "userType", score, level, "totalOrders", "completedOrders", "cancelledOrders", "refundedOrders", "timeoutCount", "complaintCount", "completionRate", "isBlacklisted", "blacklistUntil", "blacklistReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_day_counts; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.user_day_counts (id, "userId", "userType", date, "taskCount", "completedCount", "cancelledCount", "totalAmount", "commissionEarned", "commissionPaid", "rechargeAmount", "withdrawAmount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_invites; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.user_invites (id, "inviterId", "inviterType", "inviteeId", "inviteePhone", "inviteeName", "inviteCode", status, "rewardAmount", "inviteeRewardAmount", "activatedAt", "rewardedAt", remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_vip_status; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.user_vip_status (id, "userId", "userType", level, "expireAt", "isExpired", "totalDays", "totalSpent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.users (id, username, password, phone, qq, vip, "vipExpireAt", balance, silver, "frozenSilver", reward, "payPassword", "invitationCode", "invitedBy", "createdAt", "updatedAt", "frozenBalance", "referrerId", "referrerType", "referralReward", "referralRewardToday", "referralCount", "realName", "idCard", "idCardFront", "idCardBack", "verifyStatus", "isActive", "isBanned", "banReason", "lastLoginAt", "lastLoginIp", "inviteState", "monthlyTaskCount", "monthlyTaskCountResetDate") FROM stdin;
22fdf9d5-0e9f-458d-89e5-49f775ceef64	jackyang	cb227b5799bc62993647300473bd5336	TEMP00000002		f	\N	2652095556.00	1.00	1642434542.00	0.00	\N	109	\N	2026-01-01 15:29:10.784	2026-01-01 15:29:10.784	1673969900.00	7.5	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
bf96cba1-ad56-4065-a94d-4b51a7cdaf16	13326640410	60f774f7dceff1531d5cc16cf5123200	b94d811d0dbd5ddbd04277d942a8e7e8		f	\N	109128216.00	1.00	1650782835.00	0.00	\N	ABJYNW6L	\N	1970-01-01 00:00:03	2026-01-01 15:29:10.784	1674454985.00	1	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
ec444cc9-abc9-4a8c-97a6-8f9edf0b4478	13828611980	33ce17a399acae8041348ff8b298371a	d65e1f1864e45d7d5ae42b31a65040dd		f	2392-04-21 12:33:30	815147785.00	1.00	1644213295.00	0.00	\N	1.2	\N	2026-01-01 15:29:10.784	2026-01-01 15:29:10.784	1674456944.00	0	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
d5bbe74d-1d47-4493-a714-1dcb8e89bc41	13831545855	3b29b5b6b6e33a2c9954ddceaf1ad5a5	b06c875ef2fd7139d3e48bf66df56334		f	\N	2861393516.00	0.00	1647615407.00	0.00	\N	XLM7CWKF	\N	2026-01-01 15:29:10.785	2026-01-01 15:29:10.785	0.00	0	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
5dffbb14-f077-4f3b-b637-73b2cacb166d	tb664842567	0467ff464c1e52d32fa2e1ce4926fa18	1301983d83fb31078dcf8823cdcadbf2		f	\N	1844972679.00	1.00	1644301796.00	0.00	\N	IMI4X7MI	\N	2026-01-01 15:29:10.785	2026-01-01 15:29:10.785	1675831918.00	8	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
61ca535e-186e-4656-bea1-e899a1d32968	爱你	e10adc3949ba59abbe56e057f20f883e	TEMP00000003		f	\N	280390677.00	1.00	0.00	0.00	\N	VPU2RFIH	\N	2026-01-01 15:29:10.785	2026-01-01 15:29:10.785	1675850317.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
7e35fd52-f03f-4bf9-820c-908e05f0ad38	和煦冬日9662	5eca08cda7c03b799660bccf8756e9d6	f3252e1d97fe2e631801e3bbc0d5dbc5		f	\N	294209279.00	1.00	1644370900.00	0.00	\N	U968M5EP	\N	2026-01-01 15:29:10.785	2026-01-01 15:29:10.785	1675853869.00	0	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
2a21979e-ae88-450c-851d-cb05e2fb652b	白雪	29ecaa06eba6972328e2714d8aa18ece	TEMP00000004		f	\N	925603037.00	1.00	0.00	0.00	\N	YQK8QEX0	\N	1970-01-01 00:00:10	2026-01-01 15:29:10.785	1675857400.00	12	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
a06630f7-92c0-472e-8652-de4e103b0248	任小猫	bbfa4f77a12c10a4f502c1730d96b5c0	TEMP00000005		f	\N	1096357993.00	1.00	0.00	0.00	\N	VG0HW9VM	\N	2026-01-01 15:29:10.786	2026-01-01 15:29:10.786	1675918148.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
d634c701-17cf-4240-93cd-6cd921763bac	江山如此优秀	b7f84014fa48544f0a98cfbca6f3a33f	TEMP00000006		f	\N	1052647587.00	1.00	0.00	0.00	\N	N0UVO91N	\N	2026-01-01 15:29:10.786	2026-01-01 15:29:10.786	1675926879.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
5d9d2444-3e89-408c-aa82-ed15a9a5d009	zxhong123	2b20d88d4d59784a3a04ba7635a19482	TEMP00000007		f	2392-04-21 12:33:30	29906100.00	1.00	0.00	0.00	\N	JZ48QSH9	\N	1970-01-01 00:00:03	2026-01-01 15:29:10.786	1675943033.00	5	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
4e0cdeaa-00ab-41f2-9fbe-68dacdd9a3e1	ab树叶	ed03c96c2ee5f5a66d21a8031aa7f830	TEMP00000008		f	\N	1141276089.00	1.00	1644799878.00	0.00	\N	65ZUWI92	\N	2026-01-01 15:29:10.786	2026-01-01 15:29:10.786	1676007015.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
9c5dc94a-d7bd-4de1-ac7e-44e850fe242d	张凌玲93	408bbab3add5d19adfb5a32b84fbd5fd	TEMP00000009		f	\N	649200830.00	1.00	0.00	0.00	\N	NVIUEDI4	\N	2026-01-01 15:29:10.786	2026-01-01 15:29:10.786	1676082054.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
527508eb-f21b-4768-81d2-508ab202e351	冰墩墩11	f40b6a2300002019d1671d8f3f8f967e	TEMP00000011		t	2026-02-01 08:42:28.142	773867158.00	1.00	0.00	0.00	\N	MFTHRCBF	\N	2026-01-01 15:29:10.787	2026-01-02 08:42:28.145407	1676128143.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
d16f7d34-c687-475d-b830-7c7b0364084e	13506924286	cac9181a3df5f0eba993c49d3130c5a6	TEMP00000013		t	2392-05-21 12:33:30	465104122.00	1.00	1646959515.00	0.00	\N	0X94W2JP	\N	2026-01-01 15:29:10.787	2026-01-02 08:42:36.254361	1677479128.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
0265ca48-557f-407a-b8ae-78e866c5aeee	饱饱	f2092cc79ae4987cc3a237b2e392ccf2	69469da72bf8e21b3bc6a3993e0132f8		t	2026-02-01 09:13:52.636	1841735934.00	1.00	1645064131.00	0.00	\N	WYSJBQXF	\N	2026-01-01 15:29:10.787	2026-01-02 09:13:52.638922	1676437589.00	0	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
03fe250b-050e-4a4e-9f52-40847fb27b04	萌萌哒图悦	8188341a21f04fc4f0cd9d84167fc2be	TEMP00000012		f	\N	631676438.00	1.00	0.00	0.00	\N	IZ34H6IR	\N	2026-01-01 15:29:10.787	2026-01-02 09:48:53.438232	1676552042.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f		\N	\N	0	0	\N
ba7e2983-d20d-4728-b546-053f5d629bc6	小雨	a786d6284cd480855a26113c3fc6510d	f1278a205d2cbc55a396c1fc46fb81b3		t	2026-02-01 08:42:09.434	375152851.00	1.00	1644574265.00	0.00	\N	MH87P0S7	\N	2026-01-01 15:29:10.787	2026-01-02 10:05:15.390502	1676108108.00	0	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
bc47c1f0-494e-491b-9705-9cce41b10df1	15835820395	0d553d7d6f729a28d62e37fa04b0b2b6	TEMP00000010		t	2026-02-01 08:42:12.729	0.00	1.00	1644574260.00	0.00	\N	QG498UXR	\N	2026-01-01 15:29:10.787	2026-01-02 10:05:26.107648	1676108551.00	2	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
d0964f8f-94ff-426a-8b04-201e5c0ae5cf	ouyang	$2b$10$rcULmO3QNlJT1jlfNn4/XeiFMC.kPGW7RIl3sIOjfBh5OPjJCzUZ2	TEMP00000001		f	\N	7828151.00	1.00	1644936021.00	0.00	\N	476	\N	1970-01-01 00:00:16	2026-01-03 19:59:52.180882	1673085737.00	32	0	0.00	0.00	0	\N	\N	\N	\N	0	t	f	\N	\N	\N	0	0	\N
\.


--
-- Data for Name: vip_level_configs; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.vip_level_configs (id, "userType", level, name, "monthlyPrice", "yearlyPrice", "commissionRate", "maxDailyTasks", "maxTaskPrice", "priorityMatching", "exclusiveTasks", privileges, "isActive", sort, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: vip_levels; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.vip_levels (id, name, level, type, price, duration, icon, color, "dailyTaskLimit", "commissionBonus", "withdrawFeeDiscount", "priorityLevel", "canReserveTask", "showVipBadge", "publishTaskLimit", "serviceFeeDiscount", "priorityReview", "dedicatedSupport", "freePromotionDays", description, privileges, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: vip_packages; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.vip_packages (id, name, days, price, "discountPrice", description, benefits, "isActive", "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: vip_purchases; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.vip_purchases (id, "userId", "packageId", "packageName", days, amount, status, "paymentMethod", "transactionId", "paidAt", "vipStartAt", "vipEndAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: vip_records; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.vip_records (id, "userId", "userType", "oldLevel", "newLevel", "recordType", amount, duration, "expireAt", "operatorId", remark, "createdAt") FROM stdin;
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: jianouyang
--

COPY public.withdrawals (id, "userId", amount, fee, "actualAmount", type, status, "bankCardId", "bankName", "accountName", "cardNumber", phone, remark, "reviewedAt", "reviewedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: system_global_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jianouyang
--

SELECT pg_catalog.setval('public.system_global_config_id_seq', 1, false);


--
-- Name: user_credits PK_02811227c8934f2daee2b018bb2; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT "PK_02811227c8934f2daee2b018bb2" PRIMARY KEY (id);


--
-- Name: admin_users PK_06744d221bb6145dc61e5dc441d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY (id);


--
-- Name: admin_roles PK_091baca34754e848b9f8c4e7be9; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT "PK_091baca34754e848b9f8c4e7be9" PRIMARY KEY (id);


--
-- Name: system_global_config PK_0a46676b141b7f7fd895d55f60a; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.system_global_config
    ADD CONSTRAINT "PK_0a46676b141b7f7fd895d55f60a" PRIMARY KEY (id);


--
-- Name: sms_codes PK_0c00b68561d1f383939febd8648; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.sms_codes
    ADD CONSTRAINT "PK_0c00b68561d1f383939febd8648" PRIMARY KEY (id);


--
-- Name: goods_keys PK_0e4d16c7e11abd7a1df71328f31; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.goods_keys
    ADD CONSTRAINT "PK_0e4d16c7e11abd7a1df71328f31" PRIMARY KEY (id);


--
-- Name: goods PK_105e56546afe0823fa08df0baf7; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT "PK_105e56546afe0823fa08df0baf7" PRIMARY KEY (id);


--
-- Name: sensitive_words PK_11ae52393606d226dd7012fde2b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.sensitive_words
    ADD CONSTRAINT "PK_11ae52393606d226dd7012fde2b" PRIMARY KEY (id);


--
-- Name: payment_orders PK_158dd178010c39759305293a149; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT "PK_158dd178010c39759305293a149" PRIMARY KEY (id);


--
-- Name: messages PK_18325f38ae6de43878487eff986; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY (id);


--
-- Name: operation_logs PK_18c884ac5d5008d1110501edca5; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT "PK_18c884ac5d5008d1110501edca5" PRIMARY KEY (id);


--
-- Name: recharges PK_19efa203cefcf8cf544d7ea7e33; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.recharges
    ADD CONSTRAINT "PK_19efa203cefcf8cf544d7ea7e33" PRIMARY KEY (id);


--
-- Name: buyer_accounts PK_1beb880d80ed37ecd4257284f69; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.buyer_accounts
    ADD CONSTRAINT "PK_1beb880d80ed37ecd4257284f69" PRIMARY KEY (id);


--
-- Name: admin_menus PK_1d3e972e95ca1d6c4b85067594a; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_menus
    ADD CONSTRAINT "PK_1d3e972e95ca1d6c4b85067594a" PRIMARY KEY (id);


--
-- Name: bank_cards PK_1fce641a809c455751dbebc8d01; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.bank_cards
    ADD CONSTRAINT "PK_1fce641a809c455751dbebc8d01" PRIMARY KEY (id);


--
-- Name: task_goods PK_202a163f2646b005b776fd5fb41; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.task_goods
    ADD CONSTRAINT "PK_202a163f2646b005b776fd5fb41" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: system_configs PK_29ac548e654c799fd885e1b9b71; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT "PK_29ac548e654c799fd885e1b9b71" PRIMARY KEY (id);


--
-- Name: vip_purchases PK_2cfca2b1f5131312a498afa50bf; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_purchases
    ADD CONSTRAINT "PK_2cfca2b1f5131312a498afa50bf" PRIMARY KEY (id);


--
-- Name: user_invites PK_32ea679531e84878e97446e8d3f; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_invites
    ADD CONSTRAINT "PK_32ea679531e84878e97446e8d3f" PRIMARY KEY (id);


--
-- Name: commission_rates PK_36e3db4b02381d014a663adbf1b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.commission_rates
    ADD CONSTRAINT "PK_36e3db4b02381d014a663adbf1b" PRIMARY KEY (id);


--
-- Name: banks PK_3975b5f684ec241e3901db62d77; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY (id);


--
-- Name: platforms PK_3b879853678f7368d46e52b81c6; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT "PK_3b879853678f7368d46e52b81c6" PRIMARY KEY (id);


--
-- Name: shops PK_3c6aaa6607d287de99815e60b96; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY (id);


--
-- Name: recharge_orders PK_3e35ca3c8600b9d9642d7b5f525; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.recharge_orders
    ADD CONSTRAINT "PK_3e35ca3c8600b9d9642d7b5f525" PRIMARY KEY (id);


--
-- Name: notices PK_3eb18c29da25d6935fcbe584237; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT "PK_3eb18c29da25d6935fcbe584237" PRIMARY KEY (id);


--
-- Name: vip_level_configs PK_41eedd52b3ce34c1a05ce743175; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_level_configs
    ADD CONSTRAINT "PK_41eedd52b3ce34c1a05ce743175" PRIMARY KEY (id);


--
-- Name: task_keywords PK_46f61a7d2e7f8606b63643c48db; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.task_keywords
    ADD CONSTRAINT "PK_46f61a7d2e7f8606b63643c48db" PRIMARY KEY (id);


--
-- Name: vip_levels PK_4a2bebc78f5fd489fdefd768a14; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_levels
    ADD CONSTRAINT "PK_4a2bebc78f5fd489fdefd768a14" PRIMARY KEY (id);


--
-- Name: payment_callbacks PK_4b4a6946e3c111a007b8f07236e; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.payment_callbacks
    ADD CONSTRAINT "PK_4b4a6946e3c111a007b8f07236e" PRIMARY KEY (id);


--
-- Name: merchants PK_4fd312ef25f8e05ad47bfe7ed25; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT "PK_4fd312ef25f8e05ad47bfe7ed25" PRIMARY KEY (id);


--
-- Name: review_tasks PK_50e2948b4c8e8d026d077e1a777; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.review_tasks
    ADD CONSTRAINT "PK_50e2948b4c8e8d026d077e1a777" PRIMARY KEY (id);


--
-- Name: notice_reads PK_510757f8a8bbe38b23f74d05776; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.notice_reads
    ADD CONSTRAINT "PK_510757f8a8bbe38b23f74d05776" PRIMARY KEY (id);


--
-- Name: vip_records PK_5935f58c509d269d95b129f440c; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_records
    ADD CONSTRAINT "PK_5935f58c509d269d95b129f440c" PRIMARY KEY (id);


--
-- Name: keyword_details PK_613d5ce5d7e390841473faf348b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.keyword_details
    ADD CONSTRAINT "PK_613d5ce5d7e390841473faf348b" PRIMARY KEY (id);


--
-- Name: reward_recharges PK_69f6bd1c25c0fb1abccc0e14b79; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.reward_recharges
    ADD CONSTRAINT "PK_69f6bd1c25c0fb1abccc0e14b79" PRIMARY KEY (id);


--
-- Name: invite_codes PK_6c0ede25edb23ae63c935138e33; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT "PK_6c0ede25edb23ae63c935138e33" PRIMARY KEY (id);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: user_vip_status PK_77723dee2d6adbc28418ad783dd; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_vip_status
    ADD CONSTRAINT "PK_77723dee2d6adbc28418ad783dd" PRIMARY KEY (id);


--
-- Name: merchant_blacklist PK_7cd46917f4c287cba3fbcee0f4f; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchant_blacklist
    ADD CONSTRAINT "PK_7cd46917f4c287cba3fbcee0f4f" PRIMARY KEY (id);


--
-- Name: review_task_praises PK_7e52a4e9c00ed8ffa4b61011fec; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.review_task_praises
    ADD CONSTRAINT "PK_7e52a4e9c00ed8ffa4b61011fec" PRIMARY KEY (id);


--
-- Name: sms_logs PK_811e3a63f5e14a50475c6e8be3d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT "PK_811e3a63f5e14a50475c6e8be3d" PRIMARY KEY (id);


--
-- Name: user_addresses PK_8abbeb5e3239ff7877088ffc25b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT "PK_8abbeb5e3239ff7877088ffc25b" PRIMARY KEY (id);


--
-- Name: tasks PK_8d12ff38fcc62aaba2cab748772; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY (id);


--
-- Name: credit_level_configs PK_8d60d988a7c85aa8af6f0034c36; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.credit_level_configs
    ADD CONSTRAINT "PK_8d60d988a7c85aa8af6f0034c36" PRIMARY KEY (id);


--
-- Name: admin_permissions PK_97efc32c48511fc4061111040a0; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT "PK_97efc32c48511fc4061111040a0" PRIMARY KEY (id);


--
-- Name: withdrawals PK_9871ec481baa7755f8bd8b7c7e9; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT "PK_9871ec481baa7755f8bd8b7c7e9" PRIMARY KEY (id);


--
-- Name: message_templates PK_9ac2bd9635be662d183f314947d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY (id);


--
-- Name: platform_day_stats PK_9e30964816cab0d08492725eacd; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.platform_day_stats
    ADD CONSTRAINT "PK_9e30964816cab0d08492725eacd" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: deliveries PK_a6ef225c5c5f0974e503bfb731f; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY (id);


--
-- Name: user_day_counts PK_a7ff1bd93f34d9578da1fbcfb74; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_day_counts
    ADD CONSTRAINT "PK_a7ff1bd93f34d9578da1fbcfb74" PRIMARY KEY (id);


--
-- Name: invite_reward_configs PK_b6946a9d00009e79325a04c0769; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.invite_reward_configs
    ADD CONSTRAINT "PK_b6946a9d00009e79325a04c0769" PRIMARY KEY (id);


--
-- Name: merchant_bank_cards PK_b87ee95a1a2e7a6a139e4348da9; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchant_bank_cards
    ADD CONSTRAINT "PK_b87ee95a1a2e7a6a139e4348da9" PRIMARY KEY (id);


--
-- Name: merchant_withdrawals PK_be20b0e98c98453eb21c65fe93b; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchant_withdrawals
    ADD CONSTRAINT "PK_be20b0e98c98453eb21c65fe93b" PRIMARY KEY (id);


--
-- Name: vip_packages PK_c5050670321b33536aaedeba3d6; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_packages
    ADD CONSTRAINT "PK_c5050670321b33536aaedeba3d6" PRIMARY KEY (id);


--
-- Name: review_task_details PK_d3395fc2e007575fed17d6e6c91; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.review_task_details
    ADD CONSTRAINT "PK_d3395fc2e007575fed17d6e6c91" PRIMARY KEY (id);


--
-- Name: fund_records PK_d8e2f61e9b1582f6eb98c17ea86; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.fund_records
    ADD CONSTRAINT "PK_d8e2f61e9b1582f6eb98c17ea86" PRIMARY KEY (id);


--
-- Name: categories_closure PK_dc67f6a82852c15ec6e4243398d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "PK_dc67f6a82852c15ec6e4243398d" PRIMARY KEY (id_ancestor, id_descendant);


--
-- Name: credit_logs PK_e26e76ae6e504a5ce191495d75a; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.credit_logs
    ADD CONSTRAINT "PK_e26e76ae6e504a5ce191495d75a" PRIMARY KEY (id);


--
-- Name: uploaded_files PK_e2d47e01bd5be386bf0067b2ed8; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT "PK_e2d47e01bd5be386bf0067b2ed8" PRIMARY KEY (id);


--
-- Name: admin_operation_logs PK_eaf5fdb59a8e27d0d2029523346; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_operation_logs
    ADD CONSTRAINT "PK_eaf5fdb59a8e27d0d2029523346" PRIMARY KEY (id);


--
-- Name: system_config PK_eedd3cd0f227c7fb5eff2204e93; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT "PK_eedd3cd0f227c7fb5eff2204e93" PRIMARY KEY (key);


--
-- Name: sensitive_word_logs PK_f060ac4a559b9cd9389ef912534; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.sensitive_word_logs
    ADD CONSTRAINT "PK_f060ac4a559b9cd9389ef912534" PRIMARY KEY (id);


--
-- Name: delivery_warehouses PK_f33b18392f0914cc22a848dc2c8; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.delivery_warehouses
    ADD CONSTRAINT "PK_f33b18392f0914cc22a848dc2c8" PRIMARY KEY (id);


--
-- Name: file_groups PK_fa65b4d01150c9348f8369bf587; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.file_groups
    ADD CONSTRAINT "PK_fa65b4d01150c9348f8369bf587" PRIMARY KEY (id);


--
-- Name: finance_records PK_fa96ad926c6fef153a00736aeab; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.finance_records
    ADD CONSTRAINT "PK_fa96ad926c6fef153a00736aeab" PRIMARY KEY (id);


--
-- Name: order_logs PK_fb7850e731ffae56f7b7d4fad0d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.order_logs
    ADD CONSTRAINT "PK_fb7850e731ffae56f7b7d4fad0d" PRIMARY KEY (id);


--
-- Name: tasks UQ_031e3b539824978b3036152d5c9; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "UQ_031e3b539824978b3036152d5c9" UNIQUE ("taskNumber");


--
-- Name: user_vip_status UQ_1d73877345244bbde97dcc723df; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_vip_status
    ADD CONSTRAINT "UQ_1d73877345244bbde97dcc723df" UNIQUE ("userId");


--
-- Name: admin_users UQ_2873882c38e8c07d98cb64f962d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT "UQ_2873882c38e8c07d98cb64f962d" UNIQUE (username);


--
-- Name: payment_orders UQ_2b556e814d00821714c8eb132ba; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT "UQ_2b556e814d00821714c8eb132ba" UNIQUE ("orderNo");


--
-- Name: system_configs UQ_5aff9a6d272a5cedf54d7aaf617; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT "UQ_5aff9a6d272a5cedf54d7aaf617" UNIQUE (key);


--
-- Name: review_tasks UQ_5ceca594193e10a516b0d57c179; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.review_tasks
    ADD CONSTRAINT "UQ_5ceca594193e10a516b0d57c179" UNIQUE ("taskNumber");


--
-- Name: admin_roles UQ_6e9e938900168e4a0786bb65889; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT "UQ_6e9e938900168e4a0786bb65889" UNIQUE (name);


--
-- Name: recharges UQ_7deeae9c3c7e589d34e0ab9c1d6; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.recharges
    ADD CONSTRAINT "UQ_7deeae9c3c7e589d34e0ab9c1d6" UNIQUE ("orderNumber");


--
-- Name: credit_level_configs UQ_90bf83c5160f9333366dac8e9ee; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.credit_level_configs
    ADD CONSTRAINT "UQ_90bf83c5160f9333366dac8e9ee" UNIQUE (level);


--
-- Name: user_credits UQ_9bea00b91b76684bcfe49a2f115; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT "UQ_9bea00b91b76684bcfe49a2f115" UNIQUE ("userId");


--
-- Name: users UQ_a000cca60bcf04454e727699490; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE (phone);


--
-- Name: delivery_warehouses UQ_d088df1dff7c6dc82a273c995b1; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.delivery_warehouses
    ADD CONSTRAINT "UQ_d088df1dff7c6dc82a273c995b1" UNIQUE (code);


--
-- Name: merchants UQ_e19f78b202ac4f4db61456d3ac9; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT "UQ_e19f78b202ac4f4db61456d3ac9" UNIQUE (username);


--
-- Name: merchants UQ_e4aea97ced3e5fd43ad172d9df4; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT "UQ_e4aea97ced3e5fd43ad172d9df4" UNIQUE (phone);


--
-- Name: invite_codes UQ_e8034125cb28e0814cd5a526c20; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT "UQ_e8034125cb28e0814cd5a526c20" UNIQUE (code);


--
-- Name: users UQ_ec52824b1595bcf69ce0344c095; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_ec52824b1595bcf69ce0344c095" UNIQUE ("invitationCode");


--
-- Name: platforms UQ_f2dfc2261c3cb3322162a3b0615; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT "UQ_f2dfc2261c3cb3322162a3b0615" UNIQUE (code);


--
-- Name: message_templates UQ_fae105581a4ed87dedfdc5c106d; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT "UQ_fae105581a4ed87dedfdc5c106d" UNIQUE (code);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: IDX_0a112cdd42ed2e5be788ce20e3; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_0a112cdd42ed2e5be788ce20e3" ON public.merchant_withdrawals USING btree ("merchantId");


--
-- Name: IDX_0df7372b536e511cff0c47ed6d; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_0df7372b536e511cff0c47ed6d" ON public.operation_logs USING btree ("createdAt");


--
-- Name: IDX_0e7f5139141e2b3a139d270e5e; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_0e7f5139141e2b3a139d270e5e" ON public.fund_records USING btree ("userId");


--
-- Name: IDX_151b79a83ba240b0cb31b2302d; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_151b79a83ba240b0cb31b2302d" ON public.orders USING btree ("userId");


--
-- Name: IDX_1943230c14824288f70a52ec05; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_1943230c14824288f70a52ec05" ON public.sensitive_word_logs USING btree ("userId");


--
-- Name: IDX_1aa2a68cde39091863ad05c921; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_1aa2a68cde39091863ad05c921" ON public.vip_records USING btree ("userId");


--
-- Name: IDX_1d73877345244bbde97dcc723d; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_1d73877345244bbde97dcc723d" ON public.user_vip_status USING btree ("userId");


--
-- Name: IDX_2a13ab856e7888bf915765905b; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_2a13ab856e7888bf915765905b" ON public.uploaded_files USING btree (path);


--
-- Name: IDX_2b556e814d00821714c8eb132b; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_2b556e814d00821714c8eb132b" ON public.payment_orders USING btree ("orderNo");


--
-- Name: IDX_2db9cf2b3ca111742793f6c37c; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_2db9cf2b3ca111742793f6c37c" ON public.messages USING btree ("senderId");


--
-- Name: IDX_31a19fa0ec9c080027a71e4d40; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_31a19fa0ec9c080027a71e4d40" ON public.uploaded_files USING btree (md5);


--
-- Name: IDX_31e1a5f3a80e8ba7f777595a9a; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_31e1a5f3a80e8ba7f777595a9a" ON public.recharges USING btree ("createdAt");


--
-- Name: IDX_3329f00f7a5544aeba5513dd95; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_3329f00f7a5544aeba5513dd95" ON public.goods_keys USING btree ("sellerId");


--
-- Name: IDX_342531870dc894eac213288396; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_342531870dc894eac213288396" ON public.sms_codes USING btree (phone, type, status);


--
-- Name: IDX_362c0c714287c4b986c89761e3; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_362c0c714287c4b986c89761e3" ON public.uploaded_files USING btree ("uploaderId");


--
-- Name: IDX_377864ed4c51ad7668cef4abbf; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_377864ed4c51ad7668cef4abbf" ON public.recharges USING btree ("userId");


--
-- Name: IDX_37b7bf532070e7fe1ef3988c28; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_37b7bf532070e7fe1ef3988c28" ON public.review_task_praises USING btree ("reviewTaskId");


--
-- Name: IDX_38bee3d698082bdce9152dcfac; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_38bee3d698082bdce9152dcfac" ON public.finance_records USING btree ("userId");


--
-- Name: IDX_3a4dd79be1df2fe50e2ced46a7; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_3a4dd79be1df2fe50e2ced46a7" ON public.goods USING btree ("sellerId");


--
-- Name: IDX_3fb06cc4205d1079900d6f0d93; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_3fb06cc4205d1079900d6f0d93" ON public.notice_reads USING btree ("userId");


--
-- Name: IDX_46ae5bcc5e68df5e6285483cc1; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_46ae5bcc5e68df5e6285483cc1" ON public.sms_logs USING btree (phone);


--
-- Name: IDX_47b35986023ffe3d48660695f7; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_47b35986023ffe3d48660695f7" ON public.user_day_counts USING btree (date);


--
-- Name: IDX_47bfc922753fb02c6e5c04b030; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_47bfc922753fb02c6e5c04b030" ON public.operation_logs USING btree ("operatorId");


--
-- Name: IDX_4a6754634188582ae42d896d50; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_4a6754634188582ae42d896d50" ON public.notices USING btree (status);


--
-- Name: IDX_4d908dab01ea258633bfbe5597; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_4d908dab01ea258633bfbe5597" ON public.review_tasks USING btree (state);


--
-- Name: IDX_4f53b127ddf3ce935c1d74b29d; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_4f53b127ddf3ce935c1d74b29d" ON public.goods USING btree ("shopId");


--
-- Name: IDX_51fff5114cc41723e8ca36cf22; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_51fff5114cc41723e8ca36cf22" ON public.categories_closure USING btree (id_descendant);


--
-- Name: IDX_534917e421517ca2c9bfdd144e; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_534917e421517ca2c9bfdd144e" ON public.review_task_details USING btree ("reviewTaskId");


--
-- Name: IDX_5c477c234b2d4cc6122b169829; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_5c477c234b2d4cc6122b169829" ON public.keyword_details USING btree ("goodsKeyId");


--
-- Name: IDX_5ceca594193e10a516b0d57c17; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_5ceca594193e10a516b0d57c17" ON public.review_tasks USING btree ("taskNumber");


--
-- Name: IDX_5f8501202b13cd3f35e2929e01; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_5f8501202b13cd3f35e2929e01" ON public.recharge_orders USING btree ("userId");


--
-- Name: IDX_62b7d050b20681c4a99ef2526b; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_62b7d050b20681c4a99ef2526b" ON public.vip_purchases USING btree (status);


--
-- Name: IDX_63026e9e18216bebdc60ea02c0; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_63026e9e18216bebdc60ea02c0" ON public.invite_codes USING btree ("userId");


--
-- Name: IDX_6c15306339fda125bf98fbcf05; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_6c15306339fda125bf98fbcf05" ON public.fund_records USING btree (action);


--
-- Name: IDX_6d3ead587e5410d93aef34e9c9; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_6d3ead587e5410d93aef34e9c9" ON public.merchant_bank_cards USING btree ("cardNumber");


--
-- Name: IDX_6f8291d46efdb6245ed7eddf47; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_6f8291d46efdb6245ed7eddf47" ON public.merchant_blacklist USING btree ("sellerId");


--
-- Name: IDX_6fdc5b44a77404b993890bf152; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE UNIQUE INDEX "IDX_6fdc5b44a77404b993890bf152" ON public.user_day_counts USING btree ("userId", date);


--
-- Name: IDX_75d2e79c152b8f323242504212; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_75d2e79c152b8f323242504212" ON public.credit_logs USING btree ("userId");


--
-- Name: IDX_77ed6732bcffba4a0644270660; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_77ed6732bcffba4a0644270660" ON public.review_tasks USING btree ("userTaskId");


--
-- Name: IDX_781afdedafe920f331f6229cb6; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_781afdedafe920f331f6229cb6" ON public.user_addresses USING btree ("userId");


--
-- Name: IDX_7892afd880c2c3c2ccae54a7fe; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_7892afd880c2c3c2ccae54a7fe" ON public.task_goods USING btree ("taskId");


--
-- Name: IDX_789c65e558ba9d3c0bd4232da3; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_789c65e558ba9d3c0bd4232da3" ON public.user_day_counts USING btree ("userId");


--
-- Name: IDX_79477034d2bc82d9334aa53de7; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_79477034d2bc82d9334aa53de7" ON public.orders USING btree ("taskId");


--
-- Name: IDX_79a3949e02a4652fb2b2a0ccd4; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_79a3949e02a4652fb2b2a0ccd4" ON public.withdrawals USING btree ("userId");


--
-- Name: IDX_7a448cab9e4cff089c5441dc28; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_7a448cab9e4cff089c5441dc28" ON public.fund_records USING btree ("createdAt");


--
-- Name: IDX_8117cb0d18db9e582726f80390; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_8117cb0d18db9e582726f80390" ON public.order_logs USING btree ("orderId");


--
-- Name: IDX_82fa1a5a071eb71ce333ab3d68; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_82fa1a5a071eb71ce333ab3d68" ON public.payment_orders USING btree ("userId");


--
-- Name: IDX_8345c33852a1da99988fb06bff; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_8345c33852a1da99988fb06bff" ON public.vip_purchases USING btree ("userId");


--
-- Name: IDX_89f02a7541191e302b1c089f93; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE UNIQUE INDEX "IDX_89f02a7541191e302b1c089f93" ON public.sensitive_words USING btree (word);


--
-- Name: IDX_8e9e03f14ebc834bb2284bf7a0; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_8e9e03f14ebc834bb2284bf7a0" ON public.reward_recharges USING btree (uid);


--
-- Name: IDX_95c2e4dfc7f4f83ce002cca269; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_95c2e4dfc7f4f83ce002cca269" ON public.merchant_withdrawals USING btree (status);


--
-- Name: IDX_95e7576142543a3a6970d09a49; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE UNIQUE INDEX "IDX_95e7576142543a3a6970d09a49" ON public.platform_day_stats USING btree (date);


--
-- Name: IDX_9a6f051e66982b5f0318981bca; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_9a6f051e66982b5f0318981bca" ON public.categories USING btree ("parentId");


--
-- Name: IDX_9bea00b91b76684bcfe49a2f11; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_9bea00b91b76684bcfe49a2f11" ON public.user_credits USING btree ("userId");


--
-- Name: IDX_9c42929f8090409c4d6e7287da; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_9c42929f8090409c4d6e7287da" ON public.review_tasks USING btree ("userId");


--
-- Name: IDX_9f0ed6d90ffe9ed969b2b7237f; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_9f0ed6d90ffe9ed969b2b7237f" ON public.finance_records USING btree ("createdAt");


--
-- Name: IDX_a000cca60bcf04454e72769949; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON public.users USING btree (phone);


--
-- Name: IDX_a2a85b97ed9c75a4fe4d89e0f5; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_a2a85b97ed9c75a4fe4d89e0f5" ON public.operation_logs USING btree (module);


--
-- Name: IDX_a756eec32a79af7f66ad75f484; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_a756eec32a79af7f66ad75f484" ON public.payment_callbacks USING btree ("outTradeNo");


--
-- Name: IDX_a784b32d5fbad99dafdff82fd3; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_a784b32d5fbad99dafdff82fd3" ON public.sms_codes USING btree (phone);


--
-- Name: IDX_aa293113503ae2172047740f2a; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_aa293113503ae2172047740f2a" ON public.bank_cards USING btree ("userId");


--
-- Name: IDX_abd55f994da9c1969c19159780; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_abd55f994da9c1969c19159780" ON public.notice_reads USING btree ("noticeId");


--
-- Name: IDX_acf951a58e3b9611dd96ce8904; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_acf951a58e3b9611dd96ce8904" ON public.messages USING btree ("receiverId");


--
-- Name: IDX_b60078638f20293922314b0880; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_b60078638f20293922314b0880" ON public.file_groups USING btree ("userId");


--
-- Name: IDX_bc7b7a6cb64591b1682ea4b45f; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_bc7b7a6cb64591b1682ea4b45f" ON public.buyer_accounts USING btree ("userId");


--
-- Name: IDX_c8171a67ca47fc7b9c8924e733; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_c8171a67ca47fc7b9c8924e733" ON public.payment_callbacks USING btree ("tradeNo");


--
-- Name: IDX_c9416e2ecdd434e1bf308c7bc1; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_c9416e2ecdd434e1bf308c7bc1" ON public.review_tasks USING btree ("merchantId");


--
-- Name: IDX_ce8101a77e1846f197b89f28b1; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_ce8101a77e1846f197b89f28b1" ON public.task_keywords USING btree ("taskId");


--
-- Name: IDX_d4a65a29f544eba49427694a6e; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_d4a65a29f544eba49427694a6e" ON public.bank_cards USING btree ("cardNumber");


--
-- Name: IDX_dc591a3520526561b639a2432e; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_dc591a3520526561b639a2432e" ON public.categories USING btree (type);


--
-- Name: IDX_e08ea237768a6dcf292a6860b4; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_e08ea237768a6dcf292a6860b4" ON public.user_invites USING btree ("inviterId");


--
-- Name: IDX_e359942c0ba2c76bda1f04fd0a; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_e359942c0ba2c76bda1f04fd0a" ON public.merchant_bank_cards USING btree ("merchantId");


--
-- Name: IDX_e54a1b216fec6dad22dde94319; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_e54a1b216fec6dad22dde94319" ON public.fund_records USING btree (type);


--
-- Name: IDX_ea1e9c4eea91160dfdb4318778; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_ea1e9c4eea91160dfdb4318778" ON public.categories_closure USING btree (id_ancestor);


--
-- Name: IDX_ec52824b1595bcf69ce0344c09; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_ec52824b1595bcf69ce0344c09" ON public.users USING btree ("invitationCode");


--
-- Name: IDX_ed98c9469b07c01e03be1f8164; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_ed98c9469b07c01e03be1f8164" ON public.user_invites USING btree ("inviteCode");


--
-- Name: IDX_fec4941d0c28b7f1dfbc9f141c; Type: INDEX; Schema: public; Owner: jianouyang
--

CREATE INDEX "IDX_fec4941d0c28b7f1dfbc9f141c" ON public.user_invites USING btree ("inviteeId");


--
-- Name: fund_records FK_0e7f5139141e2b3a139d270e5ed; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.fund_records
    ADD CONSTRAINT "FK_0e7f5139141e2b3a139d270e5ed" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: goods_keys FK_3329f00f7a5544aeba5513dd953; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.goods_keys
    ADD CONSTRAINT "FK_3329f00f7a5544aeba5513dd953" FOREIGN KEY ("sellerId") REFERENCES public.merchants(id);


--
-- Name: goods FK_3a4dd79be1df2fe50e2ced46a7b; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT "FK_3a4dd79be1df2fe50e2ced46a7b" FOREIGN KEY ("sellerId") REFERENCES public.merchants(id);


--
-- Name: goods FK_4f53b127ddf3ce935c1d74b29d5; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT "FK_4f53b127ddf3ce935c1d74b29d5" FOREIGN KEY ("shopId") REFERENCES public.shops(id);


--
-- Name: categories_closure FK_51fff5114cc41723e8ca36cf227; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "FK_51fff5114cc41723e8ca36cf227" FOREIGN KEY (id_descendant) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: keyword_details FK_5c477c234b2d4cc6122b1698296; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.keyword_details
    ADD CONSTRAINT "FK_5c477c234b2d4cc6122b1698296" FOREIGN KEY ("goodsKeyId") REFERENCES public.goods_keys(id);


--
-- Name: recharge_orders FK_5f8501202b13cd3f35e2929e01a; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.recharge_orders
    ADD CONSTRAINT "FK_5f8501202b13cd3f35e2929e01a" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: merchant_blacklist FK_6f8291d46efdb6245ed7eddf475; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.merchant_blacklist
    ADD CONSTRAINT "FK_6f8291d46efdb6245ed7eddf475" FOREIGN KEY ("sellerId") REFERENCES public.merchants(id);


--
-- Name: admin_menus FK_73921a2edea234b490130ec34ba; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.admin_menus
    ADD CONSTRAINT "FK_73921a2edea234b490130ec34ba" FOREIGN KEY ("parentId") REFERENCES public.admin_menus(id);


--
-- Name: task_goods FK_7892afd880c2c3c2ccae54a7fe6; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.task_goods
    ADD CONSTRAINT "FK_7892afd880c2c3c2ccae54a7fe6" FOREIGN KEY ("taskId") REFERENCES public.tasks(id);


--
-- Name: tasks FK_824ef1b3f4b6d7cc0b8e6599d80; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_824ef1b3f4b6d7cc0b8e6599d80" FOREIGN KEY ("merchantId") REFERENCES public.merchants(id);


--
-- Name: vip_purchases FK_8345c33852a1da99988fb06bffe; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_purchases
    ADD CONSTRAINT "FK_8345c33852a1da99988fb06bffe" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: vip_purchases FK_88337683ff5ed8a0fd64d55d67a; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.vip_purchases
    ADD CONSTRAINT "FK_88337683ff5ed8a0fd64d55d67a" FOREIGN KEY ("packageId") REFERENCES public.vip_packages(id);


--
-- Name: shops FK_94194bc87b70e0b20bf4d1709cf; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_94194bc87b70e0b20bf4d1709cf" FOREIGN KEY ("sellerId") REFERENCES public.merchants(id);


--
-- Name: categories FK_9a6f051e66982b5f0318981bcaa; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES public.categories(id);


--
-- Name: task_keywords FK_ce8101a77e1846f197b89f28b1a; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.task_keywords
    ADD CONSTRAINT "FK_ce8101a77e1846f197b89f28b1a" FOREIGN KEY ("taskId") REFERENCES public.tasks(id);


--
-- Name: categories_closure FK_ea1e9c4eea91160dfdb4318778d; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "FK_ea1e9c4eea91160dfdb4318778d" FOREIGN KEY (id_ancestor) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: task_goods FK_ed9d838732cee1e494bdbcd6c38; Type: FK CONSTRAINT; Schema: public; Owner: jianouyang
--

ALTER TABLE ONLY public.task_goods
    ADD CONSTRAINT "FK_ed9d838732cee1e494bdbcd6c38" FOREIGN KEY ("goodsId") REFERENCES public.goods(id);


--
-- PostgreSQL database dump complete
--

\unrestrict nqgdSWo1gbS4ZR4OcJGzX77tzfn2VHguVkQXlWxU78EBA6vYum0zz98GgyW0LqF

