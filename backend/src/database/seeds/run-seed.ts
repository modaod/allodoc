import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function runSeed() {
    const app = await NestFactory.create(AppModule);
    const seedService = app.get(SeedService);

    try {
        await seedService.run();
        console.log('✅ Seeds exécutés avec succès');
    } catch (error) {
        console.error("❌ Erreur lors de l'exécution des seeds:", error);
    } finally {
        await app.close();
    }
}

runSeed();
