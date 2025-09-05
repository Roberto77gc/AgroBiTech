declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      JWT_SECRET?: string;
      MONGODB_URI?: string;
      MONGO_URI?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      EMAIL_FROM?: string;
      FRONTEND_URL?: string;
    }
  }
}

export {};
