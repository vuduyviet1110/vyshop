export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    tag: string;
    description: string;
    details: string[];
    material: string;
    care: string;
    sizes: string[];
    colors: { name: string; hex: string }[];
    type: 'top' | 'bottom' | 'coat' | 'dress';
}

// Đường dẫn ảnh Áo Dài Rồng Phượng Hoàng Gia Xanh Rồng Vàng
const AO_DAI_IMAGE = '/ao_dai_royalty_trim.png';

const COLOR_PALETTES = [
    { name: 'Xanh Hoàng Gia Rồng Vàng', hex: '#1b3b8c' },
    { name: 'Xanh Navy Phụng Múa', hex: '#0f245c' },
    { name: 'Đỏ Đô Long Phụng', hex: '#800020' },
    { name: 'Vàng Hoàng Kim Bảo Giáp', hex: '#d4af37' },
    { name: 'Xanh Ngọc Phượng Hoàng', hex: '#008080' },
    { name: 'Tím Hoàng Gia Long Vân', hex: '#4b0082' }
];

// Hàm hỗ trợ tạo danh sách 30 sản phẩm Áo Dài Hoàng Gia
const create30Products = (prefix: string, baseCategory: string, type: 'top' | 'coat'): Product[] => {
    return Array.from({ length: 30 }, (_, index) => {
        const id = `${prefix}-${index + 1}`;
        const num = index + 1;
        const colorObj = COLOR_PALETTES[index % COLOR_PALETTES.length];

        return {
            id,
            name: `Áo Dài Hoàng Gia Rồng Phượng #${num}`,
            category: baseCategory,
            price: 685 + (num * 25),
            image: AO_DAI_IMAGE,
            tag: num % 3 === 0 ? 'Tuyệt Tác' : num % 2 === 0 ? 'Mới Ra Mắt' : 'Bestseller',
            type,
            description: `Tác phẩm Áo Dài lụa gấm thêu tay họa tiết Rồng Phượng dát chỉ vàng tỉ mỉ, tôn vinh nét đẹp uy nghi sang trọng.`,
            details: [
                'Chất liệu lụa satin/gấm thượng hạng 100% mềm mịn',
                'Họa tiết Rồng Phượng thêu chỉ vàng tinh xảo thủ công',
                'Phom dáng chuẩn Áo Dài truyền thống tôn dáng đỉnh cao',
                'Cổ tàu may nẹp cứng cáp, tà áo thướt tha mềm mại'
            ],
            material: 'Lụa Gấm Thượng Hạng & Chỉ Thêu Dát Vàng',
            care: 'Giặt hấp khô chuyên dụng bảo vệ hoa văn thêu',
            sizes: ['S', 'M', 'L', 'XL'],
            colors: [colorObj, COLOR_PALETTES[(index + 1) % COLOR_PALETTES.length]]
        };
    });
};

export const RACK_SETS: { id: string; title: string; subtitle: string; products: Product[] }[] = [
    {
        id: 'rack-1',
        title: 'BỘ SƯU TẬP ÁO DÀI HOÀNG GIA RỒNG PHƯỢNG (30 MẪU SÀO 1)',
        subtitle: 'Dàn Sào 1 • Dàn Treo 30 Mẫu Áo Dài Lụa Gấm Thêu Rồng Phượng Cao Cấp',
        products: create30Products('aodai-1', 'Áo Dài Hoàng Gia', 'coat')
    },
    {
        id: 'rack-2',
        title: 'BỘ SƯU TẬP ÁO DÀI THỜI TRANG HAUTE COUTURE (30 MẪU SÀO 2)',
        subtitle: 'Dàn Sào 2 • Dàn Treo 30 Mẫu Áo Dài Thượng Hạng Quý Phái Dát Chỉ Vàng',
        products: create30Products('aodai-2', 'Áo Dài Haute Couture', 'coat')
    }
];

export const PRODUCTS = RACK_SETS[0].products;

export const HEADER_PUZZLE_PARTS = [
    {
        step: 1,
        title: 'Top Banner: VIP Announcements & Search',
        description: 'Xuất hiện khi vừa lướt xuống - Thêm thanh thông báo thương hiệu & thanh Tìm kiếm VIP.',
        color: '#e2b774',
        icon: 'Crown'
    },
    {
        step: 2,
        title: 'Middle Banner: Quick Navigation & Categories',
        description: 'Cuộn tiếp - Ghép thêm thanh Danh mục Haute Couture, Suit, Leather, Dress...',
        color: '#10b981',
        icon: 'Grid'
    },
    {
        step: 3,
        title: 'Bottom Banner: Live Flash Sale & Curator Choice',
        description: 'Cuộn tới 75% - Tích tụ thêm Widget Giỏ hàng nhanh & Flash Sales VIP.',
        color: '#6366f1',
        icon: 'Sparkles'
    },
    {
        step: 4,
        title: 'Final Masterpiece Banner: Luxury Banner Art Complete',
        description: 'Cuộn hết (100%) - Tự động khóa ghép 4 mảnh lại thành một bức ảnh Poster Thời Trang Hoàn Chỉnh!',
        color: '#ec4899',
        icon: 'Image'
    }
];
