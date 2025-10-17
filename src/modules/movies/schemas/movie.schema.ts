import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Director } from '../../directors/schemas/director.schema';

@Schema({ timestamps: true })
export class Movie extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Date })
  releaseDate?: Date;

  @Prop({ trim: true })
  genre?: string;

  @Prop({ type: Number, min: 0, max: 10 })
  rating?: number;

  @Prop({ trim: true, sparse: true })
  imdbId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Director', required: true })
  directorId: Types.ObjectId | Director;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

MovieSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret._id = String(ret._id);
    return ret;
  },
});

MovieSchema.index({ directorId: 1 });
MovieSchema.index({ imdbId: 1 }, { unique: true, sparse: true });
