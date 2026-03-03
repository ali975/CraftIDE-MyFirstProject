import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CraftIDE Proje Oluşturucu (Project Scaffolder)
 * 
 * Minecraft plugin/skript projelerini tek tıkla oluşturur.
 * Desteklenen platformlar: Spigot, Paper, Fabric, Skript, Velocity, BungeeCord
 */
export class ProjectScaffolder {

    /**
     * Yeni proje oluşturma wizard'ını başlatır
     */
    async createNewProject(): Promise<void> {
        // 1. Platform seçimi
        const platform = await vscode.window.showQuickPick(
            [
                { label: '$(server) Spigot Plugin', description: 'Java — Spigot API', value: 'spigot' },
                { label: '$(server) Paper Plugin', description: 'Java — Paper API (önerilen)', value: 'paper' },
                { label: '$(package) Fabric Mod', description: 'Java — Fabric API', value: 'fabric' },
                { label: '$(file-text) Skript Script', description: 'Skript — Kodsuz geliştirme', value: 'skript' },
                { label: '$(globe) Velocity Plugin', description: 'Java — Velocity Proxy', value: 'velocity' },
                { label: '$(globe) BungeeCord Plugin', description: 'Java — BungeeCord Proxy', value: 'bungeecord' },
            ],
            {
                placeHolder: 'Proje türünü seçin',
                title: '⛏️ CraftIDE — Yeni Proje (1/5)',
            }
        );
        if (!platform) { return; }

        // 2. Minecraft versiyonu
        const mcVersion = await vscode.window.showQuickPick(
            ['1.21.4', '1.21.3', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.18.2', '1.16.5'],
            {
                placeHolder: 'Minecraft versiyonunu seçin',
                title: '⛏️ CraftIDE — Yeni Proje (2/5)',
            }
        );
        if (!mcVersion) { return; }

        // 3. Proje adı
        const projectName = await vscode.window.showInputBox({
            prompt: 'Plugin/proje adını girin',
            title: '⛏️ CraftIDE — Yeni Proje (3/5)',
            placeHolder: 'MyAwesomePlugin',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Proje adı boş olamaz';
                }
                if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
                    return 'Proje adı harf ile başlamalı, sadece harf, rakam, tire ve alt çizgi içerebilir';
                }
                return null;
            },
        });
        if (!projectName) { return; }

        // 4. Paket adı (Java projeleri için)
        let packageName = 'com.example';
        if (platform.value !== 'skript') {
            const input = await vscode.window.showInputBox({
                prompt: 'Java paket adını girin',
                title: '⛏️ CraftIDE — Yeni Proje (4/5)',
                value: `com.example.${projectName.toLowerCase()}`,
                placeHolder: 'com.example.myplugin',
                validateInput: (value) => {
                    if (!value || !/^[a-z][a-z0-9_.]*$/.test(value)) {
                        return 'Geçersiz paket adı (örnek: com.example.myplugin)';
                    }
                    return null;
                },
            });
            if (!input) { return; }
            packageName = input;
        }

        // 5. Bağımlılıklar (Java projeleri için)
        let dependencies: string[] = [];
        if (platform.value !== 'skript') {
            const deps = await vscode.window.showQuickPick(
                [
                    { label: 'Vault', description: 'Ekonomi, izin, sohbet API', picked: false },
                    { label: 'PlaceholderAPI', description: 'Placeholder sistemi', picked: false },
                    { label: 'ProtocolLib', description: 'Paket manipülasyonu', picked: false },
                    { label: 'WorldGuard', description: 'Bölge koruma API', picked: false },
                    { label: 'LuckPerms', description: 'İzin sistemi API', picked: false },
                ],
                {
                    placeHolder: 'Bağımlılıkları seçin (isteğe bağlı)',
                    title: '⛏️ CraftIDE — Yeni Proje (5/5)',
                    canPickMany: true,
                }
            );
            dependencies = deps?.map(d => d.label) || [];
        }

        // 6. Hedef klasör seçimi
        const targetFolder = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Proje Klasörü Seç',
            title: 'Projenin oluşturulacağı klasörü seçin',
        });
        if (!targetFolder || targetFolder.length === 0) { return; }

        const projectDir = path.join(targetFolder[0].fsPath, projectName);

        // Proje oluştur
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `⛏️ ${projectName} oluşturuluyor...`,
                cancellable: false,
            },
            async (progress) => {
                progress.report({ increment: 0, message: 'Klasör yapısı oluşturuluyor...' });

                switch (platform.value) {
                    case 'spigot':
                    case 'paper':
                        await this._createJavaPlugin(projectDir, projectName, packageName, mcVersion!, platform.value, dependencies);
                        break;
                    case 'skript':
                        await this._createSkriptProject(projectDir, projectName, mcVersion!);
                        break;
                    case 'fabric':
                        await this._createFabricMod(projectDir, projectName, packageName, mcVersion!);
                        break;
                    case 'velocity':
                    case 'bungeecord':
                        await this._createProxyPlugin(projectDir, projectName, packageName, mcVersion!, platform.value);
                        break;
                }

                progress.report({ increment: 100, message: 'Tamamlandı!' });
            }
        );

        // Projeyi aç
        const openAction = await vscode.window.showInformationMessage(
            `⛏️ ${projectName} başarıyla oluşturuldu!`,
            'Projeyi Aç',
            'Yeni Pencerede Aç'
        );

        if (openAction === 'Projeyi Aç') {
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir), false);
        } else if (openAction === 'Yeni Pencerede Aç') {
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir), true);
        }
    }

    // ─── Spigot/Paper Plugin Oluşturucu ─────────────────────

    private async _createJavaPlugin(
        dir: string,
        name: string,
        pkg: string,
        mcVersion: string,
        platform: 'spigot' | 'paper',
        dependencies: string[]
    ): Promise<void> {
        const pkgPath = pkg.replace(/\./g, '/');
        const className = this._toPascalCase(name);
        const apiVersion = mcVersion.split('.').slice(0, 2).join('.');

        // Klasör yapısını oluştur
        const dirs = [
            `${dir}/src/main/java/${pkgPath}`,
            `${dir}/src/main/java/${pkgPath}/commands`,
            `${dir}/src/main/java/${pkgPath}/listeners`,
            `${dir}/src/main/java/${pkgPath}/managers`,
            `${dir}/src/main/java/${pkgPath}/utils`,
            `${dir}/src/main/resources`,
            `${dir}/src/test/java/${pkgPath}`,
        ];
        for (const d of dirs) {
            fs.mkdirSync(d, { recursive: true });
        }

        // Ana Plugin sınıfı
        fs.writeFileSync(
            `${dir}/src/main/java/${pkgPath}/${className}.java`,
            this._generateMainClass(className, pkg, platform)
        );

        // plugin.yml
        fs.writeFileSync(
            `${dir}/src/main/resources/plugin.yml`,
            this._generatePluginYml(name, className, pkg, apiVersion, dependencies)
        );

        // config.yml
        fs.writeFileSync(
            `${dir}/src/main/resources/config.yml`,
            this._generateConfigYml(name)
        );

        // pom.xml (Maven)
        fs.writeFileSync(
            `${dir}/pom.xml`,
            this._generatePomXml(name, pkg, mcVersion, platform, dependencies)
        );

        // .gitignore
        fs.writeFileSync(
            `${dir}/.gitignore`,
            'target/\n*.class\n*.jar\n.idea/\n*.iml\n.settings/\n.project\n.classpath\nbin/\n'
        );

        // README.md
        fs.writeFileSync(
            `${dir}/README.md`,
            `# ${name}\n\nA Minecraft ${platform === 'paper' ? 'Paper' : 'Spigot'} plugin for MC ${mcVersion}.\n\nGenerated by **CraftIDE** ⛏️\n\n## Build\n\n\`\`\`bash\nmvn clean package\n\`\`\`\n\nOutput: \`target/${name}-1.0.0.jar\`\n`
        );
    }

    private _generateMainClass(className: string, pkg: string, platform: string): string {
        return `package ${pkg};

import org.bukkit.plugin.java.JavaPlugin;

/**
 * ${className} — Ana plugin sınıfı
 * 
 * CraftIDE tarafından otomatik oluşturuldu ⛏️
 */
public class ${className} extends JavaPlugin {

    private static ${className} instance;

    @Override
    public void onEnable() {
        instance = this;
        
        // Config dosyasını kaydet/yükle
        saveDefaultConfig();
        
        // Komutları kaydet
        // getCommand("example").setExecutor(new ExampleCommand(this));
        
        // Event listener'ları kaydet
        // getServer().getPluginManager().registerEvents(new ExampleListener(this), this);
        
        getLogger().info("${className} başarıyla aktif edildi! ⛏️");
    }

    @Override
    public void onDisable() {
        getLogger().info("${className} deaktif edildi.");
    }

    public static ${className} getInstance() {
        return instance;
    }
}
`;
    }

    private _generatePluginYml(name: string, className: string, pkg: string, apiVersion: string, deps: string[]): string {
        let yml = `name: ${name}
version: 1.0.0
main: ${pkg}.${className}
api-version: '${apiVersion}'
description: A Minecraft plugin created with CraftIDE
author: CraftIDE User
`;
        if (deps.length > 0) {
            yml += `\nsoftdepend:\n`;
            for (const dep of deps) {
                yml += `  - ${dep}\n`;
            }
        }
        yml += `\ncommands:\n  # example:\n  #   description: An example command\n  #   usage: /<command>\n  #   permission: ${name.toLowerCase()}.example\n`;
        yml += `\npermissions:\n  # ${name.toLowerCase()}.example:\n  #   description: Allows using the example command\n  #   default: true\n`;
        return yml;
    }

    private _generateConfigYml(name: string): string {
        return `# ${name} Configuration
# Created by CraftIDE ⛏️

# Plugin settings
settings:
  prefix: "&a[${name}]&r "
  language: "tr"
  debug: false

# Database (isteğe bağlı)
# database:
#   type: sqlite  # sqlite veya mysql
#   host: localhost
#   port: 3306
#   name: ${name.toLowerCase()}
#   username: root
#   password: ""
`;
    }

    private _generatePomXml(name: string, pkg: string, mcVersion: string, platform: string, deps: string[]): string {
        const repoUrl = platform === 'paper'
            ? 'https://repo.papermc.io/repository/maven-public/'
            : 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/';

        const depGroup = platform === 'paper' ? 'io.papermc.paper' : 'org.spigotmc';
        const depArtifact = platform === 'paper' ? 'paper-api' : 'spigot-api';

        let extraDeps = '';
        if (deps.includes('Vault')) {
            extraDeps += `
        <dependency>
            <groupId>com.github.MilkBowl</groupId>
            <artifactId>VaultAPI</artifactId>
            <version>1.7.1</version>
            <scope>provided</scope>
        </dependency>`;
        }
        if (deps.includes('PlaceholderAPI')) {
            extraDeps += `
        <dependency>
            <groupId>me.clip</groupId>
            <artifactId>placeholderapi</artifactId>
            <version>2.11.6</version>
            <scope>provided</scope>
        </dependency>`;
        }
        if (deps.includes('ProtocolLib')) {
            extraDeps += `
        <dependency>
            <groupId>com.comphenix.protocol</groupId>
            <artifactId>ProtocolLib</artifactId>
            <version>5.1.0</version>
            <scope>provided</scope>
        </dependency>`;
        }

        let extraRepos = '';
        if (deps.includes('Vault')) {
            extraRepos += `
        <repository>
            <id>jitpack.io</id>
            <url>https://jitpack.io</url>
        </repository>`;
        }
        if (deps.includes('PlaceholderAPI')) {
            extraRepos += `
        <repository>
            <id>placeholderapi</id>
            <url>https://repo.extendedclip.com/content/repositories/placeholderapi/</url>
        </repository>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${pkg}</groupId>
    <artifactId>${name}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${name}</name>
    <description>A Minecraft plugin created with CraftIDE</description>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>${platform}</id>
            <url>${repoUrl}</url>
        </repository>${extraRepos}
    </repositories>

    <dependencies>
        <dependency>
            <groupId>${depGroup}</groupId>
            <artifactId>${depArtifact}</artifactId>
            <version>${mcVersion}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>${extraDeps}
    </dependencies>

    <build>
        <finalName>\${project.name}-\${project.version}</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>
`;
    }

    // ─── Skript Proje Oluşturucu ────────────────────────────

    private async _createSkriptProject(dir: string, name: string, mcVersion: string): Promise<void> {
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
            `${dir}/${name.toLowerCase()}.sk`,
            `# ${name}
# Minecraft ${mcVersion} için Skript
# CraftIDE tarafından oluşturuldu ⛏️
#
# Bu dosyayı sunucunuzun plugins/Skript/scripts/ klasörüne koyun
# Ardından /skript reload ${name.toLowerCase()} yazın

# ─── Ayarlar ─────────────────────────
options:
    prefix: &a[${name}]&r

# ─── Komutlar ────────────────────────
command /example:
    permission: ${name.toLowerCase()}.example
    description: Örnek komut
    trigger:
        send "{@prefix} Merhaba %player%!" to player

# ─── Event'ler ───────────────────────
on join:
    send "{@prefix} Hoş geldin %player%!" to player

on quit:
    broadcast "{@prefix} %player% sunucudan ayrıldı."
`
        );

        fs.writeFileSync(
            `${dir}/README.md`,
            `# ${name}\n\nA Minecraft Skript for MC ${mcVersion}.\n\nGenerated by **CraftIDE** ⛏️\n\n## Installation\n\n1. Copy \`${name.toLowerCase()}.sk\` to \`plugins/Skript/scripts/\`\n2. Run \`/skript reload ${name.toLowerCase()}\`\n`
        );
    }

    // ─── Fabric Mod Oluşturucu ──────────────────────────────

    private async _createFabricMod(dir: string, name: string, pkg: string, mcVersion: string): Promise<void> {
        const pkgPath = pkg.replace(/\./g, '/');
        const className = this._toPascalCase(name);

        const dirs = [
            `${dir}/src/main/java/${pkgPath}`,
            `${dir}/src/main/resources`,
        ];
        for (const d of dirs) {
            fs.mkdirSync(d, { recursive: true });
        }

        fs.writeFileSync(
            `${dir}/src/main/java/${pkgPath}/${className}.java`,
            `package ${pkg};

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ${className} implements ModInitializer {
    public static final String MOD_ID = "${name.toLowerCase()}";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("${className} initialized! ⛏️");
    }
}
`
        );

        fs.writeFileSync(
            `${dir}/src/main/resources/fabric.mod.json`,
            JSON.stringify({
                schemaVersion: 1,
                id: name.toLowerCase(),
                version: '1.0.0',
                name: name,
                description: 'A Fabric mod created with CraftIDE',
                authors: ['CraftIDE User'],
                license: 'MIT',
                environment: '*',
                entrypoints: { main: [`${pkg}.${className}`] },
                depends: { fabricloader: '>=0.15.0', minecraft: `~${mcVersion}`, java: '>=17' },
            }, null, 2)
        );

        fs.writeFileSync(`${dir}/.gitignore`, 'build/\n.gradle/\n*.class\n.idea/\n*.iml\n');
        fs.writeFileSync(`${dir}/README.md`, `# ${name}\n\nA Fabric mod for MC ${mcVersion}.\n\nGenerated by **CraftIDE** ⛏️\n`);
    }

    // ─── Proxy Plugin Oluşturucu ────────────────────────────

    private async _createProxyPlugin(
        dir: string, name: string, pkg: string, mcVersion: string, platform: 'velocity' | 'bungeecord'
    ): Promise<void> {
        const pkgPath = pkg.replace(/\./g, '/');
        const className = this._toPascalCase(name);

        const dirs = [
            `${dir}/src/main/java/${pkgPath}`,
            `${dir}/src/main/resources`,
        ];
        for (const d of dirs) {
            fs.mkdirSync(d, { recursive: true });
        }

        if (platform === 'velocity') {
            fs.writeFileSync(
                `${dir}/src/main/java/${pkgPath}/${className}.java`,
                `package ${pkg};

import com.google.inject.Inject;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.proxy.ProxyInitializeEvent;
import com.velocitypowered.api.plugin.Plugin;
import org.slf4j.Logger;

@Plugin(id = "${name.toLowerCase()}", name = "${name}", version = "1.0.0",
        description = "A Velocity plugin created with CraftIDE",
        authors = {"CraftIDE User"})
public class ${className} {
    private final Logger logger;

    @Inject
    public ${className}(Logger logger) {
        this.logger = logger;
    }

    @Subscribe
    public void onProxyInitialization(ProxyInitializeEvent event) {
        logger.info("${className} initialized! ⛏️");
    }
}
`
            );
        } else {
            fs.writeFileSync(
                `${dir}/src/main/java/${pkgPath}/${className}.java`,
                `package ${pkg};

import net.md_5.bungee.api.plugin.Plugin;

public class ${className} extends Plugin {
    @Override
    public void onEnable() {
        getLogger().info("${className} enabled! ⛏️");
    }

    @Override
    public void onDisable() {
        getLogger().info("${className} disabled.");
    }
}
`
            );

            fs.writeFileSync(
                `${dir}/src/main/resources/bungee.yml`,
                `name: ${name}\nmain: ${pkg}.${className}\nversion: 1.0.0\nauthor: CraftIDE User\n`
            );
        }

        fs.writeFileSync(`${dir}/.gitignore`, 'target/\n*.class\n*.jar\n.idea/\n*.iml\n');
        fs.writeFileSync(`${dir}/README.md`, `# ${name}\n\nA ${platform === 'velocity' ? 'Velocity' : 'BungeeCord'} plugin for MC ${mcVersion}.\n\nGenerated by **CraftIDE** ⛏️\n`);
    }

    // ─── Yardımcılar ────────────────────────────────────────

    private _toPascalCase(str: string): string {
        return str
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(/\s+/g, '');
    }
}
