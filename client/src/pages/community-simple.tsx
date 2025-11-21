import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function CommunityChatPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <iframe
      src="about:blank"
      title="Community"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        overflow: "hidden",
      }}
      onLoad={(e) => {
        const iframeDoc = (e.target as HTMLIFrameElement).contentDocument;
        if (iframeDoc) {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #fff; overflow: hidden; }
                  .container { display: flex; height: 100vh; }
                  .sidebar { width: 280px; background: #2a2a2a; border-right: 1px solid #333; overflow-y: auto; padding: 16px; }
                  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                  .header { border-bottom: 1px solid #333; background: #1a1a1a; padding: 24px; }
                  .messages { flex: 1; overflow-y: auto; padding: 24px; }
                  .input-area { border-top: 1px solid #333; background: #1a1a1a; padding: 16px 24px; }
                  .channel-btn { width: 100%; text-align: left; padding: 12px; margin: 4px 0; border: none; background: #333; color: #fff; border-radius: 4px; cursor: pointer; font-size: 14px; }
                  .channel-btn:hover { background: #404040; }
                  .channel-btn.active { background: #404040; }
                  .section-title { font-size: 12px; text-transform: uppercase; color: #999; padding: 8px 0; margin-top: 16px; font-weight: bold; }
                  .message { padding: 12px 0; border-bottom: 1px solid #333; }
                  .message-user { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
                  .message-text { font-size: 14px; color: #ccc; }
                  .input-box { width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: #fff; border-radius: 4px; }
                  .btn-send { margin-left: 8px; padding: 8px 16px; background: #00bcd4; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="sidebar">
                    <div class="section-title">Bienvenida</div>
                    <button class="channel-btn active">📢 empieza</button>
                    <button class="channel-btn">❓ faq</button>
                    <div class="section-title">Redes</div>
                    <button class="channel-btn">🐦 twitter</button>
                    <button class="channel-btn">💼 linkedin</button>
                  </div>
                  <div class="main">
                    <div class="header"><h1>Comunidad</h1></div>
                    <div class="messages"><p style="text-align: center; margin-top: 40px; color: #999;">Cargando mensajes...</p></div>
                    <div class="input-area">
                      <div style="display: flex;">
                        <input type="text" class="input-box" placeholder="Escribe un mensaje...">
                        <button class="btn-send">Enviar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
        }
      }}
    />
  );
}
