import { StorageManager } from './storage.js';

const DEFAULT_FOLDERS = [
  { id: "all", name: "Todas" },
  { id: "f_favorites", name: "Favoritas" },
  { id: "f_sueltas", name: "Voces Sueltas" }
];

const DEFAULT_VOICES = [];

class App {
  constructor() {
    this.voices = [];
    this.folders = [];
    this.settings = StorageManager.getSettings();
    this.selectedVoiceIds = new Set();
    this.isMultiSelectActive = false;
    this.activeFolderId = 'all';
    this.audioPlayers = new Map();
    this.currentPlayingId = null;
    this.editingVoiceId = null;
    this.currentCroppedImage = '';

    this.init();
  }

  async init() {
    this.bindDOM();
    await this.loadData();
    this.bindEvents();
    this.applySettings();
    this.renderFolders();
    this.render();
  }

  bindDOM() {
    this.openTabBtn = document.getElementById('openTabBtn');

    this.openModalBtn = document.getElementById('openModalBtn');
    this.addModal = document.getElementById('addModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.cancelModalBtn = document.getElementById('cancelModalBtn');
    this.modalAddForm = document.getElementById('modalAddForm');
    this.modalTitle = document.getElementById('modalTitle');
    
    this.modalTitleInput = document.getElementById('modalTitleInput');
    this.modalUrlInput = document.getElementById('modalUrlInput');
    this.modalFolderSelect = document.getElementById('modalFolderSelect');
    this.modalNotesInput = document.getElementById('modalNotesInput');

    // Folder elements & controls
    this.folderTabsWrapper = document.getElementById('folderTabsWrapper');
    this.scrollFoldersLeft = document.getElementById('scrollFoldersLeft');
    this.scrollFoldersRight = document.getElementById('scrollFoldersRight');
    this.openFolderModalBtn = document.getElementById('openFolderModalBtn');

    // Left Sidebar Folder Elements
    this.sidebarFolderList = document.getElementById('sidebarFolderList');
    this.sidebarOpenFolderModalBtn = document.getElementById('sidebarOpenFolderModalBtn');

    // Active Folder Header Actions
    this.folderHeaderActions = document.getElementById('folderHeaderActions');
    this.activeFolderNameEl = document.getElementById('activeFolderNameEl');
    this.editFolderBtn = document.getElementById('editFolderBtn');
    this.deleteFolderBtn = document.getElementById('deleteFolderBtn');

    // Create Folder Modal
    this.createFolderModal = document.getElementById('createFolderModal');
    this.closeFolderModalBtn = document.getElementById('closeFolderModalBtn');
    this.cancelFolderModalBtn = document.getElementById('cancelFolderModalBtn');
    this.createFolderForm = document.getElementById('createFolderForm');
    this.newFolderNameInput = document.getElementById('newFolderNameInput');

    // Edit Folder Modal
    this.editFolderModal = document.getElementById('editFolderModal');
    this.closeEditFolderModalBtn = document.getElementById('closeEditFolderModalBtn');
    this.cancelEditFolderModalBtn = document.getElementById('cancelEditFolderModalBtn');
    this.editFolderForm = document.getElementById('editFolderForm');
    this.editFolderNameInput = document.getElementById('editFolderNameInput');

    // Tree View / Map Modal Elements
    this.treeViewBtn = document.getElementById('treeViewBtn');
    this.treeViewModal = document.getElementById('treeViewModal');
    this.closeTreeViewModalBtn = document.getElementById('closeTreeViewModalBtn');
    this.treeSearchInput = document.getElementById('treeSearchInput');
    this.expandAllTreeBtn = document.getElementById('expandAllTreeBtn');
    this.collapseAllTreeBtn = document.getElementById('collapseAllTreeBtn');
    this.treeContainer = document.getElementById('treeContainer');

    // Multi-Select Elements
    this.toggleMultiSelectBtn = document.getElementById('toggleMultiSelectBtn');
    this.toggleMultiSelectMode = document.getElementById('toggleMultiSelectMode');
    this.batchActionBar = document.getElementById('batchActionBar');
    this.batchCountText = document.getElementById('batchCountText');
    this.selectAllBatchBtn = document.getElementById('selectAllBatchBtn');
    this.batchFolderSelect = document.getElementById('batchFolderSelect');
    this.applyBatchMoveBtn = document.getElementById('applyBatchMoveBtn');
    this.closeBatchBarBtn = document.getElementById('closeBatchBarBtn');

    // Settings Modal Elements
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.toggleQuickFolderBadge = document.getElementById('toggleQuickFolderBadge');
    this.toggleSidebarFolders = document.getElementById('toggleSidebarFolders');
    this.toggleShowVoiceNotes = document.getElementById('toggleShowVoiceNotes');

    // Confirm Action Modal
    this.confirmModal = document.getElementById('confirmModal');
    this.confirmModalTitle = document.getElementById('confirmModalTitle');
    this.confirmModalText = document.getElementById('confirmModalText');
    this.closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
    this.cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    this.acceptConfirmBtn = document.getElementById('acceptConfirmBtn');
    this.onConfirmCallback = null;

    // Import / Export PC Storage & Direct File Auto-Sync
    this.linkDiskFileBtn = document.getElementById('linkDiskFileBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.importDataBtn = document.getElementById('importDataBtn');
    this.importFileInput = document.getElementById('importFileInput');
    this.fileHandle = null;

    // Image Upload & Crop elements
    this.modalFileInput = document.getElementById('modalFileInput');
    this.cropCanvas = document.getElementById('cropCanvas');
    this.imagePlaceholder = document.getElementById('imagePlaceholder');
    this.removeImgBtn = document.getElementById('removeImgBtn');
    this.imageDropZone = document.getElementById('imageDropZone');

    this.voicesList = document.getElementById('voicesList');
    this.emptyState = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');
    this.totalCountEl = document.getElementById('totalCount');

    // Sort Order Button
    this.sortOrderBtn = document.getElementById('sortOrderBtn');
    this.sortIconDesc = document.getElementById('sortIconDesc');
    this.sortIconAsc = document.getElementById('sortIconAsc');
    this.sortOrder = 'desc';

    this.checkViewMode();
  }

  checkViewMode() {
    const isExtensionPopup = window.chrome && chrome.extension && chrome.extension.getViews && 
                             chrome.extension.getViews({ type: 'popup' }).includes(window);
    
    if (!isExtensionPopup && window.innerWidth >= 600) {
      if (this.openTabBtn) this.openTabBtn.style.display = 'none';
    }
  }

  async loadData() {
    let localFolders = StorageManager.getFolders();
    let localVoices = StorageManager.getVoices();

    const hasAudioUrls = localVoices && localVoices.some(v => v.audioUrl && v.audioUrl.length > 10);
    if (!localVoices || localVoices.length < 70 || !hasAudioUrls) {
      try {
        const jsonPath = (window.chrome && chrome.runtime && chrome.runtime.getURL) 
          ? chrome.runtime.getURL('voices.json') 
          : 'voices.json';
        const res = await fetch(jsonPath);
        if (res.ok) {
          const json = await res.json();
          if (json.voices && Array.isArray(json.voices) && json.voices.length > 0) {
            localVoices = json.voices;
            if (json.folders && Array.isArray(json.folders)) {
              localFolders = json.folders;
            }
          }
        }
      } catch (e) {
        console.warn('Carga de fallback local voices.json completada:', e);
      }
    }

    let savedFolders = localFolders || JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
    let savedVoices = localVoices || [];

    savedVoices.forEach(v => {
      if (!v.coverImage || v.coverImage.trim() === '' || v.coverImage.startsWith('images/v_') || v.coverImage.includes('icon128.png')) {
        v.coverImage = '';
      }
    });

    this.folders = this.ensureFixedFoldersOrder(savedFolders);
    this.voices = savedVoices;

    StorageManager.saveFolders(this.folders);
    StorageManager.saveVoices(this.voices);
  }

  ensureFixedFoldersOrder(folders) {
    if (!Array.isArray(folders)) return JSON.parse(JSON.stringify(DEFAULT_FOLDERS));

    const allFolder = folders.find(f => f.id === 'all') || { id: 'all', name: 'Todas' };
    const favoritesFolder = folders.find(f => f.id === 'f_favorites') || { id: 'f_favorites', name: 'Favoritas' };
    const sueltasFolder = folders.find(f => f.id === 'f_sueltas') || { id: 'f_sueltas', name: 'Voces Sueltas' };

    allFolder.name = 'Todas';
    favoritesFolder.name = 'Favoritas';
    sueltasFolder.name = 'Voces Sueltas';

    const customFolders = folders.filter(f => f.id !== 'all' && f.id !== 'f_favorites' && f.id !== 'f_sueltas');

    return [allFolder, favoritesFolder, sueltasFolder, ...customFolders];
  }

  async syncCloudDataInBackground() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const liveRes = await fetch(`http://localhost:8080/voices.json?t=${Date.now()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        if (liveJson.voices && Array.isArray(liveJson.voices) && liveJson.voices.length > 0) {
          const cloudVoices = liveJson.voices;
          const cloudFolders = liveJson.folders || [];

          cloudVoices.forEach(v => {
            if (!v.coverImage || v.coverImage.trim() === '' || v.coverImage.startsWith('images/v_') || v.coverImage.includes('icon128.png')) {
              v.coverImage = '';
            }
          });

          this.voices = cloudVoices;
          if (cloudFolders.length > 0) {
            this.folders = this.ensureFixedFoldersOrder(cloudFolders);
          }

          StorageManager.saveFolders(this.folders);
          StorageManager.saveVoices(this.voices);
          this.renderFolders();
          this.render();
        }
      }
    } catch (e) {
      console.log('Sincronización en segundo plano (servidor local opcional).');
    }
  }

  async checkServerStatus() {
    const pill = document.getElementById('syncStatusPill');
    const textEl = document.getElementById('syncStatusText');
    if (!pill || !textEl) return;

    const setOnline = () => {
      pill.classList.remove('offline');
      pill.classList.add('online');
      textEl.textContent = 'Firebase & Host En Vivo';
      pill.title = '🟢 Conexión activa: Sincronizando en tiempo real con Firebase Firestore y Host local';
    };

    const setOffline = () => {
      pill.classList.remove('online');
      pill.classList.add('offline');
      textEl.textContent = 'Modo Nube Directa';
      pill.title = '🟡 Modo Nube Directa: Conectado a Firebase Cloud';
    };

    // 1. Probar conexión en segundo plano mediante Service Worker de Chrome
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      const isOnline = await new Promise(resolve => {
        try {
          chrome.runtime.sendMessage({ action: 'ping_host' }, (res) => {
            if (chrome.runtime.lastError || !res || !res.success) {
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } catch (e) {
          resolve(false);
        }
      });

      if (isOnline) {
        setOnline();
        return;
      }
    }

    // 2. Intento directo por HTTP localhost / 127.0.0.1
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      let res = await fetch(`http://localhost:8080/ping?t=${Date.now()}`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (!res || !res.ok) {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 1000);
        res = await fetch(`http://127.0.0.1:8080/ping?t=${Date.now()}`, { signal: controller2.signal }).catch(() => null);
        clearTimeout(timeoutId2);
      }

      if (res && res.ok) {
        setOnline();
        return;
      }
    } catch (e) {}

    setOffline();
  }

