---
title: Câu hỏi thường gặp
description: Câu trả lời ngắn về dự án, quyền, dữ liệu và cập nhật.
---

# Câu hỏi thường gặp

## DeepCode có thấy thư mục chính của tôi không?

Không. Hộp cát nhìn thấy thư mục dự án tại `/workspace` và các thư mục mà bạn cấp rõ ràng. Phần còn lại của hệ thống tập tin máy chủ không được gắn kết.

## Điều gì xảy ra khi tôi chấp thuận yêu cầu thư mục?

Deepsand thêm thư mục dưới dạng cấp phép, tạo lại vùng chứa có gắn kết mới được đính kèm và tiếp tục phiên DeepCode. Hộp cát đang chạy không thể có được liên kết gắn kết nếu không được tạo lại.

## Cuộc trò chuyện của tôi được lưu trữ ở đâu?

Lịch sử hội thoại, phiên, tệp đính kèm và kỹ năng được tạo có trong tập Docker cho mỗi dự án. Thư mục dự án trên đĩa chỉ chứa mã và tệp của bạn.

Việc xóa một dự án khỏi Deepsand sẽ không xóa ổ đĩa đó. Việc xóa dữ liệu DeepCode của dự án sẽ xóa ổ đĩa nhưng không ảnh hưởng đến thư mục dự án.

## Các khóa và bí mật API được lưu trữ ở đâu?

Các bí mật được mã hóa ở trạng thái lưu trữ bằng khóa do kho khóa của hệ điều hành nắm giữ và chỉ được đưa vào hộp cát dưới dạng các biến môi trường khi nó khởi động. Giao diện hiển thị tên và độ dài, không bao giờ hiển thị các giá trị được lưu trữ.

Thông tin xác thực cũng có thể được kế thừa từ cấu hình DeepCode máy chủ của bạn. Chúng không được sao chép vào thư mục dự án.

## Mỗi dự án có thể sử dụng một mô hình khác nhau không?

Đúng. Dự án có thể kế thừa cấu hình máy chủ hoặc ghi đè mô hình, URL cơ sở và thông tin xác thực trong cài đặt của chính dự án đó. Bộ chọn tiêu đề cũng có thể chọn mô hình cho dự án; **Trì hoãn cấu hình** có nghĩa là dự án không ghim một.

## Tôi nên sử dụng mô hình nào để giảm chi phí?

Sử dụng mô hình flash cho hầu hết các nhiệm vụ. Deepsand mặc định là `deepseek-v4-flash`, đây là lựa chọn rẻ hơn cho việc viết mã, giải thích và chỉnh sửa hàng ngày. Dự trữ `deepseek-v4-pro` cho công việc mà đèn flash rõ ràng đang gặp khó khăn hoặc bạn cần khả năng bổ sung của nó vì mẫu chuyên nghiệp tốn nhiều chi phí hơn để chạy.

Chuyển mô hình từ tiêu đề dự án hoặc với `/model` trong thiết bị đầu cuối DeepCode. Nếu bạn đang dùng thử Deepsand lần đầu tiên, hãy bắt đầu với flash và chỉ chuyển sang chuyên nghiệp khi bạn có nhiệm vụ cần đến nó.

## Thanh trượt suy nghĩ làm gì?

Thanh trượt tư duy nằm bên cạnh bộ chọn mô hình trong tiêu đề dự án. Nó kiểm soát mức độ suy luận của mô hình trước khi trả lời.

| Dừng lại | Ý nghĩa của nó |
| --- | --- |
| **Tắt** | Đừng suy nghĩ trước khi trả lời. Nhanh nhất nhưng ít cẩn thận nhất. |
| **Nhanh** | Suy nghĩ một chút về những chỉnh sửa nhỏ được chỉ định rõ ràng. |
| **Cân bằng** | Suy nghĩ vừa phải. Điểm dừng ở giữa và mặc định hợp lý cho công việc thực tế. |
| **Sâu** | Hãy suy nghĩ kỹ càng nhất có thể. Chậm nhất và đắt nhất. |
| **Mặc định** | Trì hoãn máy chủ `settings.json`; nếu nó không nói gì, DeepCode sẽ quay lại trạng thái Cân bằng. |

Giữ thanh trượt trên **Cân bằng** cho hầu hết các tác vụ. Đây là cài đặt ở mức trung bình và nó mang lại kết quả tốt mà không phải trả tiền cho lý do chậm nhất, tốn kém nhất cho mọi yêu cầu. Chỉ chuyển sang **Sâu** cho những vấn đề thực sự khó khăn và sử dụng **Tắt** hoặc **Nhanh** cho những chỉnh sửa nhỏ, có thể dự đoán được.

