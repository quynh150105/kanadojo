# LearnJapanese

Ứng dụng Expo React Native luyện 46 chữ Hiragana cơ bản, chạy trên Android và web.
Giữ nội dung Hiragana/Romaji, giao diện tối và các chức năng flashcard.

## Chức năng

- Bảy chế độ: tất cả 46 chữ xáo trộn; A → N; N → A; A → T (20 chữ); N → Y (18 chữ); R → N (8 chữ); ôn chữ sai.
- Chạm để lật thẻ; vuốt **trái để quay lại**, vuốt **phải để sang từ tiếp theo**.
- Có nút **Từ trước / Từ tiếp theo**. Di chuyển không thay đổi đánh dấu.
- Mỗi từ có một trạng thái mới nhất: **Đã nhớ / Chưa nhớ**. Đánh dấu lại cập nhật trạng thái, không cộng trùng.
- Xáo trộn, bắt đầu lại hoặc đổi chế độ giữ các đánh dấu. Bộ đếm tính trên bộ từ đang chọn.
- Trên web: `Space` lật thẻ, `←` chưa nhớ, `→` đã nhớ, `↓` từ tiếp theo.

## Lưu tiến độ

AsyncStorage lưu đánh dấu, chế độ, thứ tự bộ từ và vị trí học. Đóng rồi mở lại app sẽ
khôi phục tiến độ đã lưu, kể cả trạng thái hoàn thành lượt học.

- **Android:** dữ liệu nằm trong bộ nhớ app trên thiết bị.
- **Web:** dữ liệu nằm trong bộ nhớ trình duyệt của website.
- Không đồng bộ giữa thiết bị hoặc giữa Android và web. Gỡ app, xóa dữ liệu app hoặc xóa dữ liệu website sẽ mất tiến độ cục bộ.

Đợi thông báo **“Tiến độ đã lưu trên thiết bị.”** để biết lần lưu gần nhất hoàn tất.
Nếu báo không lưu được, giữ app mở và chọn **Thử lưu lại**. Nếu không đọc được tiến độ,
app hiển thị **Thử lại** và không tự ghi đè dữ liệu đang có.

## Chạy dự án

Khuyến nghị Node.js **22 LTS, từ 22.13 trở lên**, và npm. Các nhánh Node khác được hỗ trợ ghi trong `package.json`.

```sh
npm ci
npm start
```

Trên Android, mở **Expo Go** và quét mã QR. Điện thoại và máy chạy Metro cần cùng mạng Wi-Fi.
Hoặc mở thiết bị/emulator Android đã kết nối với máy rồi chạy:

```sh
npm run android
```

Chạy web:

```sh
npm run web
```

## Kiểm tra và xuất bản

```sh
npm test
npm run build:web
npm run export:android
```

- `build:web` xuất website vào `dist/`.
- `export:android` xuất JavaScript và tài nguyên Android vào `dist-android/`; đây **không phải APK**.
- Các kiểm tra tự động kiểm tra logic học và lưu/khôi phục dữ liệu; không thay thế kiểm tra trên điện thoại.

Tại lần cài này, `npm audit` báo 3 cảnh báo moderate từ chuỗi thư viện công cụ Expo → fingerprint → minimatch.
Chưa ép đổi major của minimatch hoặc hạ SDK Expo theo gợi ý `audit fix --force`.

GitHub Pages dùng workflow `.github/workflows/deploy-web.yml` để kiểm tra, build và deploy
`dist/` khi push lên `main`. Trong repo, chọn **Settings → Pages → Source → GitHub Actions**.
Workflow lấy `base_path` từ `actions/configure-pages` và truyền qua `EXPO_BASE_URL` để
build đúng đường dẫn con của website. Khi tự build cho đường dẫn con, đặt biến này theo
đường dẫn deploy, ví dụ `/LearnJapanese`.

## Cấu trúc

```text
App.js                          Giao diện và tương tác Android/web
index.js                        Điểm vào Expo
src/study.js                    46 chữ, chế độ và logic học
src/progressStorage.js          Lưu và khôi phục tiến độ
src/styles.js                   Kiểu dáng React Native
tests/                          Kiểm tra logic và bộ nhớ
app.config.js                   Cấu hình Android/web
package.json                    Lệnh chạy và thư viện
.github/workflows/deploy-web.yml Build và deploy GitHub Pages
```
