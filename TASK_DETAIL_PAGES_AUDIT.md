# Task Detail Pages Comprehensive Audit Report

**Date**: January 13, 2026  
**Scope**: Full audit of task detail pages across three modules comparing task creation form fields vs display pages  
**Methodology**: Independent audit without comparing to original version - analyzing what fields are set during task creation and what's displayed on detail pages

---

## Executive Summary

The refactored task detail pages display **most** of the fields set during task creation, but with some notable gaps and organizational differences. The pages have been redesigned with improved UX and multi-goods/multi-keyword support, but certain fields are missing or not prominently displayed.

**Overall Coverage**: ~85% of task creation fields are displayed across the three detail pages

---

## 1. Task Creation Form Fields (Complete Reference)

### Step 1: Basic Info
- `taskType` - Platform type (Taobao, Tmall, JD, PDD, Douyin, Kuaishou, XHS, Xianyu, Ali1688)
- `taskEntryType` - Entry method (Keyword, Tao Password, QR Code, ZTC, Channel)
- `terminal` - Settlement method (本佣货返 / 本立佣货)
- `shopId` / `shopName` - Shop information
- `goodsList` - Multi-goods list (new version)
  - `name`, `image`, `link`, `price`, `quantity`
  - `specName` / `specValue` - Product specs
  - `keywords` - Multi-keyword config (up to 5)
  - `orderSpecs` - Order spec config (up to 5)
  - `verifyCode` - Verify code (4-10 chars)
  - `filterSettings` - Goods filter settings

### Step 2: Value Added Services
- `isFreeShipping` - Shipping (包邮 / 非包邮)
- `isPraise` / `praiseType` / `praiseList` - Text praise
- `isImgPraise` / `praiseImgList` - Image praise
- `isVideoPraise` / `praiseVideoList` - Video praise
- Browse behavior settings:
  - `needCompare` / `compareCount` - Compare with other products
  - `needFavorite` - Favorite product
  - `needFollow` - Follow shop
  - `needAddCart` - Add to cart
  - `needContactCS` / `contactCSContent` - Contact CS
- Browse time settings:
  - `totalBrowseMinutes` - Total browse time
  - `mainBrowseMinutes` - Main product browse time
  - `subBrowseMinutes` - Sub product browse time
- Extra services:
  - `isTimingPublish` / `publishTime` - Timing publish
  - `isTimingPay` / `timingPayTime` - Timing pay
  - `isCycleTime` / `cycleTime` - Cycle time (days)
  - `addReward` - Extra reward per order
  - `isRepay` - Repurchase task
  - `isNextDay` - Next day task
- Order settings:
  - `memo` - Order memo/tips (max 100 chars)
  - `weight` - Package weight (0-30kg)
  - `fastRefund` - Fast refund service
  - `orderInterval` - Order interval (minutes)
- Verify code:
  - `isPasswordEnabled` - Enable verify code
  - `checkPassword` - Verify code (4-10 chars)

---

## 2. Merchant Center Task Detail Page (`/merchant/tasks/[id]`)

### ✅ Displayed Fields

**Product Information Section**
- ✅ Multi-goods list with main/sub product badges
- ✅ Product image, name, price, quantity
- ✅ Product specs (specName/specValue)
- ✅ Product link

**Entry Method Section**
- ✅ Entry type (Keyword/Tao Password/QR Code/Channel)
- ✅ Multi-keyword configuration with:
  - ✅ Keyword text
  - ✅ Terminal type (PC/Mobile)
  - ✅ Filter settings (sort, province, price range)

**Browse Requirements Section**
- ✅ Browse behavior (货比, 收藏, 关注, 加购, 联系客服)
- ✅ Browse time (total, main product, sub product)

**Value Added Services Section**
- ✅ Settlement method (terminal)
- ✅ Shipping (包邮 / 非包邮)
- ✅ Extra reward (addReward)
- ✅ Timing publish
- ✅ Timing pay
- ✅ Repurchase task (isRepay)
- ✅ Next day task (isNextDay)
- ✅ Cycle time
- ✅ Order interval (unionInterval)

