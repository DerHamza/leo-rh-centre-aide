# Centre d'aide — Leo RH

Centre d'aide de **Leo RH by Neva**, publié via GitHub Pages.

👉 **https://derhamza.github.io/leo-rh-centre-aide/**

## Contenu

`index.html` — le centre d'aide complet, en un seul fichier autonome : styles, icônes,
logo et captures d'écran sont intégrés, aucune dépendance externe.

Il couvre la connexion, l'interface, les rôles et permissions, les sept modules
(Accueil, Congés, Notes de frais, Documents, Projets, Feuilles de temps, Espace
Collaborateur), l'administration, puis un récapitulatif des statuts, une FAQ et
un glossaire.

## Mettre à jour

Remplacez `index.html` et poussez sur `main` : GitHub Pages se met à jour tout seul.

Les captures d'écran proviennent d'un jeu de données de démonstration fictif —
aucune donnée client n'y figure.

## Nouveautés (notes de version)

Rubrique publiée sur **https://aide.leorh.com/nouveautes/**, la plus récente en tête,
une page par note. L'application Leo RH lit `nouveautes/releases.json` et affiche
la dernière note dans le menu du lion (« Nouveautés »).

Publier une note :

1. Créer `nouveautes/notes/AAAA-MM-JJ.md` (date de mise en production) :

   ```
   ---
   titre: Documents RH plus souples
   resume: Une phrase, montrée dans la liste et dans l'application.
   modules: Documents RH, Projets
   ---
   ## Documents RH

   - **Nouvel onglet** : ce qu'il apporte et où le trouver.
   ```

2. Lancer `node outils/publier-nouveautes.mjs` (Node 18 ou plus, aucune dépendance) :
   il régénère la liste, les pages, `releases.json`, ainsi que le lien et le bandeau
   « Nouveautés » de `index.html`.
3. Pousser sur `main`.
