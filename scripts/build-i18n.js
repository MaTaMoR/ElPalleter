import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getDatabase, DatabaseUtils } from '../src/utils/database.js';
import { StaticTranslationBuilder } from '../src/utils/translation-utils.js';

/**
 * Gestor de build para i18n
 */
class I18nBuildManager {
    constructor(config = {}) {
        this.config = {
            languages: [],
            validateTranslations: true,
            generateSitemap: true,
            deployAfterBuild: false,
            environment: 'production',
            ...config
        };
    }

    /**
     * Ejecutar build completo
     */
    async build() {
        console.log('🌍 Iniciando build del sistema i18n...\n');

        try {
            // 1. Validar base de datos
            await this.validateDatabase();

            // 2. Cargar idiomas activos
            await this.loadActiveLanguages();

            // 3. Validar traducciones si está habilitado
            if (this.config.validateTranslations) {
                await this.validateTranslations();
            }

            // 4. Generar traducciones estáticas
            await this.generateStaticTranslations();

            // 5. Actualizar configuración de Astro
            await this.updateAstroConfig();

            // 6. Ejecutar build de Astro
            await this.executeAstroBuild();

            // 7. Post-procesamiento
            await this.postProcess();

            // 8. Deploy si está configurado
            if (this.config.deployAfterBuild) {
                await this.deploy();
            }

            console.log('\n✅ Build completado exitosamente!');

        } catch (error) {
            console.error('\n❌ Error durante el build:', error);
            process.exit(1);
        }
    }

