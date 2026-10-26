---
title: Dưới mui xe
description: Kiến trúc, cách ly, luồng cấp phép, kết nối mạng và các công cụ dòng lệnh đằng sau Deepsand.
---

# Dưới mui xe

Trang này dành cho các nhà phát triển muốn có hình dạng kỹ thuật của hệ thống. Nếu bạn đang tìm lời giải thích bằng ngôn ngữ đơn giản, hãy bắt đầu với [Deepsand là gì?](./what-is-deepsand).

## Ngành kiến ​​​​trúc

Deepsand là ứng dụng máy tính để bàn Tauri với ba lớp chính:

- **Cửa sổ** là giao diện SolidJS. Nó hiển thị trạng thái và gửi ý định; nó không quyết định chính sách.
- **Lớp Tauri** hiển thị các lệnh trên máy tính để bàn và dịch cùng một bề mặt lệnh sang máy chủ HTTP loopback cho các máy khách từ xa.
- **`deepsand-core`** sở hữu các quy tắc. Xác thực đường dẫn, gói `docker run`, nhà môi giới cấp phép, proxy đầu ra, kho lưu trữ bí mật được mã hóa và kho lưu trữ trạng thái đều nằm ở đó.

Ứng dụng dành cho máy tính để bàn và trình điều khiển dòng lệnh `deepsandctl` sử dụng cùng một lõi nên chúng không thể tách rời nhau trong một quyết định bảo mật.

## Một dự án, một container

Mỗi dự án có vùng chứa Docker riêng và khối lượng trạng thái riêng. Thư mục dự án được gắn tại `/workspace`; các thư mục máy chủ khác yêu cầu trợ cấp rõ ràng.

`policy::plan_run` xây dựng đối số `docker run` hoàn chỉnh ở một nơi. Tab Hoạt động hiển thị gói chính xác đó, bao gồm các gắn kết, khả năng, chế độ mạng và đường dẫn chỉ đọc.

Thùng chứa bị hạn chế có chủ ý:

- Hệ thống tập tin gốc ở chế độ chỉ đọc, với các giá trị gắn tmpfs có kích thước dành cho `/tmp` và `/run`.
- Bộ đệm phản hồi và thư mục trạng thái được gắn ở chế độ chỉ đọc.
- Ổ cắm thời gian chạy vùng chứa bị từ chối theo tên.
- Khả năng bị loại bỏ trước khi DeepCode chạy và `no-new-privileges` được thiết lập.
- Các ổ cắm trong thời gian chạy vùng chứa và các giá đỡ bị cấm khác không đóng được thay vì tạo ra một kế hoạch yếu hơn.

## Quyền

Hộp cát có thể yêu cầu thêm quyền truy cập nhưng không thể cấp quyền truy cập đó. Một yêu cầu cấp phép được ghi vào một ống chỉ; nhà môi giới máy chủ xác nhận nó và tạm dừng vùng chứa. Người điều hành nhìn thấy yêu cầu và quyết định.

Việc phê duyệt yêu cầu thư mục sẽ tạo lại vùng chứa có liên kết gắn kết mới và tiếp tục phiên. Từ chối là một trong hai câu trả lời và mô hình được thông báo: **Đừng hỏi lại** là câu trả lời cuối cùng, trong khi **Không phải bây giờ** từ chối lần này và cho biết mô hình có thể hỏi lại sau. Lời từ chối cuối cùng được lưu trữ trong dự án và được thực thi bởi máy chủ: không có giá trị gắn kết nào được tạo cho đường dẫn hoặc bất kỳ thứ gì bên dưới nó và máy chủ bị từ chối sẽ trở thành quy tắc từ chối bao trùm các tên miền phụ của nó. Các lệnh chặn được liệt kê trong Quyền và có thể được dỡ bỏ ở đó, bởi vì một quyết định không còn đường quay lại là một cái bẫy hơn là một sự lựa chọn.

Yêu cầu về thứ gì đó mà hộp cát đã có sẽ bị từ chối kèm theo lời giải thích. Không có đường dẫn phê duyệt tự động, bởi vì phê duyệt im lặng sẽ là sự đồng ý mà nhà điều hành không bao giờ đưa ra.

## Mạng

Chính sách mạng có bốn chế độ:

| Chế độ | Hành vi |
| --- | --- |
| `none` | Chỉ điểm cuối của mô hình thông qua proxy đầu ra Deepsand. |
| `allowlisted` | Điểm cuối của mô hình, proxy và các máy chủ, địa chỉ và cổng được đặt tên. |
| `internet` | Truy cập Internet, với phạm vi cục bộ và riêng tư bị chặn bên trong vùng chứa. |
| `full` | Truy cập Internet mà không bị chặn mạng cục bộ. |

Mục nhập tên máy chủ được giải quyết bằng proxy, từ chối các kết quả riêng tư, lặp lại, liên kết cục bộ và dành riêng. Một mục nhập địa chỉ được thực thi trực tiếp bởi vùng chứa, đây là mục nhập cho phép máy khách cơ sở dữ liệu hoặc chương trình không phải HTTP khác kết nối. Một cổng được đặt tên chỉ được xuất bản trên vòng lặp ngược của máy chủ.

## Bí mật và cập nhật

Các bí mật được mã hóa ở trạng thái lưu trữ bằng khóa do kho khóa của hệ điều hành nắm giữ. Chúng được chuyển đến vùng chứa thông qua tệp môi trường, không bao giờ dưới dạng giá trị dòng lệnh và chỉ được đưa vào khi hộp cát khởi động.

Bản phát hành xác minh các bản cập nhật đã ký trước khi cài đặt chúng. Khóa ký không bao giờ được lưu trữ trong kho lưu trữ.

## Dòng lệnh

`deepsandctl` cung cấp bề mặt không đầu:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` in argv `docker run` chính xác mà không cần khởi động vùng chứa, điều này rất hữu ích để xem lại chính sách đã thay đổi.

## Đọc thêm

- [Mô hình bảo mật đầy đủ](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [ghi chú kiến ​​trúc](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Cách hộp cát hoạt động](./security)
