import App from '../App';
import { getRackPage, listRacks } from '@/lib/storeData';

// Trang tĩnh, làm mới nền mỗi 60 giây: dàn sào đầu tiên có sẵn trong HTML nên ảnh đầu trang
// được tải ngay, không phải chờ JS chạy rồi gọi 2 API nối tiếp nhau.
export const revalidate = 60;

async function loadInitialStore() {
    try {
        const racks = await listRacks();
        const firstPage = racks[0] ? await getRackPage(racks[0].id, 1, 24) : null;
        return JSON.parse(JSON.stringify({ racks, firstPage }));
    } catch (error) {
        console.error('⚠️ [HOME] Không prefetch được dữ liệu, client sẽ tự tải:', error);
        return { racks: null, firstPage: null };
    }
}

export default async function Page() {
    const { racks, firstPage } = await loadInitialStore();
    return <App initialRacks={racks} initialFirstPage={firstPage} />;
}
