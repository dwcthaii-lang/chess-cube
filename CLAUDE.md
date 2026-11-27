# Cờ & Rubik – quy tắc dự án

Web luyện cờ vua và Rubik (React + Vite + Tailwind + PWA). Dữ liệu lưu ở LocalStorage (khoá `chess-cube:v1`). Push nhánh `main` thì app tự đăng lên GitHub Pages.
Khung app (store, lịch ôn, PWA, deploy) lấy từ app tiếng Anh `eng-`.

## QUY TẮC BẮT BUỘC (yêu cầu của người dùng)
**Mọi bài luyện hoặc loại bài mới đều phải có ôn tập lặp lại ngắt quãng (SRS).**
- Gọi `scheduleReview(type, id, grade0to5, title)` (`src/lib/review.js`), khai báo `type` trong `REVIEW_TYPES` kèm đường dẫn ôn.
- Mục đến hạn phải hiện ở **Ôn tập hôm nay** (`src/modules/Review.jsx`) và trong số đếm (`countDue` ở `App.jsx`).
- Ôn trước, học mới sau; giới hạn số mục mới mỗi ngày (`newPuzzlesPerDay`, `newAlgsPerDay`).
- Hiện có các type: `puzzle` (thế cờ, kể cả nước hớ của người chơi sau ván với máy), `calc` (tính nước), `scan` (quét nguy hiểm), `alg` (công thức Rubik), `lesson` (bài học Rubik).

## Người học
- Cờ vua: biết luật nhưng nhìn nước chậm, hay bỏ quên quân bị đe doạ hoặc bị chiếu, chưa biết tính nước. Trọng tâm là thói quen quét **Chiếu → Ăn quân → Đe doạ** và tính chuỗi nước.
- Rubik: giải 3x3 bằng cách tầng (> 2 phút), mục tiêu dưới 1 phút. 2x2 và 4x4 học từ đầu. Cờ tướng để bản sau.

## Kỹ thuật
- Bàn cờ: `chessground` (`src/components/Board.jsx`). Luật: `chess.js`. Phân tích cho người học (quân treo, nước chiếu…): `src/lib/chessx.js`.
- Máy cờ: Stockfish 19 lite single-thread WASM ở `public/engine/`, gọi qua Web Worker (`src/lib/engine.js`).
- Thế cờ có sẵn: `src/data/puzzles.json`, sinh bằng `scripts/gen-puzzles.mjs` (Stockfish tự đánh, lọc nước thắng duy nhất) rồi gộp bằng `scripts/merge-puzzles.mjs`. Thế cờ online: Lichess `/api/puzzle/next`.
- Rubik: cubing.js `<twisty-player>` (`src/components/Cube.jsx`, công thức hiển thị với VÀNG trên bằng setup `z2`). Scramble tự sinh theo nước (`Timer.jsx`), không dùng worker của cubing (bị lỗi khi build với Vite).
- Công thức Rubik (`src/data/algs.js`) phải được kiểm tra bằng `node scripts/verify-algs.mjs` trước khi thêm.

## Quy ước
- Giao diện tiếng Việt, responsive (thanh điều hướng dưới trên điện thoại), có phím tắt.
