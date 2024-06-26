/* eslint-disable prettier/prettier */
// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';

export enum UserStatus {
  Offline = 0,
  Online = 1,
  Typing = 2,
}

@Schema()
export class User {
  [x: string]: any;
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  avatar: string;

  @Prop({
    type: Number,
    enum: UserStatus,
    default: UserStatus.Offline,
  })
  status: UserStatus;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: []}])
  friends: Types.Array<Types.ObjectId>;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;
