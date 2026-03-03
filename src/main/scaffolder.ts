import * as fs from 'fs';
import * as path from 'path';

/**
 * CraftIDE Project Scaffolder
 * Minecraft plugin/skript projelerini tek tıkla oluşturur
 */
export class ProjectScaffolder {

    async createProject(config: {
        platform: string;
        mcVersion: string;
        name: string;
        packageName: string;
        targetDir: string;
        dependencies: string[];
    }): Promise<void> {
        const projectDir = path.join(config.targetDir, config.name);

        switch (config.platform) {
            case 'spigot':
            case 'paper':
                this.createJavaPlugin(projectDir, config);
                break;
            case 'skript':
                this.createSkriptProject(projectDir, config);
                break;
            case 'fabric':
                this.createFabricMod(projectDir, config);
                break;
            case 'forge':
                this.createForgeMod(projectDir, config);
                break;
            case 'velocity':
            case 'bungeecord':
                this.createProxyPlugin(projectDir, config);
                break;
        }
    }

    private createForgeMod(dir: string, config: any): void {
        const pkgPath = config.packageName.replace(/\./g, '/');
        const className = this.toPascalCase(config.name);
        const modId = config.name.toLowerCase().replace(/[^a-z0-9_]/g, '');

        const mcParts = config.mcVersion.split('.').map(Number);
        const javaVersion = (mcParts[1] > 20 || (mcParts[1] === 20 && (mcParts[2] || 0) >= 5)) ? 21 : 17;

        fs.mkdirSync(`${dir}/src/main/java/${pkgPath}`, { recursive: true });
        fs.mkdirSync(`${dir}/src/main/resources/META-INF`, { recursive: true });

        // Main Class
        fs.writeFileSync(
            `${dir}/src/main/java/${pkgPath}/${className}.java`,
            `package ${config.packageName};\n\nimport net.minecraftforge.fml.common.Mod;\nimport org.apache.logging.log4j.LogManager;\nimport org.apache.logging.log4j.Logger;\n\n@Mod("${modId}")\npublic class ${className} {\n    private static final Logger LOGGER = LogManager.getLogger();\n\n    public ${className}() {\n        LOGGER.info("${className} initialized! ⛏️");\n    }\n}\n`
        );

        // mods.toml
        fs.writeFileSync(
            `${dir}/src/main/resources/META-INF/mods.toml`,
            `modLoader="javafml"\nloaderVersion="[47,)"\nlicense="All rights reserved"\n\n[[mods]]\nmodId="${modId}"\nversion="1.0.0"\ndisplayName="${config.name}"\nauthors="CraftIDE User"\ndescription="A Forge mod created with CraftIDE"\n\n[[dependencies.${modId}]]\n    modId="forge"\n    mandatory=true\n    versionRange="[47,)"\n    ordering="NONE"\n    side="BOTH"\n[[dependencies.${modId}]]\n    modId="minecraft"\n    mandatory=true\n    versionRange="[1.20,1.22)"\n    ordering="NONE"\n    side="BOTH"\n`
        );

        // build.gradle (basic template)
        fs.writeFileSync(
            `${dir}/build.gradle`,
            `plugins {\n    id 'net.minecraftforge.gradle' version '6.0.+'\n}\n\ngroup = '${config.packageName}'\nversion = '1.0.0'\n\njava {\n    toolchain.languageVersion = JavaLanguageVersion.of(${javaVersion})\n}\n\nminecraft {\n    mappings channel: 'official', version: '${config.mcVersion}'\n}\n\ndependencies {\n    // Note: The forge version here is a placeholder. You may need to update it to the exact version for ${config.mcVersion}\n    minecraft "net.minecraftforge:forge:${config.mcVersion}-47.2.0"\n}\n`
        );

        // settings.gradle
        fs.writeFileSync(`${dir}/settings.gradle`, `rootProject.name = '${config.name}'\n`);

        // .gitignore
        fs.writeFileSync(`${dir}/.gitignore`, 'build/\n.gradle/\n*.class\n*.jar\n.idea/\n*.iml\n');
    }

