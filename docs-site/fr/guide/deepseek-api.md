---
title: Obtenez une clé DeepSeek API
description: >-
  Inscrivez-vous à la plateforme DeepSeek API, ajoutez du crédit, créez une clé et stockez-la en
  toute sécurité dans Deepsand.
---

# Obtenez une clé DeepSeek API

Deepsand a besoin d'un fournisseur de modèles pour alimenter l'assistant. La configuration par défaut utilise DeepSeek. Cette page explique la création d'un compte, l'ajout de crédit, la création d'une clé API et son enregistrement dans Deepsand.

Si vous disposez déjà d'une clé API d'un autre fournisseur, passez à [Utilisez une clé que vous possédez déjà](#use-a-key-you-already-have).

## Avant de commencer

Vous aurez besoin de :

- Une adresse e-mail ou un compte de connexion pris en charge.
- Un mode de paiement pour le crédit API.
- Quelques minutes pour créer la clé et la coller dans Deepsand.

Le DeepSeek API est facturé séparément du site Web de chat et de l'application mobile DeepSeek. L'ajout de crédit sur la plateforme API est ce qui permet à l'assistant de faire des requêtes.

## 1. Créez un compte DeepSeek

1. Ouvrez le [Plateforme DeepSeek API](https://platform.deepseek.com/).
2. Sélectionnez **S'inscrire** ou **Se connecter**.
3. Créez un compte avec votre adresse e-mail ou utilisez l'une des options de connexion prises en charge.
4. Vérifiez votre adresse e-mail ou votre numéro de téléphone si la plateforme vous le demande.

## 2. Ajouter du crédit

1. Connectez-vous à la plateforme API.
2. Ouvrez la section de facturation ou de recharge dans le tableau de bord.
3. Ajoutez le montant du crédit que vous souhaitez utiliser.
4. Terminez le paiement.

L'utilisation API est déduite de ce solde. La plateforme affiche le solde actuel, l'utilisation et les prix. Commencez avec une petite quantité pendant que vous essayez Deepsand ; vous pourrez en ajouter d'autres plus tard.

## 3. Créez une clé API

1. Ouvrez la section **Clés API** de la plateforme.
2. Sélectionnez **Créer une nouvelle clé API** ou le bouton équivalent.
3. Donnez à la clé un nom que vous reconnaîtrez, tel que **Deepsand**.
4. Créez la clé et copiez-la immédiatement.

La clé n'est généralement affichée qu'une seule fois. Traitez-le comme un mot de passe : toute personne qui le possède peut dépenser le crédit sur votre compte.

## 4. Enregistrez la clé dans Deepsand

1. Ouvrez Deepsand.
2. Ouvrez **Paramètres**.
3. Recherchez le champ **Clé API** sous les informations d'identification par défaut.
4. Collez la clé.
5. Sélectionnez **Enregistrer la clé**.

Deepsand stocke la clé dans le magasin de clés de votre système d'exploitation, et non dans son fichier de paramètres. La fenêtre affiche uniquement les quatre derniers caractères après l'enregistrement, vous pouvez donc confirmer qu'une clé est présente sans l'exposer à nouveau.

La clé à l'échelle de l'application est utilisée lorsque ni la configuration hôte DeepCode ni un projet ne fournissent sa propre clé. Une clé au niveau du projet est toujours prioritaire.

## Utilisez une clé que vous possédez déjà

Si vous possédez déjà une clé API, vous n'avez pas besoin de créer un compte DeepSeek.

- Pour l'utiliser pour chaque projet, ouvrez **Paramètres**, saisissez la clé dans le champ **Clé API** et enregistrez-la.
- Pour utiliser un point de terminaison ou un modèle différent, définissez également l'URL de base et le modèle dans **Paramètres** ou dans les informations d'identification du projet.
- Pour conserver une clé uniquement pour un projet, ouvrez les paramètres de ce projet et saisissez-la à la place.

Le fournisseur doit exposer un API que le DeepCode CLI peut appeler. Si vous utilisez un fournisseur autre que DeepSeek, saisissez son URL de base et le nom du modèle plutôt que les valeurs par défaut de DeepSeek.

## Si quelque chose ne fonctionne pas

- **La clé est rejetée :** crée une nouvelle clé sur la plateforme et remplace celle stockée.
- **Le solde est vide :** ajoute du crédit au compte API. Un abonnement au chat ne finance pas automatiquement l'utilisation de API.
- **L'assistant ne parvient pas à joindre le prestataire :** vérifie le mode réseau et la liste autorisée du projet. Le point de terminaison du modèle doit être accessible.
- **Vous souhaitez supprimer la clé :** ouvrez **Paramètres** et sélectionnez **Supprimer la clé**.

## Pages connexes

- [Commencer](./getting-started)
- [Qu'est-ce que Deepsand ?](./what-is-deepsand)
- [Comment fonctionne le bac à sable](./security)
