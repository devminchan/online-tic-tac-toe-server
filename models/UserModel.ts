import { prop, getModelForClass, DocumentType } from "@typegoose/typegoose";

export class User {
  @prop({ required: true, unique: true })
  username!: string;

  @prop({ required: true })
  password!: string;
}

export default getModelForClass(User);