    private createJavaPlugin(dir: string, config: any): void {
        const pkgPath = config.packageName.replace(/\./g, '/');
        const className = this.toPascalCase(config.name);
        const apiVersion = config.mcVersion.split('.').slice(0, 2).join('.');

        // Create directory structure
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

        // Main class
        fs.writeFileSync(
            `${dir}/src/main/java/${pkgPath}/${className}.java`,
            this.generateMainClass(className, config.packageName, config.platform)
        );

        // plugin.yml
        fs.writeFileSync(
            `${dir}/src/main/resources/plugin.yml`,
            this.generatePluginYml(config.name, className, config.packageName, apiVersion, config.dependencies)
        );

        // config.yml
        fs.writeFileSync(
            `${dir}/src/main/resources/config.yml`,
            `# ${config.name} Configuration\n# Created by CraftIDE ⛏️\n\nsettings:\n  prefix: "&a[${config.name}]&r "\n  language: "tr"\n  debug: false\n`
        );

        // pom.xml
        fs.writeFileSync(`${dir}/pom.xml`, this.generatePomXml(config));

        // .gitignore & README
        fs.writeFileSync(`${dir}/.gitignore`, 'target/\n*.class\n*.jar\n.idea/\n*.iml\n.settings/\n.project\n.classpath\nbin/\n');
        fs.writeFileSync(`${dir}/README.md`, `# ${config.name}\n\nA Minecraft ${config.platform} plugin for MC ${config.mcVersion}.\n\nGenerated by **CraftIDE** ⛏️\n\n## Build\n\n\`\`\`bash\nmvn clean package\n\`\`\`\n`);
    }

