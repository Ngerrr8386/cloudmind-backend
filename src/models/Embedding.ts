import { Schema, model, Types } from 'mongoose'
import { baseToJSON } from '../utils/model'

/**
 * Một đoạn (chunk) văn bản của file kèm vector embedding.
 * Basecode dùng cosine similarity in-app; lên production có thể chuyển sang
 * MongoDB Atlas Vector Search ($vectorSearch) trên field `vector`.
 */
export interface IEmbedding {
  file: Types.ObjectId
  owner: Types.ObjectId
  workspaceId?: Types.ObjectId | null
  chunkIndex: number
  text: string
  vector: number[]
  createdAt: Date
  updatedAt: Date
}

const embeddingSchema = new Schema<IEmbedding>(
  {
    file: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    vector: { type: [Number], required: true },
  },
  { timestamps: true, toJSON: baseToJSON },
)

export const Embedding = model<IEmbedding>('Embedding', embeddingSchema)
