import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export default async function globalSetup() {
  const serverDir = path.resolve(__dirname, '../server');

  execSync('bunx prisma db push --skip-generate', {
    cwd: serverDir,
    env: { ...process.env },
    stdio: 'inherit',
  });

  execSync('bun run db:seed:test', {
    cwd: serverDir,
    env: { ...process.env },
    stdio: 'inherit',
  });
}
