// BÀI HỌC RUBIK – lộ trình cho người đã giải 3x3 bằng cách tầng (> 2 phút), chưa biết 2x2 & 4x4
// Mỗi bài: nội dung ngắn + khối minh hoạ (demo) + bộ công thức (algSet) để ôn trong "Ôn công thức".
export const TRACKS = [
  { id: '333', name: '3x3 · Từ cách giải tầng xuống dưới 1 phút', emoji: '🟩' },
  { id: '222', name: '2x2 · Học từ đầu (dựa trên 3x3)', emoji: '🟨' },
  { id: '444', name: '4x4 · Reduction (biến thành 3x3)', emoji: '🟥' },
]

export const LESSONS = [
  {
    id: '333-notation', track: '333', title: 'Ký hiệu & cách cầm khối', time: '10 phút',
    body: [
      'Mọi công thức viết bằng ký hiệu WCA. Cầm khối: mặt TRẮNG ở DƯỚI, VÀNG ở TRÊN (khác cách giải tầng phổ biến – làm quen sớm vì F2L cần nhìn từ trên xuống).',
      'R L U D F B = xoay mặt Phải, Trái, Trên, Dưới, Trước, Sau 90° theo chiều kim đồng hồ (khi nhìn thẳng vào mặt đó). Thêm \' = ngược chiều, thêm 2 = 180°.',
      'Chữ thường (r, f…) hoặc Rw = xoay 2 lớp. M = lớp giữa (cùng chiều L). x y z = xoay CẢ khối theo trục R, U, F.',
      'Mẹo tốc độ: ngón trỏ tay phải đẩy U (U), ngón trỏ tay trái kéo U\' – không dùng cả cổ tay. Tập “R U R\' U\'” (sexy move) 10 lần liền thật đều tay.',
    ],
    demos: [{ alg: "R U R' U'", label: 'Sexy move – chuỗi tay phổ biến nhất' }, { alg: "x y z", label: 'Xoay cả khối x, y, z' }],
  },
  {
    id: '333-cross', track: '333', title: 'Cross trắng ở mặt DƯỚI, ≤ 8 nước', time: '1 tuần luyện',
    body: [
      'Cách giải tầng thường làm cross ở trên rồi lật khối – mất 2–3 giây và khiến bạn không nhìn thấy các mảnh tiếp theo. Hãy làm cross TRỰC TIẾP ở mặt dưới.',
      'Trong 15 giây quan sát: tìm 4 cạnh trắng, lên kế hoạch đưa ít nhất 2–3 cạnh xuống đúng chỗ. Cross tối ưu luôn ≤ 8 nước.',
      'Luyện: mỗi ngày 20 lần “chỉ làm cross” trong phần Bấm giờ (dừng giờ khi xong cross). Mục tiêu: cross dưới 4 giây, không nhìn xuống đáy.',
    ],
    demos: [{ setup: "F' R U2 F2 D' L2", alg: "L2 D F2 U2 R' F", stick: 'Cross', label: 'Ví dụ: cross 6 nước ở mặt dưới (chỉ tô màu các mảnh cross)' }],
  },
  {
    id: '333-f2l', track: '333', title: 'F2L trực giác – ghép cặp góc + cạnh', time: '2–3 tuần', algSet: '333-f2l',
    body: [
      'Thay 2 bước “góc tầng 1” + “cạnh tầng 2” bằng MỘT bước: ghép góc trắng với cạnh cùng màu ở tầng trên, rồi chèn cả cặp vào khe. Đây là bước giúp giảm thời gian nhiều nhất (thường 30–60 giây).',
      'Ý tưởng: đưa góc và cạnh lên tầng trên → ghép thành cặp (cùng màu cạnh nhau) → chèn bằng R U R\' (khe phải) hoặc F\' U\' F / L\' U\' L (khe trái).',
      'Luyện chậm có chủ đích: xoay chậm nhưng KHÔNG dừng lại tìm mảnh. Khi đang chèn cặp này, mắt đã tìm cặp tiếp theo (lookahead).',
      'Mỗi trường hợp trong phần “Ôn công thức” chỉ vài nước – học hiểu vì sao nó ghép được, đừng học thuộc máy móc.',
    ],
  },
  {
    id: '333-oll2', track: '333', title: 'OLL 2 bước – vàng cả mặt trên', time: '1–2 tuần', algSet: '333-oll2',
    body: [
      'Bước 1 (cạnh): tạo dấu cộng vàng – 3 trường hợp: Chấm, Chữ L, Thanh ngang. Bạn có thể đã biết F R U R\' U\' F\' từ cách giải tầng.',
      'Bước 2 (góc): 7 trường hợp. Học Sune và Anti-Sune trước (gặp nhiều nhất), sau đó H, Pi, U, T, L.',
      'Nhận diện bằng cách nhìn vị trí các ô vàng trên mặt bên, không chỉ mặt trên.',
    ],
  },
  {
    id: '333-pll2', track: '333', title: 'PLL 2 bước – hoán vị tầng cuối', time: '1–2 tuần', algSet: '333-pll2',
    body: [
      'Bước 1 (góc): tìm “đèn pha” (2 góc cùng màu trên một mặt). Có đèn pha → T-perm (đặt đèn pha bên trái). Không có → Y-perm.',
      'Bước 2 (cạnh): Ua / Ub (3 cạnh xoay vòng), H (đổi cạnh đối), Z (đổi cạnh kề).',
      'Với 2-look OLL + 2-look PLL (16 công thức), tầng cuối chỉ còn ~4 bước nhìn. Tổng thời gian 3x3 thường xuống dưới 1 phút.',
    ],
  },
  {
    id: '333-speed', track: '333', title: 'Tăng tốc: lookahead, finger tricks, luyện có chủ đích', time: 'liên tục',
    body: [
      'Lookahead: giải chậm hơn bình thường nhưng KHÔNG ĐƯỢC DỪNG. Tốc độ đến từ việc không dừng, không phải tay nhanh.',
      'Mỗi buổi: 5 phút ôn công thức → 12 lần bấm giờ (ao12) → ghi lại bước chậm nhất (cross / F2L / OLL / PLL) và luyện riêng bước đó.',
      'Bôi trơn và chỉnh độ căng khối; khối có nam châm giúp xoay chính xác hơn.',
      'Mục tiêu theo mốc: ao12 dưới 90 giây → dưới 60 giây → dưới 45 giây (lúc đó học thêm OLL/PLL đầy đủ).',
    ],
  },
  {
    id: '222-method', track: '222', title: '2x2 bằng kiến thức 3x3 (3 bước)', time: '2–3 ngày', algSet: '222',
    body: [
      '2x2 chỉ có 8 góc – giống hệt các góc của 3x3, không có cạnh và tâm. Vì vậy bạn giải bằng chính các bước “góc” của 3x3.',
      'Bước 1: làm 4 góc trắng ở mặt dưới (giống tầng 1 của 3x3, chỉ không có cạnh). Chú ý màu cạnh của các góc phải khớp nhau.',
      'Bước 2: vàng cả mặt trên bằng Sune (làm lại từ hướng khác nếu chưa xong).',
      'Bước 3: hoán vị góc tầng trên bằng T-perm (đổi 2 góc kề) hoặc Y-perm (2 góc chéo). Mục tiêu: dưới 20 giây.',
    ],
    demos: [{ puzzle: '2x2x2', alg: "R U R' U'", label: 'Đưa một góc trắng xuống (lặp đến khi đúng)' }],
  },
  {
    id: '444-centers', track: '444', title: '4x4 bước 1: ghép 6 tâm 2x2', time: '1 tuần',
    body: [
      'Phương pháp Reduction: biến 4x4 thành 3x3 lớn – (1) ghép tâm, (2) ghép cạnh đôi, (3) giải như 3x3 + xử lý parity.',
      'Mỗi mặt 4x4 có 4 ô tâm. Ghép tâm TRẮNG trước, rồi VÀNG ở mặt đối diện. Sau đó 4 tâm còn lại theo đúng thứ tự màu như 3x3 (trắng dưới, xanh lá trước → đỏ bên phải, cam bên trái, xanh dương sau).',
      'Thao tác cơ bản: đưa 2 ô tâm thành một thanh, rồi dùng Rw U Rw\' (hoặc Rw U2 Rw\') để chèn thanh vào mặt đang ghép mà không phá phần đã xong.',
      'Cẩn thận thứ tự màu – ghép sai vị trí tâm là lỗi phổ biến nhất của người mới.',
    ],
    demos: [{ puzzle: '4x4x4', alg: "Rw U Rw'", label: 'Chèn thanh tâm bằng lớp kép' }],
  },
  {
    id: '444-edges', track: '444', title: '4x4 bước 2: ghép 12 cạnh đôi', time: '1 tuần', algSet: '444',
    body: [
      'Mỗi cạnh 3x3 tương ứng với 2 nửa cạnh trên 4x4. Ghép 8 cạnh đầu khá tự do (chỉ cần giữ tâm nguyên vẹn khi trả lại).',
      'Cách “slice – flip – slice”: đặt hai nửa cạnh cần ghép ở trái và phải tầng giữa → Uw\' (ghép lại) → R U R\' F R\' F\' R (đưa cặp vừa ghép ra, đưa cạnh chưa ghép vào) → Uw (trả tâm).',
      'Bốn cạnh cuối: dùng đúng chuỗi slice–flip–slice ở trên lặp lại.',
    ],
  },
  {
    id: '444-parity', track: '444', title: '4x4 bước 3: giải như 3x3 + parity', time: '3–4 ngày', algSet: '444',
    body: [
      'Sau khi có tâm và cạnh đôi, xoay CHỈ các mặt ngoài (R, U, F…) – nó y hệt 3x3, dùng cách bạn đang giải.',
      'OLL parity: đến tầng cuối thấy chỉ MỘT cạnh đôi bị lật (không thể xảy ra trên 3x3) → làm công thức OLL parity, rồi tiếp tục.',
      'PLL parity: chỉ còn 2 cạnh đôi đối diện bị đổi chỗ (hoặc tình huống PLL “không có trên 3x3”) → làm PLL parity.',
      'Mục tiêu đầu tiên: giải được trọn vẹn; sau đó dưới 3 phút.',
    ],
  },
]

export const lessonById = (id) => LESSONS.find((l) => l.id === id)
