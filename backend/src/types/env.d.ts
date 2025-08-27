declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      JWT_SECRET?: string;
      MONGODB_URI?: string;
      MONGO_URI?: string;
    }
  }
}

export {};
