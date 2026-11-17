import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const gameSrc = resolve(__dirname, 'game');
const screenshotsSrc = resolve(__dirname, 'screenshots');
const gameDest = resolve(outputDir, 'game');
const screenshotsDest = resolve(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
mkdirSync(gameDest, { recursive: true });
mkdirSync(screenshotsDest, { recursive: true });

cpSync(gameSrc, gameDest, { recursive: true });
cpSync(screenshotsSrc, screenshotsDest, { recursive: true });

const dossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(resolve(outputDir, 'dossier.json'), dossierJson);
console.log('Dossier successfully written to', resolve(outputDir, 'dossier.json'));
