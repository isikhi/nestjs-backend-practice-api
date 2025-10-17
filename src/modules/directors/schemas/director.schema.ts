import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Director extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ type: Date })
  birthDate?: Date;

  @Prop({ trim: true })
  bio?: string;
}

export const DirectorSchema = SchemaFactory.createForClass(Director);

DirectorSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret._id = String(ret._id);
    return ret;
  },
});

DirectorSchema.index({ firstName: 1, lastName: 1 });
