// 中国省市区数据 (简化版)
// 主要城市和常用地区

export interface RegionData {
    value: string;
    label: string;
    children?: RegionData[];
}

export const CHINA_REGIONS: RegionData[] = [
    {
        value: '北京市', label: '北京市', children: [
            {
                value: '北京市', label: '北京市', children: [
                    { value: '东城区', label: '东城区' },
                    { value: '西城区', label: '西城区' },
                    { value: '朝阳区', label: '朝阳区' },
                    { value: '海淀区', label: '海淀区' },
                    { value: '丰台区', label: '丰台区' },
                    { value: '石景山区', label: '石景山区' },
                    { value: '通州区', label: '通州区' },
                    { value: '顺义区', label: '顺义区' },
                    { value: '大兴区', label: '大兴区' },
                    { value: '昌平区', label: '昌平区' },
                ]
            }
        ]
    },
    {
        value: '上海市', label: '上海市', children: [
            {
                value: '上海市', label: '上海市', children: [
                    { value: '黄浦区', label: '黄浦区' },
                    { value: '徐汇区', label: '徐汇区' },
                    { value: '长宁区', label: '长宁区' },
                    { value: '静安区', label: '静安区' },
                    { value: '普陀区', label: '普陀区' },
                    { value: '虹口区', label: '虹口区' },
                    { value: '杨浦区', label: '杨浦区' },
                    { value: '浦东新区', label: '浦东新区' },
                    { value: '闵行区', label: '闵行区' },
                    { value: '宝山区', label: '宝山区' },
                ]
            }
        ]
    },
    {
        value: '广东省', label: '广东省', children: [
            {
                value: '广州市', label: '广州市', children: [
                    { value: '天河区', label: '天河区' },
                    { value: '越秀区', label: '越秀区' },
                    { value: '海珠区', label: '海珠区' },
                    { value: '荔湾区', label: '荔湾区' },
                    { value: '白云区', label: '白云区' },
                    { value: '黄埔区', label: '黄埔区' },
                    { value: '番禺区', label: '番禺区' },
                    { value: '花都区', label: '花都区' },
                    { value: '南沙区', label: '南沙区' },
                    { value: '增城区', label: '增城区' },
                ]
            },
            {
                value: '深圳市', label: '深圳市', children: [
                    { value: '福田区', label: '福田区' },
                    { value: '罗湖区', label: '罗湖区' },
                    { value: '南山区', label: '南山区' },
                    { value: '宝安区', label: '宝安区' },
                    { value: '龙岗区', label: '龙岗区' },
                    { value: '龙华区', label: '龙华区' },
                    { value: '坪山区', label: '坪山区' },
                    { value: '光明区', label: '光明区' },
                ]
            },
            { value: '东莞市', label: '东莞市', children: [{ value: '东莞市', label: '东莞市' }] },
            {
                value: '佛山市', label: '佛山市', children: [
                    { value: '禅城区', label: '禅城区' },
                    { value: '南海区', label: '南海区' },
                    { value: '顺德区', label: '顺德区' },
                ]
            },
        ]
    },
    {
        value: '浙江省', label: '浙江省', children: [
            {
                value: '杭州市', label: '杭州市', children: [
                    { value: '上城区', label: '上城区' },
                    { value: '下城区', label: '下城区' },
                    { value: '西湖区', label: '西湖区' },
                    { value: '拱墅区', label: '拱墅区' },
                    { value: '江干区', label: '江干区' },
                    { value: '滨江区', label: '滨江区' },
                    { value: '余杭区', label: '余杭区' },
                    { value: '萧山区', label: '萧山区' },
                ]
            },
            {
                value: '宁波市', label: '宁波市', children: [
                    { value: '海曙区', label: '海曙区' },
                    { value: '江北区', label: '江北区' },
                    { value: '鄞州区', label: '鄞州区' },
                ]
            },
            {
                value: '温州市', label: '温州市', children: [
                    { value: '鹿城区', label: '鹿城区' },
                    { value: '龙湾区', label: '龙湾区' },
                ]
            },
        ]
    },
    {
        value: '江苏省', label: '江苏省', children: [
            {
                value: '南京市', label: '南京市', children: [
                    { value: '玄武区', label: '玄武区' },
                    { value: '秦淮区', label: '秦淮区' },
                    { value: '建邺区', label: '建邺区' },
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '浦口区', label: '浦口区' },
                    { value: '栖霞区', label: '栖霞区' },
                    { value: '江宁区', label: '江宁区' },
                ]
            },
            {
                value: '苏州市', label: '苏州市', children: [
                    { value: '姑苏区', label: '姑苏区' },
                    { value: '虎丘区', label: '虎丘区' },
                    { value: '吴中区', label: '吴中区' },
                    { value: '相城区', label: '相城区' },
                    { value: '吴江区', label: '吴江区' },
                    { value: '工业园区', label: '工业园区' },
                ]
            },
            {
                value: '无锡市', label: '无锡市', children: [
                    { value: '梁溪区', label: '梁溪区' },
                    { value: '滨湖区', label: '滨湖区' },
                ]
            },
        ]
    },
    {
        value: '四川省', label: '四川省', children: [
            {
                value: '成都市', label: '成都市', children: [
                    { value: '锦江区', label: '锦江区' },
                    { value: '青羊区', label: '青羊区' },
                    { value: '金牛区', label: '金牛区' },
                    { value: '武侯区', label: '武侯区' },
                    { value: '成华区', label: '成华区' },
                    { value: '龙泉驿区', label: '龙泉驿区' },
                    { value: '双流区', label: '双流区' },
                    { value: '温江区', label: '温江区' },
                    { value: '高新区', label: '高新区' },
                    { value: '天府新区', label: '天府新区' },
                ]
            },
        ]
    },
    {
        value: '湖北省', label: '湖北省', children: [
            {
                value: '武汉市', label: '武汉市', children: [
                    { value: '江岸区', label: '江岸区' },
                    { value: '江汉区', label: '江汉区' },
                    { value: '硚口区', label: '硚口区' },
                    { value: '汉阳区', label: '汉阳区' },
                    { value: '武昌区', label: '武昌区' },
                    { value: '洪山区', label: '洪山区' },
                ]
            },
        ]
    },
    {
        value: '山东省', label: '山东省', children: [
            {
                value: '济南市', label: '济南市', children: [
                    { value: '历下区', label: '历下区' },
                    { value: '市中区', label: '市中区' },
                    { value: '槐荫区', label: '槐荫区' },
                    { value: '天桥区', label: '天桥区' },
                    { value: '历城区', label: '历城区' },
                ]
            },
            {
                value: '青岛市', label: '青岛市', children: [
                    { value: '市南区', label: '市南区' },
                    { value: '市北区', label: '市北区' },
                    { value: '黄岛区', label: '黄岛区' },
                    { value: '崂山区', label: '崂山区' },
                ]
            },
        ]
    },
    {
        value: '福建省', label: '福建省', children: [
            {
                value: '福州市', label: '福州市', children: [
                    { value: '鼓楼区', label: '鼓楼区' },
                    { value: '台江区', label: '台江区' },
                    { value: '仓山区', label: '仓山区' },
                    { value: '晋安区', label: '晋安区' },
                ]
            },
            {
                value: '厦门市', label: '厦门市', children: [
                    { value: '思明区', label: '思明区' },
                    { value: '湖里区', label: '湖里区' },
                    { value: '集美区', label: '集美区' },
                    { value: '海沧区', label: '海沧区' },
                ]
            },
        ]
    },
    {
        value: '河南省', label: '河南省', children: [
            {
                value: '郑州市', label: '郑州市', children: [
                    { value: '中原区', label: '中原区' },
                    { value: '二七区', label: '二七区' },
                    { value: '管城回族区', label: '管城回族区' },
                    { value: '金水区', label: '金水区' },
                    { value: '上街区', label: '上街区' },
                    { value: '惠济区', label: '惠济区' },
                ]
            },
        ]
    },
    {
        value: '湖南省', label: '湖南省', children: [
            {
                value: '长沙市', label: '长沙市', children: [
                    { value: '芙蓉区', label: '芙蓉区' },
                    { value: '天心区', label: '天心区' },
                    { value: '岳麓区', label: '岳麓区' },
                    { value: '开福区', label: '开福区' },
                    { value: '雨花区', label: '雨花区' },
                ]
            },
        ]
    },
    {
        value: '重庆市', label: '重庆市', children: [
            {
                value: '重庆市', label: '重庆市', children: [
                    { value: '渝中区', label: '渝中区' },
                    { value: '江北区', label: '江北区' },
                    { value: '南岸区', label: '南岸区' },
                    { value: '九龙坡区', label: '九龙坡区' },
                    { value: '沙坪坝区', label: '沙坪坝区' },
                    { value: '渝北区', label: '渝北区' },
                    { value: '巴南区', label: '巴南区' },
                ]
            }
        ]
    },
    {
        value: '天津市', label: '天津市', children: [
            {
                value: '天津市', label: '天津市', children: [
                    { value: '和平区', label: '和平区' },
                    { value: '河东区', label: '河东区' },
                    { value: '河西区', label: '河西区' },
                    { value: '南开区', label: '南开区' },
                    { value: '河北区', label: '河北区' },
                    { value: '红桥区', label: '红桥区' },
                ]
            }
        ]
    },
    {
        value: '陕西省', label: '陕西省', children: [
            {
                value: '西安市', label: '西安市', children: [
                    { value: '新城区', label: '新城区' },
                    { value: '碑林区', label: '碑林区' },
                    { value: '莲湖区', label: '莲湖区' },
                    { value: '雁塔区', label: '雁塔区' },
                    { value: '未央区', label: '未央区' },
                    { value: '灞桥区', label: '灞桥区' },
                ]
            },
        ]
    },
    {
        value: '安徽省', label: '安徽省', children: [
            {
                value: '合肥市', label: '合肥市', children: [
                    { value: '蜀山区', label: '蜀山区' },
                    { value: '庐阳区', label: '庐阳区' },
                    { value: '包河区', label: '包河区' },
                    { value: '瑶海区', label: '瑶海区' },
                ]
            },
        ]
    },
];

// 获取省份列表
export function getProvinces(): { value: string; label: string }[] {
    return CHINA_REGIONS.map(p => ({ value: p.value, label: p.label }));
}

// 获取城市列表
export function getCities(province: string): { value: string; label: string }[] {
    const p = CHINA_REGIONS.find(r => r.value === province);
    if (!p || !p.children) return [];
    return p.children.map(c => ({ value: c.value, label: c.label }));
}

// 获取区县列表
export function getDistricts(province: string, city: string): { value: string; label: string }[] {
    const p = CHINA_REGIONS.find(r => r.value === province);
    if (!p || !p.children) return [];
    const c = p.children.find(c => c.value === city);
    if (!c || !c.children) return [];
    return c.children.map(d => ({ value: d.value, label: d.label }));
}
