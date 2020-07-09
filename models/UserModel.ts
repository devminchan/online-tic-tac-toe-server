import { prop, getModelForClass, DocumentType } from "@typegoose/typegoose";

export class User {
  @prop()
  username?: string;

  @prop()
  password?: string;
}

export default getModelForClass(User);
