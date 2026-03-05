/**
 * CraftIDE Language System (i18n)
 */

const DICT = {
    en: {
        // Common
        'lang.title': 'CraftIDE - Minecraft Development Studio',
        'btn.cancel': 'Cancel',
        'btn.create': 'Create',
        'btn.open': 'Open Folder',

        // Activity Bar
        'act.explorer': 'File Explorer',
        'act.search': 'Search',
        'act.mcTools': 'Minecraft Tools',
        'act.ai': 'AI Assistant',
        'act.vb': 'Visual Plugin Builder',
        'act.blockbench': 'Blockbench 3D',
        'act.server': 'Test Server',
        'act.image': 'Image Editor',
        'act.settings': 'Settings',

        // Sidebar
        'exp.title': 'FILE EXPLORER',
        'exp.empty': 'No project opened yet',
        'search.title': 'SEARCH',
        'search.placeholder': 'Search in files...',
        'search.results': '{count} result(s) found',
        'search.limit': '(limit)',
        'search.minChars': 'Type at least 2 characters',
        'search.openProject': 'Open a project first',
        'search.searching': 'Searching...',
        'search.noResults': 'No results found',
        'ai.title': 'AI ASSISTANT',
        'ai.welcome': 'Hello! I am CraftIDE AI Assistant. I can help you with Minecraft plugin development.',
        'ai.hint': 'Example: "Open a shop menu when players type /shop"',
        'ai.placeholder': 'Type your plugin idea...',
        'ai.thinking': 'Thinking...',

        // Welcome
        'ui.titlebar.welcome': 'Welcome',
        'ui.tab.close': 'Close',
        'ui.welcome.start': 'Start',
        'ui.welcome.recent': 'Recent',
        'ui.welcome.recentEmpty': 'No project opened yet',
        'ui.welcome.newFile': 'New File...',
        'ui.welcome.openFile': 'Open File...',
        'ui.welcome.openFolder': 'Open Folder...',
        'ui.welcome.newProject': 'Create New Plugin...',
        'ui.welcome.aiCreate': 'Create with AI...',
        'ui.welcome.guides': 'Getting Started Guides',
        'ui.welcome.wt.getStarted.title': 'Get Started with CraftIDE',
        'ui.welcome.wt.getStarted.desc': 'Customize your editor, learn the basics, and start coding',
        'ui.welcome.wt.learnBasics.title': 'Learn the Basics',
        'ui.welcome.wt.build.title': 'Build and Test Plugin',
        'ui.welcome.wt.build.desc': 'Create JAR with Maven/Gradle and run a test server',
        'ui.welcome.wt.server.title': 'Local Test Server',
        'ui.welcome.wt.server.desc': 'Create, start and test your plugin directly',
        'ui.welcome.wt.api.title': 'API Reference',
        'ui.welcome.wt.api.desc': 'Paper and Bukkit API documentation',
        'ui.welcome.badge.new': 'New',
        'ui.welcome.mcVersionTitle': 'Minecraft Version',
        'ui.welcome.targetVersion': 'Target Version:',
        'ui.welcome.more': 'More...',
        'ui.welcome.showOnStartup': 'Show welcome page on startup',

        // Generic UI
        'ui.title.minimize': 'Minimize',
        'ui.title.maximize': 'Maximize',
        'ui.title.close': 'Close',
        'ui.sidebar.newFile': 'New File',
        'ui.sidebar.newFolder': 'New Folder',
        'ui.sidebar.refresh': 'Refresh',
        'ui.sidebar.openFolder': 'Open Folder',

        // Modal / Project
        'modal.newProject.title': 'Create New Plugin',
        'modal.platform': 'Platform',
        'modal.projectName': 'Project Name',
        'modal.mcVersion': 'MC Version',
        'modal.packageName': 'Package Name',
        'modal.deps': 'Dependencies (optional)',
        'ui.modal.recommended': 'Recommended',

        // Settings
        'settings.title': 'Settings',
        'settings.lang': 'Language',
        'settings.lang.en': 'English',
        'settings.lang.tr': 'Turkish',
        'settings.aiProvider': 'AI Provider',
        'settings.ollamaUrl': 'Ollama Local URL',
        'settings.openaiKey': 'OpenAI API Key',
        'settings.anthropicKey': 'Anthropic API Key',
        'settings.geminiKey': 'Gemini API Key',
        'settings.save': 'Save Settings',
        'ui.settings.subtitle': 'CraftIDE configuration',
        'ui.settings.group.ai': 'AI Settings',
        'ui.settings.group.editor': 'Editor Settings',
        'ui.settings.group.project': 'Project Settings',
        'ui.settings.model': 'Model',
        'ui.settings.endpoint': 'API Endpoint',
        'ui.settings.apiKey': 'API Key',
        'ui.settings.fontSize': 'Font Size',
        'ui.settings.fontFamily': 'Font Family',
        'ui.settings.tabSize': 'Tab Size',
        'ui.settings.minimap': 'Minimap',
        'ui.settings.wordWrap': 'Word Wrap',
        'ui.settings.defaultPlatform': 'Default Platform',
        'ui.shortcuts.title': 'Keyboard Shortcuts',
        'ui.shortcuts.desc': 'Customize command shortcuts. Context shortcuts override global shortcuts.',
        'ui.shortcuts.resetAll': 'Reset All',
        'ui.shortcuts.scope.global': 'Global',
        'ui.shortcuts.scope.vb': 'Visual Builder',
        'ui.shortcuts.scope.explorer': 'Explorer',
        'ui.shortcuts.scope.image': 'Image Editor',
        'ui.shortcuts.conflict': 'Conflict with: {command}',
        'ui.shortcuts.capture': 'Press keys...',
        'ui.shortcuts.unbound': 'Unbound',
        'ui.option.on': 'On',
        'ui.option.off': 'Off',
        'ui.option.column': 'Column',
        'ui.official.title': 'OFFICIAL BUILD VERIFICATION & UPDATES',
        'ui.official.desc': 'Integrity checks and in-app updates are locked to the official CraftIDE GitHub release channel.',
        'ui.official.notChecked': 'Not checked yet',
        'ui.official.channelLocked': 'Channel locked: ali975/CraftIDE-MyFirstProject',
        'ui.official.channelLockedDynamic': 'Channel locked: {owner}/{repo}',
        'ui.official.verifyPrompt': 'Use "Verify build" to compare your local build with the official checksums.',
        'ui.official.verifyBtn': 'Verify build',
        'ui.official.checkBtn': 'Check for updates',
        'ui.official.downloadBtn': 'Download update',
        'ui.official.installBtn': 'Install update',
        'ui.official.openReleaseBtn': 'Open official release',
        'ui.official.releaseLink': 'Official release',
        'ui.official.updaterPreparing': 'Preparing updater status...',
        'ui.official.updaterUnavailable': 'Updater state is unavailable.',
        'ui.official.updaterIdle': 'Updater is idle.',
        'ui.official.latestLabel': 'Latest: v{version}',
        'ui.official.updateAvailable': 'Update available: {current} -> {latest}. Use "Download update" to fetch it in-app.',
        'ui.official.updateDownloaded': 'Update downloaded: {current} -> {latest}. Click "Install update" to restart and apply it.',
        'ui.official.updateNotAvailable': 'You are on the latest official version ({current}).',
        'ui.official.updateDisabled': 'In-app auto update is unavailable for this build. {message}',
        'ui.official.updateError': 'Auto update error: {message}',
        'ui.official.updateDownloading': 'Downloading official update {version} in the background.',
        'ui.official.checkingRelease': 'Checking latest official release...',
        'ui.official.unknownUpdaterError': 'Unknown updater error.',
        'ui.official.notifyAvailable': 'New version available: v{version}',
        'ui.official.notifyDownloaded': 'Update downloaded: v{version}',
        'ui.official.status.pending': 'pending',
        'ui.official.status.verified': 'verified',
        'ui.official.status.unverified': 'unverified',
        'ui.official.status.unknown': 'unknown',
        'ui.official.status.development': 'development',
        'ui.official.status.error': 'error',
        'ui.official.noDetail': 'No detail.',
        'ui.official.verifyChecking': 'Checking local build integrity against official release checksums...',
        'ui.official.noReason': 'No reason provided.',
        'ui.official.officialTag': 'Official tag: {tag}',
        'ui.official.checksumsAsset': 'Checksums asset: {name}',
        'ui.official.localAsar': 'Local app.asar SHA256: {hash}',
        'ui.official.verifyFailed': 'Verification failed: {error}',
        'ui.official.checkFailed': 'Official update check failed: {error}',
        'ui.official.downloadFailed': 'Update download failed: {error}',
        'ui.official.installNotReady': 'A downloaded update is required before installation can start.',
        'ui.official.installStarting': 'The app is restarting to install the update.',
        'ui.official.installFailed': 'Install could not be started: {error}',
        'ui.official.updaterStateLoadError': 'Unable to load updater state.',

        // Server Manager
        'server.title': 'Test Server Manager',
        'server.desc': 'Start, stop and test your local Minecraft server without leaving the IDE.',
        'server.type': 'Server Type',
        'server.version': 'Version',
        'server.start': 'Start',
        'server.stop': 'Stop',
        'server.status.stopped': 'Stopped',
        'ui.server.deploy': 'Deploy to Server',
        'ui.server.deployTitle': 'Build current project and deploy to server',
        'ui.server.loadingVersions': 'Loading versions...',
        'ui.server.type.paper': 'Paper (Plugin)',
        'ui.server.type.spigot': 'Spigot (Plugin)',
        'ui.server.type.fabric': 'Fabric (Mod)',
        'ui.server.type.forge': 'Forge (Mod)',
        'ui.server.type.vanilla': 'Vanilla',
        'ui.server.problems': 'PROBLEMS',

        // Visual Builder
        'ui.vb.title': 'Visual Mod/Plugin/Skript Builder',
        'ui.vb.hint': 'Right click -> Add block | Drag ports -> Connect | Right click on connection -> Delete',
        'ui.vb.save': 'Save',
        'ui.vb.load': 'Load',
        'ui.vb.templates': 'Templates',
        'ui.vb.generate': 'Generate Code',
        'ui.vb.clear': 'Clear',
        'ui.vb.more': 'More',

        // Bottom panel
        'ui.bottom.output': 'Output',
        'ui.bottom.problems': 'Problems',
        'ui.bottom.toggle': 'Toggle Panel',
        'ui.output.placeholder': 'Build output will appear here...',
        'ui.problems.none': 'No problems found',
        'ui.status.problems': '0 problems',

        // Context menu
        'ui.ctx.newFile': 'New File',
        'ui.ctx.newFolder': 'New Folder',
        'ui.ctx.rename': 'Rename',
        'ui.ctx.delete': 'Delete',
        'ui.ctx.copyPath': 'Copy Path',
        'ui.ctx.openExplorer': 'Open in Explorer',
        'ui.ctx.openTerminal': 'Open in Terminal',

        // Onboarding
        'ui.onboard.step1.title': 'Welcome to CraftIDE!',
        'ui.onboard.step1.desc': 'What kind of Minecraft content do you want to create?',
        'ui.onboard.step2.title': 'AI Assistant Setup',
        'ui.onboard.step2.desc': 'Configure your coding assistant. You can use local Ollama or cloud providers.',
        'ui.onboard.step3.title': 'Start with a Template',
        'ui.onboard.step3.desc': 'Choose a ready template for your platform or start blank.',
        'ui.onboard.next': 'Next ->',
        'ui.onboard.back': '<- Back',
        'ui.onboard.skip': 'Skip',
        'ui.onboard.blank': 'Start Blank',
        'ui.onboard.provider': 'AI Provider',
        'ui.onboard.model': 'Model Name',
        'ui.onboard.endpoint': 'Endpoint URL',
        'ui.onboard.apikey': 'API Key (optional)',
        'ui.onboard.recommended': '(Recommended)',
        'ui.onboard.local': '(Local)',

        // Tab names
        'ui.tab.visualBuilder': 'Visual Builder',
        'ui.tab.blockbench': 'Blockbench Editor',
        'ui.tab.settings': 'Settings',
        'ui.tab.serverManager': 'Server Manager',
        'ui.tab.imageEditor': 'Image Editor',
        'ui.tab.guiBuilder': 'GUI Builder',
        'ui.tab.commandTree': 'Command Designer',
        'ui.tab.recipeCreator': 'Recipe Creator',
        'ui.tab.permissionTree': 'Permission Tree',
        'ui.tab.marketplace': 'Blueprint Marketplace',
        'ui.tab.mcToolsHub': 'Tools Hub',

        // MC tools dropdown
        'ui.mctools.newPlugin': 'Create New Plugin',
        'ui.mctools.visualBuilder': 'Visual Builder',
        'ui.mctools.guiBuilder': 'Chest GUI Builder',
        'ui.mctools.commandTree': 'Command Tree Designer',
        'ui.mctools.recipeCreator': 'Custom Item and Recipe',
        'ui.mctools.permissionTree': 'Permission Tree Generator',
        'ui.mctools.build': 'Build Plugin',
        'ui.mctools.testServer': 'Test Server',
        'ui.mctools.marketplace': 'Blueprint Marketplace',
        'ui.mctools.api': 'API Reference',
        'ui.mctools.blockbench': 'Blockbench Editor',
        'ui.mctools.welcome': 'Welcome Page',
        'ui.mchub.title': 'Minecraft Tools Hub',
        'ui.mchub.desc': 'Open tools quickly with search, categories and one-click actions.',
        'ui.mchub.search': 'Search tools...',
        'ui.mchub.cat.all': 'All',
        'ui.mchub.cat.builder': 'Builders',
        'ui.mchub.cat.server': 'Server',
        'ui.mchub.cat.integrations': 'Integrations',
        'ui.mchub.open': 'Open',
        'ui.mchub.empty': 'No tools match your search.',

        // Prompts/Dialogs
        'prompt.newFileName': 'New file name:',
        'prompt.newFolderName': 'New folder name:',
        'prompt.quickCreate.invalidName': 'Invalid name.',
        'prompt.quickCreate.nameEmpty': 'Name cannot be empty.',
        'prompt.quickCreate.exists': 'A file/folder with this name already exists.',
        'prompt.quickCreate.fileTitle': 'Create New File',
        'prompt.quickCreate.folderTitle': 'Create New Folder',
        'prompt.quickCreate.placeholder.file': 'new-file.java',
        'prompt.quickCreate.placeholder.folder': 'new-folder',
        'prompt.deleteFolder': 'Delete folder "{name}" and all its contents?',
        'prompt.deleteFile': 'Delete file "{name}"?',
        'prompt.unsavedImage': 'There are unsaved changes in the image editor.\n\nExit without saving?',

        // Visual Builder keys used in code
        'vb.HealthCheck': 'Health Check',
        'vb.SendMessage': 'Send Message',
        'vb.Teleport': 'Teleport',
        'vb.GiveItem': 'Give Item',
        'vb.PlaySound': 'Play Sound',
        'vb.KickPlayer': 'Kick Player',
        'vb.RunCommand': 'Run Command',
        'msg.blockDeleted': 'Block deleted',
        'msg.codeGenerated': 'Code generated',
        'mode.plugin': 'Plugin Mode',
        'mode.fabric': 'Fabric Mode',
        'mode.forge': 'Forge Mode',
        'mode.skript': 'Skript Mode',
        'ui.common.latest': 'Latest',
        'ui.common.latestOffline': 'Latest - Offline',
        'ui.tab.closeGlyph': 'Close tab',
        'terminal.main.title': 'CraftIDE Terminal',
        'terminal.main.cwd': 'Working directory: {cwd}',
        'terminal.server.title': 'CraftIDE Test Server Console',
        'terminal.server.hint': 'Type command - press Enter to send to server',
        'notify.welcomeHint': 'Welcome to CraftIDE! Start by creating a new project.',
        'notify.basicsHint': 'Basics: Manage files from the left panel and use the terminal below.',
        'notify.apiRefHint': 'Open a Java file - view API details on hover!',
        'dialog.unsaved.title': 'Unsaved Changes',
        'dialog.unsaved.message': 'There are unsaved changes in "{name}".',
        'dialog.unsaved.detail': 'Do you want to save your changes?',
        'dialog.unsaved.save': 'Save',
        'dialog.unsaved.dontSave': 'Don\'t Save',
        'dialog.unsaved.cancel': 'Cancel',
        'modal.projectNameLabel': 'Plugin Name',
        'ui.vb.deployTest': 'Build & Test',
        'ui.vb.empty.title': 'Visual Mod / Plugin / Skript Builder',
        'ui.vb.empty.desc': 'Create real plugin, mod and skript logic by connecting blocks',
        'ui.vb.empty.step1': 'Choose project type from top (Plugin/Mod/Skript)',
        'ui.vb.empty.step2': 'Right click canvas and add blocks',
        'ui.vb.empty.step3': 'Drag right port of a block to left port of another block',
        'ui.vb.empty.step4': 'Right click a connection to delete it',
        'ui.vb.empty.step5': 'Generate working code with "Generate Code"',
        'ui.vb.empty.template': 'Browse Templates',
        'ui.vb.templatesTitle': 'Templates',
                'ui.vb.param.command': 'Command',
        'ui.vb.param.cmd': 'Command',
        'ui.vb.param.message': 'Message',
        'ui.vb.param.mesaj': 'Message',
        'ui.vb.param.item': 'Item',
        'ui.vb.param.material': 'Material',
        'ui.vb.param.amount': 'Amount',
        'ui.vb.param.adet': 'Amount',
        'ui.vb.param.count': 'Count',
        'ui.vb.param.permission': 'Permission',
        'ui.vb.param.world': 'World',
        'ui.vb.param.reason': 'Reason',
        'ui.vb.param.sound': 'Sound',
        'ui.vb.param.ses': 'Sound',
        'ui.vb.param.mode': 'Mode',
        'ui.vb.param.x': 'X',
        'ui.vb.param.y': 'Y',
        'ui.vb.param.z': 'Z',
        'ui.vb.param.key': 'Key',
        'ui.vb.param.value': 'Value',
        'ui.vb.param.name': 'Name',
        'ui.vb.param.variable': 'Variable',
        'ui.vb.param.delay': 'Delay',
        'ui.vb.param.tick': 'Tick',
        'ui.vb.param.slot': 'Slot',
        'ui.vb.param.inventory': 'Inventory',
        'ui.vb.param.entity': 'Entity',
        'ui.vb.param.type': 'Type',
        'ui.vb.param.start': 'Start',
        'ui.vb.param.interval': 'Interval',
        'ui.vb.param.title': 'Title',
        'ui.vb.param.subtitle': 'Subtitle',        'ui.config.title': 'Config Editor',
        'ui.config.rawYaml': 'Raw YAML',
        'ui.config.save': 'Save',
        'msg.imageSaved': 'Saved: {name}',
        'msg.imageLoaded': 'Loaded: {name} ({size})',
        'msg.imageNoPath': 'No target file path. Open a PNG file from the explorer first.',
        'msg.imageSaveError': 'Error: Could not save file — {error}',
        'msg.imageLoadError': 'Error: Could not load image — {error}',
        'msg.imageNewCanvas': 'Create a new canvas? Unsaved changes will be lost.',
        'ui.nc.oneStep': 'One-Step AI',
        'ui.nc.intent': 'Intent Wizard',
        'ui.nc.packs': 'Behavior Packs',
        'ui.nc.validate': 'Validate',
        'ui.nc.guaranteed': 'Guaranteed Build',
        'ui.nc.scenario': 'Scenario Test',
        'ui.nc.release': 'One-Click Release',
        'ui.nc.health': 'No-Code Health',
        'ui.nc.validationReady': 'Validation panel initialized.',
        'ui.nc.suggestionReady': 'Suggestion engine initialized.',
        'ui.nc.modal.oneStepTitle': 'One-Step Natural Language -> Plugin',
        'ui.nc.modal.intentTitle': 'Intent Wizard',
        'ui.nc.modal.packTitle': 'Behavior Packs',
        'ui.nc.modal.scenarioTitle': 'Scenario Runner',
        'ui.nc.modal.releaseTitle': 'One-Click Release',
        'ui.nc.close': 'Close',
        'ui.nc.run': 'Run',
        'ui.nc.analyze': 'Analyze',
        'ui.nc.apply': 'Apply',
        'ui.nc.placeholder.oneStep': 'Describe the full plugin you want in natural language...',
        'ui.nc.placeholder.intent': 'Describe feature in natural language...',
        'ui.nc.placeholder.example': 'e.g. /spawn command with teleport',
        'ui.gui.title': 'Chest GUI Builder',
        'ui.gui.row1': '1 Row (9 slots)',
        'ui.gui.row2': '2 Rows (18 slots)',
        'ui.gui.row3': '3 Rows (27 slots)',
        'ui.gui.row4': '4 Rows (36 slots)',
        'ui.gui.row5': '5 Rows (45 slots)',
        'ui.gui.row6': '6 Rows (54 slots)',
        'ui.gui.titlePlaceholder': 'GUI Title',
        'ui.gui.exportVB': 'Send to VB',
        'ui.gui.generate': 'Generate Code',
        'ui.gui.clear': 'Clear',
        'ui.gui.hint': 'Click slot -> configure -> apply',
        'ui.gui.slotSelect': 'Select Slot',
        'ui.gui.material': 'Material',
        'ui.gui.displayName': 'Display Name (& color codes)',
        'ui.gui.description': 'Description (new line with Enter)',
        'ui.gui.clickAction': 'Click Action',
        'ui.gui.action.none': 'None',
        'ui.gui.action.command': 'Run Command',
        'ui.gui.action.give': 'Give Item',
        'ui.gui.action.close': 'Close Inventory',
        'ui.gui.valuePlaceholder': 'Command or value',
        'ui.gui.apply': 'Apply',
        'ui.command.title': 'Command Tree Designer',
        'ui.command.addSub': '+ Subcommand',
        'ui.command.addArg': '+ Argument',
        'ui.command.delete': 'Delete',
        'ui.command.generateJava': 'Generate Java',
        'ui.command.generateSkript': 'Generate Skript',
        'ui.command.root': 'Root Command',
        'ui.command.sub': 'Subcommand',
        'ui.command.name': 'Command Name',
        'ui.command.desc': 'Description',
        'ui.command.descPlaceholder': 'Command description',
        'ui.command.permission': 'Permission',
        'ui.command.aliases': 'Aliases (comma separated)',
        'ui.command.args': 'Arguments',
        'ui.command.argName': 'name',
        'ui.command.argOptional': 'Optional',
        'ui.recipe.title': 'Custom Item & Recipe Creator',
        'ui.recipe.shaped': 'Shaped',
        'ui.recipe.shapeless': 'Shapeless',
        'ui.recipe.clear': 'Clear',
        'ui.recipe.generate': 'Generate Code',
        'ui.recipe.table': 'Crafting Grid',
        'ui.recipe.result': 'Result',
        'ui.recipe.slotConfig': 'Slot Configuration',
        'ui.recipe.resultItem': 'Result Item',
        'ui.recipe.material': 'Material',
        'ui.recipe.count': 'Amount',
        'ui.recipe.name': 'Display Name',
        'ui.recipe.lore': 'Description',
        'ui.recipe.apply': 'Apply',
        'ui.permission.title': 'Permission Tree Generator',
        'ui.permission.addSub': '+ Child Permission',
        'ui.permission.delete': 'Delete',
        'ui.permission.generateYml': 'Generate plugin.yml',
        'ui.permission.generateLuckPerms': 'Generate LuckPerms',
        'ui.permission.root': 'Root Permission',
        'ui.permission.node': 'Permission',
        'ui.permission.name': 'Permission Name',
        'ui.permission.desc': 'Description',
        'ui.permission.descPlaceholder': 'Permission description',
        'ui.permission.default': 'Default',
        'ui.market.title': 'Blueprint Marketplace',
        'ui.market.search': 'Search...',
        'ui.market.all': 'All',
        'ui.market.publishTitle': 'Publish Blueprint',
        'ui.market.publishHint': 'Save current VB canvas as a blueprint',
        'ui.market.name': 'Blueprint Name',
        'ui.market.desc': 'Description',
        'ui.market.publish': 'Publish',
        'ui.market.emptyTitle': 'No templates yet',
        'ui.market.emptyDesc': 'Create a blueprint in Visual Builder and click Publish',
        'ui.market.noDesc': 'No description',
        'ui.market.anonymous': 'Anonymous',
        'ui.market.blocks': 'blocks',
        'ui.market.load': 'Load',
        'ui.image.grid': 'Grid',
        'ui.image.clear': 'Clear',
        'ui.image.new': 'New',
        'ui.image.save': 'Save',
        'ui.image.status.ready': 'Ready',
        'ui.image.status.newFile': 'New file',
        'ui.image.status.pixel': 'Pixel: {x},{y}',
        'ui.image.tool.pencil': 'Pencil',
        'ui.image.tool.eraser': 'Eraser',
        'ui.image.tool.fill': 'Fill',
        'ui.image.tool.eyedrop': 'Eyedropper',
        'ui.image.tool.rect': 'Rectangle',
        'ui.image.tool.line': 'Line',
        'ui.image.tool.hand': 'Pan',
        'ui.image.noPath': 'No target file path. Open a PNG file from the explorer first.',
        'prompt.image.newCanvas': 'Create a new canvas? Unsaved changes will be lost.',
        'msg.guiCleared': 'GUI cleared',
        'msg.slotUpdated': 'Slot updated',
        'msg.guiExported': 'GUI exported to Visual Builder!',
        'msg.guiCodeGenerated': 'GUI code generated!',
        'msg.recipeCleared': 'Recipe cleared',
        'msg.resultUpdated': 'Result updated!',
        'msg.selectResultMaterial': 'Select a result material first!',
        'msg.recipeCodeGenerated': 'Recipe code generated!',
        'msg.commandDeleted': 'Subcommand deleted',
        'msg.fileGenerated': '{name} generated!',
        'msg.permissionDeleted': 'Permission deleted',
        'msg.permissionsGenerated': 'plugin.yml permissions generated!',
        'msg.luckpermsGenerated': 'LuckPerms commands generated!',
        'msg.noBlocksInVB': 'Add blocks in Visual Builder first!',
        'msg.enterBlueprintName': 'Enter a blueprint name!',
        'msg.publishError': 'Publish error: {error}',
        'msg.blueprintPublished': 'Blueprint published!',
        'msg.visualBuilderNotLoaded': 'Visual Builder is not loaded!',
        'msg.blueprintLoaded': 'Blueprint loaded: {name}',
        'msg.fileCreated': '{name} created',
        'msg.folderCreateError': 'Could not create folder!',
        'msg.fileReadError': 'Could not read file!',
        'msg.fileSaveError': 'Could not save file!',
        'msg.fileSaved': '{name} saved',
        'msg.fileDeleted': '{name} deleted',
        'msg.pathCopied': 'Path copied',
        'msg.terminalDirChanged': 'Terminal directory changed',
        'msg.treeRefreshed': 'File tree refreshed',
        'msg.openProjectFirst': 'Open a project first!',
        'msg.pluginNameRequired': 'Plugin name is required!',
        'msg.projectCreated': '{name} created successfully!',
        'msg.error': 'Error: {error}',
        'msg.renamed': '{old} → {new}',
        'modal.label.pluginName': 'Plugin Name',
        'modal.label.modName': 'Mod Name',
        'modal.label.skriptName': 'Skript Name',
        'msg.serverError': 'Server error: {type}',
        'msg.serverErrorLocation': 'Server error: {type} ({location})',
        'ui.server.aiAnalyze': 'AI Analyze',
        'ui.server.aiFix': 'One-Click Fix',
        'msg.aiAnalyzePrompt': 'Analyze this Java error and tell me how to fix it:\n',
        'msg.errorFallback': 'Error',
        'msg.building': 'Building...',
        'msg.buildError': 'Build error: {error}',
        'msg.buildSuccess': 'Build successful!',
        'msg.buildFileNotFound': 'Build artifact not found! Make sure your target (.jar or .sk) file was generated.',
    },
    tr: {
        // Common
        'lang.title': 'CraftIDE - Minecraft Gelistirme Studyosu',
        'btn.cancel': 'Iptal',
        'btn.create': 'Olustur',
        'btn.open': 'Klasor Ac',

        // Activity Bar
        'act.explorer': 'Dosya Gezgini',
        'act.search': 'Arama',
        'act.mcTools': 'Minecraft Araclari',
        'act.ai': 'AI Asistan',
        'act.vb': 'Gorsel Plugin Builder',
        'act.blockbench': 'Blockbench 3D',
        'act.server': 'Test Sunucusu',
        'act.image': 'Resim Duzenleyici',
        'act.settings': 'Ayarlar',

        // Sidebar
        'exp.title': 'DOSYA GEZGINI',
        'exp.empty': 'Henuz bir proje acilmadi',
        'search.title': 'ARAMA',
        'search.placeholder': 'Dosyalarda ara...',
        'search.results': '{count} sonuc bulundu',
        'search.limit': '(limit)',
        'search.minChars': 'En az 2 karakter yazin',
        'search.openProject': 'Once bir proje acin',
        'search.searching': 'Araniyor...',
        'search.noResults': 'Sonuc bulunamadi',
        'ai.title': 'AI ASISTAN',
        'ai.welcome': 'Merhaba! Ben CraftIDE AI Asistan. Minecraft plugin gelistirmede yardimci olurum.',
        'ai.hint': 'Ornek: "Oyuncular /shop yazinca bir menu acilsin"',
        'ai.placeholder': 'Plugin fikrini yaz...',
        'ai.thinking': 'Dusunuyor...',

        // Welcome
        'ui.titlebar.welcome': 'Hos Geldin',
        'ui.tab.close': 'Kapat',
        'ui.welcome.start': 'Basla',
        'ui.welcome.recent': 'Son Kullanilanlar',
        'ui.welcome.recentEmpty': 'Henuz acilmis bir proje yok',
        'ui.welcome.newFile': 'Yeni Dosya...',
        'ui.welcome.openFile': 'Dosya Ac...',
        'ui.welcome.openFolder': 'Klasor Ac...',
        'ui.welcome.newProject': 'Yeni Plugin Olustur...',
        'ui.welcome.aiCreate': 'AI ile Olustur...',
        'ui.welcome.guides': 'Baslangic Kilavuzlari',
        'ui.welcome.wt.getStarted.title': "CraftIDE'ye Baslayin",
        'ui.welcome.wt.getStarted.desc': 'Editoru ozellestirin, temelleri ogrenin ve kodlamaya baslayin',
        'ui.welcome.wt.learnBasics.title': 'Temelleri Ogrenin',
        'ui.welcome.wt.build.title': 'Plugin Derleme ve Test',
        'ui.welcome.wt.build.desc': 'Maven/Gradle ile JAR olustur ve test sunucusu kur',
        'ui.welcome.wt.server.title': 'Yerel Test Sunucusu',
        'ui.welcome.wt.server.desc': 'Server olustur, baslat ve eklentiyi test et',
        'ui.welcome.wt.api.title': 'API Referansi',
        'ui.welcome.wt.api.desc': 'Paper ve Bukkit API dokumantasyonu',
        'ui.welcome.badge.new': 'Yeni',
        'ui.welcome.mcVersionTitle': 'Minecraft Versiyonu',
        'ui.welcome.targetVersion': 'Hedef Versiyon:',
        'ui.welcome.more': 'Daha fazla...',
        'ui.welcome.showOnStartup': 'Baslangicta hos geldin sayfasini goster',

        // Generic UI
        'ui.title.minimize': 'Kucult',
        'ui.title.maximize': 'Buyut',
        'ui.title.close': 'Kapat',
        'ui.sidebar.newFile': 'Yeni Dosya',
        'ui.sidebar.newFolder': 'Yeni Klasor',
        'ui.sidebar.refresh': 'Yenile',
        'ui.sidebar.openFolder': 'Klasor Ac',

        // Modal / Project
        'modal.newProject.title': 'Yeni Plugin Olustur',
        'modal.platform': 'Platform',
        'modal.projectName': 'Proje Adi',
        'modal.mcVersion': 'MC Versiyonu',
        'modal.packageName': 'Paket Adi',
        'modal.deps': 'Bagimliliklar (opsiyonel)',
        'ui.modal.recommended': 'Onerilen',

        // Settings
        'settings.title': 'Ayarlar',
        'settings.lang': 'Dil',
        'settings.lang.en': 'English',
        'settings.lang.tr': 'Turkce',
        'settings.aiProvider': 'AI Saglayici',
        'settings.ollamaUrl': 'Ollama Yerel URL',
        'settings.openaiKey': 'OpenAI API Anahtari',
        'settings.anthropicKey': 'Anthropic API Anahtari',
        'settings.geminiKey': 'Gemini API Anahtari',
        'settings.save': 'Ayarlari Kaydet',
        'ui.settings.subtitle': 'CraftIDE yapilandirmasi',
        'ui.settings.group.ai': 'AI Ayarlari',
        'ui.settings.group.editor': 'Editor Ayarlari',
        'ui.settings.group.project': 'Proje Ayarlari',
        'ui.settings.model': 'Model',
        'ui.settings.endpoint': 'API Endpoint',
        'ui.settings.apiKey': 'API Key',
        'ui.settings.fontSize': 'Font Boyutu',
        'ui.settings.fontFamily': 'Font Ailesi',
        'ui.settings.tabSize': 'Tab Boyutu',
        'ui.settings.minimap': 'Minimap',
        'ui.settings.wordWrap': 'Word Wrap',
        'ui.settings.defaultPlatform': 'Varsayilan Platform',
        'ui.shortcuts.title': 'Klavye Kisayollari',
        'ui.shortcuts.desc': 'Komut kisayollarini ozellestirin. Baglam kisayollari global kisayollarin onune gecer.',
        'ui.shortcuts.resetAll': 'Hepsini Sifirla',
        'ui.shortcuts.scope.global': 'Global',
        'ui.shortcuts.scope.vb': 'Visual Builder',
        'ui.shortcuts.scope.explorer': 'Gezgin',
        'ui.shortcuts.scope.image': 'Gorsel Editor',
        'ui.shortcuts.conflict': 'Cakisma: {command}',
        'ui.shortcuts.capture': 'Tuslara basin...',
        'ui.shortcuts.unbound': 'Atanmadi',
        'ui.option.on': 'Acik',
        'ui.option.off': 'Kapali',
        'ui.option.column': 'Sutun',
        'ui.official.title': 'RESMI SURUM DOGRULAMA VE GUNCELLEMELER',
        'ui.official.desc': 'Butunluk kontrolleri ve uygulama ici guncellemeler resmi CraftIDE GitHub surum kanalina kilitlidir.',
        'ui.official.notChecked': 'Henuz kontrol edilmedi',
        'ui.official.channelLocked': 'Kanal kilidi: ali975/CraftIDE-MyFirstProject',
        'ui.official.channelLockedDynamic': 'Kanal kilidi: {owner}/{repo}',
        'ui.official.verifyPrompt': '"Surumu dogrula" ile yerel surumunuzu resmi checksum degerleriyle karsilastirin.',
        'ui.official.verifyBtn': 'Surumu dogrula',
        'ui.official.checkBtn': 'Guncellemeleri kontrol et',
        'ui.official.downloadBtn': 'Guncellemeyi indir',
        'ui.official.installBtn': 'Guncellemeyi kur',
        'ui.official.openReleaseBtn': 'Resmi surumu ac',
        'ui.official.releaseLink': 'Resmi surum',
        'ui.official.updaterPreparing': 'Guncelleyici durumu hazirlaniyor...',
        'ui.official.updaterUnavailable': 'Guncelleyici durumu kullanilamiyor.',
        'ui.official.updaterIdle': 'Guncelleyici beklemede.',
        'ui.official.latestLabel': 'Son: v{version}',
        'ui.official.updateAvailable': 'Guncelleme hazir: {current} -> {latest}. Uygulama icinden indirmek icin "Guncellemeyi indir" secenegini kullanin.',
        'ui.official.updateDownloaded': 'Guncelleme indirildi: {current} -> {latest}. Yeniden baslatip uygulamak icin "Guncellemeyi kur" secenegine basin.',
        'ui.official.updateNotAvailable': 'En guncel resmi surumu kullaniyorsunuz ({current}).',
        'ui.official.updateDisabled': 'Bu surumde uygulama ici otomatik guncelleme kullanilamiyor. {message}',
        'ui.official.updateError': 'Otomatik guncelleme hatasi: {message}',
        'ui.official.updateDownloading': 'Resmi {version} guncellemesi arka planda indiriliyor.',
        'ui.official.checkingRelease': 'En son resmi surum kontrol ediliyor...',
        'ui.official.unknownUpdaterError': 'Bilinmeyen guncelleyici hatasi.',
        'ui.official.notifyAvailable': 'Yeni surum hazir: v{version}',
        'ui.official.notifyDownloaded': 'Guncelleme indirildi: v{version}',
        'ui.official.status.pending': 'bekliyor',
        'ui.official.status.verified': 'dogrulandi',
        'ui.official.status.unverified': 'dogrulanamadi',
        'ui.official.status.unknown': 'bilinmiyor',
        'ui.official.status.development': 'gelistirme',
        'ui.official.status.error': 'hata',
        'ui.official.noDetail': 'Detay yok.',
        'ui.official.verifyChecking': 'Yerel surum butunlugu resmi release checksum dosyalariyla karsilastiriliyor...',
        'ui.official.noReason': 'Bir neden saglanmadi.',
        'ui.official.officialTag': 'Resmi etiket: {tag}',
        'ui.official.checksumsAsset': 'Checksum dosyasi: {name}',
        'ui.official.localAsar': 'Yerel app.asar SHA256: {hash}',
        'ui.official.verifyFailed': 'Dogrulama basarisiz: {error}',
        'ui.official.checkFailed': 'Resmi guncelleme kontrolu basarisiz: {error}',
        'ui.official.downloadFailed': 'Guncelleme indirilemedi: {error}',
        'ui.official.installNotReady': 'Kurulumun baslamasi icin once indirilmis bir guncelleme gerekli.',
        'ui.official.installStarting': 'Guncellemeyi kurmak icin uygulama yeniden baslatiliyor.',
        'ui.official.installFailed': 'Kurulum baslatilamadi: {error}',
        'ui.official.updaterStateLoadError': 'Guncelleyici durumu yuklenemedi.',

        // Server Manager
        'server.title': 'Test Sunucusu Yoneticisi',
        'server.desc': "Yerel Minecraft sunucunu baslat, durdur ve eklentilerini IDE'den test et.",
        'server.type': 'Sunucu Turu',
        'server.version': 'Versiyon',
        'server.start': 'Baslat',
        'server.stop': 'Durdur',
        'server.status.stopped': 'Durduruldu',
        'ui.server.deploy': 'Sunucuya Yukle',
        'ui.server.deployTitle': 'Mevcut projeyi derleyip sunucuya aktarir',
        'ui.server.loadingVersions': 'Veriler yukleniyor...',
        'ui.server.type.paper': 'Paper (Eklenti)',
        'ui.server.type.spigot': 'Spigot (Eklenti)',
        'ui.server.type.fabric': 'Fabric (Mod)',
        'ui.server.type.forge': 'Forge (Mod)',
        'ui.server.type.vanilla': 'Vanilla',
        'ui.server.problems': 'SORUNLAR',

        // Visual Builder
        'ui.vb.title': 'Gorsel Mod/Plugin/Skript Builder',
        'ui.vb.hint': 'Sag tik -> Blok ekle | Port surukle -> Bagla | Baglantiya sag tik -> Sil',
        'ui.vb.save': 'Kaydet',
        'ui.vb.load': 'Yukle',
        'ui.vb.templates': 'Sablonlar',
        'ui.vb.generate': 'Koda Donustur',
        'ui.vb.clear': 'Temizle',
                'ui.vb.param.command': 'Komut',
        'ui.vb.param.cmd': 'Komut',
        'ui.vb.param.message': 'Mesaj',
        'ui.vb.param.mesaj': 'Mesaj',
        'ui.vb.param.item': 'Esya',
        'ui.vb.param.material': 'Malzeme',
        'ui.vb.param.amount': 'Miktar',
        'ui.vb.param.adet': 'Adet',
        'ui.vb.param.count': 'Sayi',
        'ui.vb.param.permission': 'Yetki',
        'ui.vb.param.world': 'Dunya',
        'ui.vb.param.reason': 'Sebep',
        'ui.vb.param.sound': 'Ses',
        'ui.vb.param.ses': 'Ses',
        'ui.vb.param.mode': 'Mod',
        'ui.vb.param.x': 'X',
        'ui.vb.param.y': 'Y',
        'ui.vb.param.z': 'Z',
        'ui.vb.param.key': 'Anahtar',
        'ui.vb.param.value': 'Deger',
        'ui.vb.param.name': 'Ad',
        'ui.vb.param.variable': 'Degisken',
        'ui.vb.param.delay': 'Gecikme',
        'ui.vb.param.tick': 'Tick',
        'ui.vb.param.slot': 'Slot',
        'ui.vb.param.inventory': 'Envanter',
        'ui.vb.param.entity': 'Varlik',
        'ui.vb.param.type': 'Tur',
        'ui.vb.param.start': 'Baslangic',
        'ui.vb.param.interval': 'Aralik',
        'ui.vb.param.title': 'Baslik',
        'ui.vb.param.subtitle': 'Alt Baslik',
        // Bottom panel
        'ui.bottom.output': 'Cikti',
        'ui.bottom.problems': 'Sorunlar',
        'ui.bottom.toggle': 'Paneli Gizle/Goster',
        'ui.output.placeholder': 'Build ciktilari burada gorunecek...',
        'ui.problems.none': 'Sorun bulunamadi',
        'ui.status.problems': '0 sorun',

        // Context menu
        'ui.ctx.newFile': 'Yeni Dosya',
        'ui.ctx.newFolder': 'Yeni Klasor',
        'ui.ctx.rename': 'Yeniden Adlandir',
        'ui.ctx.delete': 'Sil',
        'ui.ctx.copyPath': 'Yolu Kopyala',
        'ui.ctx.openExplorer': 'Dosya Gezgininde Ac',
        'ui.ctx.openTerminal': "Terminal'de Ac",

        // Onboarding
        'ui.onboard.step1.title': "CraftIDE'ye Hos Geldiniz!",
        'ui.onboard.step1.desc': 'Hangi tur Minecraft icerigi olusturmak istiyorsunuz?',
        'ui.onboard.step2.title': 'AI Asistan Kurulumu',
        'ui.onboard.step2.desc': 'Kodlama asistaninizi yapilandirin. Yerel Ollama veya bulut servisleri kullanabilirsiniz.',
        'ui.onboard.step3.title': 'Bir Sablonla Basla',
        'ui.onboard.step3.desc': 'Platformunuza uygun hazir sablon secin veya bos baslayin.',
        'ui.onboard.next': 'Devam ->',
        'ui.onboard.back': '<- Geri',
        'ui.onboard.skip': 'Atla',
        'ui.onboard.blank': 'Bos Basla',
        'ui.onboard.provider': 'AI Saglayici',
        'ui.onboard.model': 'Model Adi',
        'ui.onboard.endpoint': 'Endpoint URL',
        'ui.onboard.apikey': 'API Key (opsiyonel)',
        'ui.onboard.recommended': '(Onerilen)',
        'ui.onboard.local': '(Yerel)',

        // Tab names
        'ui.tab.visualBuilder': 'Gorsel Builder',
        'ui.tab.blockbench': 'Blockbench Editor',
        'ui.tab.settings': 'Ayarlar',
        'ui.tab.serverManager': 'Sunucu Yoneticisi',
        'ui.tab.imageEditor': 'Resim Duzenleyici',
        'ui.tab.guiBuilder': 'GUI Builder',
        'ui.tab.commandTree': 'Komut Tasarimci',
        'ui.tab.recipeCreator': 'Tarif Olusturucu',
        'ui.tab.permissionTree': 'Izin Agaci',
                'ui.tab.mcToolsHub': 'Arac Merkezi',

        // MC tools dropdown
        'ui.mctools.newPlugin': 'Yeni Plugin Olustur',
        'ui.mctools.visualBuilder': 'Gorsel Builder',
        'ui.mctools.guiBuilder': 'Chest GUI Builder',
        'ui.mctools.commandTree': 'Komut Agaci Tasarimcisi',
        'ui.mctools.recipeCreator': 'Custom Item ve Tarif',
        'ui.mctools.permissionTree': 'Izin Agaci Olusturucu',
        'ui.mctools.build': "Plugin'i Derle",
        'ui.mctools.testServer': 'Test Sunucusu',
        'ui.mctools.marketplace': 'Blueprint Marketi',
        'ui.mctools.api': 'API Referansi',
        'ui.mctools.blockbench': 'Blockbench Editor',
                'ui.mchub.title': 'Minecraft Arac Merkezi',
        'ui.mchub.desc': 'Araclari arama, kategori ve hizli aksiyonlarla acin.',
        'ui.mchub.search': 'Arac ara...',
        'ui.mchub.cat.all': 'Tum',
        'ui.mchub.cat.builder': 'Builder',
        'ui.mchub.cat.server': 'Sunucu',
        'ui.mchub.cat.integrations': 'Entegrasyon',
        'ui.mchub.open': 'Ac',
        'ui.mchub.empty': 'Aramaniza uyan arac bulunamadi.',
        // Prompts/Dialogs
        'prompt.newFileName': 'Yeni dosya adi:',
                'prompt.quickCreate.invalidName': 'Gecersiz ad.',
        'prompt.quickCreate.nameEmpty': 'Ad bos olamaz.',
        'prompt.quickCreate.exists': 'Bu adla dosya veya klasor zaten var.',
        'prompt.quickCreate.fileTitle': 'Yeni Dosya Olustur',
        'prompt.quickCreate.folderTitle': 'Yeni Klasor Olustur',
        'prompt.quickCreate.placeholder.file': 'yeni-dosya.java',
        'prompt.quickCreate.placeholder.folder': 'yeni-klasor',        'prompt.deleteFolder': '"{name}" klasoru ve tum icerigi silinsin mi?',
        'prompt.deleteFile': '"{name}" dosyasi silinsin mi?',
        'prompt.unsavedImage': 'Resim editorunde kaydedilmemis degisiklikler var.\n\nKaydetmeden cikmak istiyor musunuz?',

        // Visual Builder keys used in code
        'vb.HealthCheck': 'Can Kontrolu',
        'vb.SendMessage': 'Mesaj Gonder',
        'vb.Teleport': 'Isinla',
        'vb.GiveItem': 'Esya Ver',
        'vb.PlaySound': 'Ses Cal',
        'vb.KickPlayer': 'Oyuncuyu At',
        'vb.RunCommand': 'Komut Calistir',
        'msg.blockDeleted': 'Blok silindi',
        'msg.codeGenerated': 'Kod uretildi',
        'mode.plugin': 'Plugin Modu',
        'mode.fabric': 'Fabric Modu',
        'mode.forge': 'Forge Modu',
        'mode.skript': 'Skript Modu',
        'ui.common.latest': 'Son',
        'ui.common.latestOffline': 'Son - Offline',
        'ui.tab.closeGlyph': 'Sekmeyi kapat',
        'terminal.main.title': 'CraftIDE Terminal',
        'terminal.main.cwd': 'Calisma dizini: {cwd}',
        'terminal.server.title': 'CraftIDE Test Sunucusu Konsolu',
        'terminal.server.hint': 'Komut girin - Enter ile sunucuya gonderin',
        'notify.welcomeHint': "CraftIDE'ye hos geldiniz! Yeni bir proje olusturarak baslayin.",
        'notify.basicsHint': 'Temeller: Sol panelden dosyalari yonetin, alttan terminali kullanin.',
        'notify.apiRefHint': 'Java dosyasi acin - hover ile API bilgisini goruntuleyin!',
        'dialog.unsaved.title': 'Kaydedilmemis Degisiklikler',
        'dialog.unsaved.message': '"{name}" dosyasinda kaydedilmemis degisiklikler var.',
        'dialog.unsaved.detail': 'Degisikliklerinizi kaydetmek istiyor musunuz?',
        'dialog.unsaved.save': 'Kaydet',
        'dialog.unsaved.dontSave': 'Kaydetme',
        'dialog.unsaved.cancel': 'Iptal',
        'modal.projectNameLabel': 'Plugin Adi',
        'ui.vb.deployTest': 'Derle & Test Et',
        'ui.vb.empty.title': 'Gorsel Mod / Plugin / Skript Builder',
        'ui.vb.empty.desc': 'Bloklari baglayarak gercek plugin, mod ve skript olusturun',
        'ui.vb.empty.step1': 'Yukaridan proje turunu secin (Plugin/Mod/Skript)',
        'ui.vb.empty.step2': "Canvas'a sag tiklayin ve blok ekleyin",
        'ui.vb.empty.step3': 'Blogun sag portunu baska blogun sol portuna birakin',
        'ui.vb.empty.step4': 'Baglantiyi silmek icin uzerine sag tiklayin',
        'ui.vb.empty.step5': '"Koda Donustur" ile calisan kod uretin',
        'ui.vb.empty.template': 'Hazir Sablona Bak',
        'ui.vb.templatesTitle': 'Hazir Sablonlar',
        'ui.vb.templatesDesc': 'Bir sablonu secin - canvas\'a otomatik yuklenecek ve duzenleyebilirsiniz.',
        'ui.config.title': 'Config Duzenleyici',
        'ui.config.rawYaml': 'Ham YAML',
        'ui.config.save': 'Kaydet',
        'msg.imageSaved': 'Kaydedildi: {name}',
        'msg.imageLoaded': 'Yuklendi: {name} ({size})',
        'msg.imageNoPath': 'Kaydedilecek dosya yolu yok. Dosya agacindan bir PNG acin.',
        'msg.imageSaveError': 'Hata: Dosya kaydedilemedi - {error}',
        'msg.imageLoadError': 'Hata: Resim yuklenemedi - {error}',
                'ui.nc.oneStep': 'Tek-Adim AI',
        'ui.nc.intent': 'Niyet Sihirbazi',
        'ui.nc.packs': 'Davranis Paketleri',
        'ui.nc.validate': 'Dogrula',
        'ui.nc.guaranteed': 'Garantili Build',
        'ui.nc.scenario': 'Senaryo Testi',
        'ui.nc.release': 'Tek-Tik Release',
        'ui.nc.health': 'No-Code Sagligi',
        'ui.nc.validationReady': 'Dogrulama paneli hazir.',
        'ui.nc.suggestionReady': 'Oneri motoru hazir.',
        'ui.nc.modal.oneStepTitle': 'Tek-Adim Dogal Dil -> Plugin',
        'ui.nc.modal.intentTitle': 'Niyet Sihirbazi',
        'ui.nc.modal.packTitle': 'Davranis Paketleri',
        'ui.nc.modal.scenarioTitle': 'Senaryo Calistirici',
        'ui.nc.modal.releaseTitle': 'Tek-Tik Release',
        'ui.nc.close': 'Kapat',
        'ui.nc.run': 'Calistir',
        'ui.nc.analyze': 'Analiz Et',
        'ui.nc.apply': 'Uygula',
        'ui.nc.placeholder.oneStep': 'Istedigin plugini dogal dilde anlat...',
        'ui.nc.placeholder.intent': 'Ozelligi dogal dilde anlat...',
        'ui.nc.placeholder.example': 'or. /spawn komutu ve isinlama',        'ui.gui.title': 'Chest GUI Builder',
        'ui.gui.row1': '1 Satir (9 slot)',
        'ui.gui.row2': '2 Satir (18 slot)',
        'ui.gui.row3': '3 Satir (27 slot)',
        'ui.gui.row4': '4 Satir (36 slot)',
        'ui.gui.row5': '5 Satir (45 slot)',
        'ui.gui.row6': '6 Satir (54 slot)',
        'ui.gui.titlePlaceholder': 'GUI Basligi',
        'ui.gui.exportVB': "VB'ye Aktar",
        'ui.gui.generate': 'Kodu Uret',
        'ui.gui.clear': 'Temizle',
        'ui.gui.hint': 'Slot tikla -> konfigure et -> uygula',
        'ui.gui.slotSelect': 'Slot Sec',
        'ui.gui.material': 'Malzeme',
        'ui.gui.displayName': 'Gorunen Ad (& renk kodlari)',
        'ui.gui.description': 'Aciklama (satir basina Enter)',
        'ui.gui.clickAction': 'Tiklama Aksiyonu',
        'ui.gui.action.none': 'Yok',
        'ui.gui.action.command': 'Komut Calistir',
        'ui.gui.action.give': 'Esya Ver',
        'ui.gui.action.close': 'Envanteri Kapat',
        'ui.gui.valuePlaceholder': 'Komut veya deger',
        'ui.gui.apply': 'Uygula',
        'ui.command.title': 'Komut Agaci Tasarimcisi',
        'ui.command.addSub': '+ Alt Komut',
        'ui.command.addArg': '+ Arguman',
        'ui.command.delete': 'Sil',
        'ui.command.generateJava': 'Java Uret',
        'ui.command.generateSkript': 'Skript Uret',
        'ui.command.root': 'Kok Komut',
        'ui.command.sub': 'Alt Komut',
        'ui.command.name': 'Komut Adi',
        'ui.command.desc': 'Aciklama',
        'ui.command.descPlaceholder': 'Komut aciklamasi',
        'ui.command.permission': 'Yetki (permission)',
        'ui.command.aliases': 'Takma Adlar (virgulle)',
        'ui.command.args': 'Argumanlar',
        'ui.command.argName': 'ad',
        'ui.command.argOptional': 'Istege bagli',
        'ui.recipe.title': 'Custom Item & Tarif Olusturucu',
        'ui.recipe.shaped': 'Sekilli',
        'ui.recipe.shapeless': 'Sekilsiz',
        'ui.recipe.clear': 'Temizle',
        'ui.recipe.generate': 'Kodu Uret',
        'ui.recipe.table': 'Crafting Tablosu',
        'ui.recipe.result': 'Sonuc',
        'ui.recipe.slotConfig': 'Slot Konfigurasyonu',
        'ui.recipe.resultItem': 'Sonuc Esyasi',
        'ui.recipe.material': 'Malzeme',
        'ui.recipe.count': 'Adet',
        'ui.recipe.name': 'Gorunen Ad',
        'ui.recipe.lore': 'Aciklama',
        'ui.recipe.apply': 'Uygula',
        'ui.permission.title': 'Izin Agaci Olusturucu',
        'ui.permission.addSub': '+ Alt Izin',
        'ui.permission.delete': 'Sil',
        'ui.permission.generateYml': 'plugin.yml Uret',
        'ui.permission.generateLuckPerms': 'LuckPerms Uret',
        'ui.permission.root': 'Kok Izin',
        'ui.permission.node': 'Izin',
        'ui.permission.name': 'Izin Adi',
        'ui.permission.desc': 'Aciklama',
        'ui.permission.descPlaceholder': 'Bu iznin aciklamasi',
        'ui.permission.default': 'Varsayilan',
        'ui.market.title': 'Blueprint Marketi',
        'ui.market.search': 'Ara...',
        'ui.market.all': 'Tumu',
        'ui.market.publishTitle': 'Blueprint Yayinla',
        'ui.market.publishHint': "Mevcut VB canvas'i blueprint olarak kaydet",
        'ui.market.name': 'Blueprint Adi',
        'ui.market.desc': 'Aciklama',
        'ui.market.publish': 'Yayinla',
        'ui.market.emptyTitle': 'Henuz sablon yok',
        'ui.market.emptyDesc': "Visual Builder'da bir blueprint olusturun ve Yayinla butonuna basin",
        'ui.market.noDesc': 'Aciklama yok',
        'ui.market.anonymous': 'Anonim',
        'ui.market.blocks': 'blok',
        'ui.market.load': 'Yukle',
        'ui.image.grid': 'Izgara',
        'ui.image.clear': 'Temizle',
        'ui.image.new': 'Yeni',
        'ui.image.save': 'Kaydet',
        'ui.image.status.ready': 'Hazir',
        'ui.image.status.newFile': 'Yeni dosya',
        'ui.image.status.pixel': 'Piksel: {x},{y}',
        'ui.image.tool.pencil': 'Kalem',
        'ui.image.tool.eraser': 'Silgi',
        'ui.image.tool.fill': 'Doldur',
        'ui.image.tool.eyedrop': 'Renk Al',
        'ui.image.tool.rect': 'Dikdortgen',
        'ui.image.tool.line': 'Cizgi',
        'ui.image.tool.hand': 'Gezin',
        'ui.image.noPath': 'Kaydedilecek dosya yolu yok. Once dosya agacindan bir PNG acin.',
        'prompt.image.newCanvas': 'Yeni tuval olusturulsun mu? Kaydedilmemis degisiklikler kaybolacak.',
        'msg.guiCleared': 'GUI temizlendi',
        'msg.slotUpdated': 'Slot guncellendi',
        'msg.guiExported': "GUI, Visual Builder'a aktarildi!",
        'msg.guiCodeGenerated': 'GUI kodu uretildi!',
        'msg.recipeCleared': 'Tarif temizlendi',
        'msg.resultUpdated': 'Sonuc guncellendi!',
        'msg.selectResultMaterial': 'Once sonuc malzemesini secin!',
        'msg.recipeCodeGenerated': 'Tarif kodu uretildi!',
        'msg.commandDeleted': 'Alt komut silindi',
        'msg.fileGenerated': '{name} uretildi!',
        'msg.permissionDeleted': 'Izin silindi',
        'msg.permissionsGenerated': 'plugin.yml izinleri uretildi!',
        'msg.luckpermsGenerated': 'LuckPerms komutlari uretildi!',
        'msg.noBlocksInVB': "Once Visual Builder'a blok ekleyin!",
        'msg.enterBlueprintName': 'Blueprint adi girin!',
        'msg.publishError': 'Yayinlama hatasi: {error}',
        'msg.blueprintPublished': 'Blueprint yayinlandi!',
        'msg.visualBuilderNotLoaded': 'Visual Builder yuklu degil!',
        'msg.blueprintLoaded': 'Blueprint yuklendi: {name}',
        'msg.fileCreated': '{name} oluşturuldu',
        'msg.folderCreateError': 'Klasör oluşturulamadı!',
        'msg.fileReadError': 'Dosya okunamadı!',
        'msg.fileSaveError': 'Dosya kaydedilemedi!',
        'msg.fileSaved': '{name} kaydedildi',
        'msg.fileDeleted': '{name} silindi',
        'msg.pathCopied': 'Yol kopyalandı',
        'msg.terminalDirChanged': 'Terminal dizini değiştirildi',
        'msg.treeRefreshed': 'Dosya ağacı yenilendi',
        'msg.openProjectFirst': 'Önce bir proje açın!',
        'msg.pluginNameRequired': 'Plugin adı gerekli!',
        'msg.projectCreated': '{name} başarıyla oluşturuldu!',
        'msg.error': 'Hata: {error}',
        'msg.renamed': '{old} → {new}',
        'modal.label.pluginName': 'Plugin Adı',
        'modal.label.modName': 'Mod Adı',
        'modal.label.skriptName': 'Skript Adı',
        'msg.serverError': 'Sunucuda hata: {type}',
        'msg.serverErrorLocation': 'Sunucuda hata: {type} ({location})',
        'ui.server.aiAnalyze': 'AI Analiz',
        'ui.server.aiFix': 'Tek Tik Duzelt',
        'msg.aiAnalyzePrompt': 'Bu Java hatasını analiz et ve nasıl düzelteceğimi söyle:\n',
        'msg.errorFallback': 'Hata',
        'msg.building': 'Derleniyor...',
        'msg.buildError': 'Derleme hatasi: {error}',
        'msg.buildSuccess': 'Derleme basarili!',
        'msg.buildFileNotFound': 'Derlenmis dosya bulunamadi! Hedef (.jar veya .sk) dosyanizin olusturuldugunden emin olun.',
    }
};

