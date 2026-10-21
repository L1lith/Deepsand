---
title: Nhận khóa DeepSeek API
description: Đăng ký nền tảng DeepSeek API, thêm tín dụng, tạo khóa và lưu trữ an toàn trong Deepsand.
---

# Nhận khóa DeepSeek API

Deepsand cần một nhà cung cấp mô hình để hỗ trợ trợ lý. Cấu hình mặc định sử dụng DeepSeek. Trang này hướng dẫn cách tạo tài khoản, thêm tín dụng, tạo khóa API và lưu nó trong Deepsand.

Nếu bạn đã có khóa API từ nhà cung cấp khác, hãy chuyển tới [Sử dụng chìa khóa bạn đã có](#use-a-key-you-already-have).

## Trước khi bạn bắt đầu

Bạn sẽ cần:

- Địa chỉ email hoặc tài khoản đăng nhập được hỗ trợ.
- Phương thức thanh toán cho tín dụng API.
- Mất vài phút để tạo key và dán vào Deepsand.

DeepSeek API được tính phí riêng biệt với trang web trò chuyện và ứng dụng di động DeepSeek. Thêm tín dụng trên nền tảng API là điều cho phép trợ lý đưa ra yêu cầu.

## 1. Tạo tài khoản DeepSeek

1. Mở [Nền tảng DeepSeek API](https://platform.deepseek.com/).
2. Chọn **Đăng ký** hoặc **Đăng nhập**.
3. Tạo một tài khoản bằng địa chỉ email của bạn hoặc sử dụng một trong các tùy chọn đăng nhập được hỗ trợ.
4. Xác minh địa chỉ email hoặc số điện thoại của bạn nếu nền tảng yêu cầu bạn.

## 2. Thêm tín dụng

1. Đăng nhập vào nền tảng API.
2. Mở phần thanh toán hoặc nạp tiền trong bảng điều khiển.
3. Thêm số tiền tín dụng bạn muốn sử dụng.
4. Hoàn tất thanh toán.

Việc sử dụng API được khấu trừ từ số dư này. Nền tảng này hiển thị số dư hiện tại, cách sử dụng và giá cả. Bắt đầu với một lượng nhỏ khi bạn đang thử Deepsand; bạn có thể thêm nhiều hơn sau.

## 3. Tạo khóa API

1. Mở phần **Phím API** của nền tảng.
2. Chọn **Tạo khóa API mới** hoặc nút tương đương.
3. Đặt cho khóa một cái tên mà bạn sẽ nhận ra, chẳng hạn như **Deepsand**.
4. Tạo khóa và sao chép nó ngay lập tức.

Chìa khóa thường chỉ được hiển thị một lần. Hãy coi nó như một mật khẩu: bất kỳ ai có nó đều có thể sử dụng tín dụng trong tài khoản của bạn.

## 4. Lưu key vào Deepsand

1. Mở Deepsand.
2. Mở **Cài đặt**.
3. Tìm trường **Phím API** theo thông tin xác thực mặc định.
4. Dán chìa khóa.
5. Chọn **Lưu khóa**.

Deepsand lưu trữ khóa trong kho khóa của hệ điều hành của bạn chứ không phải trong tệp cài đặt của nó. Cửa sổ chỉ hiển thị bốn ký tự cuối cùng sau khi lưu, vì vậy bạn có thể xác nhận có khóa mà không để lộ lại.

Khóa toàn ứng dụng được sử dụng khi cả cấu hình DeepCode của máy chủ lẫn dự án đều không cung cấp khóa riêng. Khóa cấp dự án vẫn được ưu tiên.

## Sử dụng chìa khóa bạn đã có

Nếu bạn đã có khóa API, bạn không cần tạo tài khoản DeepSeek.

- Để sử dụng nó cho mọi dự án, hãy mở **Cài đặt**, nhập khóa vào trường **Phím API** và lưu nó.
- Để sử dụng điểm cuối hoặc mô hình khác, hãy đặt cả URL và mô hình cơ sở trong **Cài đặt** hoặc trong thông tin xác thực của chính dự án.
- Để chỉ giữ khóa cho một dự án, hãy mở cài đặt của dự án đó và nhập khóa đó vào đó.

Nhà cung cấp phải hiển thị API mà DeepCode CLI có thể gọi. Nếu bạn đang sử dụng nhà cung cấp không phải của DeepSeek, hãy nhập URL cơ sở và tên mẫu của nhà cung cấp đó thay vì mặc định của DeepSeek.

## Nếu một cái gì đó không hoạt động

- **Chìa khóa bị từ chối:** tạo khóa mới trên nền tảng và thay thế khóa đã lưu trữ.
- **Số dư trống:** thêm tín dụng vào tài khoản API. Đăng ký trò chuyện không tự động tài trợ cho việc sử dụng API.
- **Trợ lý không thể liên hệ với nhà cung cấp:** kiểm tra chế độ mạng và danh sách cho phép của dự án. Điểm cuối của mô hình phải có thể truy cập được.
- **Bạn muốn xóa chìa khóa:** mở **Cài đặt** và chọn **Xóa chìa khóa**.

## Các trang liên quan

- [Bắt đầu](./getting-started)
- [Deepsand là gì?](./what-is-deepsand)
- [Cách hộp cát hoạt động](./security)
