'use strict'

const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const windowStateKeeper = require('electron-window-state')
const os = require('os')
const path = require('path')

if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  })
}

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('http://cabal.chat/') }
      },
      {
        label: 'Report Issue',
        click () { require('electron').shell.openExternal('https://github.com/cabal-club/cabal-desktop/issues/new') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })

  // Edit menu
  template[1].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [
        { role: 'startspeaking' },
        { role: 'stopspeaking' }
      ]
    }
  )

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let win

app.requestSingleInstanceLock()
app.on('second-instance', (event, argv, cwd) => {
  app.quit()
})

app.setAsDefaultProtocolClient('cabal')

app.on('ready', () => {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  })

  win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'default',
    title: 'Cabal Desktop ' + app.getVersion(),
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindowState.manage(win)

  win.loadURL('file://' + path.join(__dirname, 'index.html'))
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // Protocol handler for osx
  app.on('open-url', (event, url) => {
    event.preventDefault()
    win.webContents.send('open-cabal-url', { url })
  })

  ipcMain.on('update-badge', (event, { badgeCount, showCount }) => {
    if (os.platform() === 'darwin') {
      let badge = showCount ? badgeCount : '•'
      app.dock.setBadge(badgeCount > 0 ? ('' + badge) : '')
    } else {
      app.setBadgeCount(badgeCount)
    }
  })
})

app.on('window-all-closed', () => app.quit())
