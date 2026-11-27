// CÔNG THỨC RUBIK – ký hiệu chuẩn WCA (dùng được trực tiếp với cubing.js)
// Màu chuẩn: trắng dưới (D), vàng trên (U), xanh lá trước (F). Mặt trên = tầng cuối (LL).
// stick: kiểu tô màu khi minh hoạ (OLL = chỉ hiện màu vàng; PLL = hiện vị trí; F2L…)
// Mọi công thức đã được kiểm tra bằng mô phỏng khối Rubik (scripts/verify-algs.mjs).

export const ALG_SETS = {
  '333-oll2': { puzzle: '3x3x3', name: '3x3 · OLL 2 bước (định hướng mặt vàng)', stick: 'OLL' },
  '333-pll2': { puzzle: '3x3x3', name: '3x3 · PLL 2 bước (hoán vị tầng cuối)', stick: 'PLL' },
  '333-f2l': { puzzle: '3x3x3', name: '3x3 · F2L cơ bản (ghép cặp góc–cạnh)', stick: 'F2L' },
  '222': { puzzle: '2x2x2', name: '2x2 · Cách giải tầng', stick: 'full' },
  '444': { puzzle: '4x4x4', name: '4x4 · Reduction & parity', stick: 'full' },
}

export const ALGS = [
  // ── OLL 2 bước – bước 1: tạo dấu cộng vàng (cạnh) ──
  { id: 'oll-line', set: '333-oll2', name: 'Thanh ngang', alg: "F R U R' U' F'", tip: 'Thanh vàng nằm ngang (song song với bạn).' },
  { id: 'oll-l', set: '333-oll2', name: 'Chữ L', alg: "f R U R' U' f'", tip: 'Chữ L vàng ở góc TRÁI–SAU. f = xoay 2 lớp trước (như F nhưng dày).' },
  { id: 'oll-dot', set: '333-oll2', name: 'Chấm', alg: "F R U R' U' F' f R U R' U' f'", tip: 'Chỉ có tâm vàng: làm thanh ngang rồi làm chữ L.' },
  // ── OLL 2 bước – bước 2: vàng cả mặt (góc) ──
  { id: 'oll-sune', set: '333-oll2', name: 'Sune (cá)', alg: "R U R' U R U2 R'", tip: 'Một góc vàng ở trên, đặt nó ở TRƯỚC–TRÁI; góc trước–phải có vàng nhìn về phía bạn.' },
  { id: 'oll-antisune', set: '333-oll2', name: 'Anti-Sune', alg: "R U2 R' U' R U' R'", tip: 'Một góc vàng ở trên, đặt nó ở SAU–PHẢI; vàng của góc trước–trái nhìn sang trái.' },
  { id: 'oll-h', set: '333-oll2', name: 'H (hai đèn hai bên)', alg: "F R U R' U' R U R' U' R U R' U' F'", tip: 'Không góc nào vàng ở trên, hai cặp vàng nhìn ra hai bên trái–phải.' },
  { id: 'oll-pi', set: '333-oll2', name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R", tip: 'Không góc vàng ở trên; một cặp vàng nhìn sang TRÁI, hai vàng còn lại ở phía trước & sau.' },
  { id: 'oll-u', set: '333-oll2', name: 'U (đèn pha)', alg: "R2 D R' U2 R D' R' U2 R'", tip: 'Hai góc vàng kề nhau ở trên, cặp “đèn pha” vàng nhìn về phía bạn.' },
  { id: 'oll-t', set: '333-oll2', name: 'T', alg: "r U R' U' r' F R F'", tip: 'Hai góc vàng kề nhau ở trên (phía phải), hai vàng còn lại nhìn sang trái và… (hình chữ T).' },
  { id: 'oll-l2', set: '333-oll2', name: 'L (nơ)', alg: "F' r U R' U' r' F R", tip: 'Hai góc vàng chéo nhau ở trên; xoay sao cho vàng của góc trước–trái nhìn về phía bạn.' },
  // ── PLL 2 bước – bước 1: góc ──
  { id: 'pll-t', set: '333-pll2', name: 'T-perm (đổi 2 góc kề)', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", tip: 'Có một mặt có “đèn pha” (2 góc cùng màu): đặt đèn pha ở bên TRÁI rồi làm.' },
  { id: 'pll-y', set: '333-pll2', name: 'Y-perm (đổi 2 góc chéo)', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", tip: 'Không mặt nào có đèn pha: đổi hai góc chéo nhau.' },
  // ── PLL 2 bước – bước 2: cạnh ──
  { id: 'pll-ua', set: '333-pll2', name: 'Ua (3 cạnh xoay ngược chiều kim đồng hồ)', alg: "R U' R U R U R U' R' U' R2", tip: 'Một mặt đã xong: đặt mặt đó ở SAU.' },
  { id: 'pll-ub', set: '333-pll2', name: 'Ub (3 cạnh xoay theo chiều kim đồng hồ)', alg: "R2 U R U R' U' R' U' R' U R'", tip: 'Một mặt đã xong: đặt mặt đó ở SAU.' },
  { id: 'pll-h', set: '333-pll2', name: 'H-perm (đổi 2 cặp cạnh đối)', alg: "M2 U M2 U2 M2 U M2", tip: 'Các cạnh đối diện bị đổi chỗ (hình chữ thập màu trái ngược).' },
  { id: 'pll-z', set: '333-pll2', name: 'Z-perm (đổi 2 cặp cạnh kề)', alg: "M' U M2 U M2 U M' U2 M2 U'", tip: 'Hai cặp cạnh kề bị đổi chỗ.' },
  // ── F2L cơ bản: chèn cặp góc–cạnh vào khe trước–phải ──
  { id: 'f2l-1', set: '333-f2l', name: 'Cặp đã ghép, chèn phải', alg: "U R U' R'", tip: 'Cặp góc–cạnh nằm ở trên, chèn vào khe phải bằng tay phải.' },
  { id: 'f2l-2', set: '333-f2l', name: 'Cặp đã ghép, chèn trước', alg: "U' F' U F", tip: 'Giống trường hợp trước nhưng chèn từ phía trước.' },
  { id: 'f2l-3', set: '333-f2l', name: 'Trắng nhìn sang phải', alg: "R U R'", tip: 'Góc ở trên khe, trắng nhìn sang phải, cạnh ở sau: một nhát R U R\'.' },
  { id: 'f2l-4', set: '333-f2l', name: 'Trắng nhìn về trước', alg: "F' U' F", tip: 'Đối xứng của trường hợp trên.' },
  { id: 'f2l-5', set: '333-f2l', name: 'Tách rồi ghép', alg: "R U' R' U R U' R'", tip: 'Cặp bị ngược: tách ra, ghép lại, rồi chèn.' },
  // ── 2x2 ──
  { id: '222-oll', set: '222', name: 'Định hướng góc (Sune)', alg: "R U R' U R U2 R'", tip: 'Giống 3x3: làm vàng cả mặt trên. Lặp lại Sune từ các hướng khác nhau nếu cần.' },
  { id: '222-pll-adj', set: '222', name: 'Đổi 2 góc kề (T-perm)', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", tip: 'Đặt cặp góc cần đổi ở bên PHẢI (đèn pha ở trái).' },
  { id: '222-pll-diag', set: '222', name: 'Đổi 2 góc chéo (Y-perm)', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", tip: 'Khi không có đèn pha nào.' },
  // ── 4x4 ──
  { id: '444-flip', set: '444', name: 'Ghép cạnh: slice – flip – slice', alg: "Uw' R U R' F R' F' R Uw", tip: 'Đặt hai nửa cạnh cần ghép ở khe trái & phải tầng giữa; Uw\' đưa ghép, đoạn giữa “lật” cặp đã ghép ra chỗ khác, Uw trả tâm.' },
  { id: '444-oll-parity', set: '444', name: 'OLL parity (một cạnh bị lật)', alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2", tip: 'Khi tầng cuối chỉ có MỘT cạnh đôi bị lật (không gặp ở 3x3). 2R / 2L = chỉ xoay LỚP TRONG bên phải/trái (sách hay viết r, l). Bản “pure”: không làm xáo phần khác.' },
  { id: '444-pll-parity', set: '444', name: 'PLL parity (2 cạnh đối bị đổi)', alg: "2R2 U2 2R2 Uw2 2R2 2U2", tip: 'Khi tầng cuối chỉ còn 2 cạnh đối diện bị đổi chỗ (không gặp ở 3x3). 2R2 = lớp trong bên phải 180°, Uw2 = 2 lớp trên, 2U2 = chỉ lớp trong phía trên.' },
]

export const algById = (id) => ALGS.find((a) => a.id === id)
