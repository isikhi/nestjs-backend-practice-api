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
  transform: (_doc, ret) => {
    ret._id = ret._id.toString();
    return ret;
  },
});

DirectorSchema.index({ firstName: 1, lastName: 1 });
