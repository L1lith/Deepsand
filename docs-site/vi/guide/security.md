---
title: Cách hộp cát hoạt động
description: Deepsand thực thi những gì, những gì bạn quyết định và những gì hộp cát không thể tiếp cận.
---

# Cách hộp cát hoạt động

Nói một cách dễ hiểu: trợ lý có thể làm việc trong dự án bạn đã chọn và trong các thư mục bạn phê duyệt chứ không phải ở nơi nào khác trên máy tính của bạn.

Lời hứa của Deepsand rất hẹp và có thể kiểm tra được: hộp cát có thể tiếp cận thư mục dự án và các thư mục mà bạn cấp rõ ràng, ngoài ra không có gì khác.

## ranh giới

Vùng chứa không có chế độ xem hệ thống tệp máy chủ ngoài các giá trị gắn kết mà Deepsand đã chọn. Các đường dẫn máy chủ khác không tồn tại bên trong không gian tên gắn kết của vùng chứa, do đó không có tệp máy chủ nào để thoát tới.

Mọi thứ khác được mô tả ở đây là phòng thủ theo chiều sâu trên ranh giới đó.

## Những gì được thi hành

- Chỉ có không gian làm việc và các khoản trợ cấp rõ ràng mới được gắn kết từ máy chủ.
- Bộ đệm phản hồi và thư mục trạng thái được gắn ở chế độ chỉ đọc.
- Ổ cắm thời gian chạy vùng chứa bị từ chối theo tên.
- Hệ thống tệp gốc vùng chứa ở chế độ chỉ đọc, với các hệ thống tệp tạm thời có kích thước dành cho `/tmp` và `/run`.
- Các liên kết tượng trưng được giải quyết trước khi đường dẫn được kiểm tra, do đó liên kết không thể ngụy trang mục tiêu bị cấm.
- Các đặc quyền bị loại bỏ trước khi DeepCode chạy và `no-new-privileges` ngăn không cho chúng lấy lại được.

## Chế độ mạng

| Chế độ | Nó cho phép những gì |
| --- | --- |
| Không có | Chỉ điểm cuối của mô hình thông qua proxy Deepsand. |
| Được phép | Điểm cuối của mô hình, proxy và máy chủ hoặc địa chỉ trong danh sách cho phép. |
| Internet | Truy cập Internet, với phạm vi cục bộ và riêng tư bị chặn bên trong vùng chứa. |
| Đầy đủ | Truy cập Internet mà không bị chặn mạng cục bộ. Chỉ sử dụng nó khi hộp cát thực sự cần mạng cục bộ của bạn. |

Tên máy chủ có trong danh sách cho phép sẽ đi qua proxy, proxy này sẽ tự phân giải tên đó và từ chối kết quả trong không gian địa chỉ riêng tư. Quy tắc của vùng chứa cho phép trực tiếp một địa chỉ trong danh sách cho phép vì máy khách cơ sở dữ liệu hoặc chương trình không phải HTTP khác không thể sử dụng proxy. Cổng có tên trong một mục cũng được xuất bản trên loopback của máy chủ, không bao giờ có trên mọi giao diện.

## Những gì bạn quyết định

Deepsand không bao giờ cấp quyền truy cập tự động. Một yêu cầu sẽ đến với bạn bằng đường dẫn, máy chủ, công cụ hoặc tài nguyên mà nó yêu cầu và hộp cát sẽ bị tạm dừng cho đến khi bạn quyết định.

Yêu cầu về thứ gì đó mà hộp cát đã có sẽ bị từ chối kèm theo lời giải thích, bởi vì sự cho phép tự động sẽ là sự đồng ý mà bạn chưa bao giờ đưa ra. Bất cứ điều gì mơ hồ đều đến với bạn.

## Những gì nó không bảo vệ chống lại

- Nhà cung cấp mô hình có thể xem nội dung bạn gửi cho nó.
- Các tệp bạn đặt trong không gian làm việc sẽ hiển thị trong hộp cát và có thể bị thay đổi hoặc xóa.
- Một công cụ hoặc hướng dẫn mô hình không đúng định dạng vẫn có thể yêu cầu quyền truy cập. Quyết định vẫn là của bạn.
- Bản thân Docker nằm ngoài ranh giới. Luôn cập nhật Docker Desktop và hệ điều hành máy chủ.

## Đọc thêm

Mô hình bảo mật đầy đủ, bao gồm các thử nghiệm xác nhận từng thuộc tính, có trong [docs/SECURITY.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

Kiến trúc được mô tả trong [docs/ARCHITECTURE.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).
