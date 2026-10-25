---
title: Sous le capot
description: >-
  Architecture, isolation, flux d'autorisations, mise en réseau et outils de ligne de commande
  derrière Deepsand.
---

# Sous le capot

Cette page est destinée aux développeurs qui souhaitent connaître la forme technique du système. Si vous recherchez une explication en langage simple, commencez par [Qu'est-ce que Deepsand ?](./what-is-deepsand).

## Architecture

Deepsand est une application de bureau Tauri avec trois couches principales :

- **La fenêtre** est une interface SolidJS. Il rend l'état et envoie des intentions ; il ne décide pas de la politique.
- **La couche Tauri** expose les commandes de bureau et traduit la même surface de commande en un serveur HTTP de bouclage pour les clients distants.
- **`deepsand-core`** possède les règles. La validation du chemin, le plan `docker run`, le courtier d'autorisations, le proxy de sortie, le magasin de secrets chiffrés et le magasin d'état y résident tous.

L'application de bureau et le pilote de ligne de commande `deepsandctl` utilisent le même noyau, ils ne peuvent donc pas se séparer sur une décision de sécurité.

## Un projet, un conteneur

Chaque projet obtient son propre conteneur Docker et son propre volume d'état. Le répertoire du projet est monté sur `/workspace` ; d'autres répertoires hôtes nécessitent des subventions explicites.

`policy::plan_run` construit l'argv `docker run` complet en un seul endroit. L'onglet Activité affiche ce plan exact, y compris les montages, les capacités, le mode réseau et les chemins en lecture seule.

Le conteneur est volontairement contraint :

- Le système de fichiers racine est en lecture seule, avec des montages tmpfs dimensionnés pour `/tmp` et `/run`.
- Le spool de réponse et le répertoire d'état sont montés en lecture seule.
- Les sockets d’exécution du conteneur sont rejetées par leur nom.
- Les capacités sont supprimées avant l'exécution de DeepCode et `no-new-privileges` est défini.
- Les sockets d'exécution du conteneur et autres montages interdits échouent à la fermeture plutôt que de produire un plan plus faible.

## Autorisations

Le bac à sable peut demander plus d'accès, mais il ne peut pas l'accorder. Une demande d'autorisation est écrite dans un spool ; le courtier hôte le valide et met le conteneur en pause. L'opérateur voit la demande et décide.

L'approbation d'une demande de répertoire recrée le conteneur avec le nouveau montage de liaison et reprend la session. Un refus est l'une des deux réponses possibles, et on indique au modèle laquelle : **Ne demande plus** est définitive, tandis que **Pas maintenant** refuse cette fois et indique que le modèle pourra demander à nouveau plus tard. Un refus final est stocké sur le projet et appliqué par l'hôte : aucun montage n'est jamais créé pour le chemin ou quoi que ce soit en dessous, et un hôte refusé devient une règle de refus couvrant ses sous-domaines. Les blocages sont répertoriés dans les autorisations et peuvent y être levés, car une décision sans retour est un piège plutôt qu'un choix.

Une demande concernant quelque chose que le bac à sable possède déjà est refusée avec une explication. Il n’existe pas de processus d’approbation automatique, car une approbation silencieuse serait un consentement que l’opérateur n’a jamais donné.

## Réseautage

La politique de réseau comporte quatre modes :

| Mode | Comportement |
| --- | --- |
| `none` | Uniquement le point de terminaison du modèle via le proxy de sortie Deepsand. |
| `allowlisted` | Le point de terminaison du modèle, le proxy et les hôtes, adresses et ports nommés. |
| `internet` | Accès Internet, avec plages locales et privées bloquées à l'intérieur du conteneur. |
| `full` | Accès Internet sans blocage du réseau local. |

Une entrée de nom d'hôte est résolue par le proxy, qui refuse les résultats privés, de bouclage, de lien local et réservés. Une entrée d'adresse est appliquée directement par le conteneur, ce qui permet à un client de base de données ou à un autre programme non HTTP de se connecter. Un port nommé est publié uniquement sur le bouclage de l'hôte.

## Secrets et mises à jour

Les secrets sont chiffrés au repos avec une clé détenue par le magasin de clés du système d'exploitation. Ils sont transmis au conteneur via un fichier d'environnement, jamais en tant que valeur de ligne de commande, et sont injectés uniquement au démarrage du bac à sable.

Les versions de version vérifient les mises à jour signées avant de les installer. La clé de signature n'est jamais stockée dans le référentiel.

## Ligne de commande

`deepsandctl` fournit la surface sans tête :

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` imprime l'argv `docker run` exact sans démarrer de conteneur, ce qui est utile pour examiner une stratégie modifiée.

## En savoir plus

- [Le modèle de sécurité totale](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Notes d'architecture](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Comment fonctionne le bac à sable](./security)
