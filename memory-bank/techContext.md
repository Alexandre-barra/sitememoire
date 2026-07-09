# Technical Context - Site Mémoire

## Technologies utilisées
- **HTML5** : Structure sémantique pour une meilleure accessibilité.
- **CSS3 (Vanilla)** : Flexbox/Grid, OKLCH, animations clés.
- **JavaScript (ES6+)** : Logique de l'application, manipulation du DOM, stockage local.
- **canvas-confetti** (CDN / npm local) : Librairie haute performance pour l'effet de confettis.

## Environnement de développement
- Serveur de développement local : simple serveur HTTP (ex: `python3 -m http.server`, `npx live-server`, ou n'importe quel outil similaire).

## Contraintes techniques
- **Audio Autoplay** : Les navigateurs bloquent la lecture audio automatique avant une interaction utilisateur. L'application doit gérer l'état initial "muet" et encourager l'activation.
- **GIFs transparents** : Chargement et affichage fluide du GIF de célébration sans décalage de mise en page (Layout Shift).
- **Z-Index Scale** :
  - `0` : Arrière-plan
  - `10` : Contenu principal / Formulaire
  - `20` : Boutons de contrôle (Audio)
  - `100` : Overlay de célébration (GIF + confettis)
