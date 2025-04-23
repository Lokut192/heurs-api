declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    DB_TYPE?: string;
    DB_NAME?: string;
  }
}