class LangManager {
    constructor() {
        this.currentLang = localStorage.getItem('setting-language') || 'en';
        document.documentElement.lang = this.currentLang;
    }

    setLanguage(lang) {
        if (!['en', 'tr'].includes(lang)) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('setting-language', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();

        if (typeof window.rebuildContextMenu === 'function') window.rebuildContextMenu();
        document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang: this.currentLang } }));
    }

    t(key, params = {}) {
        let text = DICT[this.currentLang][key] || DICT.en[key] || key;
        for (const [k, v] of Object.entries(params)) {
            text = text.replaceAll(`{${k}}`, String(v));
        }
        return text;
    }

    localizeMessage(rawMessage) {
        let message = String(rawMessage || '');
        if (!message) return message;

        if (this.currentLang === 'en') {
            const replacements = [
                [/Önce bir proje açın!?/gi, 'Open a project first!'],
                [/Klasör oluşturulamadı!?/gi, 'Could not create folder!'],
                [/Dosya okunamadı!?/gi, 'Could not read file!'],
                [/Dosya kaydedilemedi!?/gi, 'Could not save file!'],
                [/Ayarlar kaydedildi\.?/gi, 'Settings saved.'],
                [/Build başarılı!?/gi, 'Build succeeded!'],
                [/Build hatası!?/gi, 'Build failed!'],
                [/Build başarısız oldu\.?/gi, 'Build failed.'],
                [/Sunucu zaten çalışıyor\.?/gi, 'Server is already running.'],
                [/Sunucu şu an çalışmıyor\.?/gi, 'Server is not running right now.'],
                [/Sunucu durduruluyor\.\.\./gi, 'Stopping server...'],
                [/Derleniyor\.\.\./gi, 'Building...'],
                [/Derleme başarılı!?/gi, 'Build completed successfully!'],
                [/Derleme hatası:/gi, 'Build error:'],
                [/Yükleme hatası:/gi, 'Deploy error:'],
                [/Bulunamadı!?/gi, 'Not found!'],
                [/Projeyi derleyip sunucuya aktarıyoruz\.\.\./gi, 'Building project and deploying to server...'],
                [/Sunucu yenileniyor\.\.\./gi, 'Reloading server...'],
                [/Skript dosyası kaydedildi!?/gi, 'Skript file saved!'],
                [/Skript sunucuya yüklendi!?/gi, 'Skript deployed to server!'],
                [/Test sunucusu çalışıyor!?/gi, 'Test server is running!'],
                [/Kod proje dosyasına yazılıyor\.\.\./gi, 'Writing code into project file...'],
                [/Plugin adı gerekli!?/gi, 'Plugin name is required!'],
                [/Yol kopyaland[ıi]/gi, 'Path copied'],
                [/Terminal dizini de[gğ]i[sş]tirildi/gi, 'Terminal directory changed'],
                [/Dosya a[gğ]ac[ıi] yenilendi/gi, 'File tree refreshed'],
                [/Sunucuda hata:/gi, 'Server error:'],
                [/JAR bulunamad[ıi]/gi, 'JAR not found'],
                [/Java dosyas[ıi] g[uü]ncellendi:/gi, 'Java file updated:'],
                [/Önce Visual Builder'?a blok ekleyin!?/gi, 'Add blocks in Visual Builder first!'],
                [/CraftIDE'ye ho[sş] geldiniz! Yeni bir proje olu[sş]turarak ba[sş]lay[ıi]n\./gi, 'Welcome to CraftIDE! Start by creating a new project.'],
                [/Temeller: Sol men[uü]den dosyalar[ıi]n[ıi]z[ıi] y[oö]netebilir, alttan terminali kullanabilirsiniz\./gi, 'Basics: Manage files from the left panel and use the terminal below.'],
                [/Hata:/gi, 'Error:'],
                [/başarıyla oluşturuldu/gi, 'created successfully'],
                [/oluşturuldu/gi, 'created'],
                [/açıldı/gi, 'opened'],
                [/kaydedildi/gi, 'saved'],
                [/Güncelleyici durumu kullanılamıyor\.?/gi, 'Updater state is unavailable.'],
                [/Güncelleyici beklemede\.?/gi, 'Updater is idle.'],
                [/Yeni sürüm hazır: v/gi, 'New version available: v'],
                [/Güncelleme indirildi: v/gi, 'Update downloaded: v'],
                [/En son resmi sürüm kontrol ediliyor\.\.\./gi, 'Checking latest official release...'],
                [/Doğrulama başarısız: /gi, 'Verification failed: '],
                [/Resmi güncelleme kontrolü başarısız: /gi, 'Official update check failed: '],
                [/Güncelleme indirilemedi: /gi, 'Update download failed: '],
                [/Kurulum başlatılamadı: /gi, 'Install could not be started: '],
                [/Kurulumun başlaması için önce indirilmiş bir güncelleme gerekli\.?/gi, 'A downloaded update is required before installation can start.'],
                [/Güncellemeyi kurmak için uygulama yeniden başlatılıyor\.?/gi, 'The app is restarting to install the update.'],
                [/Kanal kilidi: /gi, 'Channel locked: '],
                [/Resmi etiket: /gi, 'Official tag: '],
                [/Checksum dosyası: /gi, 'Checksums asset: '],
                [/Yerel app\.asar SHA256: /gi, 'Local app.asar SHA256: '],
                [/Bir neden sağlanmadı\.?/gi, 'No reason provided.'],
                [/Detay yok\.?/gi, 'No detail.'],
                [/Yerel sürüm bütünlüğü resmi release checksum dosyalarıyla karşılaştırılıyor\.\.\./gi, 'Checking local build integrity against official release checksums...'],
                [/Taşınabilir sürümler uygulama içi otomatik güncellemeyi desteklemez\. Kurulum sürümünü kullanın\.?/gi, 'Portable builds do not support in-app auto update. Use the installer build.'],
                [/Taşınabilir sürümler bütünlük doğrulaması için uygun değildir\. Kurulum sürümünü kullanın\.?/gi, 'Portable builds are not eligible for integrity verification. Use the installer build.'],
                [/Bu sürüm için yerel app\.asar kullanılamıyor\.?/gi, 'Local app.asar is not available for this build.'],
                [/Yerel app\.asar okunamadı: /gi, 'Local app.asar could not be read: '],
                [/Bu sürüm için resmi GitHub release bulunamadı\.?/gi, 'No official GitHub release found for this version.'],
                [/Release checksum dosyası eksik\.?/gi, 'Release checksum asset missing.'],
            ];
            replacements.forEach(([pattern, value]) => {
                message = message.replace(pattern, value);
            });
            return message;
        }

        if (this.currentLang === 'tr') {
            const replacements = [
                [/Open a project first!?/gi, 'Önce bir proje açın!'],
                [/Settings saved\.?/gi, 'Ayarlar kaydedildi.'],
                [/Build succeeded!?/gi, 'Build başarılı!'],
                [/Build failed!?/gi, 'Build hatası!'],
                [/Updater state is unavailable\.?/gi, 'Güncelleyici durumu kullanılamıyor.'],
                [/Updater is idle\.?/gi, 'Güncelleyici beklemede.'],
                [/New version available: v/gi, 'Yeni sürüm hazır: v'],
                [/Update downloaded: v/gi, 'Güncelleme indirildi: v'],
                [/Checking latest official release\.\.\./gi, 'En son resmi sürüm kontrol ediliyor...'],
                [/Verification failed: /gi, 'Doğrulama başarısız: '],
                [/Official update check failed: /gi, 'Resmi güncelleme kontrolü başarısız: '],
                [/Update download failed: /gi, 'Güncelleme indirilemedi: '],
                [/Install could not be started: /gi, 'Kurulum başlatılamadı: '],
                [/A downloaded update is required before installation can start\.?/gi, 'Kurulumun başlaması için önce indirilmiş bir güncelleme gerekli.'],
                [/The app is restarting to install the update\.?/gi, 'Güncellemeyi kurmak için uygulama yeniden başlatılıyor.'],
                [/Channel locked: /gi, 'Kanal kilidi: '],
                [/Official tag: /gi, 'Resmi etiket: '],
                [/Checksums asset: /gi, 'Checksum dosyası: '],
                [/Local app\.asar SHA256: /gi, 'Yerel app.asar SHA256: '],
                [/No reason provided\.?/gi, 'Bir neden sağlanmadı.'],
                [/No detail\.?/gi, 'Detay yok.'],
                [/Checking local build integrity against official release checksums\.\.\./gi, 'Yerel sürüm bütünlüğü resmi release checksum dosyalarıyla karşılaştırılıyor...'],
                [/Portable builds do not support in-app auto update\. Use the installer build\.?/gi, 'Taşınabilir sürümler uygulama içi otomatik güncellemeyi desteklemez. Kurulum sürümünü kullanın.'],
                [/Portable builds are not eligible for integrity verification\. Use the installer build\.?/gi, 'Taşınabilir sürümler bütünlük doğrulaması için uygun değildir. Kurulum sürümünü kullanın.'],
                [/Local app\.asar is not available for this build\.?/gi, 'Bu sürüm için yerel app.asar kullanılamıyor.'],
                [/Local app\.asar could not be read: /gi, 'Yerel app.asar okunamadı: '],
                [/No official GitHub release found for this version\.?/gi, 'Bu sürüm için resmi GitHub release bulunamadı.'],
                [/Release checksum asset missing\.?/gi, 'Release checksum dosyası eksik.'],
            ];
            replacements.forEach(([pattern, value]) => {
                message = message.replace(pattern, value);
            });
        }
        return message;
    }

    _setText(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.textContent = this.t(key, params);
    }

    _setTitle(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.title = this.t(key, params);
    }

    _setPlaceholder(selector, key, params = {}) {
        const el = document.querySelector(selector);
        if (el) el.placeholder = this.t(key, params);
    }

    _setOption(selector, value, key) {
        const el = document.querySelector(`${selector} option[value="${value}"]`);
        if (el) el.textContent = this.t(key);
    }

    _setIconLinkText(selector, key) {
        const el = document.querySelector(selector);
        if (!el) return;
        const svg = el.querySelector('svg');
        if (svg && svg.parentElement === el) {
            el.innerHTML = `${svg.outerHTML} ${this.t(key)}`;
            return;
        }
        el.textContent = this.t(key);
    }

    _setContextText(action, key, icon = '') {
        const el = document.querySelector(`#context-menu .context-item[data-action="${action}"]`);
        if (!el) return;
        el.textContent = icon ? `${icon} ${this.t(key)}` : this.t(key);
    }

    applyStaticTranslations() {
        const currentPath = window.CraftIDEAppState?.getCurrentFilePath?.();
        if (!currentPath) this._setText('#titlebar-filename', 'ui.titlebar.welcome');

        this._setTitle('#btn-minimize', 'ui.title.minimize');
        this._setTitle('#btn-maximize', 'ui.title.maximize');
        this._setTitle('#btn-close', 'ui.title.close');

        this._setTitle('#btn-new-file', 'ui.sidebar.newFile');
        this._setTitle('#btn-new-folder', 'ui.sidebar.newFolder');
        this._setTitle('#btn-refresh-tree', 'ui.sidebar.refresh');
        this._setTitle('#btn-open-folder', 'ui.sidebar.openFolder');

        this._setText('#visual-builder-container .vb-toolbar-title', 'ui.vb.title');
        this._setText('#visual-builder-container .vb-toolbar-hint', 'ui.vb.hint');
        this._setIconLinkText('#btn-vb-save', 'ui.vb.save');
        this._setIconLinkText('#btn-vb-load', 'ui.vb.load');
        this._setIconLinkText('#btn-vb-templates', 'ui.vb.templates');
        this._setIconLinkText('#btn-vb-generate', 'ui.vb.generate');
        this._setIconLinkText('#btn-vb-clear', 'ui.vb.clear');
        this._setIconLinkText('#btn-vb-deploy', 'ui.vb.deployTest');
        this._setOption('#vb-mode-select', 'plugin', 'mode.plugin');
        this._setOption('#vb-mode-select', 'fabric', 'mode.fabric');
        this._setOption('#vb-mode-select', 'forge', 'mode.forge');
        this._setOption('#vb-mode-select', 'skript', 'mode.skript');

        // VB Empty hint
        this._setText('#vb-empty-hint h3', 'ui.vb.empty.title');
        this._setText('#vb-empty-hint > p', 'ui.vb.empty.desc');
        const vbSteps = document.querySelectorAll('#vb-empty-hint .vb-step');
        const stepKeys = ['ui.vb.empty.step1', 'ui.vb.empty.step2', 'ui.vb.empty.step3', 'ui.vb.empty.step4', 'ui.vb.empty.step5'];
        vbSteps.forEach((step, i) => {
            if (stepKeys[i]) {
                const span = step.querySelector('span');
                if (span) { step.innerHTML = span.outerHTML + ' ' + this.t(stepKeys[i]); }
                else { step.textContent = this.t(stepKeys[i]); }
            }
        });
        this._setIconLinkText('#btn-vb-load-template-hint', 'ui.vb.empty.template');

        // VB Templates modal
        this._setText('#vb-templates-modal .modal-header h2', 'ui.vb.templatesTitle');
        this._setText('#vb-templates-modal .modal-body > p', 'ui.vb.templatesDesc');

        // GUI Builder
        this._setOption('#gb-rows-select', '1', 'ui.gui.row1');
        this._setOption('#gb-rows-select', '2', 'ui.gui.row2');
        this._setOption('#gb-rows-select', '3', 'ui.gui.row3');
        this._setOption('#gb-rows-select', '4', 'ui.gui.row4');
        this._setOption('#gb-rows-select', '5', 'ui.gui.row5');
        this._setOption('#gb-rows-select', '6', 'ui.gui.row6');
        const gbTitleInput = document.getElementById('gb-gui-title');
        if (gbTitleInput) gbTitleInput.placeholder = this.t('ui.gui.titlePlaceholder');
        this._setIconLinkText('#btn-gb-export-vb', 'ui.gui.exportVB');
        this._setIconLinkText('#btn-gb-generate-code', 'ui.gui.generate');
        this._setIconLinkText('#btn-gb-clear-gb', 'ui.gui.clear');
        const gbHint = document.querySelector('#gb-grid-area > div:first-child');
        if (gbHint && gbHint.style) gbHint.textContent = this.t('ui.gui.hint');
        this._setText('#gb-slot-title', 'ui.gui.slotSelect');
        const gbLabels = document.querySelectorAll('#gb-config-panel > label');
        const gbLabelKeys = ['ui.gui.material', 'ui.gui.displayName', 'ui.gui.description', 'ui.gui.clickAction'];
        gbLabelKeys.forEach((key, i) => { if (gbLabels[i]) gbLabels[i].textContent = this.t(key); });
        this._setOption('#gb-click-action', 'none', 'ui.gui.action.none');
        this._setOption('#gb-click-action', 'command', 'ui.gui.action.command');
        this._setOption('#gb-click-action', 'give', 'ui.gui.action.give');
        this._setOption('#gb-click-action', 'close', 'ui.gui.action.close');
        const gbValueInput = document.getElementById('gb-click-value');
        if (gbValueInput) gbValueInput.placeholder = this.t('ui.gui.valuePlaceholder');
        this._setText('#btn-gb-apply-slot', 'ui.gui.apply');

        // Marketplace
        this._setText('#marketplace-container > div:first-child > span', 'ui.market.title');
        const mkSearch = document.getElementById('mk-search');
        if (mkSearch) mkSearch.placeholder = this.t('ui.market.search');
        this._setText('.mk-filter-btn[data-mode="all"]', 'ui.market.all');
        this._setText('#marketplace-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)', 'ui.market.publishTitle');
        this._setText('#marketplace-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(2)', 'ui.market.publishHint');
        const mkLabels = document.querySelectorAll('#marketplace-container > div:nth-child(2) > div:nth-child(2) > label');
        if (mkLabels[0]) mkLabels[0].textContent = this.t('ui.market.name');
        if (mkLabels[1]) mkLabels[1].textContent = this.t('ui.market.desc');
        this._setText('#btn-mk-publish', 'ui.market.publish');

        // Recipe Creator
        this._setText('#recipe-creator-container > div:first-child > span', 'ui.recipe.title');
        this._setText('.rc-type-btn[data-type="shaped"]', 'ui.recipe.shaped');
        this._setText('.rc-type-btn[data-type="shapeless"]', 'ui.recipe.shapeless');
        this._setIconLinkText('#btn-rc-clear', 'ui.recipe.clear');
        this._setIconLinkText('#btn-rc-generate', 'ui.recipe.generate');
        this._setText('#recipe-creator-container div[style*="Crafting"]', 'ui.recipe.table');
        const rcResultLabel = document.querySelector('#recipe-creator-container div[style*="Sonuç"], #recipe-creator-container div[style*="Result"]');
        if (rcResultLabel) rcResultLabel.textContent = this.t('ui.recipe.result');
        this._setText('#rc-cell-config > div:first-child', 'ui.recipe.slotConfig');
        this._setText('#rc-result-config > div:first-child', 'ui.recipe.resultItem');
        const rcCellLabels = document.querySelectorAll('#rc-cell-config > label');
        if (rcCellLabels[0]) rcCellLabels[0].textContent = this.t('ui.recipe.material');
        if (rcCellLabels[1]) rcCellLabels[1].textContent = this.t('ui.recipe.count');
        const rcResultLabels = document.querySelectorAll('#rc-result-config > label');
        if (rcResultLabels[0]) rcResultLabels[0].textContent = this.t('ui.recipe.material');
        if (rcResultLabels[1]) rcResultLabels[1].textContent = this.t('ui.recipe.name');
        if (rcResultLabels[2]) rcResultLabels[2].textContent = this.t('ui.recipe.lore');
        if (rcResultLabels[3]) rcResultLabels[3].textContent = this.t('ui.recipe.count');

        // Permission Tree
        this._setText('#permission-tree-container > div:first-child > span', 'ui.permission.title');
        this._setText('#btn-pt-add-child', 'ui.permission.addSub');
        this._setIconLinkText('#btn-pt-delete', 'ui.permission.delete');
        this._setText('#btn-pt-generate-yml', 'ui.permission.generateYml');
        this._setText('#btn-pt-generate-luckperms', 'ui.permission.generateLuckPerms');

        // Command Tree
        this._setText('#command-tree-container > div:first-child > span', 'ui.command.title');
        this._setText('#btn-ct-add-sub', 'ui.command.addSub');
        this._setText('#btn-ct-add-arg', 'ui.command.addArg');
        this._setIconLinkText('#btn-ct-delete', 'ui.command.delete');
        this._setText('#btn-ct-generate-java', 'ui.command.generateJava');
        this._setText('#btn-ct-generate-skript', 'ui.command.generateSkript');

        // Config Editor
        this._setText('#config-editor-container > div:first-child > span', 'ui.config.title');
        this._setText('#btn-config-raw-toggle', 'ui.config.rawYaml');
        this._setIconLinkText('#btn-config-save', 'ui.config.save');

        this._setText('#tab-bar .tab[data-tab="welcome"] .tab-name', 'ui.titlebar.welcome');
        this._setText('.welcome-col-left .welcome-section:nth-of-type(1) h2', 'ui.welcome.start');
        this._setIconLinkText('#wl-new-file', 'ui.welcome.newFile');
        this._setIconLinkText('#wl-open-file', 'ui.welcome.openFile');
        this._setIconLinkText('#wl-open-folder', 'ui.welcome.openFolder');
        this._setIconLinkText('#btn-new-project', 'ui.welcome.newProject');
        this._setIconLinkText('#wl-ai-create', 'ui.welcome.aiCreate');
        this._setText('.welcome-col-left .welcome-section:nth-of-type(2) h2', 'ui.welcome.recent');
        this._setText('#welcome-recent-list .welcome-recent-empty', 'ui.welcome.recentEmpty');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(1) h2', 'ui.welcome.guides');
        this._setText('#wt-get-started .wt-title', 'ui.welcome.wt.getStarted.title');
        this._setText('#wt-get-started .wt-desc', 'ui.welcome.wt.getStarted.desc');
        this._setText('#wt-learn-basics .wt-title', 'ui.welcome.wt.learnBasics.title');
        this._setText('#btn-build-plugin .wt-title', 'ui.welcome.wt.build.title');
        this._setText('#btn-build-plugin .wt-desc', 'ui.welcome.wt.build.desc');
        this._setText('#btn-build-plugin .wt-badge', 'ui.welcome.badge.new');
        this._setText('#btn-test-server .wt-title', 'ui.welcome.wt.server.title');
        this._setText('#btn-test-server .wt-desc', 'ui.welcome.wt.server.desc');
        this._setText('#btn-test-server .wt-badge', 'ui.welcome.badge.new');
        this._setText('#btn-api-ref .wt-title', 'ui.welcome.wt.api.title');
        this._setText('#btn-api-ref .wt-desc', 'ui.welcome.wt.api.desc');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(2) h2', 'ui.welcome.mcVersionTitle');
        this._setText('.welcome-col-right .welcome-section:nth-of-type(2) .welcome-mc-version label', 'ui.welcome.targetVersion');
        this._setText('.welcome-more-link', 'ui.welcome.more');

        const startupLabel = document.querySelector('.welcome-footer .welcome-checkbox');
        if (startupLabel) {
            const checkbox = startupLabel.querySelector('input');
            if (checkbox) {
                const textNode = Array.from(startupLabel.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.nodeValue = ` ${this.t('ui.welcome.showOnStartup')}`;
                else startupLabel.appendChild(document.createTextNode(` ${this.t('ui.welcome.showOnStartup')}`));
            }
        }

        this._setText('#settings-container .settings-tab-header p', 'ui.settings.subtitle');
        const settingGroupTitles = document.querySelectorAll('#settings-container .setting-group h3');
        if (settingGroupTitles[0]) settingGroupTitles[0].textContent = this.t('ui.settings.group.ai');
        if (settingGroupTitles[1]) settingGroupTitles[1].textContent = this.t('ui.settings.group.editor');
        if (settingGroupTitles[2]) settingGroupTitles[2].textContent = this.t('ui.settings.group.project');

        const labels = document.querySelectorAll('#settings-container .setting-item label');
        const settingLabelKeys = [
            'settings.aiProvider',
            'ui.settings.model',
            'ui.settings.endpoint',
            'ui.settings.apiKey',
            'ui.settings.fontSize',
            'ui.settings.fontFamily',
            'ui.settings.tabSize',
            'ui.settings.minimap',
            'ui.settings.wordWrap',
            'ui.settings.defaultPlatform',
            'settings.lang',
        ];
        settingLabelKeys.forEach((key, idx) => {
            if (labels[idx]) labels[idx].textContent = this.t(key);
        });
        this._setOption('#setting-minimap', 'true', 'ui.option.on');
        this._setOption('#setting-minimap', 'false', 'ui.option.off');
        this._setOption('#setting-wordwrap', 'off', 'ui.option.off');
        this._setOption('#setting-wordwrap', 'on', 'ui.option.on');
        this._setOption('#setting-wordwrap', 'wordWrapColumn', 'ui.option.column');
        this._setOption('#setting-language', 'en', 'settings.lang.en');
        this._setOption('#setting-language', 'tr', 'settings.lang.tr');

        this._setText('#server-manager-container .settings-tab-header h1', 'server.title');
        this._setText('#server-manager-container .settings-tab-header p', 'server.desc');
        this._setText('#btn-sm-start', 'server.start');
        this._setText('#btn-sm-stop', 'server.stop');
        this._setText('#btn-sm-deploy', 'ui.server.deploy');
        this._setTitle('#btn-sm-deploy', 'ui.server.deployTitle');
        this._setOption('#sm-type-select', 'paper', 'ui.server.type.paper');
        this._setOption('#sm-type-select', 'spigot', 'ui.server.type.spigot');
        this._setOption('#sm-type-select', 'fabric', 'ui.server.type.fabric');
        this._setOption('#sm-type-select', 'forge', 'ui.server.type.forge');
        this._setOption('#sm-type-select', 'vanilla', 'ui.server.type.vanilla');
        const inputMcSelect = document.getElementById('input-mc-version');
        if (inputMcSelect && inputMcSelect.options && inputMcSelect.options.length === 1) {
            inputMcSelect.options[0].textContent = this.t('ui.server.loadingVersions');
        }
        const smSelect = document.getElementById('sm-version-select');
        if (smSelect && smSelect.options && smSelect.options.length === 1) {
            smSelect.options[0].textContent = this.t('ui.server.loadingVersions');
        }
        this._setText('#sm-problems-panel > div:first-child', 'ui.server.problems');

        this._setText('.bottom-tab[data-btab="output"]', 'ui.bottom.output');
        this._setText('.bottom-tab[data-btab="problems"]', 'ui.bottom.problems');
        this._setTitle('#btn-toggle-panel', 'ui.bottom.toggle');

        const outputLine = document.querySelector('#output-output .terminal-line.dim');
        if (outputLine) outputLine.textContent = this.t('ui.output.placeholder');
        const problemsLine = document.querySelector('#problems-output .terminal-line.dim');
        if (problemsLine) problemsLine.textContent = this.t('ui.problems.none');
        this._setText('#status-problems', 'ui.status.problems');

        this._setContextText('newFile', 'ui.ctx.newFile', '📄');
        this._setContextText('newFolder', 'ui.ctx.newFolder', '📁');
        this._setContextText('rename', 'ui.ctx.rename', '✏️');
        this._setContextText('delete', 'ui.ctx.delete', '🗑️');
        this._setContextText('copyPath', 'ui.ctx.copyPath', '📋');
        this._setContextText('openInExplorer', 'ui.ctx.openExplorer', '📂');
        this._setContextText('openInTerminal', 'ui.ctx.openTerminal', '💻');

        this._setText('#modal-new-project .modal-header h2', 'modal.newProject.title');
        const recommended = document.querySelector('#modal-new-project .platform-card[data-platform="paper"] .platform-tag');
        if (recommended) recommended.textContent = this.t('ui.modal.recommended');
        this._setText('#label-project-name', 'modal.projectNameLabel');

        this._setText('#ob-step-0 h2', 'ui.onboard.step1.title');
        this._setText('#ob-step-0 p', 'ui.onboard.step1.desc');
        this._setText('#ob-next-0', 'ui.onboard.next');
        this._setText('#ob-step-1 h2', 'ui.onboard.step2.title');
        this._setText('#ob-step-1 p', 'ui.onboard.step2.desc');
        this._setText('#ob-step-1 label:nth-of-type(1)', 'ui.onboard.provider');
        this._setText('#ob-step-1 label:nth-of-type(2)', 'ui.onboard.model');
        this._setText('#ob-step-1 label:nth-of-type(3)', 'ui.onboard.endpoint');
        this._setText('#ob-step-1 label:nth-of-type(4)', 'ui.onboard.apikey');
        this._setText('#ob-back-1', 'ui.onboard.back');
        this._setText('#ob-skip-ai', 'ui.onboard.skip');
        this._setText('#ob-next-1', 'ui.onboard.next');
        this._setText('#ob-step-2 h2', 'ui.onboard.step3.title');
        this._setText('#ob-step-2 p', 'ui.onboard.step3.desc');
        this._setText('#ob-back-2', 'ui.onboard.back');
        this._setText('#ob-blank-start', 'ui.onboard.blank');
    }

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                const input = el;
                if (input.type === 'button' || input.type === 'submit') input.value = this.t(key);
                else input.placeholder = this.t(key);
            } else {
                el.textContent = this.t(key);
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;
            if ('placeholder' in el) el.placeholder = this.t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            if (!key) return;
            el.title = this.t(key);
        });

        this.applyStaticTranslations();
        document.title = this.t('lang.title');
    }
}

window.Lang = new LangManager();

window.addEventListener('DOMContentLoaded', () => {
    window.Lang.applyTranslations();
});

