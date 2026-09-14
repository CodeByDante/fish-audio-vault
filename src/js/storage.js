const SETTINGS_KEY = 'fish_audio_settings';

export class StorageManager {
  static clearLegacyStorage() {
    try {
      localStorage.removeItem('fish_audio_voices');
      localStorage.removeItem('fish_audio_folders');
    } catch (e) {}
  }

  static getVoices() {
    // NUNCA usar localStorage para voces: Fuerza la lectura desde voices.json
    this.clearLegacyStorage();
    return null;
  }

  static saveVoices(voices) {
    // NUNCA guardar voces en localStorage
    this.clearLegacyStorage();
  }

  static getFolders() {
    // NUNCA usar localStorage para carpetas: Fuerza la lectura desde voices.json
    this.clearLegacyStorage();
    return null;
  }

  static saveFolders(folders) {
    // NUNCA guardar carpetas en localStorage
    this.clearLegacyStorage();
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
      console.error('Error al guardar configuración:', e);
    }
  }
}
