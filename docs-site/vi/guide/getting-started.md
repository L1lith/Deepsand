---
title: Bắt đầu
description: Cài đặt Deepsand, tạo dự án đầu tiên của bạn và chạy hộp cát của nó.
---

# Bắt đầu

Deepsand giúp bạn làm việc với trợ lý mã hóa AI trong một dự án thực tế mà không cấp cho trợ lý đó quyền truy cập vào phần còn lại của máy tính. Bạn không cần phải hiểu Docker hoặc dòng lệnh để sử dụng luồng cơ bản.

Nếu bạn muốn hình ảnh lớn hơn trước, hãy đọc [Deepsand là gì?](./what-is-deepsand).

## Yêu cầu

- Docker Desktop trên Windows hoặc macOS hoặc Docker Engine trên Linux.
- Máy tính Windows, macOS hoặc Linux. [trang tải xuống](../download) phát hiện hệ thống và liệt kê các trình cài đặt phù hợp.
- Không cần cài đặt Node.js hoặc Rust trừ khi bạn đang xây dựng Deepsand từ nguồn.

Docker Desktop phải chạy trước khi Deepsand có thể khởi động hộp cát. Nếu daemon vẫn đang khởi động, dải trạng thái sẽ thông báo như vậy và đề nghị kiểm tra lại. Docker Desktop cũng có thể chạy nhưng không phản hồi; nếu Deepsand thông báo daemon không trả lời, hãy khởi động lại Docker Desktop. Khi Deepsand phát hiện Docker Desktop, nó hiển thị điều khiển **Khởi động lại Docker Desktop…**. Xem [phải làm gì nếu Docker Desktop không chạy hoặc ngừng phản hồi](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Cài đặt

Mở [Trang tải xuống Deepsand](../download). Nó phát hiện hệ điều hành của bạn và liệt kê các trình cài đặt Windows, macOS và Linux mới nhất từ ​​bản phát hành GitHub hiện tại. Chọn gói cho máy tính của bạn, cài đặt nó, sau đó khởi động Deepsand.

Nếu bạn đang tự phát triển Deepsand, kho lưu trữ README có các lệnh xây dựng nguồn và tải lại nóng.

## Lần chạy đầu tiên

Bạn không cần cài đặt hoặc định cấu hình DeepCode trước khi sử dụng Deepsand. Deepsand chạy DeepCode bên trong hộp cát và đi kèm với các giá trị mặc định hợp lý cho mô hình và điểm cuối.

Thứ bạn cần là một mẫu khóa API. Phần tiếp theo giải thích cách lấy khóa DeepSeek hoặc bạn có thể sử dụng khóa từ nhà cung cấp khác. Lưu nó trong **Cài đặt → Phím API**.

Nếu bạn đã sử dụng DeepCode CLI trên máy tính này, Deepsand có thể kế thừa mô hình, URL cơ sở và khóa từ cấu hình DeepCode hiện có của bạn. Một dự án cũng có thể ghi đè những thông tin xác thực đó trong cài đặt của chính nó.

## Nhận khóa API

Deepsand cần khóa API từ nhà cung cấp mô hình trước khi trợ lý có thể chạy.

- **Nếu bạn không có:** theo dõi [Nhận khóa DeepSeek API](./deepseek-api). Nó hướng dẫn tạo tài khoản, thêm tín dụng, tạo khóa và quay lại Deepsand.
- **Nếu bạn đã có một cái:** mở **Cài đặt**, dán nó vào trường **Phím API** và chọn **Lưu khóa**.
- **Nếu bạn muốn một khóa dành riêng cho dự án:** mở cài đặt của dự án đó và nhập nó vào đó.

Khóa toàn ứng dụng được lưu trong kho khóa của hệ điều hành của bạn chứ không phải trong tệp trạng thái của Deepsand. Cửa sổ chỉ hiển thị bốn ký tự cuối cùng sau khi lưu.

## Tạo một dự án

1. Chọn **Dự án mới** trong thanh bên.
2. Đặt tên cho dự án.
3. Chọn thư mục làm việc.
4. Tạo dự án.

Thư mục làm việc trở thành `/workspace` bên trong hộp cát. Deepsand từ chối các đường dẫn như thư mục gốc của hệ thống tệp, thư mục chính của bạn, kho lưu trữ thông tin xác thực và thư mục dữ liệu của chính nó.

## Chọn một mô hình

Sử dụng **mô hình đèn flash** cho hầu hết các tác vụ. Deepsand mặc định là `deepseek-v4-flash`, đây là lựa chọn rẻ hơn cho việc viết mã, giải thích và chỉnh sửa hàng ngày. Chỉ chuyển sang `deepseek-v4-pro` khi đèn flash rõ ràng đang gặp khó khăn với một tác vụ; mô hình chuyên nghiệp tốn nhiều chi phí hơn để chạy.

Bạn có thể thay đổi mô hình trong **Cài đặt**, từ tiêu đề dự án hoặc bằng `/model` trong thiết bị đầu cuối DeepCode.

## Chọn mức độ tư duy

Thanh trượt tư duy nằm bên cạnh bộ chọn mô hình trong tiêu đề dự án. Nó kiểm soát mức độ suy luận của mô hình trước khi trả lời.

- **Tắt:** không cần suy nghĩ. Nhanh nhất nhưng ít cẩn thận nhất.
- **Nhanh:** suy nghĩ một chút về các chỉnh sửa nhỏ được chỉ định rõ ràng.
- **Cân bằng:** suy nghĩ điều độ và dừng lại ở giữa. Đây là mặc định hợp lý cho công việc thực tế.
- **Sâu:** lý luận tối đa. Chậm nhất và đắt nhất.
- **Mặc định:** chuyển sang máy chủ `settings.json`; nếu nó không nói gì, DeepCode sẽ quay lại trạng thái Cân bằng.

Giữ thanh trượt trên **Cân bằng** cho hầu hết các tác vụ. Nó mang lại kết quả tốt mà không phải trả tiền cho lý do chậm nhất, tốn kém nhất cho mọi yêu cầu. Chỉ sử dụng **Sâu** cho những vấn đề thực sự khó khăn và **Tắt** hoặc **Nhanh** cho những chỉnh sửa nhỏ, có thể dự đoán được.

## Chạy một dự án

1. Chọn dự án.
2. Nhấn **Chạy**.
3. Nếu hình ảnh bị thiếu, Deepsand sẽ xây dựng nó trước và hiển thị kết quả xây dựng trong tab Hoạt động.
4. DeepCode CLI bắt đầu bên trong vùng chứa và xuất hiện trong thiết bị đầu cuối.

Việc dừng hộp cát sẽ kết thúc vùng chứa. Bắt đầu lại nó sẽ tiếp tục phiên DeepCode trước đó khi có phiên này.

## Sử dụng thiết bị đầu cuối DeepCode

Tab **Phần cuối** là phiên DeepCode CLI trực tiếp. Nhập yêu cầu và nhấn **Đi vào** hoặc sử dụng lệnh gạch chéo để điều khiển phiên. `/new` bắt đầu một cuộc trò chuyện mới, `/resume` tiếp tục cuộc trò chuyện trước đó, `/model` thay đổi mô hình và `/` mở menu lệnh.

Đọc [Sử dụng thiết bị đầu cuối DeepCode](./deepcode-terminal) để biết các lệnh chính, phím tắt và các bước khôi phục.

## Trả lời yêu cầu cấp phép

Khi DeepCode cần một thư mục, đích mạng, công cụ hoặc tài nguyên khác, Deepsand sẽ tạm dừng hộp cát và hiển thị yêu cầu.

- **Cấp quyền truy cập** cho phép yêu cầu và tiếp tục phiên.
- **Từ chối** từ chối và cho mô hình biết quyết định cuối cùng.
- Cấp thư mục sẽ tạo lại vùng chứa có gắn kết mới.

Đọc [Cách hộp cát hoạt động](./security) trước khi cấp quyền truy cập vào thư mục chứa các tệp nhạy cảm.

## Tìm đồ vật ở đâu

| Khu vực | Nó hiển thị những gì |
| --- | --- |
| Nhà ga | Phiên DeepCode trực tiếp bên trong hộp cát. |
| Quyền | Thư mục được chia sẻ, danh sách cho phép mạng và đường dẫn kiểm tra. |
| Công cụ | Công cụ được đưa vào hình ảnh dự án. Thay đổi lựa chọn sẽ xây dựng lại hình ảnh. |
| Bí mật | Các giá trị được mã hóa được đưa vào dưới dạng biến môi trường khi bắt đầu. |
| Hoạt động | Các đối số `docker run` chính xác, nhật ký xây dựng và các lần thử đi ra bị chặn. |

## Các bước tiếp theo

- [Cách hộp cát hoạt động](./security)
- [Câu hỏi thường gặp](./faq)
