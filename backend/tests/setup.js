// Set environment variables before any module is loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_jest_32chars!!';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_for_jest!!';
process.env.PORT = '5099';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'khidmati_test';
process.env.DB_USER = 'root';
process.env.DB_PASS = 'root';
