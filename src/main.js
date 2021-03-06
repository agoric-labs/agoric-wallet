import { app, ipcMain, BrowserWindow } from 'electron';
import { fork } from 'child_process';
import path from 'path';

async function main(argv, isProduction) {
  // TODO: Use this to automatically download updates on Windows and MacOS.
  // Requires code signing.
  require('update-electron-app')();

  // Needed to display on Ubuntu 2020.04 under Parallels
  app.disableHardwareAcceleration();

  const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, '../ui/preload-entry.cjs'),
        contextIsolation: true,
        worldSafeExecuteJavaScript: true,
      },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));

    // Open the DevTools.
    if (argv.includes('--devtools') || !isProduction) {
      mainWindow.webContents.openDevTools();
    }
  };

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('fork', (ev, obj) => {
    const { id, args } = obj;
    ev.sender.send('fork-start', { id });
    const [progname, ...restArgs] = args;
    const entrypoint = path.join(__dirname, `${progname}.cjs`);
    const cp = fork(entrypoint, restArgs, { detached: true });
    cp.on('close', (code, signal) => ev.sender.send('fork-close', { id, code, signal }))
  });

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.
};

export default main;
