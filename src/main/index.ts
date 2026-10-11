import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'node:path';
import * as url from 'node:url';
import { BrowserWindowManager } from './window/index.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

export const windowManager = new BrowserWindowManager({
  preloadPath: path.join(__dirname, '../preload/index.js'),
  prodIndexPath: path.join(__dirname, '../renderer/index.html'),
  isDev,
  devServerUrl: 'http://localhost:5173',
});

export function createMainWindow(): BrowserWindow {
  return windowManager.createWindow();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.whenReady().then(() => {
  windowManager.registerIpcHandlers();
  createMainWindow();

  app.on('second-instance', () => {
    windowManager.focus();
  });
});

ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getName', () => app.getName());
ipcMain.handle('platform:get', () => process.platform);
ipcMain.handle('shell:openExternal', async (_event, targetUrl: string) => {
  await shell.openExternal(targetUrl);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.commandLine.appendSwitch('enable-features', 'WebContentsForceDark');
app.commandLine.appendSwitch('disable-features', 'TranslateUI');