    private createSkriptProject(dir: string, config: any): void {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
            `${dir}/${config.name.toLowerCase()}.sk`,
            `# ${config.name}\n# Minecraft ${config.mcVersion} için Skript\n# CraftIDE tarafından oluşturuldu ⛏️\n\noptions:\n    prefix: &a[${config.name}]&r\n\ncommand /example:\n    permission: ${config.name.toLowerCase()}.example\n    trigger:\n        send "{@prefix} Merhaba %player%!" to player\n\non join:\n    send "{@prefix} Hoş geldin %player%!" to player\n`
        );
        fs.writeFileSync(`${dir}/README.md`, `# ${config.name}\n\nSkript for MC ${config.mcVersion}.\nGenerated by **CraftIDE** ⛏️\n`);
    }

    private createFabricMod(dir: string, config: any): void {
        const pkgPath = config.packageName.replace(/\./g, '/');
        const className = this.toPascalCase(config.name);

        fs.mkdirSync(`${dir}/src/main/java/${pkgPath}`, { recursive: true });
        fs.mkdirSync(`${dir}/src/main/resources`, { recursive: true });

        fs.writeFileSync(
            `${dir}/src/main/java/${pkgPath}/${className}.java`,
            `package ${config.packageName};\n\nimport net.fabricmc.api.ModInitializer;\nimport org.slf4j.Logger;\nimport org.slf4j.LoggerFactory;\n\npublic class ${className} implements ModInitializer {\n    public static final String MOD_ID = "${config.name.toLowerCase()}";\n    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);\n\n    @Override\n    public void onInitialize() {\n        LOGGER.info("${className} initialized! ⛏️");\n    }\n}\n`
        );

        fs.writeFileSync(`${dir}/src/main/resources/fabric.mod.json`, JSON.stringify({
            schemaVersion: 1, id: config.name.toLowerCase(), version: '1.0.0', name: config.name,
            description: 'A Fabric mod created with CraftIDE', entrypoints: { main: [`${config.packageName}.${className}`] },
            depends: { fabricloader: '>=0.15.0', minecraft: `~${config.mcVersion}`, java: '>=17' },
        }, null, 2));
    }

    private createProxyPlugin(dir: string, config: any): void {
        const pkgPath = config.packageName.replace(/\./g, '/');
        const className = this.toPascalCase(config.name);

        fs.mkdirSync(`${dir}/src/main/java/${pkgPath}`, { recursive: true });
        fs.mkdirSync(`${dir}/src/main/resources`, { recursive: true });

        if (config.platform === 'velocity') {
            fs.writeFileSync(
                `${dir}/src/main/java/${pkgPath}/${className}.java`,
                `package ${config.packageName};\n\nimport com.google.inject.Inject;\nimport com.velocitypowered.api.event.Subscribe;\nimport com.velocitypowered.api.event.proxy.ProxyInitializeEvent;\nimport com.velocitypowered.api.plugin.Plugin;\nimport org.slf4j.Logger;\n\n@Plugin(id = "${config.name.toLowerCase()}", name = "${config.name}", version = "1.0.0")\npublic class ${className} {\n    private final Logger logger;\n\n    @Inject\n    public ${className}(Logger logger) {\n        this.logger = logger;\n    }\n\n    @Subscribe\n    public void onProxyInitialization(ProxyInitializeEvent event) {\n        logger.info("${className} initialized! ⛏️");\n    }\n}\n`
            );
        } else {
            fs.writeFileSync(
                `${dir}/src/main/java/${pkgPath}/${className}.java`,
                `package ${config.packageName};\n\nimport net.md_5.bungee.api.plugin.Plugin;\n\npublic class ${className} extends Plugin {\n    @Override\n    public void onEnable() {\n        getLogger().info("${className} enabled! ⛏️");\n    }\n\n    @Override\n    public void onDisable() {\n        getLogger().info("${className} disabled.");\n    }\n}\n`
            );
            fs.writeFileSync(`${dir}/src/main/resources/bungee.yml`, `name: ${config.name}\nmain: ${config.packageName}.${className}\nversion: 1.0.0\n`);
        }
        fs.writeFileSync(`${dir}/.gitignore`, 'target/\n*.class\n*.jar\n.idea/\n*.iml\n');
    }

    private generateMainClass(className: string, pkg: string, platform: string): string {
        return `package ${pkg};\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class ${className} extends JavaPlugin {\n\n    private static ${className} instance;\n\n    @Override\n    public void onEnable() {\n        instance = this;\n        saveDefaultConfig();\n        getLogger().info("${className} başarıyla aktif edildi! ⛏️");\n    }\n\n    @Override\n    public void onDisable() {\n        getLogger().info("${className} deaktif edildi.");\n    }\n\n    public static ${className} getInstance() {\n        return instance;\n    }\n}\n`;
    }

    private generatePluginYml(name: string, className: string, pkg: string, apiVersion: string, deps: string[]): string {
        let yml = `name: ${name}\nversion: 1.0.0\nmain: ${pkg}.${className}\napi-version: '${apiVersion}'\ndescription: A Minecraft plugin created with CraftIDE\nauthor: CraftIDE User\n`;
        if (deps.length > 0) {
            yml += `\nsoftdepend:\n`;
            for (const dep of deps) { yml += `  - ${dep}\n`; }
        }
        return yml;
    }

    private generatePomXml(config: any): string {
        const repoUrl = config.platform === 'paper'
            ? 'https://repo.papermc.io/repository/maven-public/'
            : 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/';
        const depGroup = config.platform === 'paper' ? 'io.papermc.paper' : 'org.spigotmc';
        const depArtifact = config.platform === 'paper' ? 'paper-api' : 'spigot-api';

        // MC 1.20.5+ requires Java 21, older versions use Java 17
        const mcParts = config.mcVersion.split('.').map(Number);
        const javaVersion = (mcParts[1] > 20 || (mcParts[1] === 20 && (mcParts[2] || 0) >= 5)) ? 21 : 17;

        return `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0">\n    <modelVersion>4.0.0</modelVersion>\n    <groupId>${config.packageName}</groupId>\n    <artifactId>${config.name}</artifactId>\n    <version>1.0.0</version>\n    <packaging>jar</packaging>\n    <name>${config.name}</name>\n    <properties>\n        <java.version>${javaVersion}</java.version>\n        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n    </properties>\n    <repositories>\n        <repository>\n            <id>${config.platform}</id>\n            <url>${repoUrl}</url>\n        </repository>\n    </repositories>\n    <dependencies>\n        <dependency>\n            <groupId>${depGroup}</groupId>\n            <artifactId>${depArtifact}</artifactId>\n            <version>${config.mcVersion}-R0.1-SNAPSHOT</version>\n            <scope>provided</scope>\n        </dependency>\n    </dependencies>\n    <build>\n        <finalName>\${project.name}-\${project.version}</finalName>\n        <plugins>\n            <plugin>\n                <groupId>org.apache.maven.plugins</groupId>\n                <artifactId>maven-compiler-plugin</artifactId>\n                <version>3.13.0</version>\n                <configuration>\n                    <source>\${java.version}</source>\n                    <target>\${java.version}</target>\n                </configuration>\n            </plugin>\n        </plugins>\n    </build>\n</project>\n`;
    }

    private toPascalCase(str: string): string {
        return str.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, '');
    }
}
