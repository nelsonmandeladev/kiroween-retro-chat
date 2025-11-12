import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { userProfile } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  development: {
    baseURL: 'http://localhost:3001',
    clientURL: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000'],
  },
  production: {
    baseURL:
      process.env.BETTER_AUTH_URL ||
      'https://kiiroween-retrochat-backend-production.up.railway.app',
    clientURL:
      process.env.BETTER_AUTH_CLIENT_URL ||
      'https://kiiroween-retrochat-frontend.vercel.app',
    allowedOrigins: [
      process.env.BETTER_AUTH_CLIENT_URL ||
        'https://kiiroween-retrochat-frontend.vercel.app',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
    ],
  },
};

const currentConfig = isProduction ? config.production : config.development;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: currentConfig.baseURL,
  basePath: '/api/auth',
  trustedOrigins: currentConfig.allowedOrigins,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: 'retrochat',
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        attributes: {
          sameSite: isProduction ? 'none' : 'lax',
          secure: isProduction,
          httpOnly: true,
          path: '/',
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          // Create user profile for the new user
          await createUserProfile(
            newSession.user.id,
            newSession.user.name,
            newSession.user.email,
          );
        }
      }
    }),
  },
});

/**
 * Helper function to create user profile
 */
async function createUserProfile(
  userId: string,
  name: string,
  email: string,
): Promise<void> {
  try {
    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return; // Profile already exists
    }

    // Generate a default username from email or name
    const baseUsername =
      name?.toLowerCase().replace(/\s+/g, '') || email.split('@')[0];
    const timestamp = Date.now().toString().slice(-4);
    const defaultUsername = `${baseUsername}${timestamp}`;

    // Create user profile with default values
    await db.insert(userProfile).values({
      userId,
      username: defaultUsername,
      displayName: name || defaultUsername,
      statusMessage: null,
      profilePictureUrl: null,
    });

    console.log(
      `User profile created for user ${userId} with username ${defaultUsername}`,
    );
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: any;
        session?: any;
      }
    >();
    const session = await auth.api.getSession({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      headers: request.headers as any,
    });

    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }

    request.user = session.user;
    request.session = session.session;
    return true;
  }
}
