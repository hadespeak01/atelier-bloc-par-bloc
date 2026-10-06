# Atelier bloc par bloc

Application de bureau (Windows et Mac) pour modéliser des constructions Minecraft en 3D :
319 blocs vanilla, dalles et escaliers, vue plan 2D couche par couche, générateur de
cercles, cylindres, sphères et dômes (pleins ou en contour), plans PNG imprimables et
export en commandes Bedrock ou Java.

## Obtenir les installateurs sans rien installer (recommandé)

1. Crée un dépôt sur GitHub et envoies-y tout ce dossier.
2. Ouvre l'onglet **Actions**, choisis **Construire l'application**, puis **Run workflow**.
3. Après 5 à 10 minutes, télécharge les fichiers en bas de la page du build :
   - `atelier-windows-latest` contient l'installateur `.exe` et une version portable ;
   - `atelier-macos-latest` contient les `.dmg` (Intel `x64` et Apple Silicon `arm64`).

GitHub compile la version Mac sur un vrai Mac : pas besoin d'en avoir un.

## Construire sur ton propre ordinateur

Installe [Node.js](https://nodejs.org) (version LTS), puis dans un terminal ouvert dans ce dossier :

```
npm install          # télécharge Electron et three.js (une seule fois)
npm start            # lance l'application pour la tester
npm run build:win    # sur Windows : crée dist/…-installation.exe et dist/…-portable.exe
npm run build:mac    # sur un Mac : crée dist/…-arm64.dmg et dist/…-x64.dmg
```

La version Windows se construit sur Windows et la version Mac sur un Mac
(ou les deux via GitHub, voir plus haut).

## Premier lancement

- **Windows** : l'application n'est pas signée, SmartScreen peut afficher « Windows a protégé
  votre ordinateur ». Clique sur **Informations complémentaires**, puis **Exécuter quand même**.
- **Mac** : fais un clic droit sur l'application, puis **Ouvrir**, et confirme. Si macOS dit
  qu'elle est « endommagée », lance une fois dans le Terminal :
  `xattr -cr "/Applications/Atelier bloc par bloc.app"`

Pour supprimer ces avertissements, il faut un certificat de signature
(Microsoft ou compte Apple Developer), à ajouter plus tard dans la config `build`.

## Fichiers

- Les projets s'enregistrent en `.abp` (Fichier → Enregistrer). Un double-clic sur un `.abp`
  l'ouvre dans l'application.
- La dernière construction est aussi sauvegardée automatiquement et rouverte au lancement.
- Fichier → Exporter en commandes produit un `.mcfunction` à placer dans un pack de
  comportement (`functions/`), puis à lancer en jeu avec `/function`.

## Structure

```
main.js            fenêtre, menus, dialogues de fichiers
preload.js         pont sécurisé entre l'interface et le système
app/index.html     l'éditeur (interface, 3D, plan 2D, formes)
build/icon.png     icône de l'application
.github/workflows  build automatique Windows + Mac
```
