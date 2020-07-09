import { prop, getModelForClass } from "@typegoose/typegoose";

export class User {
  @prop()
  username?: string;

  @prop()
  password?: string;
}

export default getModelForClass(User);
