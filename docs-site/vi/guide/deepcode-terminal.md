---
title: Sử dụng thiết bị đầu cuối DeepCode
description: Cách sử dụng DeepCode CLI bên trong Deepsand, các lệnh gạch chéo chính và phím tắt.
---

# Sử dụng thiết bị đầu cuối DeepCode

Deepsand chạy [DeepCode CLI](https://github.com/lessweb/deepcode-cli) bên trong hộp cát. Tab **Phần cuối** là phiên DeepCode trực tiếp: nhập yêu cầu bằng ngôn ngữ bình thường hoặc sử dụng một trong các lệnh gạch chéo của DeepCode để điều khiển phiên.

Bạn không cài đặt DeepCode trên máy của chính mình. Deepsand khởi động CLI trong vùng chứa của dự án, nơi nó có thể thấy `/workspace` và các thư mục bạn đã chia sẻ.

Tìm hiểu thêm trên [Trang chủ dự án DeepCode](https://deepcode.vegamo.cn/) hoặc trong [Kho lưu trữ DeepCode](https://github.com/lessweb/deepcode-cli).

## Bắt đầu một phiên

1. Chọn một dự án trong thanh bên.
2. Nhấn **Chạy**.
3. Đợi hộp cát bắt đầu. Nếu hình ảnh bị thiếu, Deepsand sẽ tạo hình ảnh đó trước và hiển thị đầu ra bản dựng trong **Hoạt động**.
4. Thiết bị đầu cuối DeepCode xuất hiện khi CLI sẵn sàng.

Việc dừng hộp cát sẽ kết thúc vùng chứa. Bắt đầu lại dự án sẽ tiếp tục cuộc trò chuyện DeepCode trước đó khi có cuộc trò chuyện đó.

## Yêu cầu DeepCode làm điều gì đó

Nhập một yêu cầu bình thường và nhấn **Đi vào**. Ví dụ:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode có thể đọc và chỉnh sửa các tệp trong không gian làm việc, chạy lệnh và sử dụng các công cụ được chọn cho dự án. Bạn luôn nắm quyền kiểm soát: khi nó cần thứ gì đó bên ngoài không gian làm việc, Deepsand sẽ tạm dừng hộp cát và hỏi bạn trước.

## Các lệnh gạch chéo chính

Các lệnh gạch chéo bắt đầu bằng `/`. Tự gõ `/` sẽ mở menu lệnh.

| Lệnh | Nó làm gì |
| --- | --- |
| `/new` | Bắt đầu một cuộc trò chuyện mới |
| `/resume` | Chọn cuộc trò chuyện trước đó để tiếp tục |
| `/fork` | Ngã ba cuộc trò chuyện hiện tại |
| `/continue` | Tiếp tục cuộc trò chuyện đang diễn ra hoặc chọn một cuộc trò chuyện để tiếp tục |
| `/model` | Chuyển đổi mô hình, phương thức tư duy và nỗ lực suy luận |
| `/raw` | Chuyển đổi chế độ hiển thị: Cuộn ngược bình thường, Lite hoặc Raw |
| `/init` | Tạo tệp `AGENTS.md` có hướng dẫn dự án |
| `/skills` | Liệt kê các kỹ năng có sẵn của DeepCode |
| `/mcp` | Hiển thị trạng thái máy chủ MCP và các công cụ có sẵn |
| `/undo` | Khôi phục mã, cuộc trò chuyện hoặc cả hai về điểm trước đó |
| `/exit` | Thoát khỏi DeepCode |

Một dự án có thể đã có `AGENTS.md`; kiểm tra trước khi sử dụng `/init` để không thay thế các hướng dẫn đã có sẵn.

## Phím tắt

| Chìa khóa | Hành động |
| --- | --- |
| `Enter` | Gửi lời nhắc |
| `Shift+Enter` | Chèn một dòng mới |
| `Ctrl+J` | Chèn một dòng mới |
| `Esc` | Ngắt lượt mô hình hiện tại |
| `Ctrl+V` | Dán hình ảnh khi mô hình đã chọn hỗ trợ hình ảnh |
| `Ctrl+D` hai lần | Thoát khỏi DeepCode |

Sau khi dừng lượt bằng `Esc`, bạn có thể nhập một yêu cầu khác. Hộp cát không được khởi động lại.

## Phiên, mô hình và hoàn tác

- `/new` bắt đầu lại bằng một cuộc trò chuyện rõ ràng. Các tập tin dự án không bị xóa.
- `/resume` và `/continue` gợi lại cuộc trò chuyện trước đó.
- `/model` thay đổi mô hình, phương thức tư duy và nỗ lực suy luận cho buổi học. Tiêu đề dự án cũng có bộ chọn mô hình và thanh trượt tư duy; **Cân bằng** là điểm dừng giữa và cài đặt được đề xuất cho hầu hết công việc.
- `/undo` khôi phục mã, cuộc trò chuyện hoặc cả hai về điểm trước đó. Đó là cách nhanh nhất để thoát khỏi sự thay đổi mà bạn không mong muốn.

Lịch sử hội thoại nằm trong ổ trạng thái Deepsand của dự án chứ không phải trong kho lưu trữ của bạn.

## Quyền và hộp cát

Thiết bị đầu cuối nằm bên trong vùng chứa, do đó, nó nhìn thấy dự án tại `/workspace` và các thư mục mà bạn đã chia sẻ rõ ràng và không có gì khác trên máy tính của bạn.

Khi DeepCode yêu cầu một thư mục khác, đích mạng, công cụ hoặc tài nguyên khác, Deepsand sẽ đóng băng hộp cát và hiển thị hộp thoại cấp phép.

- **Cấp quyền truy cập** áp dụng yêu cầu và tiếp tục phiên.
- **Từ chối** từ chối và nói với DeepCode rằng quyết định là cuối cùng.
- Việc phê duyệt một thư mục sẽ tạo lại vùng chứa có giá trị gắn kết mới.

Đọc [Cách hộp cát hoạt động](./security) trước khi chia sẻ thư mục chứa các tệp nhạy cảm.

## Nếu thiết bị đầu cuối không khởi động

- **Hình ảnh bị thiếu:** Deepsand xây dựng nó trước. Xem **Hoạt động** để biết tiến độ xây dựng.
- **Docker Desktop không chạy hoặc bị kẹt:** khởi động nó và đợi động cơ khởi động xong. Nếu Docker Desktop đang chạy nhưng động cơ của nó không phản hồi, hãy khởi động lại Docker Desktop. Sử dụng điều khiển **Khởi động lại Docker Desktop…** trong ứng dụng khi Deepsand hiển thị nó. Nếu không, trên Windows nhấp chuột phải vào cá voi Docker trong vùng thông báo và chọn **Khởi động lại**; trên macOS sử dụng biểu tượng thanh menu Docker; trên Linux mở menu **Khắc phục sự cố** của Docker Desktop. Khởi động lại Docker Desktop sẽ kết thúc mọi vùng chứa trên máy. Xem [Câu hỏi thường gặp về Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **Khóa API bị thiếu hoặc bị từ chối:** mở **Cài đặt** và lưu khóa hợp lệ.
- **DeepCode đã thoát:** nhấn lại **Chạy**. Phiên trước đó có thể được tiếp tục với `/resume`.

## Các trang liên quan

- [Bắt đầu](./getting-started)
- [Nhận khóa DeepSeek API](./deepseek-api)
- [Cách hộp cát hoạt động](./security)
- [Trang chủ dự án DeepCode](https://deepcode.vegamo.cn/)
