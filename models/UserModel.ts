import { prop, getModelForClass } from "@typegoose/typegoose";

export class User {
  @prop({ required: true, unique: true, minlength: 3, maxlength: 16 })
  username!: string;

  @prop({ required: true, minlength: 8 })
  password!: string;

  @prop({ required: true, default: false })
  isAdmin?: boolean = false;
}

export default getModelForClass(User);
