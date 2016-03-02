'use strict';
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const ipc = require('electron').ipcMain;
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

let mainWindow;
let bgWindow;

function createMainWindow(){
  const win = new BrowserWindow({
  width: 800,
  height: 600
  });

  win.loadURL('file://' + __dirname + '/frontend/index.html');
  win.on('closed', function(){
    mainWindow = null;
	  bgWindow = null;
    app.quit();
  });
  return win;
}

function createBGWindow(){
  const win = new BrowserWindow({
    //width: 800,
    //height: 600
    show:false
  });
  win.loadURL('file://' + __dirname + '/background/index.html');
  return win;
}

app.on('ready', function() {
  mainWindow = createMainWindow();
  bgWindow = createBGWindow();
});

//route events between frontend and background

ipc.on('encrypt-request', function(event, envelope){
  bgWindow.webContents.send('encrypt-request', envelope);
});

ipc.on('decrypt-request', function(event, envelope){
  bgWindow.webContents.send('decrypt-request', envelope);
});

ipc.on('encrypt-response', function(event, payload){
  mainWindow.webContents.send('encrypt-response', payload);
});

ipc.on('decrypt-response', function(event, payload){
  mainWindow.webContents.send('decrypt-response', payload);
});