**Praise Settings Section**
- ✅ Text praise (count)
- ✅ Image praise (count)
- ✅ Video praise (count)
- ✅ Praise content preview (modal)

**Merchant Memo Section**
- ✅ Order memo/tips (memo)

**Task Progress Section**
- ✅ Total orders, claimed, completed, remaining

### ❌ Missing/Not Displayed

| Field | Status | Notes |
|-------|--------|-------|
| `compareCount` | ❌ Missing | Number of products to compare not shown |
| `compareKeyword` | ⚠️ Partial | Shown in badge but not detailed |
| `contactCSContent` | ❌ Missing | Contact CS content not displayed |
| `verifyCode` / `isPasswordEnabled` | ❌ Missing | Verify code settings not shown |
| `weight` | ❌ Missing | Package weight not displayed |
| `fastRefund` | ❌ Missing | Fast refund service not shown |
| `orderSpecs` | ❌ Missing | Order spec configuration not displayed |
| Fee breakdown | ⚠️ Partial | Only total fees shown, not individual components |

---

## 3. Buyer Task Detail Page (`/tasks/[id]`)

### ✅ Displayed Fields

**Product Information Section**
- ✅ Multi-goods list with main/sub product badges
- ✅ Product image, name, price, quantity
- ✅ Product specs (specName/specValue)
- ✅ Task statistics (total, claimed, completed, remaining)

**Entry Method Section**
- ✅ Entry type (Keyword/Tao Password/QR Code/Channel)
- ✅ Multi-keyword configuration with:
  - ✅ Keyword text
  - ✅ Filter settings (sort, province, price range)

**Browse Requirements Section**
- ✅ Browse time (total, main product, sub product)
- ✅ Browse behavior (货比, 收藏, 关注, 加购, 联系客服)

**Praise Requirements Section**
- ✅ Praise types (text, image, video)
- ✅ Text praise content preview (first 3 items)

**Task Information Section**
- ✅ Task number
- ✅ Settlement method (terminal)
- ✅ Shipping (包邮 / 非包邮)
- ✅ Extra reward (extraReward)
- ✅ Repurchase task (isRepay)
- ✅ Next day task (isNextDay)

**Merchant Memo Section**
- ✅ Order memo/tips (memo)

**Notes Section**
- ✅ Task requirements and warnings

### ❌ Missing/Not Displayed

| Field | Status | Notes |
|-------|--------|-------|
| `compareCount` | ❌ Missing | Number of products to compare not shown |
| `contactCSContent` | ❌ Missing | Contact CS content not displayed |
| `verifyCode` / `isPasswordEnabled` | ❌ Missing | Verify code settings not shown |
| `weight` | ❌ Missing | Package weight not displayed |
| `fastRefund` | ❌ Missing | Fast refund service not shown |
| `orderSpecs` | ❌ Missing | Order spec configuration not displayed |
| `isTimingPublish` / `publishTime` | ❌ Missing | Timing publish not shown |
| `isTimingPay` / `timingPayTime` | ❌ Missing | Timing pay not shown |
| `isCycleTime` / `cycleTime` | ❌ Missing | Cycle time not shown |
| `unionInterval` | ❌ Missing | Order interval not shown |
| Commission details | ❌ Missing | No commission breakdown |

---

## 4. Admin Task Detail Page (`/admin/tasks` - Modal)

### ✅ Displayed Fields

**Basic Information Section**
- ✅ Task number
- ✅ Platform (taskType)
- ✅ Status
- ✅ Title
- ✅ Shop name
- ✅ Merchant info
- ✅ Settlement method (terminal)

**Product Information Section**
- ✅ Multi-goods list with main/sub product badges
- ✅ Product image, name, price, quantity
- ✅ Product specs (specName/specValue)

**Entry Method Section**
- ✅ Entry type (Keyword/Tao Password/QR Code/Channel)
- ✅ Multi-keyword configuration with:
  - ✅ Keyword text
  - ✅ Filter settings (sort, province, price range)