## Deepsand chỉ hoạt động với DeepSeek phải không?

Không. DeepSeek là mặc định vì đây là mô hình và điểm cuối mà Deepsand đi kèm, nhưng Deepsand định cấu hình DeepCode CLI bằng tên mô hình, URL cơ sở và khóa API. Bạn có thể trỏ nó vào một nhà cung cấp khác hiển thị API mà CLI có thể gọi, thường là điểm cuối tương thích với OpenAI.

Đặt URL cơ sở và mô hình của nhà cung cấp trong **Cài đặt** hoặc trong thông tin xác thực của chính dự án và lưu trữ khóa API của nhà cung cấp đó ở cùng một nơi. Chính sách mạng của sandbox cũng phải cho phép điểm cuối của nhà cung cấp.

## Điều gì xảy ra nếu Docker Desktop không chạy hoặc ngừng phản hồi?

Deepsand không thể khởi động hộp cát nếu không có động cơ Docker. Nếu Docker Desktop không chạy, hãy khởi động nó và đợi động cơ khởi động xong. Deepsand kiểm tra lại khi cửa sổ lấy lại tiêu điểm và dải trạng thái yêu cầu thử lại.

Đôi khi Docker Desktop vẫn chạy nhưng động cơ của nó đã ngừng phản hồi. Khởi động lại Deepsand không khắc phục được điều đó; Bản thân Docker Desktop cần được khởi động lại.

- **Sử dụng điều khiển trong ứng dụng khi nó xuất hiện.** Nếu Deepsand phát hiện Docker Desktop, nó hiển thị **Khởi động lại Docker Desktop…** trong dải trạng thái hoặc cảnh báo đầu cuối. Điều khiển đó khởi động lại công cụ Docker, bao gồm cả quy trình WSL mà nó sử dụng trên Windows và đợi cho đến khi vùng chứa có thể khởi động lại.
- **Windows:** nhấp chuột phải vào cá voi Docker trong vùng thông báo và chọn **Khởi động lại**. Nếu tùy chọn đó bị thiếu, hãy mở Docker Desktop, chọn **Khắc phục sự cố**, sau đó chọn **Khởi động lại Docker Desktop**.
- **macOS:** nhấp vào cá voi Docker trên thanh menu và chọn **Khởi động lại**.
- **Linux:** mở menu Docker Desktop, chọn **Khắc phục sự cố**, sau đó chọn **Khởi động lại Docker Desktop**. Nếu bạn sử dụng Docker Engine thay vì Docker Desktop, hãy khởi động lại dịch vụ của nó, ví dụ `sudo systemctl restart docker`.

Việc khởi động lại Docker Desktop sẽ kết thúc mọi vùng chứa trên máy, bao gồm cả các vùng chứa không liên quan đến Deepsand. Deepsand cung cấp tính năng khởi động lại nhưng không tự động thực hiện. Xem [Tài liệu khắc phục sự cố của Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) để biết menu dành riêng cho nền tảng.

## Tôi có thể sử dụng Deepsand mà không cần truy cập internet không?

Mô hình cần điểm cuối của nó. Với chế độ mạng `none`, chỉ điểm cuối đó mới có thể truy cập được thông qua proxy Deepsand. Cài đặt gói và truy cập mạng khác sẽ không thành công trừ khi bạn cho phép các máy chủ mà chúng cần.

## Làm cách nào để cập nhật Deepsand?

Mở **Cài đặt**, sau đó là **Cập nhật** và kiểm tra phiên bản mới hơn. Bản phát hành tải xuống các bản cập nhật đã ký và khởi động lại ứng dụng sau khi cài đặt bản cập nhật. Việc cài đặt bản cập nhật sẽ ngừng chạy hộp cát.

## Có giao diện dòng lệnh không?

Đúng. `deepsandctl` cung cấp các lệnh không đầu như `doctor`, `plan`, `run`, `watch`, `requests` và `network`. Ứng dụng dành cho máy tính để bàn và CLI có chung mã chính sách trong `deepsand-core`.

## Làm cách nào để báo cáo vấn đề bảo mật?

Không mở một vấn đề công khai vì vấn đề bảo mật. Liên hệ riêng với người bảo trì thông qua kênh báo cáo bảo mật của kho lưu trữ và đưa ra đủ chi tiết để tái tạo sự cố.
