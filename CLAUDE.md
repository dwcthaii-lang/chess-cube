# Cờ & Rubik – quy tắc dự án

Web luyện cờ vua, cờ tướng và Rubik (React + Vite + Tailwind + PWA). Dữ liệu lưu ở LocalStorage (khoá `chess-cube:v1`). Push nhánh `main` thì app tự đăng lên GitHub Pages.
Khung app (store, lịch ôn, PWA, deploy) lấy từ app tiếng Anh `eng-`.

## QUY TẮC BẮT BUỘC (yêu cầu của người dùng)
**Mọi bài luyện hoặc loại bài mới đều phải có ôn tập lặp lại ngắt quãng (SRS).**
- Gọi `scheduleReview(type, id, grade0to5, title)` (`src/lib/review.js`), khai báo `type` trong `REVIEW_TYPES` kèm đường dẫn ôn.
- Mục đến hạn phải hiện ở **Ôn tập hôm nay** (`src/modules/Review.jsx`) và trong số đếm (`countDue` ở `App.jsx`).
- Ôn trước, học mới sau; giới hạn số mục mới mỗi ngày (`newPuzzlesPerDay`, `newAlgsPerDay`).
- Hiện có các type: `puzzle` (thế cờ, kể cả nước hớ của người chơi sau ván với máy), `calc` (tính nước), `scan` (quét nguy hiểm), `alg` (công thức Rubik), `lesson` (bài học Rubik); cờ tướng: `xqpuzzle`, `xqcalc`, `xqscan` (giới hạn mới/ngày: `newXqPerDay`).

## Người học
- Cờ vua: biết luật nhưng nhìn nước chậm, hay bỏ quên quân bị đe doạ hoặc bị chiếu, chưa biết tính nước. Trọng tâm là thói quen quét **Chiếu → Ăn quân → Đe doạ** và tính chuỗi nước.
- Rubik: giải 3x3 bằng cách tầng (> 2 phút), mục tiêu dưới 1 phút. 2x2 và 4x4 học từ đầu.
- Cờ tướng: người mới. Cùng 4 phần như cờ vua (Quét nguy hiểm, Thế cờ, Tính nước, Đánh với máy + cảnh báo), nhấn mạnh Pháo đánh qua ngòi, Mã chiếu / cản chân Mã.

## Kỹ thuật
- Bàn cờ: `chessground` (`src/components/Board.jsx`). Luật: `chess.js`. Phân tích cho người học (quân treo, nước chiếu…): `src/lib/chessx.js`.
- Máy cờ: Stockfish 19 lite single-thread WASM ở `public/engine/`, gọi qua Web Worker (`src/lib/engine.js`).
- Thế cờ có sẵn: `src/data/puzzles.json`, sinh bằng `scripts/gen-puzzles.mjs` (Stockfish tự đánh, lọc nước thắng duy nhất) rồi gộp bằng `scripts/merge-puzzles.mjs`. Thế cờ online: Lichess `/api/puzzle/next`.
- Rubik: cubing.js `<twisty-player>` (`src/components/Cube.jsx`, công thức hiển thị với VÀNG trên bằng setup `z2`). Scramble tự sinh theo nước (`Timer.jsx`), không dùng worker của cubing (bị lỗi khi build với Vite).
- Cờ tướng: luật + ký hiệu Việt Nam (P2-5, M8.7, X1/1) + phân tích cho người học + máy alpha-beta đều ở `src/lib/xiangqi.js` (không thư viện ngoài). Máy chạy trong Web Worker `src/lib/xqWorker.js`, gọi qua `src/lib/xqEngine.js`. Bàn cờ SVG `src/components/XqBoard.jsx`, các trang ở `src/modules/xq/`. Ô đặt tên a–i + 0–9, hàng 0 là hàng cuối của Đỏ (chuẩn UCCI). Luật hoà: lặp thế 3 lần (đơn giản hoá, chưa có luật bắt lỗi chiếu dai).
- Thế cờ tướng: `src/data/xqPuzzles.json` + `src/data/xqScan.json`, sinh bằng `scripts/gen-xq.mjs` (máy tự đánh; chiếu hết ≤ 3 nước kiểm tra vét cạn với nước đầu duy nhất; bài ăn quân lọc nước thắng duy nhất chênh ≥ 2.5 Tốt), gộp bằng `node scripts/gen-xq.mjs merge …`. Sửa luật thì chạy lại perft (44 / 1920 / 79666 / 3290240).
- Công thức Rubik (`src/data/algs.js`) phải được kiểm tra bằng `node scripts/verify-algs.mjs` trước khi thêm.

## Quy ước
- Giao diện tiếng Việt, responsive (thanh điều hướng dưới trên điện thoại), có phím tắt.
