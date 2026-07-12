import { z } from 'zod';

// Module insights chủ yếu đọc dữ liệu từ DB và không nhận input phức tạp.
// Giữ một schema rỗng (cho phép query rỗng) để có thể dùng validate() nếu cần.
export const emptyQuerySchema = z.object({}).passthrough();

export type EmptyQuery = z.infer<typeof emptyQuerySchema>;
