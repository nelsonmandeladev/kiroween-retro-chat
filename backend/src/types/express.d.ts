import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
