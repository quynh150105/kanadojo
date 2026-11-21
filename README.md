# LearnJapanese

Ứng dụng luyện 46 chữ Hiragana cơ bản. Mở `index.html` trong trình duyệt để học.

```text
index.html                  Giao diện
assets/
  css/styles.css            Kiểu dáng
  js/app.js                 Dữ liệu và logic flashcard
tests/flashcards.test.cjs    Kiểm tra tự động
```

Chế độ **A → N** đi từ あ (a) đến ん (n); **N → A** đi theo thứ tự ngược.
Nút **Bắt đầu lại** giữ thứ tự của chế độ đang chọn. Các chế độ còn lại xáo trộn thẻ.

Vuốt trái để quay lại từ trước, vuốt phải để sang từ tiếp theo.
Thao tác này dùng được trên điện thoại hoặc kéo bằng chuột, không thay đổi đánh dấu.
Chạm thẻ để lật; cuộn dọc vẫn dùng bình thường.

Đánh dấu **Đã nhớ / Chưa nhớ** được giữ khi xáo trộn, bắt đầu lại hoặc đổi chế độ,
cho đến khi tải lại trang. Mỗi từ có một đánh dấu mới nhất; bộ đếm và kết quả tính
trên bộ từ của chế độ đang chọn. **Chưa đánh dấu** là các từ chưa được chọn trạng thái.

Chạy kiểm tra bằng Node.js:

```sh
node --test tests/flashcards.test.cjs
```
