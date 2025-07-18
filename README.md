# Trello Card Creator Chrome Extension

A chrome extension that allows you to quickly create Trello cards from any website with just one click. Perfect for saving interesting articles, research, or any web content directly to your Trello boards.

## ✨ Features

- 🚀 **One-click card creation** from any website
- 📋 **Auto-fill card title** with page title
- 🔗 **Include page URL** automatically in card description
- ✂️ **Capture selected text** and add it to the card
- 🎯 **Default board/list selection** for quick workflow
- ⚡ **Keyboard shortcuts** for power users
- 🎨 **Clean, modern interface** inspired by Trello's design
- 🔒 **Secure credential storage** (stored locally only)

## 🛠️ Installation

### Step 1: Set up the Extension

1. **Clone or download** this repository to your local machine
2. **Generate proper icons** (see [Icon Setup](#-icon-setup) below)
3. **Open Chrome/Chromium** and navigate to `chrome://extensions/`
4. **Enable Developer mode** (toggle in the top right)
5. **Click "Load unpacked"** and select the extension folder
6. The extension should now appear in your extensions list

### Step 2: Get Trello API Credentials

1. **Visit** [https://trello.com/app-key](https://trello.com/app-key) while logged into Trello
2. **Copy your API Key** (the long string under "Key")
3. **Click the "Token" link** on the same page
4. **Click "Allow"** to grant access
5. **Copy the generated token**

### Step 3: Configure the Extension

1. **Click the extension icon** in your chrome toolbar
2. **Click "Settings"** or right-click the extension and select "Options"
3. **Paste your API Key and Token** in the respective fields
4. **Click "Test Connection"** to verify your credentials
5. **Select default board and list** (optional but recommended)
6. **Click "Save Settings"**

## 🎯 Usage

### Creating Cards

1. **Visit any website** you want to save
2. **Optionally select text** you want to include in the card
3. **Click the extension icon** in the toolbar
4. **Edit the card title** if needed
5. **Add a description** (optional)
6. **Choose board and list** (or use defaults)
7. **Click "Create Card"**

### Keyboard Shortcuts

- **Ctrl+Shift+T** (or **Cmd+Shift+T** on Mac): Open the card creation popup
- **Ctrl+Enter** (or **Cmd+Enter**): Test connection in settings page

### Context Menu

- **Right-click on any page** and select "Create Trello Card"

## 🎨 Icon Setup

The extension includes placeholder icon files. For a professional look, you'll need to generate proper PNG icons:

### Option 1: Online Conversion
1. Use the included `icons/icon.svg` file
2. Visit an online SVG to PNG converter (e.g., [CloudConvert](https://cloudconvert.com/svg-to-png))
3. Generate PNG files in these sizes: 16x16, 32x32, 48x48, 128x128
4. Save them as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` in the `icons/` folder

### Option 2: Command Line (if you have tools installed)
```bash
# Using rsvg-convert (install with: brew install librsvg)
rsvg-convert -w 16 -h 16 icons/icon.svg > icons/icon16.png
rsvg-convert -w 32 -h 32 icons/icon.svg > icons/icon32.png
rsvg-convert -w 48 -h 48 icons/icon.svg > icons/icon48.png
rsvg-convert -w 128 -h 128 icons/icon.svg > icons/icon128.png

# Using ImageMagick (install with: brew install imagemagick)
convert -size 16x16 icons/icon.svg icons/icon16.png
convert -size 32x32 icons/icon.svg icons/icon32.png
convert -size 48x48 icons/icon.svg icons/icon48.png
convert -size 128x128 icons/icon.svg icons/icon128.png
```

## 🔧 Configuration Options

### API Settings
- **API Key**: Your Trello application key
- **API Token**: Your personal access token

### Default Preferences
- **Default Board**: Pre-select a board for new cards
- **Default List**: Pre-select a list within the board

### Card Options
- **Include page URL**: Automatically add the source URL to card descriptions
- **Include selected text**: Add any text you've selected on the page

## 🔒 Privacy & Security

- ✅ **Local storage only**: API credentials are stored locally on your device
- ✅ **Direct API calls**: Communicates only with Trello's official API
- ✅ **No tracking**: No analytics or data collection
- ✅ **Open source**: Full code transparency
- ✅ **Revokable access**: You can revoke API access anytime from Trello settings

## 🐛 Troubleshooting

### "Please configure your Trello API credentials"
- Make sure you've entered both API Key and Token in settings
- Verify credentials by clicking "Test Connection"
- Ensure you're logged into Trello when generating the token

### "Error loading boards"
- Check your internet connection
- Verify your API credentials are correct
- Make sure your Trello account has access to boards

### Extension icon not showing
- Check that all icon files exist in the `icons/` folder
- Reload the extension: go to `chrome://extensions/` and click the reload button
- Make sure icon files are valid PNG format

### "Content script not ready"
- This is normal for some pages - the extension will still work
- Refresh the page if you need to capture selected text

## 🚀 Development

### File Structure
```
create-trello-card-chrome-ext/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── options.html           # Settings page
├── options.css            # Settings page styling
├── options.js             # Settings functionality
├── content.js             # Content script for page interaction
├── background.js          # Service worker for API calls
├── icons/                 # Extension icons
│   ├── icon.svg          # Source SVG icon
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

### Key Technologies
- **Manifest V3**: Latest Chrome extension standard
- **Chrome Extensions API**: Storage, tabs, runtime messaging
- **Trello REST API**: Board, list, and card management
- **Modern JavaScript**: ES6+, async/await
- **CSS3**: Flexbox, modern styling

### API Endpoints Used
- `GET /1/members/me/boards` - Fetch user boards
- `GET /1/boards/{id}/lists` - Fetch board lists  
- `POST /1/cards` - Create new cards
- `GET /1/members/me` - Validate credentials

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🙏 Acknowledgments

- Trello for their excellent API
- The Chrome Extensions team for great documentation
- All contributors and users of this extension

---

**Made with ❤️ for productivity enthusiasts** 
