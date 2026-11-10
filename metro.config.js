const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

let transcriberPromise = null;

function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = import('@xenova/transformers')
      .then(async ({ pipeline, env }) => {
        env.allowLocalModels = true;
        console.log('🎙️ [BeeReady Voice Engine] Loading Whisper English model...');
        const pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        console.log('✅ [BeeReady Voice Engine] Whisper model ready for mobile voice spelling!');
        return pipe;
      })
      .catch((err) => {
        console.error('⚠️ [BeeReady Voice Engine] Failed to load Whisper model:', err);
        transcriberPromise = null;
        throw err;
      });
  }
  return transcriberPromise;
}

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, metroServer) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/transcribe')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          const chunks = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const rawBody = Buffer.concat(chunks).toString('utf8');
              const payload = JSON.parse(rawBody || '{}');
              const { pcmBase64 } = payload;

              if (!pcmBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing pcmBase64 audio data' }));
                return;
              }

              const buf = Buffer.from(pcmBase64, 'base64');
              const sampleCount = Math.floor(buf.byteLength / 2);
              const float32Audio = new Float32Array(sampleCount);
              for (let i = 0; i < sampleCount; i++) {
                const int16 = buf.readInt16LE(i * 2);
                float32Audio[i] = int16 / 32768.0;
              }

              const transcriber = await getTranscriber();
              const result = await transcriber(float32Audio, {
                chunk_length_s: 30,
                stride_length_s: 5
              });

              const transcript = (result && result.text ? result.text : '').trim();
              console.log(`🎙️ [BeeReady Voice] Transcribed (${sampleCount} samples): "${transcript}"`);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ transcript }));
            } catch (err) {
              console.error('⚠️ [BeeReady Voice] Transcription error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
            }
          });
          return;
        }
      }

      return metroMiddleware(req, res, next);
    };
  }
};

module.exports = config;
