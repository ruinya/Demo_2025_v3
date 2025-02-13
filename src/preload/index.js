import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  foo: (data) => ipcRenderer.invoke('sendSignal', data),
  getMembers: () => ipcRenderer.invoke('get-members'),
  countBudget: () => ipcRenderer.invoke('countBudget'),
  addMember: (member) => ipcRenderer.invoke('addMember', member),
  editMember: (member) => ipcRenderer.invoke('editMember', member),
  getMemberById: (id) => ipcRenderer.invoke('getMemberById', id)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
