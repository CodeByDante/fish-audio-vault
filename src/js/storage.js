const VOICES_KEY = 'fish_audio_voices';
const FOLDERS_KEY = 'fish_audio_folders';
const SETTINGS_KEY = 'fish_audio_settings';

export class StorageManager {
  static getVoices() {
    try {
      const data = localStorage.getItem(VOICES_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static saveVoices(voices) {
    try {
      localStorage.setItem(VOICES_KEY, JSON.stringify(voices));
    } catch (e) {
      console.error('Error saving voices to localStorage:', e);
    }
  }

  static getFolders() {
    try {
      const data = localStorage.getItem(FOLDERS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static saveFolders(folders) {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving folders to localStorage:', e);
    }
  }

  static getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { showQuickFolderBadge: false, showSidebarFolders: true, showVoiceNotes: true };
    } catch (e) {
      return { showQuickFolderBadge: false, showSidebarFolders: true, showVoiceNotes: true };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  }
}