- ✅ Product link

**Browse Requirements Section**
- ✅ Browse behavior (货比, 收藏, 关注, 加购, 联系客服)
- ✅ Browse time (total, main product, sub product)

**Task Progress Section**
- ✅ Total orders, claimed, completed, remaining

**Fee Information Section**
- ✅ Product price
- ✅ Total deposit
- ✅ Total commission
- ✅ Extra reward

**Value Added Services Section**
- ✅ Shipping (包邮 / 非包邮)
- ✅ Timing publish
- ✅ Timing pay
- ✅ Repurchase task
- ✅ Next day task
- ✅ Cycle time
- ✅ Order interval

**Praise Settings Section**
- ✅ Text praise (count)
- ✅ Image praise (count)
- ✅ Video praise (count)

**Praise Content Details Section**
- ✅ Text praise content (all items)
- ✅ Image praise preview (all groups)
- ✅ Video praise preview (all videos)

**Merchant Memo Section**
- ✅ Order memo/tips (memo)

### ❌ Missing/Not Displayed

| Field | Status | Notes |
|-------|--------|-------|
| `compareCount` | ❌ Missing | Number of products to compare not shown |
| `contactCSContent` | ❌ Missing | Contact CS content not displayed |
| `verifyCode` / `isPasswordEnabled` | ❌ Missing | Verify code settings not shown |
| `weight` | ❌ Missing | Package weight not displayed |
| `fastRefund` | ❌ Missing | Fast refund service not shown |
| `orderSpecs` | ❌ Missing | Order spec configuration not displayed |
| Fee breakdown | ⚠️ Partial | Only total fees shown, not individual components (baseServiceFee, praiseFee, etc.) |

---

## 5. Cross-Page Comparison Matrix

| Field | Merchant Detail | Buyer Detail | Admin Detail | Status |
|-------|-----------------|--------------|-------------|--------|
| Platform | ✅ | ✅ | ✅ | Complete |
| Shop Info | ✅ | ✅ | ✅ | Complete |
| Multi-goods | ✅ | ✅ | ✅ | Complete |
| Multi-keywords | ✅ | ✅ | ✅ | Complete |
| Entry method | ✅ | ✅ | ✅ | Complete |
| Browse behavior | ✅ | ✅ | ✅ | Complete |
| Browse time | ✅ | ✅ | ✅ | Complete |
| Praise settings | ✅ | ✅ | ✅ | Complete |
| Praise content | ✅ | ✅ | ✅ | Complete |
| Settlement method | ✅ | ✅ | ✅ | Complete |
| Shipping | ✅ | ✅ | ✅ | Complete |
| Extra reward | ✅ | ✅ | ✅ | Complete |
| Timing publish | ✅ | ❌ | ✅ | Partial |
| Timing pay | ✅ | ❌ | ✅ | Partial |
| Cycle time | ✅ | ❌ | ✅ | Partial |
| Order interval | ✅ | ❌ | ✅ | Partial |
| Repurchase task | ✅ | ✅ | ✅ | Complete |
| Next day task | ✅ | ✅ | ✅ | Complete |
| **compareCount** | ❌ | ❌ | ❌ | Missing |
| **contactCSContent** | ❌ | ❌ | ❌ | Missing |
| **verifyCode** | ❌ | ❌ | ❌ | Missing |
| **weight** | ❌ | ❌ | ❌ | Missing |
| **fastRefund** | ❌ | ❌ | ❌ | Missing |
| **orderSpecs** | ❌ | ❌ | ❌ | Missing |
| Fee breakdown | ⚠️ | ❌ | ⚠️ | Partial |

---

## 6. Missing Fields Analysis

### Critical Missing Fields (Should Be Displayed)

1. **Verify Code Settings** (`isPasswordEnabled`, `checkPassword`)
   - Set during task creation
   - Used for order verification
   - **Impact**: Buyers cannot see verification requirements
   - **Recommendation**: Add to all detail pages