  bindEvents() {
    if (this.openTabBtn) {
      this.openTabBtn.addEventListener('click', () => this.openNewTab());
    }

    if (this.openModalBtn) {
      this.openModalBtn.addEventListener('click', () => this.showModal());
    }
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.hideModal());
    }
    if (this.cancelModalBtn) {
      this.cancelModalBtn.addEventListener('click', () => this.hideModal());
    }
    
    if (this.addModal) {
      this.addModal.addEventListener('click', (e) => {
        if (e.target === this.addModal) this.hideModal();
      });
    }

    // Folder Scroll Controls (Arrows, Wheel & Drag)
    if (this.scrollFoldersLeft) {
      this.scrollFoldersLeft.addEventListener('click', () => {
        if (this.folderTabsWrapper) this.folderTabsWrapper.scrollBy({ left: -180, behavior: 'smooth' });
      });
    }
    if (this.scrollFoldersRight) {
      this.scrollFoldersRight.addEventListener('click', () => {
        if (this.folderTabsWrapper) this.folderTabsWrapper.scrollBy({ left: 180, behavior: 'smooth' });
      });
    }

    if (this.folderTabsWrapper) {
      this.folderTabsWrapper.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          this.folderTabsWrapper.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      let isDown = false;
      let startX, scrollLeft;

      this.folderTabsWrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - this.folderTabsWrapper.offsetLeft;
        scrollLeft = this.folderTabsWrapper.scrollLeft;
      });

      this.folderTabsWrapper.addEventListener('mouseleave', () => { isDown = false; });
      this.folderTabsWrapper.addEventListener('mouseup', () => { isDown = false; });

      this.folderTabsWrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - this.folderTabsWrapper.offsetLeft;
        const walk = (x - startX) * 1.5;
        this.folderTabsWrapper.scrollLeft = scrollLeft - walk;
      });
    }

    // Create Folder Modal Events
    if (this.openFolderModalBtn) {
      this.openFolderModalBtn.addEventListener('click', () => this.showFolderModal());
    }
    if (this.sidebarOpenFolderModalBtn) {
      this.sidebarOpenFolderModalBtn.addEventListener('click', () => this.showFolderModal());
    }
    if (this.closeFolderModalBtn) {
      this.closeFolderModalBtn.addEventListener('click', () => this.hideFolderModal());
    }
    if (this.cancelFolderModalBtn) {
      this.cancelFolderModalBtn.addEventListener('click', () => this.hideFolderModal());
    }
    
    if (this.createFolderModal) {
      this.createFolderModal.addEventListener('click', (e) => {
        if (e.target === this.createFolderModal) this.hideFolderModal();
      });
    }

    if (this.createFolderForm) {
      this.createFolderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveNewFolder();
      });
    }

    // Active Folder Actions (Rename & Delete)
    if (this.editFolderBtn) {
      this.editFolderBtn.addEventListener('click', () => this.showEditFolderModal());
    }
    if (this.deleteFolderBtn) {
      this.deleteFolderBtn.addEventListener('click', () => this.deleteActiveFolder());
    }

    if (this.closeEditFolderModalBtn) {
      this.closeEditFolderModalBtn.addEventListener('click', () => this.hideEditFolderModal());
    }
    if (this.cancelEditFolderModalBtn) {
      this.cancelEditFolderModalBtn.addEventListener('click', () => this.hideEditFolderModal());
    }

    if (this.editFolderModal) {
      this.editFolderModal.addEventListener('click', (e) => {
        if (e.target === this.editFolderModal) this.hideEditFolderModal();
      });
    }

    if (this.editFolderForm) {
      this.editFolderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFolderEdits();
      });
    }

    // Tree View / Map Modal Events
    if (this.treeViewBtn) {
      this.treeViewBtn.addEventListener('click', () => this.showTreeViewModal());
    }
    if (this.closeTreeViewModalBtn) {
      this.closeTreeViewModalBtn.addEventListener('click', () => this.hideTreeViewModal());
    }
    if (this.treeViewModal) {
      this.treeViewModal.addEventListener('click', (e) => {
        if (e.target === this.treeViewModal) this.hideTreeViewModal();
      });
    }
    if (this.treeSearchInput) {
      this.treeSearchInput.addEventListener('input', () => this.renderTreeView());
    }
    if (this.expandAllTreeBtn) {
      this.expandAllTreeBtn.addEventListener('click', () => this.expandAllTree());
    }
    if (this.collapseAllTreeBtn) {
      this.collapseAllTreeBtn.addEventListener('click', () => this.collapseAllTree());
    }

    // Confirm Modal Events
    if (this.closeConfirmModalBtn) {
      this.closeConfirmModalBtn.addEventListener('click', () => this.hideConfirmDialog());
    }
    if (this.cancelConfirmBtn) {
      this.cancelConfirmBtn.addEventListener('click', () => this.hideConfirmDialog());
    }
    if (this.confirmModal) {
      this.confirmModal.addEventListener('click', (e) => {
        if (e.target === this.confirmModal) this.hideConfirmDialog();
      });
    }
    if (this.acceptConfirmBtn) {
      this.acceptConfirmBtn.addEventListener('click', () => {
        const callback = this.onConfirmCallback;
        this.hideConfirmDialog();
        if (typeof callback === 'function') {
          callback();
        }
      });
    }

    // Settings Modal Events
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
    }
    if (this.closeSettingsModalBtn) {
      this.closeSettingsModalBtn.addEventListener('click', () => this.hideSettingsModal());
    }
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());
    }
    if (this.settingsModal) {
      this.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.settingsModal) this.hideSettingsModal();
      });
    }

    if (this.toggleQuickFolderBadge) {
      this.toggleQuickFolderBadge.addEventListener('change', (e) => {
        this.settings.showQuickFolderBadge = e.target.checked;
        StorageManager.saveSettings(this.settings);
        this.render();
      });
    }

    if (this.toggleSidebarFolders) {
      this.toggleSidebarFolders.addEventListener('change', (e) => {
        this.settings.showSidebarFolders = e.target.checked;
        StorageManager.saveSettings(this.settings);
        this.applySettings();
      });
    }

    if (this.toggleShowVoiceNotes) {
      this.toggleShowVoiceNotes.addEventListener('change', (e) => {
        this.settings.showVoiceNotes = e.target.checked;
        StorageManager.saveSettings(this.settings);
        this.render();
      });
    }

    // Multi-Select & Batch Move Events
    if (this.toggleMultiSelectBtn) {
      this.toggleMultiSelectBtn.addEventListener('click', () => {
        this.setMultiSelectMode(!this.isMultiSelectActive);
      });
    }

    if (this.toggleMultiSelectMode) {
      this.toggleMultiSelectMode.addEventListener('change', (e) => {
        this.setMultiSelectMode(e.target.checked);
      });
    }

    if (this.selectAllBatchBtn) {
      this.selectAllBatchBtn.addEventListener('click', () => this.toggleSelectAllBatch());
    }

    if (this.applyBatchMoveBtn) {
      this.applyBatchMoveBtn.addEventListener('click', () => this.applyBatchMove());
    }

    if (this.closeBatchBarBtn) {
      this.closeBatchBarBtn.addEventListener('click', () => this.setMultiSelectMode(false));
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.addModal && this.addModal.style.display !== 'none') this.hideModal();
        if (this.createFolderModal && this.createFolderModal.style.display !== 'none') this.hideFolderModal();
        if (this.editFolderModal && this.editFolderModal.style.display !== 'none') this.hideEditFolderModal();
        if (this.treeViewModal && this.treeViewModal.style.display !== 'none') this.hideTreeViewModal();
        if (this.confirmModal && this.confirmModal.style.display !== 'none') this.hideConfirmDialog();
        if (this.settingsModal && this.settingsModal.style.display !== 'none') this.hideSettingsModal();
      }
    });

    // Direct PC File Sync Link Button
    if (this.linkDiskFileBtn) {
      this.linkDiskFileBtn.addEventListener('click', () => this.linkDiskFile());
    }

    // PC File Storage Export & Import
    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener('click', () => this.exportData());
    }
    if (this.importDataBtn && this.importFileInput) {
      this.importDataBtn.addEventListener('click', () => this.importFileInput.click());
      this.importFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importData(e.target.files[0]);
        }
      });
    }

    // Image Upload Events
    if (this.modalFileInput) {
      this.modalFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.processImageFile(e.target.files[0]);
        }
      });
    }

    if (this.removeImgBtn) {
      this.removeImgBtn.addEventListener('click', () => this.clearCroppedImage());
    }

    // Clipboard Paste Support (Ctrl + V)
    document.addEventListener('paste', (e) => {
      if (this.addModal && this.addModal.style.display !== 'none') {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            this.processImageFile(blob);
            break;
          }
        }
      }
    });

    // Modal Form submission
    if (this.modalAddForm) {
      this.modalAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveVoiceFromModal();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.render());
    }

    if (this.sortOrderBtn) {
      this.sortOrderBtn.addEventListener('click', () => {
        this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
        if (this.sortIconDesc && this.sortIconAsc) {
          this.sortIconDesc.style.display = this.sortOrder === 'desc' ? 'block' : 'none';
          this.sortIconAsc.style.display = this.sortOrder === 'asc' ? 'block' : 'none';
        }
        if (this.sortOrderBtn) {
          this.sortOrderBtn.title = this.sortOrder === 'desc' 
            ? 'Orden: Más reciente a más antiguo' 
            : 'Orden: Más antiguo a más reciente';
        }
        this.render();
      });
    }
  }

  renderFolders() {
    this.folders = this.ensureFixedFoldersOrder(this.folders);

    if (this.folderTabsWrapper) this.folderTabsWrapper.innerHTML = '';
    if (this.sidebarFolderList) this.sidebarFolderList.innerHTML = '';

    const systemFolderIds = new Set(['all', 'f_favorites', 'f_sueltas']);

    this.folders.forEach(folder => {
      let count = 0;
      if (folder.id === 'all') {
        count = this.voices.length;
      } else if (folder.id === 'f_favorites') {
        count = this.voices.filter(v => !!v.isFavorite).length;
      } else {
        count = this.voices.filter(v => v.folderId === folder.id).length;
      }

      const isSystemFolder = systemFolderIds.has(folder.id);

      // 1. Render Top Carousel Tab
      if (this.folderTabsWrapper) {
        const tab = document.createElement('button');
        tab.className = `folder-tab ${this.activeFolderId === folder.id ? 'active' : ''}`;
        tab.innerHTML = `
          <span>${this.escape(folder.name)}</span>
          <span class="folder-tab-count">(${count})</span>
        `;

        tab.addEventListener('click', () => {
          if (this.isReordering) return;
          this.activeFolderId = folder.id;
          this.renderFolders();
          this.render();
        });

        if (!isSystemFolder) {
          tab.draggable = true;

          tab.addEventListener('dragstart', (e) => {
            this.draggedFolderId = folder.id;
            this.isReordering = true;
            tab.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
          });

          tab.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            tab.classList.add('drag-over');
          });

          tab.addEventListener('dragleave', () => {
            tab.classList.remove('drag-over');
          });

          tab.addEventListener('drop', (e) => {
            e.preventDefault();
            tab.classList.remove('drag-over');
            if (this.draggedFolderId && this.draggedFolderId !== folder.id && !isSystemFolder) {
              const fromIndex = this.folders.findIndex(f => f.id === this.draggedFolderId);
              const toIndex = this.folders.findIndex(f => f.id === folder.id);

              if (fromIndex !== -1 && toIndex !== -1) {
                const [moved] = this.folders.splice(fromIndex, 1);
                this.folders.splice(toIndex, 0, moved);
                this.folders = this.ensureFixedFoldersOrder(this.folders);
                StorageManager.saveFolders(this.folders);
                this.autoSyncDiskFile();
                this.renderFolders();
              }
            }
          });

          tab.addEventListener('dragend', () => {
            tab.classList.remove('dragging');
            this.draggedFolderId = null;
            setTimeout(() => { this.isReordering = false; }, 100);
          });
        }

        this.folderTabsWrapper.appendChild(tab);
      }

      // 2. Render Left Sidebar Folder Item
      if (this.sidebarFolderList) {
        const item = document.createElement('button');
        item.className = `sidebar-folder-item ${this.activeFolderId === folder.id ? 'active' : ''}`;
        
        item.innerHTML = `
          <div class="sidebar-folder-left">
            <span class="sidebar-folder-name">${this.escape(folder.name)}</span>
          </div>
          <span class="sidebar-folder-count">${count}</span>
        `;

        item.addEventListener('click', () => {
          if (this.isReordering) return;
          this.activeFolderId = folder.id;
          this.renderFolders();
          this.render();
        });

        if (!isSystemFolder) {
          item.draggable = true;

          item.addEventListener('dragstart', (e) => {
            this.draggedFolderId = folder.id;
            this.isReordering = true;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
          });

          item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            item.classList.add('drag-over');
          });

          item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
          });

          item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (this.draggedFolderId && this.draggedFolderId !== folder.id && !isSystemFolder) {
              const fromIndex = this.folders.findIndex(f => f.id === this.draggedFolderId);
              const toIndex = this.folders.findIndex(f => f.id === folder.id);

              if (fromIndex !== -1 && toIndex !== -1) {
                const [moved] = this.folders.splice(fromIndex, 1);
                this.folders.splice(toIndex, 0, moved);
                this.folders = this.ensureFixedFoldersOrder(this.folders);
                StorageManager.saveFolders(this.folders);
                this.autoSyncDiskFile();
                this.renderFolders();
              }
            }
          });

          item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            this.draggedFolderId = null;
            setTimeout(() => { this.isReordering = false; }, 100);
          });
        }

        this.sidebarFolderList.appendChild(item);
      }
    });

    // Populate Folder Select in Modal (Excluding system folders 'all', 'f_favorites' and 'f_sueltas')
    if (this.modalFolderSelect) {
      this.modalFolderSelect.innerHTML = '';

      const defaultOpt = document.createElement('option');
      defaultOpt.value = 'f_sueltas';
      defaultOpt.textContent = 'Sin carpeta';
      this.modalFolderSelect.appendChild(defaultOpt);

      this.folders.forEach(folder => {
        if (folder.id === 'all' || folder.id === 'f_favorites' || folder.id === 'f_sueltas') return;
        const opt = document.createElement('option');
        opt.value = folder.id;
        opt.textContent = folder.name;
        this.modalFolderSelect.appendChild(opt);
      });
    }

    // Handle Active Folder Header Actions Bar (Protected for 'all', 'f_favorites' and 'f_sueltas')
    if (this.folderHeaderActions && this.activeFolderNameEl) {
      const currentFolder = this.folders.find(f => f.id === this.activeFolderId);
      if (currentFolder && currentFolder.id !== 'all' && currentFolder.id !== 'f_favorites' && currentFolder.id !== 'f_sueltas') {
        this.activeFolderNameEl.textContent = currentFolder.name;
        this.folderHeaderActions.style.display = 'flex';
      } else {
        this.folderHeaderActions.style.display = 'none';
      }
    }
  }

  showFolderModal() {
    if (this.newFolderNameInput) this.newFolderNameInput.value = '';
    if (this.createFolderModal) this.createFolderModal.style.display = 'flex';
    if (this.newFolderNameInput) this.newFolderNameInput.focus();
  }

  hideFolderModal() {
    if (this.createFolderModal) this.createFolderModal.style.display = 'none';
    if (this.newFolderNameInput) this.newFolderNameInput.value = '';
  }

  showEditFolderModal() {
    const currentFolder = this.folders.find(f => f.id === this.activeFolderId);
    if (!currentFolder || currentFolder.id === 'all' || currentFolder.id === 'f_favorites' || currentFolder.id === 'f_sueltas') return;

    if (this.editFolderNameInput) this.editFolderNameInput.value = currentFolder.name;
    if (this.editFolderModal) this.editFolderModal.style.display = 'flex';
    if (this.editFolderNameInput) this.editFolderNameInput.focus();
  }

  hideEditFolderModal() {
    if (this.editFolderModal) this.editFolderModal.style.display = 'none';
    if (this.editFolderNameInput) this.editFolderNameInput.value = '';
  }

  saveFolderEdits() {
    if (!this.editFolderNameInput) return;
    const newName = this.editFolderNameInput.value.trim();
    if (!newName) return;

    const folder = this.folders.find(f => f.id === this.activeFolderId);
    if (folder) {
      folder.name = newName;
      StorageManager.saveFolders(this.folders);
      this.autoSyncDiskFile();
      this.hideEditFolderModal();
      this.renderFolders();
      this.render();
    }
  }

  deleteActiveFolder() {
    const folder = this.folders.find(f => f.id === this.activeFolderId);
    if (!folder || folder.id === 'all' || folder.id === 'f_favorites' || folder.id === 'f_sueltas') return;

    this.showConfirmDialog(
      'Eliminar Carpeta',
      `¿Eliminar la carpeta "${folder.name}"? Sus voces se moverán a "Voces Sueltas".`,
      () => {
        this.voices.forEach(v => {
          if (v.folderId === folder.id) {
            v.folderId = 'f_sueltas';
          }
        });

        this.folders = this.folders.filter(f => f.id !== folder.id);
        StorageManager.saveFolders(this.folders);
        StorageManager.saveVoices(this.voices);
        this.autoSyncDiskFile();
        
        this.activeFolderId = 'all';
        this.renderFolders();
        this.render();
      }
    );
  }

  showTreeViewModal() {
    if (this.treeSearchInput) this.treeSearchInput.value = '';
    this.renderTreeView();
    if (this.treeViewModal) this.treeViewModal.style.display = 'flex';
  }

  hideTreeViewModal() {
    if (this.treeViewModal) this.treeViewModal.style.display = 'none';
  }

  expandAllTree() {
    if (!this.treeContainer) return;
    const nodes = this.treeContainer.querySelectorAll('.tree-folder-node');
    nodes.forEach(node => node.classList.add('open'));
  }

  collapseAllTree() {
    if (!this.treeContainer) return;
    const nodes = this.treeContainer.querySelectorAll('.tree-folder-node');
    nodes.forEach(node => node.classList.remove('open'));
  }

  renderTreeView() {
    if (!this.treeContainer) return;
    const query = this.treeSearchInput ? this.treeSearchInput.value.toLowerCase().trim() : '';
    this.treeContainer.innerHTML = '';

    const validFolders = this.folders.filter(f => f.id !== 'all');

    validFolders.forEach(folder => {
      const folderVoices = this.voices.filter(v => v.folderId === folder.id);

      const matchingVoices = folderVoices.filter(v => {
        return !query || v.title.toLowerCase().includes(query) || (v.notes && v.notes.toLowerCase().includes(query)) || folder.name.toLowerCase().includes(query);
      });

      if (query && matchingVoices.length === 0) return;

      const node = document.createElement('div');
      node.className = `tree-folder-node ${query ? 'open' : ''}`;

      node.innerHTML = `
        <div class="tree-folder-header">
          <div class="tree-folder-title">
            <span class="tree-arrow-icon">▶</span>
            <span>${this.escape(folder.name)}</span>
          </div>
          <span class="folder-tab-count">${matchingVoices.length} voces</span>
        </div>
        <div class="tree-folder-items"></div>
      `;

      const header = node.querySelector('.tree-folder-header');
      header.addEventListener('click', () => {
        node.classList.toggle('open');
      });

      const itemsContainer = node.querySelector('.tree-folder-items');

      if (matchingVoices.length === 0) {
        itemsContainer.innerHTML = `<div style="padding: 0.45rem; font-size: 0.8rem; color: var(--text-muted);">Sin voces en esta carpeta</div>`;
      } else {
        matchingVoices.forEach(voice => {
          const itemEl = document.createElement('div');
          itemEl.className = 'tree-voice-item';

          const hasValidThumb = voice.coverImage && voice.coverImage.trim() !== '' && !voice.coverImage.startsWith('images/v_') && !voice.coverImage.includes('icon128.png');
          const thumbPlaceholder = `<div class="tree-voice-thumb-placeholder"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg></div>`;
          const thumbHtml = hasValidThumb 
            ? `<img src="${this.escape(voice.coverImage)}" class="tree-voice-thumb" alt="Portada" onerror="this.outerHTML='<div class=\\'tree-voice-thumb-placeholder\\'><svg width=\\'15\\' height=\\'15\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z\\'></path><path d=\\'M19 10v2a7 7 0 0 1-14 0v-2\\'></path></svg></div>';">` 
            : thumbPlaceholder;

          itemEl.innerHTML = `
            <div class="tree-voice-left">
              ${thumbHtml}
              <span class="tree-voice-title">${this.escape(voice.title)}</span>
            </div>
            <div class="tree-voice-actions">
              <button class="btn btn-secondary btn-sm goto-folder-btn" title="Ver esta carpeta en la lista">Ver en Lista</button>
              <button class="btn btn-secondary btn-sm copy-link-btn" title="Copiar enlace">Copiar Enlace</button>
            </div>
          `;

          const gotoBtn = itemEl.querySelector('.goto-folder-btn');
          const copyBtn = itemEl.querySelector('.copy-link-btn');

          gotoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.activeFolderId = folder.id;
            this.hideTreeViewModal();
            this.renderFolders();
            this.render();
          });

          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(voice.url).then(() => {
              copyBtn.textContent = '¡Copiado!';
              setTimeout(() => copyBtn.textContent = 'Copiar Enlace', 1500);
            });
          });

          itemsContainer.appendChild(itemEl);
        });
      }

      this.treeContainer.appendChild(node);
    });

    if (this.treeContainer.children.length === 0) {
      this.treeContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No se encontraron voces o carpetas que coincidan con la búsqueda.</div>`;
    }
  }

  saveNewFolder() {
    if (!this.newFolderNameInput) return;
    const name = this.newFolderNameInput.value.trim();
    if (!name) return;

    const newFolder = {
      id: 'f_' + Date.now(),
      name
    };

    this.folders.push(newFolder);
    StorageManager.saveFolders(this.folders);
    this.autoSyncDiskFile();
    this.activeFolderId = newFolder.id;
    this.hideFolderModal();
    this.renderFolders();
    this.render();
  }

  async linkDiskFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Archivo de Base de Datos JSON',
            accept: { 'application/json': ['.json'] }
          }],
          multiple: false
        });
        this.fileHandle = handle;
        if (this.linkDiskFileBtn) {
          this.linkDiskFileBtn.style.background = '#22c55e';
          this.linkDiskFileBtn.style.borderColor = '#22c55e';
          this.linkDiskFileBtn.title = '¡Archivo voices.json vinculado en tu PC! Se auto-guardará en tiempo real.';
        }
        await this.autoSyncDiskFile();
        alert('¡Archivo voices.json de tu PC vinculado con éxito! Cada cambio se escribirá automáticamente en tu disco duro.');
      } catch (err) {
        if (err.name !== 'AbortError') {
          alert('No se pudo vincular el archivo: ' + err.message);
        }
      }
    } else {
      alert('Tu navegador no admite sincronización directa en tiempo real. Usa los botones de Exportar e Importar.');
    }
  }

  async autoSyncDiskFile() {
    const data = {
      folders: this.folders,
      voices: this.voices
    };

    // 1. Enviar mensaje al background service worker de la extensión para guardado en disco
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ action: 'save_to_disk', data }, (res) => {});
      } catch (e) {}
    }

    // 2. Enviar petición POST directa al servidor local Node.js (sync_server.js)
    try {
      fetch('http://localhost:8080/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}

    // 3. Escritura directa File System Access API si está vinculado
    if (this.fileHandle) {
      try {
        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      } catch (e) {
        console.warn('Error al auto-guardar en disco:', e);
      }
    }
  }

  exportData() {
    const data = {
      folders: this.folders,
      voices: this.voices
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'voices.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json && (json.voices || Array.isArray(json))) {
          this.folders = json.folders || JSON.parse(JSON.stringify(DEFAULT_FOLDERS));
          this.voices = json.voices || json;

          StorageManager.saveFolders(this.folders);
          StorageManager.saveVoices(this.voices);

          this.activeFolderId = 'all';
          this.renderFolders();
          this.render();
          alert('¡Base de datos importada con éxito desde tu PC!');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Carga y recorta la imagen en un cuadrado perfecto (1:1) en Canvas
  processImageFile(fileOrBlob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.loadAndCropSquare(e.target.result);
    };
    reader.readAsDataURL(fileOrBlob);
  }

  loadAndCropSquare(imageSrc) {
    if (!this.cropCanvas) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = this.cropCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = 160;
      canvas.height = 160;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.clearRect(0, 0, 160, 160);
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 160, 160);

      this.currentCroppedImage = canvas.toDataURL('image/png');
      this.cropCanvas.style.display = 'block';
      if (this.imagePlaceholder) this.imagePlaceholder.style.display = 'none';
      if (this.removeImgBtn) this.removeImgBtn.style.display = 'inline-flex';
    };
    img.src = imageSrc;
  }

  clearCroppedImage() {
    this.currentCroppedImage = '';
    if (this.cropCanvas) this.cropCanvas.style.display = 'none';
    if (this.imagePlaceholder) this.imagePlaceholder.style.display = 'flex';
    if (this.removeImgBtn) this.removeImgBtn.style.display = 'none';
    if (this.modalFileInput) this.modalFileInput.value = '';
  }

  openNewTab() {
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'open_tab' }, (response) => {
        if (!response || !response.success) {
          window.open(window.location.href, '_blank');
        }
      });
    } else {
      window.open(window.location.href, '_blank');
    }
  }

  showModal() {
    this.editingVoiceId = null;
    if (this.modalTitle) this.modalTitle.textContent = 'Agregar Nueva Voz';
    if (this.modalTitleInput) this.modalTitleInput.value = '';
    if (this.modalUrlInput) this.modalUrlInput.value = '';
    if (this.modalNotesInput) this.modalNotesInput.value = '';
    
    if (this.modalFolderSelect && this.activeFolderId !== 'all') {
      this.modalFolderSelect.value = this.activeFolderId;
    }

    this.clearCroppedImage();
    if (this.addModal) this.addModal.style.display = 'flex';
    if (this.modalTitleInput) this.modalTitleInput.focus();
  }

  showEditModal(voice) {
    this.editingVoiceId = voice.id;
    if (this.modalTitle) this.modalTitle.textContent = 'Editar Voz';
    if (this.modalTitleInput) this.modalTitleInput.value = voice.title;
    if (this.modalUrlInput) this.modalUrlInput.value = voice.url;
    if (this.modalNotesInput) this.modalNotesInput.value = voice.notes || '';
    if (this.modalFolderSelect && voice.folderId) {
      this.modalFolderSelect.value = voice.folderId;
    }
    
    if (voice.coverImage) {
      this.loadAndCropSquare(voice.coverImage);
    } else {
      this.clearCroppedImage();
    }

    if (this.addModal) this.addModal.style.display = 'flex';
    if (this.modalTitleInput) this.modalTitleInput.focus();
  }

  hideModal() {
    if (this.addModal) this.addModal.style.display = 'none';
    this.editingVoiceId = null;
    if (this.modalTitleInput) this.modalTitleInput.value = '';
    if (this.modalUrlInput) this.modalUrlInput.value = '';
    if (this.modalNotesInput) this.modalNotesInput.value = '';
    this.clearCroppedImage();
  }

  async fetchFishAudioInfo(modelId) {
    // 1. Intento por Background Service Worker de Chrome (Rápido y sin problemas de CORS)
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'resolve_fish_audio', modelId }, (res) => resolve(res));
        });
        if (response && response.success && response.data) {
          const data = response.data;
          const sample = data.samples && data.samples.length > 0 ? data.samples[0].audio : null;
          const cover = data.cover_image ? `https://public-platform.r2.fish.audio/${data.cover_image}` : '';
          return { title: data.title, sampleAudio: sample, coverImage: cover };
        }
      } catch (e) {
        console.warn('Background fetch error:', e);
      }
    }

    // 3. Intento directo por API pública
    try {
      const res = await fetch(`https://api.fish.audio/model/${modelId}`);
      if (res.ok) {
        const data = await res.json();
        const sample = data.samples && data.samples.length > 0 ? data.samples[0].audio : null;
        const cover = data.cover_image ? `https://public-platform.r2.fish.audio/${data.cover_image}` : '';
        return { title: data.title, sampleAudio: sample, coverImage: cover };
      }
    } catch (err) {
      console.warn('Direct fetch error:', err);
    }

    return null;
  }

  async saveVoiceFromModal() {
    let title = this.modalTitleInput ? this.modalTitleInput.value.trim() : '';
    const url = this.modalUrlInput ? this.modalUrlInput.value.trim() : '';
    const folderId = this.modalFolderSelect ? this.modalFolderSelect.value || 'f_sueltas' : 'f_sueltas';
    const notes = this.modalNotesInput ? this.modalNotesInput.value.trim() : '';

    if (!url) return;

    let audioUrl = url;
    let coverImage = this.currentCroppedImage;

    // Detectar enlace de modelo Fish Audio (soporta URLs con idioma /es/m/ o /m/)
    const match = url.match(/fish\.audio\/(?:[a-z]{2}\/)?m\/([a-f0-9]{32})/i) || url.match(/m\/([a-f0-9]{32})/i);
    if (match) {
      const modelId = match[1];
      const info = await this.fetchFishAudioInfo(modelId);
      if (info) {
        if (!title && info.title) title = info.title;
        if (info.sampleAudio) audioUrl = info.sampleAudio;
      }
    }

    if (!title) title = 'Voz Fish Audio';

    if (this.editingVoiceId) {
      const index = this.voices.findIndex(v => v.id === this.editingVoiceId);
      if (index !== -1) {
        const oldVoice = this.voices[index];
        const oldBase = this.parseVoiceVersion(oldVoice.title).baseName.toLowerCase();
        const newBase = this.parseVoiceVersion(title).baseName.toLowerCase();

        this.voices[index].title = title;
        this.voices[index].url = url;
        this.voices[index].audioUrl = audioUrl;
        this.voices[index].coverImage = coverImage;
        this.voices[index].folderId = folderId;
        this.voices[index].notes = notes;

        // Mover automáticamente todas las demás versiones del grupo a la misma carpeta
        this.voices.forEach((v, i) => {
          if (i !== index) {
            const vBase = this.parseVoiceVersion(v.title).baseName.toLowerCase();
            if (vBase === oldBase || vBase === newBase) {
              v.folderId = folderId;
            }
          }
        });
        
        if (this.currentPlayingId === this.editingVoiceId) {
          this.pauseAudio(this.editingVoiceId);
        }
        this.audioPlayers.delete(this.editingVoiceId);
      }
    } else {
      const newBase = this.parseVoiceVersion(title).baseName.toLowerCase();
      let finalFolderId = folderId;

      // Si se agrega una nueva versión, asociarla a la carpeta donde ya está la voz base
      const existingSibling = this.voices.find(v => this.parseVoiceVersion(v.title).baseName.toLowerCase() === newBase);
      if (existingSibling) {
        if (folderId === 'f_sueltas' && existingSibling.folderId !== 'f_sueltas') {
          finalFolderId = existingSibling.folderId;
        }
      }

      const item = {
        id: 'v_' + Date.now(),
        title,
        url,
        audioUrl,
        coverImage,
        folderId: finalFolderId,
        notes
      };
      this.voices.unshift(item);

      // Si se eligió una carpeta específica en el modal, actualizar a todas las versiones existentes
      if (existingSibling && folderId !== 'f_sueltas') {
        this.voices.forEach(v => {
          if (this.parseVoiceVersion(v.title).baseName.toLowerCase() === newBase) {
            v.folderId = folderId;
          }
        });
      }
    }

    StorageManager.saveVoices(this.voices);
    this.autoSyncDiskFile();
    this.hideModal();
    this.renderFolders();
    this.render();
  }

  showConfirmDialog(title, message, onConfirm) {
    if (!this.confirmModal) return;
    if (this.confirmModalTitle) this.confirmModalTitle.textContent = title || 'Confirmar Acción';
    if (this.confirmModalText) this.confirmModalText.textContent = message || '¿Estás seguro de continuar?';
    this.onConfirmCallback = onConfirm;
    this.confirmModal.style.display = 'flex';
  }

  hideConfirmDialog() {
    if (this.confirmModal) this.confirmModal.style.display = 'none';
    this.onConfirmCallback = null;
  }

  deleteVoice(id) {
    const voice = this.voices.find(v => v.id === id);
    const title = voice ? voice.title : 'esta voz';

    this.showConfirmDialog(
      'Eliminar Voz',
      `¿Estás seguro de que deseas eliminar "${title}"?`,
      () => {
        if (this.currentPlayingId === id) {
          this.pauseAudio(id);
        }
        this.audioPlayers.delete(id);
        this.voices = this.voices.filter(v => v.id !== id);
        StorageManager.saveVoices(this.voices);
        this.autoSyncDiskFile();
        this.renderFolders();
        this.render();
      }
    );
  }

  changeVoiceFolder(voiceId, newFolderId) {
    const voice = this.voices.find(v => v.id === voiceId);
    if (voice) {
      const { baseName } = this.parseVoiceVersion(voice.title);
      const baseKey = baseName.toLowerCase();

      this.voices.forEach(v => {
        if (v.id === voiceId || (v.title && this.parseVoiceVersion(v.title).baseName.toLowerCase() === baseKey)) {
          v.folderId = newFolderId;
        }
      });

      StorageManager.saveVoices(this.voices);
      this.autoSyncDiskFile();
      this.renderFolders();
      this.render();
    }
  }

  showSettingsModal() {
    if (!this.settingsModal) return;
    this.settingsModal.style.display = 'flex';
    if (this.toggleQuickFolderBadge) {
      this.toggleQuickFolderBadge.checked = !!this.settings.showQuickFolderBadge;
    }
    if (this.toggleSidebarFolders) {
      this.toggleSidebarFolders.checked = this.settings.showSidebarFolders !== false;
    }
    if (this.toggleShowVoiceNotes) {
      this.toggleShowVoiceNotes.checked = this.settings.showVoiceNotes !== false;
    }
  }

  hideSettingsModal() {
    if (this.settingsModal) this.settingsModal.style.display = 'none';
  }

  saveSettingsFromModal() {
    this.settings.showQuickFolderBadge = this.toggleQuickFolderBadge ? this.toggleQuickFolderBadge.checked : false;
    this.settings.showSidebarFolders = this.toggleSidebarFolders ? this.toggleSidebarFolders.checked : true;
    this.settings.showVoiceNotes = this.toggleShowVoiceNotes ? this.toggleShowVoiceNotes.checked : true;

    StorageManager.saveSettings(this.settings);
    this.applySettings();
    this.hideSettingsModal();
    this.render();
  }

  applySettings() {
    const sidebar = document.getElementById('sidebarFolders');
    const folderSec = document.querySelector('.folder-section');

    const show = this.settings.showSidebarFolders !== false;
    if (sidebar) sidebar.style.display = show ? '' : 'none';
    if (folderSec) folderSec.style.display = show ? '' : 'none';
  }

  setMultiSelectMode(active) {
    this.isMultiSelectActive = active;
    if (this.toggleMultiSelectBtn) {
      this.toggleMultiSelectBtn.classList.toggle('active', active);
    }
    if (this.toggleMultiSelectMode) {
      this.toggleMultiSelectMode.checked = active;
    }
    if (!active) {
      this.selectedVoiceIds.clear();
    }
    this.updateBatchBarUI();
    this.render();
  }

  updateBatchBarUI() {
    if (!this.batchActionBar) return;
    if (this.isMultiSelectActive) {
      this.batchActionBar.style.display = 'flex';
      if (this.batchCountText) {
        this.batchCountText.textContent = `${this.selectedVoiceIds.size} seleccionadas`;
      }
      if (this.batchFolderSelect) {
        this.batchFolderSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = 'f_sueltas';
        defaultOpt.textContent = 'Voces Sueltas';
        this.batchFolderSelect.appendChild(defaultOpt);

        this.folders.forEach(f => {
          if (f.id !== 'all' && f.id !== 'f_favorites' && f.id !== 'f_sueltas') {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            this.batchFolderSelect.appendChild(opt);
          }
        });
      }
    } else {
      this.batchActionBar.style.display = 'none';
    }
  }

  toggleSelectAllBatch() {
    const query = this.searchInput ? this.searchInput.value.toLowerCase() : '';
    const filtered = this.voices.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(query);
      let matchesFolder = false;
      if (this.activeFolderId === 'all') matchesFolder = true;
      else if (this.activeFolderId === 'f_favorites') matchesFolder = !!v.isFavorite;
      else matchesFolder = v.folderId === this.activeFolderId;
      return matchesSearch && matchesFolder;
    });

    const allFilteredSelected = filtered.length > 0 && filtered.every(v => this.selectedVoiceIds.has(v.id));

    if (allFilteredSelected) {
      filtered.forEach(v => this.selectedVoiceIds.delete(v.id));
    } else {
      filtered.forEach(v => this.selectedVoiceIds.add(v.id));
    }

    this.updateBatchBarUI();
    this.render();
  }

  applyBatchMove() {
    if (this.selectedVoiceIds.size === 0) return;
    const targetFolderId = this.batchFolderSelect ? this.batchFolderSelect.value : 'f_sueltas';

    this.selectedVoiceIds.forEach(id => {
      const v = this.voices.find(voice => voice.id === id);
      if (v) v.folderId = targetFolderId;
    });

    StorageManager.saveVoices(this.voices);
    this.autoSyncDiskFile();
    this.selectedVoiceIds.clear();
    this.renderFolders();
    this.render();
    this.updateBatchBarUI();
  }


  parseVoiceVersion(title) {
    if (!title) return { baseName: 'Voz Sin Nombre', versionTag: 'V1' };
    let cleaned = title.trim();

    // Normalizar artículos iniciales para agrupar "El Narrador" con "Narrador v2"
    let withoutArticle = cleaned.replace(/^(el|la|los|las)\s+/i, '');

    // Coincidencia con v2, v3, v.2, version 2, versión 2, - v2, _v2, etc.
    const vRegex = /^(.*?)(?:\s+|-|_|\()(?:v|v\.|version|versión)\s*(\d+)\)?$/i;
    const vMatch = withoutArticle.match(vRegex);
    if (vMatch && vMatch[1].trim().length > 0) {
      return {
        baseName: vMatch[1].trim(),
        versionTag: 'V' + vMatch[2]
      };
    }

    // Coincidencia con paréntesis como "Kinger (Español Latino)" -> Base: "Kinger"
    const parenRegex = /^(.*?)\s*\((.*?)\)$/;
    const parenMatch = withoutArticle.match(parenRegex);
    if (parenMatch && parenMatch[1].trim().length > 0) {
      return {
        baseName: parenMatch[1].trim(),
        versionTag: parenMatch[2].trim()
      };
    }

    return {
      baseName: withoutArticle,
      versionTag: 'V1'
    };
  }

  groupFilteredVoices(filtered) {
    const groupsMap = new Map();

    filtered.forEach(voice => {
      const { baseName, versionTag } = this.parseVoiceVersion(voice.title);
      const key = baseName.toLowerCase();

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          baseName: baseName,
          voices: []
        });
      }

      groupsMap.get(key).voices.push({
        ...voice,
        versionTag: versionTag
      });
    });

    const groups = Array.from(groupsMap.values());

    groups.sort((a, b) => {
      const getMaxId = (g) => Math.max(...g.voices.map(v => parseInt(String(v.id).replace(/\D/g, '')) || 0));
      const maxA = getMaxId(a);
      const maxB = getMaxId(b);
      return this.sortOrder === 'desc' ? maxB - maxA : maxA - maxB;
    });

    return groups;
  }

  render() {
    if (!this.voicesList) return;
    const query = this.searchInput ? this.searchInput.value.toLowerCase() : '';

    let filtered = this.voices.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(query) || (v.notes && v.notes.toLowerCase().includes(query));
      let matchesFolder = false;
      if (this.activeFolderId === 'all') {
        matchesFolder = true;
      } else if (this.activeFolderId === 'f_favorites') {
        matchesFolder = !!v.isFavorite;
      } else {
        matchesFolder = v.folderId === this.activeFolderId;
      }
      return matchesSearch && matchesFolder;
    });

    const groups = this.groupFilteredVoices(filtered);

    if (this.totalCountEl) {
      this.totalCountEl.textContent = `${filtered.length} voces`;
    }

    if (groups.length === 0) {
      this.voicesList.innerHTML = '';
      if (this.emptyState) this.emptyState.style.display = 'block';
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';
    this.voicesList.innerHTML = '';

    groups.forEach(group => {
      if (group.voices.length === 1) {
        const el = this.createCardElement(group.voices[0]);
        this.voicesList.appendChild(el);
      } else {
        const el = this.createGroupCard(group);
        this.voicesList.appendChild(el);
      }
    });
  }

  createCard(voice) {
    return this.createCardElement(voice);
  }

  createGroupCard(group) {
    const groupVoices = group.voices;
    groupVoices.sort((a, b) => {
      const numA = parseInt(a.versionTag.replace(/\D/g, '')) || 1;
      const numB = parseInt(b.versionTag.replace(/\D/g, '')) || 1;
      return numA - numB;
    });

    const mainVoice = groupVoices[0];
    const subVoices = groupVoices.slice(1);

    const container = document.createElement('div');
    container.className = 'voice-item-group-container';

    const mainCard = this.createCardElement(mainVoice, {
      isGroupHeader: true,
      baseName: group.baseName,
      subCount: groupVoices.length
    });

    container.appendChild(mainCard);

    const subContainer = document.createElement('div');
    subContainer.className = 'group-versions-panel';
    subContainer.style.display = 'none';

    subVoices.forEach(subVoice => {
      const subCard = this.createCardElement(subVoice, {
        isSubVersion: true
      });
      subContainer.appendChild(subCard);
    });

    container.appendChild(subContainer);

    const toggleBtn = mainCard.querySelector('.expand-group-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = subContainer.style.display !== 'none' && !subContainer.classList.contains('collapsing');

        if (isExpanded) {
          toggleBtn.classList.remove('expanded');
          toggleBtn.setAttribute('title', `Desplegar otras versiones (${groupVoices.length} versiones)`);
          subContainer.classList.add('collapsing');
          setTimeout(() => {
            subContainer.style.display = 'none';
            subContainer.classList.remove('collapsing');
          }, 290);
        } else {
          subContainer.style.display = 'flex';
          subContainer.classList.remove('collapsing');
          toggleBtn.classList.add('expanded');
          toggleBtn.setAttribute('title', 'Ocultar versiones');
        }
      });
    }

    return container;
  }

  createCardElement(voice, options = {}) {
    const isSelected = this.selectedVoiceIds.has(voice.id);
    const item = document.createElement('div');
    item.className = options.isSubVersion 
      ? `voice-item sub-version-item ${isSelected ? 'selected' : ''}`
      : `voice-item ${isSelected ? 'selected' : ''}`;
    item.dataset.id = voice.id;

    let checkboxHtml = '';
    if (this.isMultiSelectActive) {
      checkboxHtml = `
        <div class="card-checkbox-wrapper">
          <input type="checkbox" class="card-checkbox" ${isSelected ? 'checked' : ''}>
        </div>
      `;
    }

    const isPlaying = this.currentPlayingId === voice.id;

    const hasValidCover = voice.coverImage && voice.coverImage.trim() !== '' && !voice.coverImage.startsWith('images/v_') && !voice.coverImage.includes('icon128.png');
    const svgPlaceholder = `<div class="voice-cover-large-placeholder"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg></div>`;
    const coverHtml = hasValidCover 
      ? `<img src="${this.escape(voice.coverImage)}" class="voice-cover-large" alt="Portada" onerror="this.parentElement.innerHTML='<div class=\\'voice-cover-large-placeholder\\'><svg width=\\'44\\' height=\\'44\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.6\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z\\'></path><path d=\\'M19 10v2a7 7 0 0 1-14 0v-2\\'></path><line x1=\\'12\\' y1=\\'19\\' x2=\\'12\\' y2=\\'22\\'></line><line x1=\\'8\\' y1=\\'22\\' x2=\\'16\\' y2=\\'22\\'></line></svg></div>';">`
      : svgPlaceholder;

    let toggleBtnHtml = '';
    if (options.isGroupHeader) {
      toggleBtnHtml = `
        <button class="expand-group-btn" title="Desplegar otras versiones (${options.subCount} versiones)">
          <span class="version-count-badge">${options.subCount} vers.</span>
          <svg class="chevron-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      `;
    }

    const titleText = options.isGroupHeader ? options.baseName : voice.title;

    let folderSelectHtml = '';
    if (this.settings.showQuickFolderBadge) {
      let folderOptionsHtml = `
        <option value="f_sueltas" ${(voice.folderId === 'f_sueltas' || !voice.folderId) ? 'selected' : ''}>Voces Sueltas</option>
      `;

      this.folders.forEach(f => {
        if (f.id !== 'all' && f.id !== 'f_favorites' && f.id !== 'f_sueltas') {
          folderOptionsHtml += `
            <option value="${f.id}" ${voice.folderId === f.id ? 'selected' : ''}>${this.escape(f.name)}</option>
          `;
        }
      });

      const currentFolderName = (this.folders.find(f => f.id === voice.folderId) || { name: 'Voces Sueltas' }).name;

      folderSelectHtml = `
        <div class="quick-folder-badge" title="Mover a otra carpeta rápidamente">
          <svg class="folder-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="quick-folder-label">${this.escape(currentFolderName)}</span>
          <svg class="chevron-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <select class="quick-folder-select">
            ${folderOptionsHtml}
          </select>
        </div>
      `;
    }

    item.innerHTML = `
      ${checkboxHtml}
      <div class="voice-cover-side">
        ${coverHtml}
      </div>

      <div class="voice-content-side">
        <div class="voice-item-header">
          <span class="voice-item-title">${this.escape(titleText)}</span>
          <div class="header-btns-right">
            ${folderSelectHtml}
            <button class="icon-fav-btn ${voice.isFavorite ? 'active' : ''}" title="${voice.isFavorite ? 'Quitar de Favoritas' : 'Marcar como Favorita'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${voice.isFavorite ? '#ffc107' : 'none'}" stroke="${voice.isFavorite ? '#ffc107' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <button class="icon-edit-btn edit-btn" title="Editar esta voz">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${toggleBtnHtml}
          </div>
        </div>

        ${(this.settings.showVoiceNotes !== false && voice.notes && voice.notes.trim() !== '') ? `
          <div class="voice-notes-box">
            <svg class="notes-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span class="notes-text">${this.escape(voice.notes)}</span>
          </div>
        ` : ''}

        <div class="player-row">
          <button class="play-toggle-btn" title="${isPlaying ? 'Pausar' : 'Reproducir'}">
            ${isPlaying ? '❚❚' : '▶'}
          </button>
          <div class="timeline">
            <span class="time-str cur-time">0:00</span>
            <input type="range" class="seek-bar" value="0" min="0" max="100">
            <span class="time-str dur-time">0:00</span>
          </div>
        </div>

        <div class="item-actions">
          <div class="left-actions">
            <button class="action-link copy-btn">Copiar Enlace</button>
            <a href="${this.escape(voice.url)}" target="_blank" rel="noopener noreferrer" class="action-link open-url-btn">Ir al Enlace</a>
          </div>
          <button class="action-link danger del-btn">Eliminar</button>
        </div>
      </div>
    `;

    this.bindCardControls(item, voice);
    return item;
  }

  bindCardControls(item, voice) {
    const playBtn = item.querySelector('.play-toggle-btn');
    const seekBar = item.querySelector('.seek-bar');
    const curTimeEl = item.querySelector('.cur-time');
    const durTimeEl = item.querySelector('.dur-time');
    const copyBtn = item.querySelector('.copy-btn');
    const editBtn = item.querySelector('.edit-btn');
    const delBtn = item.querySelector('.del-btn');
    const favBtn = item.querySelector('.icon-fav-btn');
    const cardCheckbox = item.querySelector('.card-checkbox');

    if (cardCheckbox) {
      cardCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
          this.selectedVoiceIds.add(voice.id);
          item.classList.add('selected');
        } else {
          this.selectedVoiceIds.delete(voice.id);
          item.classList.remove('selected');
        }
        this.updateBatchBarUI();
      });
    }

    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(voice.id);
      });
    }

    const folderSelect = item.querySelector('.quick-folder-select');
    if (folderSelect) {
      folderSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        this.changeVoiceFolder(voice.id, e.target.value);
      });
      folderSelect.addEventListener('click', (e) => e.stopPropagation());
    }

    const streamSource = (voice.audioUrl && (voice.audioUrl.startsWith('http') || voice.audioUrl.startsWith('data:audio'))) ? voice.audioUrl : '';

    let audio = this.audioPlayers.get(voice.id);
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto'; // Precargar buffer completo en memoria RAM
      if (streamSource) {
        audio.src = streamSource;
      }
      this.audioPlayers.set(voice.id, audio);
    }

    audio.onloadedmetadata = () => {
      durTimeEl.textContent = this.formatTime(audio.duration);
    };

    audio.oncanplaythrough = () => {
      if (audio.duration) {
        durTimeEl.textContent = this.formatTime(audio.duration);
      }
    };

    audio.onplaying = () => {
      if (this.currentPlayingId === voice.id && curTimeEl.textContent === 'Cargando...') {
        curTimeEl.textContent = this.formatTime(audio.currentTime);
      }
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        curTimeEl.textContent = this.formatTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      this.stopSmoothProgressLoop();
      this.currentPlayingId = null;
      playBtn.textContent = '▶';
      seekBar.value = 0;
      seekBar.style.background = '#262626';
      curTimeEl.textContent = '0:00';
    };

    audio.onerror = () => {
      this.stopSmoothProgressLoop();
      if (this.currentPlayingId === voice.id) {
        curTimeEl.textContent = 'Cargando...';
        const match = voice.url.match(/m\/([a-zA-Z0-9_]+)/i) || voice.url.match(/([a-f0-9]{12,32})/i);
        if (match) {
          this.fetchFishAudioInfo(match[1]).then(info => {
            if (info && info.sampleAudio) {
              voice.audioUrl = info.sampleAudio;
              audio.src = info.sampleAudio;
              audio.load();
              StorageManager.saveVoices(this.voices);
              this.autoSyncDiskFile();
              audio.play().then(() => {
                playBtn.textContent = '❚❚';
                this.startSmoothProgressLoop(voice.id);
              }).catch(() => {
                curTimeEl.textContent = 'Error';
                this.currentPlayingId = null;
                playBtn.textContent = '▶';
              });
            } else {
              curTimeEl.textContent = 'Error';
              this.currentPlayingId = null;
              playBtn.textContent = '▶';
            }
          });
        } else {
          curTimeEl.textContent = 'Error';
          this.currentPlayingId = null;
          playBtn.textContent = '▶';
        }
      }
    };

    playBtn.addEventListener('click', () => {
      if (this.currentPlayingId === voice.id && !audio.paused) {
        this.pauseAudio(voice.id);
      } else {
        this.playAudio(voice.id);
      }
    });

    seekBar.addEventListener('input', (e) => {
      if (audio.duration) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
        const percent = (audio.currentTime / audio.duration) * 100;
        seekBar.style.background = `linear-gradient(to right, #ffffff ${percent}%, #262626 ${percent}%)`;
      }
    });

    editBtn.addEventListener('click', () => this.showEditModal(voice));

    delBtn.addEventListener('click', () => this.deleteVoice(voice.id));

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(voice.url).then(() => {
        copyBtn.textContent = '¡Copiado!';
        setTimeout(() => copyBtn.textContent = 'Copiar Enlace', 1500);
      });
    });
  }

  stopOtherAudios(keepId = null) {
    this.audioPlayers.forEach((audioPlayer, playerVoiceId) => {
      if (playerVoiceId !== keepId) {
        audioPlayer.pause();
        const otherCard = document.querySelector(`.voice-item[data-id="${playerVoiceId}"]`);
        if (otherCard) {
          const otherBtn = otherCard.querySelector('.play-toggle-btn');
          if (otherBtn) otherBtn.textContent = '▶';
        }
      }
    });
    if (keepId === null || this.currentPlayingId !== keepId) {
      this.stopSmoothProgressLoop();
    }
  }

  async playAudio(id) {
    const audio = this.audioPlayers.get(id);
    const voice = this.voices.find(v => v.id === id);
    if (!audio || !voice) return;

    // Detener de inmediato cualquier otro audio activo antes de iniciar el nuevo
    this.stopOtherAudios(id);
    this.currentPlayingId = id;

    const card = document.querySelector(`.voice-item[data-id="${id}"]`);
    const btn = card ? card.querySelector('.play-toggle-btn') : null;
    const curTimeEl = card ? card.querySelector('.cur-time') : null;

    if (btn) btn.textContent = '...';

    const match = voice.url.match(/m\/([a-zA-Z0-9_]+)/i) || voice.url.match(/([a-f0-9]{12,32})/i);

    if (!audio.src && match) {
      if (curTimeEl) curTimeEl.textContent = 'Cargando...';
      const info = await this.fetchFishAudioInfo(match[1]);
      if (this.currentPlayingId !== id) return;
      if (info && info.sampleAudio) {
        voice.audioUrl = info.sampleAudio;
        audio.src = info.sampleAudio;
        audio.load();
        StorageManager.saveVoices(this.voices);
      }
    }

    try {
      if (this.currentPlayingId !== id) return;
      this.stopOtherAudios(id);
      await audio.play();
      if (this.currentPlayingId !== id) {
        audio.pause();
        return;
      }
      this.startSmoothProgressLoop(id);
      if (btn) btn.textContent = '❚❚';
      if (curTimeEl && curTimeEl.textContent === 'Cargando...') {
        curTimeEl.textContent = this.formatTime(audio.currentTime);
      }
    } catch (e) {
      console.warn('Initial play error, attempting fresh signed URL fetch:', e);
      if (match) {
        if (curTimeEl) curTimeEl.textContent = 'Cargando...';
        const freshInfo = await this.fetchFishAudioInfo(match[1]);
        if (this.currentPlayingId !== id) return;
        if (freshInfo && freshInfo.sampleAudio) {
          voice.audioUrl = freshInfo.sampleAudio;
          audio.src = freshInfo.sampleAudio;
          audio.load();
          StorageManager.saveVoices(this.voices);
          this.autoSyncDiskFile();

          try {
            if (this.currentPlayingId !== id) return;
            this.stopOtherAudios(id);
            await audio.play();
            if (this.currentPlayingId !== id) {
              audio.pause();
              return;
            }
            this.startSmoothProgressLoop(id);
            if (btn) btn.textContent = '❚❚';
            return;
          } catch (err2) {
            console.error('Playback retry failed:', err2);
          }
        }
      }

      if (this.currentPlayingId === id) {
        this.currentPlayingId = null;
        if (btn) btn.textContent = '▶';
        if (curTimeEl) curTimeEl.textContent = 'Error';
      }
    }
  }

  pauseAudio(id) {
    const audio = this.audioPlayers.get(id);
    if (audio) audio.pause();
    this.stopSmoothProgressLoop();
    if (this.currentPlayingId === id) this.currentPlayingId = null;
    
    const card = document.querySelector(`.voice-item[data-id="${id}"]`);
    if (card) {
      const btn = card.querySelector('.play-toggle-btn');
      if (btn) btn.textContent = '▶';
    }
  }

  toggleFavorite(voiceId) {
    const voice = this.voices.find(v => v.id === voiceId);
    if (!voice) return;

    const baseName = this.parseVoiceVersion(voice.title).baseName.toLowerCase();
    const newFavState = !voice.isFavorite;

    this.voices.forEach(v => {
      if (this.parseVoiceVersion(v.title).baseName.toLowerCase() === baseName) {
        v.isFavorite = newFavState;
      }
    });

    StorageManager.saveVoices(this.voices);
    this.autoSyncDiskFile();
    this.renderFolders();
    this.render();
  }

  startSmoothProgressLoop(id) {
    this.stopSmoothProgressLoop();

    const update = () => {
      if (this.currentPlayingId === id) {
        const audio = this.audioPlayers.get(id);
        const card = document.querySelector(`.voice-item[data-id="${id}"]`);
        
        if (audio && card && audio.duration && !audio.paused) {
          const seekBar = card.querySelector('.seek-bar');
          const curTimeEl = card.querySelector('.cur-time');
          
          const percent = (audio.currentTime / audio.duration) * 100;
          if (seekBar) {
            seekBar.value = percent;
            seekBar.style.background = `linear-gradient(to right, #ffffff ${percent}%, #262626 ${percent}%)`;
          }
          if (curTimeEl) {
            curTimeEl.textContent = this.formatTime(audio.currentTime);
          }
          this.animFrameId = requestAnimationFrame(update);
          return;
        }
      }
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  stopSmoothProgressLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  escape(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