    /**
     * Validar base de datos
     */
    async validateDatabase() {
        console.log('🔍 Validando base de datos...');

        const validation = await DatabaseUtils.validateDatabase();

        if (!validation.isValid) {
            console.error('❌ Errores en la base de datos:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            throw new Error('Base de datos inválida');
        }

        if (validation.warnings.length > 0) {
            console.warn('⚠️ Advertencias:');
            validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        console.log('✅ Base de datos válida');
    }

    /**
     * Cargar idiomas activos
     */
    async loadActiveLanguages() {
        console.log('🗣️ Cargando idiomas activos...');

        const db = await getDatabase();
        const languages = db.prepare(`
      SELECT id FROM languages 
      WHERE is_active = true 
      ORDER BY is_default DESC, id
    `).all();

        this.config.languages = languages.map(lang => lang.id);

        console.log(`✅ Idiomas cargados: ${this.config.languages.join(', ')}`);
    }

    /**
     * Validar traducciones
     */
    async validateTranslations() {
        console.log('🔤 Validando traducciones...');

        const issues = [];

        for (const language of this.config.languages) {
            try {
                const response = await fetch(`http://localhost:4321/api/translations/validate/${language}`);
                if (response.ok) {
                    const validation = await response.json();

                    if (!validation.isComplete) {
                        issues.push(`${language}: ${validation.missingKeys.length} traducciones faltantes`);
                    }

                    console.log(`  ${language}: ${validation.completionPercentage}% completo`);
                }
            } catch (error) {
                console.warn(`  ⚠️ No se pudo validar ${language}: ${error.message}`);
            }
        }

        if (issues.length > 0 && this.config.environment === 'production') {
            console.warn('⚠️ Issues de traducción encontrados:');
            issues.forEach(issue => console.warn(`  - ${issue}`));

            if (this.config.environment === 'production') {
                throw new Error('Traducciones incompletas para producción');
            }
        }

        console.log('✅ Validación de traducciones completada');
    }

    /**
     * Generar traducciones estáticas
     */
    async generateStaticTranslations() {
        console.log('📄 Generando traducciones estáticas...');

        await StaticTranslationBuilder.generateStaticTranslations();

        console.log('✅ Traducciones estáticas generadas');
    }

    /**
     * Actualizar configuración de Astro
     */
    async updateAstroConfig() {
        console.log('⚙️ Actualizando configuración de Astro...');

        const configPath = join(process.cwd(), 'astro.config.mjs');

        let configContent = `
            import { defineConfig } from 'astro/config';

            export default defineConfig({
            output: 'static',
            i18n: {
                defaultLocale: 'es',
                locales: ${JSON.stringify(this.config.languages)},
                routing: {
                prefixDefaultLocale: false
                }
            },
            build: {
                format: 'directory'
            },
            vite: {
                define: {
                __LANGUAGES__: ${JSON.stringify(this.config.languages)}
                }
            }
            });`;

        writeFileSync(configPath, configContent);

        console.log('✅ Configuración de Astro actualizada');
    }

    /**
     * Ejecutar build de Astro
     */
    async executeAstroBuild() {
        console.log('🔨 Ejecutando build de Astro...');

        try {
            execSync('npm run astro build', {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: this.config.environment
                }
            });
        } catch (error) {
            throw new Error(`Error en build de Astro: ${error}`);
        }

        console.log('✅ Build de Astro completado');
    }

    /**
     * Post-procesamiento
     */
    async postProcess() {
        console.log('🔄 Post-procesando build...');

        const distDir = join(process.cwd(), 'dist');

        // Generar sitemap si está habilitado
        if (this.config.generateSitemap) {
            await this.generateSitemap(distDir);
        }

        // Generar robots.txt
        await this.generateRobotsTxt(distDir);

        console.log('✅ Post-procesamiento completado');
    }

    /**
     * Generar sitemap
     */
    async generateSitemap(distDir) {
        const baseUrl = process.env.SITE_URL || 'https://elpalleter.com';
        const now = new Date().toISOString();

        // Páginas principales
        const pages = ['', 'menu', 'about', 'contact', 'reservations'];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

        for (const page of pages) {
            for (const lang of this.config.languages) {
                const path = page ? `/${page}` : '';
                const url = lang === 'es'
                    ? `${baseUrl}${path}`
                    : `${baseUrl}/${lang}${path}`;

                sitemap += `
                <url>
                    <loc>${url}</loc>
                    <lastmod>${now}</lastmod>
                    <changefreq>weekly</changefreq>
                    <priority>${page === '' ? '1.0' : '0.8'}</priority>`;

                // Añadir enlaces alternativos para otros idiomas
                for (const altLang of this.config.languages) {
                    const altUrl = altLang === 'es'
                        ? `${baseUrl}${path}`
                        : `${baseUrl}/${altLang}${path}`;

                    sitemap += `<xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />`;
                }

                sitemap += `</url>`;
            }
        }

        sitemap += `</urlset>`;

        writeFileSync(join(distDir, 'sitemap.xml'), sitemap);
    }

    /**
     * Generar robots.txt
     */
    async generateRobotsTxt(distDir) {
        const baseUrl = process.env.SITE_URL || 'https://elpalleter.com';

        const robots = `User-agent: *
        Allow: /

        Sitemap: ${baseUrl}/sitemap.xml

        Disallow: /admin/
        Disallow: /api/
    `;

        writeFileSync(join(distDir, 'robots.txt'), robots);
    }

    /**
     * Deploy
     */
    async deploy() {
        console.log('🚀 Iniciando deployment...');

        const deployScript = process.env.DEPLOY_SCRIPT || 'npm run deploy';

        try {
            execSync(deployScript, { stdio: 'inherit' });
            console.log('✅ Deployment completado');
        } catch (error) {
            throw new Error(`Error en deployment: ${error}`);
        }
    }
}

/**
 * Script principal
 */
async function main() {
    const args = process.argv.slice(2);
    const flags = args.reduce((acc, arg) => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            acc[key] = value || true;
        }
        return acc;
    }, {});

    const config = {
        validateTranslations: flags.validate !== 'false',
        generateSitemap: flags.sitemap !== 'false',
        deployAfterBuild: flags.deploy === 'true',
        environment: flags.env || 'production'
    };

    const builder = new I18nBuildManager(config);
    await builder.build();
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
