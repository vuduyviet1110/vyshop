import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Custom Vite Plugin để tạo API Mock Endpoint tạm thời
const testApiPlugin = (): Plugin => ({
  name: 'test-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/test', (req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });

      req.on('end', () => {
        console.log('\n========================================');
        console.log(`📩 [API MOCK RECEIVED REQUEST]`);
        console.log(`⏱️ Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`);
        console.log(`📌 Method: ${req.method}`);
        console.log(`🔗 URL: ${req.url}`);
        console.log(`📄 Headers:`, JSON.stringify(req.headers, null, 2));
        if (body) {
          try {
            console.log(`📦 Body (JSON):`, JSON.stringify(JSON.parse(body), null, 2));
          } catch {
            console.log(`📦 Body (Raw):`, body);
          }
        } else {
          console.log(`📦 Body: (Empty)`);
        }
        console.log('========================================\n');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.statusCode = 200;
        res.end(JSON.stringify({
          status: 'success',
          message: 'Đã nhận request thành công và in ra terminal console!',
          receivedAt: new Date().toISOString()
        }));
      });
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), testApiPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true
  }
})
