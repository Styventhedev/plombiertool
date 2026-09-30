# PlombierTool

## Builds natifs

Node.js 20 ou plus récent est nécessaire pour les builds locaux.

- Windows : `npm install`, puis `npm run dist:windows`. L’installateur est créé dans `release/`.
- Android : `npm install`, `npm run build:web`, `npx cap add android` (une seule fois), puis `npm run android:sync`. Depuis Android Studio, générez un APK debug, ou lancez `cd android && gradlew.bat assembleDebug` sous Windows.

L’APK publié automatiquement est un APK debug signé avec la clé de test Android. Il convient à l’installation directe, mais pas à une publication sur Google Play. Une publication Play Store exige une clé de signature privée conservée hors du dépôt.

## Publier les téléchargements

Poussez un tag de version, par exemple `v1.0.0`. GitHub Actions construit l’installateur Windows et l’APK Android, puis les ajoute à une GitHub Release. Sur GitHub Pages à l’adresse standard `https://<proprietaire>.github.io/<depot>/`, le bouton « Télécharger l’app » détecte automatiquement les liens de cette Release.

Le workflow peut aussi être lancé manuellement depuis l’onglet Actions; dans ce cas, les deux fichiers sont disponibles comme artefacts du workflow.
