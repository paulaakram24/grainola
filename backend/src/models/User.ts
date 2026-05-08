import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubscriptionPlan = 'free' | 'basic' | 'premium';

export interface ISubscription {
  plan: SubscriptionPlan;
  startedAt: Date;
  expiresAt: Date | null;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  avatarUrl?: string;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  subscription: ISubscription;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    plan:      { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:               { type: String, required: true, trim: true },
    passwordHash:       { type: String },
    avatarUrl:          { type: String },
    googleId:           { type: String, unique: true, sparse: true },
    googleAccessToken:  { type: String },
    googleRefreshToken: { type: String },
    googleTokenExpiry:  { type: Date },
    subscription:       { type: subscriptionSchema, default: () => ({ plan: 'free', startedAt: new Date(), expiresAt: null }) },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
