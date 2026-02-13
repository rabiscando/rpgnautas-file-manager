# RPGNautas File Manager

![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v12%20--%20v13-orange)
![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive file management module for Foundry VTT that provides automatic WebP conversion, link repair, and file protection features.

## ✨ Features

### 🖼️ Automatic WebP Conversion

- **On Upload**: Automatically converts PNG/JPG images to WebP format when uploading
- **Mass Conversion**: Batch convert all existing images in your world to WebP
- **Smart Detection**: Skips SVG files and already-converted WebP images
- **Space Saving**: Reduces file sizes by up to 70% without quality loss

### 🔗 Link Repair System

- **Broken Link Detection**: Scans your entire world for broken file references
- **Automatic Repair**: Fixes broken links by finding and updating to correct paths
- **Deep Scan**: Searches through actors, items, scenes, journal entries, and more
- **HTML Content**: Repairs links even within rich text HTML content

### 🛡️ File Protection

- **Usage Detection**: Prevents deletion of files that are actively used in your world
- **Safety Dialog**: Shows where a file is being used before allowing deletion
- **Cross-Reference Check**: Scans all document types for file usage

### 📊 World Indexing

- **Automatic Scanning**: Indexes all file usage on world startup
- **Manual Rescan**: Update the index on demand
- **Performance**: Fast indexing with minimal impact on world loading

## 📋 Requirements

- **Foundry VTT**: Version 12 or higher (tested up to v13)
- **Dependencies**: [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper) (required)

## 🚀 Installation

### Method 1: Manifest URL (Recommended)

1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/rabiscando/rpgnautas-file-manager/main/module.json
   ```
4. Click **Install**

### Method 2: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/rabiscando/rpgnautas-file-manager/releases)
2. Extract the ZIP file to your Foundry VTT `Data/modules` folder
3. Restart Foundry VTT
4. Enable the module in your world settings

## 🎮 Usage

### Initial Setup

1. Enable the module in your world settings
2. Make sure **lib-wrapper** is also enabled
3. The module will automatically start indexing your world files

### Accessing the Module

1. As a **Game Master**, go to **Game Settings** → **Configure Settings**
2. Click on **Module Settings**
3. Find **RPGNautas File Manager** and click the configuration button

### Features Guide

#### 🔧 Repair Links

Fixes broken file references throughout your world.

1. Click **"Reparar Links"** (Repair Links)
2. Confirm the action
3. Wait for the process to complete
4. Check the notification for the number of links repaired

#### 🔄 Rescan Index

Updates the file usage index.

1. Click **"Reescanear"** (Rescan)
2. The module will scan all documents in your world
3. A notification will confirm when complete

#### 🎨 Mass Convert to WebP

Converts all PNG/JPG images to WebP format.

1. Click **"Converter"** (Convert)
2. Confirm the action
3. Monitor the progress bar
4. All images will be converted and links updated automatically

> **⚠️ Important**: Always backup your world before running mass conversion!

## 🌍 Supported Languages

- 🇺🇸 English
- 🇧🇷 Português (Brasil)

## 🔧 Technical Details

### File Structure

```
rpgnautas-file-manager/
├── data/                    # Index storage
├── languages/              # Localization files
│   ├── en.json
│   └── pt-BR.json
├── scripts/                # Module logic
│   ├── api.js             # Public API
│   ├── indexer.js         # File indexing & operations
│   ├── main.js            # Module initialization
│   └── utils.js           # Utility functions
├── styles/                 # CSS styles
│   └── module.css
├── templates/              # HTML templates
│   └── index-config.html
└── module.json            # Module manifest
```

### API Access

The module exposes a public API for macro usage:

```javascript
// Access the API
const api = game.modules.get("rpgnautas-file-manager").api;

// Index the world
await api.WorldIndexer.indexWorld();

// Repair broken links
const count = await api.WorldIndexer.repairBrokenLinks();

// Check if files are in use
const result = await api.FileManagerAPI.checkFiles(["path/to/file.png"]);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Changelog

### Version 2.1.0

- ✅ Removed file deletion features (not supported by Foundry VTT API)
- ✅ Enhanced file protection system
- ✅ Improved link repair functionality
- ✅ Added comprehensive error handling

### Version 2.0.6

- ✅ Initial standalone release
- ✅ Automatic WebP conversion on upload
- ✅ Mass conversion feature
- ✅ Link repair system
- ✅ File protection

## 🐛 Known Issues

- File deletion is not supported due to Foundry VTT security restrictions
- Large worlds may take longer to index (this is normal)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**RPGNautas**

- Website: [https://rpgnautas.com.br](https://rpgnautas.com.br)

## 🙏 Acknowledgments

- Thanks to the Foundry VTT community for their support
- lib-wrapper by ruipin for making module compatibility easier
- All contributors who have helped improve this module

## 💬 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/rabiscando/rpgnautas-file-manager/issues) page
2. Create a new issue if your problem isn't already listed
3. Visit [RPGNautas](https://rpgnautas.com.br) for more resources

---

**Made with ❤️ by RPGNautas**
