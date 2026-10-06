/**
 * GOOGLE APPS SCRIPT - VYYY BOUTIQUE ORDER TRACKER
 * 
 * Hướng dẫn cài đặt:
 * 1. Mở trang Google Sheet của bạn (https://sheets.google.com).
 * 2. Vào menu "Tiện ích mở rộng" (Extensions) -> chọn "Apps Script".
 * 3. Xóa hết code cũ và dán toàn bộ đoạn mã bên dưới vào.
 * 4. Nhấn biểu tượng 💾 Lưu (Save).
 * 5. Nhấn nút "Triển khai" (Deploy) -> chọn "Triển khai dưới dạng ứng dụng web" (New deployment).
 * 6. Mục "Ai có quyền truy cập" (Who has access) -> Chọn "Bất kỳ ai" (Anyone).
 * 7. Nhấn "Triển khai" (Deploy), cấp quyền và copy đường link "URL ứng dụng Web".
 */

function doPost(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        // Tạo dòng tiêu đề nếu trang tính còn trống
        if (sheet.getLastRow() === 0) {
            sheet.appendRow([
                "Mã Đơn Hàng",
                "Thời Gian",
                "Họ Và Tên Khách Hàng",
                "Số Điện Thoại",
                "Địa Chỉ Giao Hàng",
                "Ghi Chú",
                "Phương Thức Thanh Toán",
                "Tổng Tiền (VNĐ)",
                "Danh Sách Sản Phẩm",
                "Trạng Thái"
            ]);
            // Định dạng dòng tiêu đề
            sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#5b6e5d").setFontColor("#ffffff");
        }

        var contents = JSON.parse(e.postData.contents);

        var orderId = contents.orderId || "VYYY-" + Math.floor(100000 + Math.random() * 900000);
        var date = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        var customerName = contents.name || "";
        var phone = contents.phone || "";
        var address = contents.address || "";
        var note = contents.note || "";
        var paymentMethod = contents.paymentMethod || "VIETQR";
        var totalPrice = contents.totalPrice || 0;
        var itemsDetail = contents.items ? contents.items.map(function (item) {
            return item.name + " (" + item.size + ", " + item.color + ") x" + item.quantity;
        }).join("; ") : "";
        var status = contents.status || "Chờ xác nhận";

        // Thêm dòng dữ liệu đơn hàng mới vào Google Sheet
        sheet.appendRow([
            orderId,
            date,
            customerName,
            phone,
            address,
            note,
            paymentMethod,
            totalPrice,
            itemsDetail,
            status
        ]);

        return ContentService
            .createTextOutput(JSON.stringify({ result: "success", orderId: orderId }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet() {
    return ContentService.createTextOutput("Vyyy Boutique Apps Script API is running!");
}
