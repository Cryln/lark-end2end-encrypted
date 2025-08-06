/**
 * Cloudflare Workers Todo API Entry
 * Main entry point for the worker application
 */
import router from './routes';

// Export worker with type safety
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      // 处理静态资源请求
      if (url.pathname.startsWith('/') && (url.pathname.endsWith('.html') || 
          url.pathname.endsWith('.js') || 
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.png') || 
          url.pathname.endsWith('.jpg') || 
          url.pathname.endsWith('.svg') || 
          url.pathname.endsWith('.ico'))) {
        const asset = await env.ASSETS.get(url.pathname);
        if (asset) {
          // 根据文件扩展名设置正确的Content-Type
          let contentType = 'text/plain';
          if (url.pathname.endsWith('.html')) contentType = 'text/html';
          else if (url.pathname.endsWith('.js')) contentType = 'application/javascript';
          else if (url.pathname.endsWith('.css')) contentType = 'text/css';
          else if (url.pathname.endsWith('.png')) contentType = 'image/png';
          else if (url.pathname.endsWith('.jpg')) contentType = 'image/jpeg';
          else if (url.pathname.endsWith('.svg')) contentType = 'image/svg+xml';
          else if (url.pathname.endsWith('.ico')) contentType = 'image/x-icon';

          return new Response(asset, {
            headers: { 'Content-Type': contentType }
          });
        }
        // 如果找不到静态资源，继续使用router处理
      }
      // 处理API请求
      return await router.fetch(request, env, ctx);
    } catch (error) {
      console.error('Global error:', error);
      return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }}
      );
    }
  },
} satisfies ExportedHandler<Env>;