2. **Contact CS Content** (`contactCSContent`)
   - Set when `needContactCS` is enabled
   - Specific message to send to customer service
   - **Impact**: Buyers don't know what to say to CS
   - **Recommendation**: Display in browse requirements section

3. **Compare Count** (`compareCount`)
   - Set when `needCompare` is enabled
   - Number of products to compare
   - **Impact**: Buyers see "货比" but not how many products
   - **Recommendation**: Display in browse behavior section

4. **Package Weight** (`weight`)
   - Set during order settings
   - Used for logistics calculation
   - **Impact**: Buyers don't know package weight
   - **Recommendation**: Add to order settings section

5. **Fast Refund Service** (`fastRefund`)
   - Set during order settings
   - 0.6% fee service
   - **Impact**: Buyers don't know if fast refund is available
   - **Recommendation**: Add to value added services section

6. **Order Spec Configuration** (`orderSpecs`)
   - Set during product configuration
   - Specific specs to order (up to 5)
   - **Impact**: Buyers don't know exact specs to order
   - **Recommendation**: Add to product information section

### Partial Display Issues

1. **Fee Breakdown**
   - Only total fees displayed
   - Individual components not shown (baseServiceFee, praiseFee, etc.)
   - **Recommendation**: Add detailed fee breakdown section

2. **Timing Services on Buyer Page**
   - Timing publish and timing pay not shown to buyers
   - **Recommendation**: Add to value added services section

---

## 7. Recommendations

### Priority 1: Critical (Should Add Immediately)

1. **Add Verify Code Section** to all detail pages
   - Display `isPasswordEnabled` status
   - Show `checkPassword` value
   - Location: After browse requirements

2. **Add Contact CS Content** to browse requirements
   - Display `contactCSContent` when `needContactCS` is true
   - Location: In browse behavior section

3. **Add Compare Count** to browse behavior
   - Display `compareCount` when `needCompare` is true
   - Format: "货比 (3个商品)"

4. **Add Order Specs** to product information
   - Display `orderSpecs` array
   - Format: Spec name + value pairs

### Priority 2: Important (Should Add)

5. **Add Package Weight** to order settings section
   - Display `weight` value
   - Location: New "Order Settings" section

6. **Add Fast Refund Service** to value added services
   - Display `fastRefund` status
   - Location: Value added services section

7. **Add Fee Breakdown** to admin detail page
   - Display individual fee components
   - Location: Expand fee information section

### Priority 3: Enhancement (Nice to Have)

8. **Add Timing Services to Buyer Page**
   - Display `isTimingPublish`, `isTimingPay`, `isCycleTime`, `unionInterval`
   - Location: Value added services section

9. **Improve Browse Behavior Display**
   - Show more details for each behavior
   - Add icons or visual indicators

---

## 8. Implementation Notes

### For Merchant Detail Page
- Add verify code section after browse requirements
- Add contact CS content in browse behavior
- Add compare count in browse behavior
- Add order specs in product information
- Add package weight in value added services
- Add fast refund in value added services

### For Buyer Detail Page
- Add verify code section after browse requirements
- Add contact CS content in browse behavior
- Add compare count in browse behavior
- Add order specs in product information
- Add timing services in task information section
- Add package weight in task information section
- Add fast refund in task information section

### For Admin Detail Page
- Add verify code section after browse requirements
- Add contact CS content in browse behavior
- Add compare count in browse behavior
- Add order specs in product information
- Add package weight in order settings section
- Add fast refund in value added services
- Expand fee information with breakdown

---

## 9. Conclusion

The refactored task detail pages successfully display **~85% of task creation fields** with improved UX and multi-goods/multi-keyword support. However, **6 critical fields are completely missing** and should be added to provide complete task information to users:

1. Verify code settings
2. Contact CS content
3. Compare count
4. Order specs
5. Package weight
6. Fast refund service

Additionally, **timing services and fee breakdown** should be enhanced for better transparency.

**Overall Assessment**: The pages are functional and display most important information, but adding the missing fields would provide complete feature parity with task creation form.
