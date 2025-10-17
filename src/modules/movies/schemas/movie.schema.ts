import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  directorId: Types.ObjectId;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

MovieSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret._id = ret._id.toString();
    return ret;
  },
});

MovieSchema.index({ directorId: 1 });
MovieSchema.index({ imdbId: 1 }, { unique: true, sparse: true });
