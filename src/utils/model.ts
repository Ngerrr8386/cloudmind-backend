/** Cấu hình toJSON chuẩn: đổi _id → id, ẩn __v. */
export const baseToJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
}
