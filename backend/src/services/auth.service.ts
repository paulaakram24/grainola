import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Folder } from '../models/Folder';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';

interface RegisterInput { name: string; email: string; password: string; }
interface LoginInput    { email: string; password: string; }

export class AuthService {
  private generateAccessToken(userId: string, email: string) {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  async register({ name, email, password }: RegisterInput) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    // Create default "All Meetings" folder for every new user
    await Folder.create({
      name: 'All Meetings',
      userId: user._id,
      isDefault: true,
      color: '#6366f1',
      position: 0,
    });

    const accessToken   = this.generateAccessToken(user._id.toString(), user.email);
    const refreshToken  = await this.createRefreshToken(user._id.toString());

    return {
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const accessToken  = this.generateAccessToken(user._id.toString(), user.email);
    const refreshToken = await this.createRefreshToken(user._id.toString());

    return {
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(token: string) {
    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(stored.userId);
    if (!user) throw new AppError('User not found', 401);

    // Rotate: delete old, issue new
    await RefreshToken.deleteOne({ token });
    const newRefreshToken = await this.createRefreshToken(user._id.toString());

    return {
      accessToken:  this.generateAccessToken(user._id.toString(), user.email),
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string) {
    await RefreshToken.deleteOne({ token });
  }

  /**
   * Find or create a user from an OAuth provider (Google / GitHub / Apple).
   * Three lookup paths, in order:
   *   1. By the provider-specific id (e.g. user has logged in this way before)
   *   2. By email (link an existing email/password account to the provider)
   *   3. Otherwise, create a fresh account
   */
  async findOrCreateOAuthUser(input: {
    provider: 'google' | 'github' | 'apple';
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const { provider, providerId, email, name, avatarUrl } = input;
    const idField =
      provider === 'google' ? 'googleId'
      : provider === 'github' ? 'githubId'
      : 'appleId';

    let user = await User.findOne({ [idField]: providerId });

    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        (user as any)[idField] = providerId;
        if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        avatarUrl,
        [idField]: providerId,
        // No passwordHash → user can only log in via this provider until they reset.
      });
      await Folder.create({
        name: 'All Meetings',
        userId: user._id,
        isDefault: true,
        color: '#6366f1',
        position: 0,
      });
    }

    const accessToken  = this.generateAccessToken(user._id.toString(), user.email);
    const refreshToken = await this.createRefreshToken(user._id.toString());

    return {
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId).select('id name email avatarUrl createdAt');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token     = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ token, userId, expiresAt });
    return token;
  }
}

export const authService = new AuthService();
