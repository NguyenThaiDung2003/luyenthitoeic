import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Các file e2e dùng chung một CSDL test nên phải chạy tuần tự
    fileParallelism: false,
    // Lần đầu nạp app và kết nối CSDL có thể vượt mức mặc định 10 giây
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
