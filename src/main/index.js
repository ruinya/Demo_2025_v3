import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { Client } from 'pg';
import icon from '../../resources/Лого.png?asset';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 700,
    height: 850,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Работа с БАЗАМИ ДАННЫХ
const login = {
  user: 'electron',
  password: '123test',
  host: 'localhost',
  port: 5433,
  database: 'demo_2025',
};

async function getMemberById(_, id) {
  const client = new Client(login);
  await client.connect();

  try {
    const res = await client.query(
      `
      SELECT 
        fm.name, 
        fm.date_of_birth, 
        fmj.occupation, 
        fmj.organization, 
        fmj.salary
      FROM family_members AS fm
      LEFT JOIN family_members_job AS fmj ON fm.id = fmj.member_id
      WHERE fm.id = $1;`,
      [id]
    );
    await client.end();

    return res.rows[0];
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

async function getMembers() {
  const client = new Client(login);
  await client.connect();

  const res = await client.query(
    `SELECT 
      T1.id,
      T1.name, 
      EXTRACT(YEAR FROM age(T1.date_of_birth)) AS age,
      COALESCE(T2.occupation, 'Безработный') AS occupation,
      COALESCE(T2.organization, '-') AS organization, 
      COALESCE(T2.salary, 0) AS salary
    FROM family_members AS T1
    LEFT JOIN family_members_job AS T2 ON T1.id = T2.member_id;`
  );

  await client.end();
  return res.rows;
}

async function countBudget() {
  const client = new Client(login);
  await client.connect();

  const res = await client.query(
    `SELECT 
      m.id AS member_id,
      m.name,
      COALESCE(s.salary, 0) - COALESCE(SUM(e.quantity * pr.price_per_item), 0) AS budget
    FROM family_members AS m
    LEFT JOIN family_members_job AS s ON m.id = s.member_id
    LEFT JOIN expences AS e ON m.id = e.member_id
    LEFT JOIN products AS pr ON e.product_id = pr.id
    GROUP BY m.id, m.name, s.salary;`
  );

  await client.end();
  return res.rows;
}

async function addMember(_, member) {
  const client = new Client(login);
  await client.connect();

  const { name, date, occupation, address, salary } = member;
  try {
    const memberInfo = await client.query(
      `INSERT INTO family_members (name, date_of_birth) VALUES ($1, $2) RETURNING id;`,
      [name, date]
    );
    const memberId = memberInfo.rows[0].id;
    await client.query(
      `INSERT INTO family_members_job (member_id, occupation, organization, salary) 
       VALUES ($1, $2, $3, $4)`,
      [memberId, occupation, address, salary]
    );
    dialog.showMessageBox({ message: 'Успех! Член семьи создан.' });
  } catch (e) {
    console.log(e);
    if (e.code === '23505') {
      dialog.showErrorBox(
        'Ошибка!',
        'Член семьи с таким именем уже существует!'
      );
    } else {
      dialog.showErrorBox(
        'Ошибка!',
        e.message || 'Ошибка при создании члена семьи!'
      );
    }
  }

  await client.end();
}

async function editMember(_, member) {
  const client = new Client(login);
  await client.connect();

  const { name, date, occupation, address, salary, id } = member;
  try {
    await client.query(
      `UPDATE family_members SET name = $1, date_of_birth = $2 WHERE id = $3`,
      [name, date, id]
  );

  await client.query(
      `UPDATE family_members_job 
       SET occupation = $2, organization = $3, salary = $4 
       WHERE member_id = $1`,
      [id, occupation, address, salary]
  );
    dialog.showMessageBox({ message: 'Успех! Информация обновлена.' });
  } catch (e) {
    console.log(e);
    if (e.code === '23505') {
      dialog.showErrorBox('Ошибка!', 'Член семьи с таким именем уже существует!');
    } else {
      dialog.showErrorBox(
        'Ошибка!',
        e.message || 'Ошибка при редактировании члена семьи!'
      );
    }
  }

  await client.end();
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  ipcMain.handle('get-members', getMembers);
  ipcMain.handle('countBudget', countBudget);
  ipcMain.handle('addMember', addMember);
  ipcMain.handle('editMember', editMember);
  ipcMain.handle('getMemberById', getMemberById);

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
